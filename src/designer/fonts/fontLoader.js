import catalog from "./catalog.json";

export const fontCatalog = catalog;

const fontMap = new Map(
  catalog.map(font => [font.family, font])
);

const pending = new Map();

export function loadFont(family) {
  if (!family || !fontMap.has(family)) {
    return Promise.resolve();
  }

  if (pending.has(family)) {
    return pending.get(family);
  }

  const task = new Promise((resolve, reject) => {
    const font = fontMap.get(family);

    const variants = font.variants || [];
    const weights = ["400", "700"].filter(
      weight => variants.includes(weight)
    );

    const styles = [
      ...weights.map(weight => `0,${weight}`),
      ...weights.filter(
        weight => variants.includes(`${weight}i`)
      ).map(weight => `1,${weight}`)
    ];

    const name = encodeURIComponent(family)
      .replace(/%20/g, "+");

    const query = styles.length
      ? `${name}:ital,wght@${styles.join(";")}`
      : name;

    const link = document.createElement("link");

    link.rel = "stylesheet";
    link.href =
      `https://fonts.googleapis.com/css2?family=${query}&display=swap`;

    link.onload = async () => {
      try {
        await document.fonts.load(
          `16px ${JSON.stringify(family)}`
        );
        resolve();
      } catch (error) {
        link.remove();
        reject(error);
      }
    };

    link.onerror = () => {
      link.remove();
      reject(new Error(`Unable to load ${family}`));
    };

    document.head.appendChild(link);
  }).catch(error => {
    pending.delete(family);
    throw error;
  });

  pending.set(family, task);
  return task;
}

export async function loadDesignFonts(elements = []) {
  const families = [...new Set(
    elements.map(element => element.fontFamily)
      .filter(Boolean)
  )];

  await Promise.all(families.map(loadFont));
  await document.fonts.ready;
}
