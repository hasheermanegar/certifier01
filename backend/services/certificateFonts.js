const catalog = require("../fonts/catalog.json");

const fontMap = new Map(
  catalog.map(font => [font.family, font])
);

const cache = new Map();
const pending = new Map();

const MAX_CACHE_BYTES = 20 * 1024 * 1024;
const MAX_FONT_BYTES = 12 * 1024 * 1024;

let cacheBytes = 0;

function selectVariant(font, bold, italic) {
  const targetWeight = bold ? 700 : 400;

  const variants = (font.variants || [])
    .filter(value => /^\d+i?$/.test(value))
    .map(value => ({
      value,
      weight: parseInt(value, 10),
      italic: value.endsWith("i")
    }));

  variants.sort((a, b) => {
    const score = item =>
      Math.abs(item.weight - targetWeight)
      + (item.italic !== italic ? 1000 : 0);

    return score(a) - score(b);
  });

  return variants[0]?.value || "400";
}

async function fetchLimited(url, limit) {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(12000),
    redirect: "error",
    headers: { "User-Agent": "curl/8.0" }
  });

  if (!response.ok) {
    throw new Error(`Font request failed: ${response.status}`);
  }

  const chunks = [];
  let length = 0;

  for await (const chunk of response.body) {
    length += chunk.length;

    if (length > limit) {
      throw new Error("Font response exceeds size limit");
    }

    chunks.push(Buffer.from(chunk));
  }

  return Buffer.concat(chunks);
}

async function downloadFont(family, variant) {
  const weight = parseInt(variant, 10);
  const italic = variant.endsWith("i");

  const url = new URL("https://fonts.googleapis.com/css2");

  url.searchParams.set(
    "family",
    italic
      ? `${family}:ital,wght@1,${weight}`
      : `${family}:wght@${weight}`
  );

  const css = (
    await fetchLimited(url, 256 * 1024)
  ).toString("utf8");

  const matches = [...css.matchAll(
    /url\((['"]?)(https:\/\/fonts\.gstatic\.com\/[^)'"]+)\1\)/g
  )];

  const urls = [...new Set(matches.map(match => match[2]))];

  if (urls.length !== 1) {
    throw new Error(`Unexpected font response for ${family}`);
  }

  const fontUrl = new URL(urls[0]);

  if (fontUrl.hostname !== "fonts.gstatic.com") {
    throw new Error("Invalid font download host");
  }

  const bytes = await fetchLimited(fontUrl, MAX_FONT_BYTES);

  const magic = bytes.subarray(0, 4).toString("hex");

  if (!["00010000", "4f54544f"].includes(magic)) {
    throw new Error(`Unsupported font format: ${family}`);
  }

  return bytes;
}

async function loadFontBytes(family, bold = false, italic = false) {
  const font = fontMap.get(family);

  if (!font) {
    throw new Error(`Unknown Google font: ${family}`);
  }

  const variant = selectVariant(font, bold, italic);
  const key = `${family}:${variant}`;

  if (cache.has(key)) {
    const bytes = cache.get(key);

    cache.delete(key);
    cache.set(key, bytes);

    return { bytes, family, variant };
  }

  if (!pending.has(key)) {
    const task = downloadFont(family, variant)
      .then(bytes => {
        while (
          cache.size &&
          cacheBytes + bytes.length > MAX_CACHE_BYTES
        ) {
          const oldest = cache.keys().next().value;

          cacheBytes -= cache.get(oldest).length;
          cache.delete(oldest);
        }

        cache.set(key, bytes);
        cacheBytes += bytes.length;

        return bytes;
      })
      .finally(() => pending.delete(key));

    pending.set(key, task);
  }

  const bytes = await pending.get(key);

  return { bytes, family, variant };
}

function getCacheStats() {
  return {
    families: fontMap.size,
    cachedFonts: cache.size,
    cacheBytes
  };
}

module.exports = {
  loadFontBytes,
  getCacheStats
};
