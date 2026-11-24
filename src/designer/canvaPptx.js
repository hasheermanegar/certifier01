import { strFromU8, unzipSync } from "fflate";
import { normalizeCanvaUrl } from "./customTemplates";

const PRESENTATION_NS = "http://schemas.openxmlformats.org/presentationml/2006/main";
const DRAWING_NS = "http://schemas.openxmlformats.org/drawingml/2006/main";
const OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships";
const PACKAGE_REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships";
const MAX_FILE_SIZE = 25 * 1024 * 1024;
const MAX_UNCOMPRESSED_SIZE = 120 * 1024 * 1024;
const DEFAULT_LANDSCAPE_WIDTH = 1120;
const DEFAULT_PORTRAIT_WIDTH = 790;

function readZipBounds(bytes) {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const firstPossibleOffset = Math.max(0, bytes.byteLength - 65557);
  let endOffset = -1;
  for (let offset = bytes.byteLength - 22; offset >= firstPossibleOffset; offset -= 1) {
    if (view.getUint32(offset, true) === 0x06054b50) {
      endOffset = offset;
      break;
    }
  }
  if (endOffset < 0) throw new Error("This file is not a valid PPTX archive.");

  const entryCount = view.getUint16(endOffset + 10, true);
  const entriesOnDisk = view.getUint16(endOffset + 8, true);
  const directorySize = view.getUint32(endOffset + 12, true);
  let offset = view.getUint32(endOffset + 16, true);
  const commentLength = view.getUint16(endOffset + 20, true);
  const directoryEnd = offset + directorySize;
  if (view.getUint16(endOffset + 4, true) !== 0 ||
      view.getUint16(endOffset + 6, true) !== 0 ||
      entriesOnDisk !== entryCount ||
      entryCount === 0xffff || directorySize === 0xffffffff || offset === 0xffffffff) {
    throw new Error("PPTX files using ZIP64 are not supported.");
  }
  if (endOffset + 22 + commentLength !== bytes.byteLength ||
      entryCount > 3000 || directoryEnd > endOffset) {
    throw new Error("The PPTX archive has an invalid directory.");
  }

  let totalUncompressedSize = 0;
  for (let index = 0; index < entryCount; index += 1) {
    if (offset + 46 > directoryEnd || view.getUint32(offset, true) !== 0x02014b50) {
      throw new Error("The PPTX archive has an invalid directory entry.");
    }
    const flags = view.getUint16(offset + 8, true);
    const compressedSize = view.getUint32(offset + 20, true);
    const uncompressedSize = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const commentLength = view.getUint16(offset + 32, true);
    if (flags & 1) throw new Error("Encrypted PPTX files are not supported.");
    if (compressedSize === 0xffffffff || uncompressedSize === 0xffffffff) {
      throw new Error("PPTX files using ZIP64 are not supported.");
    }
    totalUncompressedSize += uncompressedSize;
    if (totalUncompressedSize > MAX_UNCOMPRESSED_SIZE) {
      throw new Error("The unpacked PPTX is too large to import safely.");
    }
    offset += 46 + nameLength + extraLength + commentLength;
  }
  if (offset > directoryEnd) throw new Error("The PPTX archive has an invalid directory size.");
}

function parseXml(bytes, label) {
  const document = new DOMParser().parseFromString(strFromU8(bytes), "application/xml");
  if (document.getElementsByTagName("parsererror").length) {
    throw new Error(`Could not read ${label} in the PPTX file.`);
  }
  return document;
}

function firstDescendant(node, namespace, name) {
  return node?.getElementsByTagNameNS(namespace, name)[0] || null;
}

function directChild(node, namespace, name) {
  return Array.from(node?.children || []).find(
    child => child.namespaceURI === namespace && child.localName === name
  ) || null;
}

function resolveArchivePath(sourcePath, target) {
  let path;
  try {
    path = decodeURIComponent(target);
  } catch {
    throw new Error("The PPTX contains an invalid file reference.");
  }
  const parts = path.startsWith("/") ? [] : sourcePath.split("/").slice(0, -1);
  for (const segment of path.replace(/^\/+/, "").split("/")) {
    if (!segment || segment === ".") continue;
    if (segment === "..") {
      if (!parts.length) throw new Error("The PPTX contains an unsafe file reference.");
      parts.pop();
    } else {
      parts.push(segment);
    }
  }
  return parts.join("/");
}

function relationshipsFor(files, sourcePath) {
  const pathParts = sourcePath.split("/");
  const filename = pathParts.pop();
  const relationshipsPath = [...pathParts, "_rels", `${filename}.rels`].join("/");
  const relationshipsFile = files[relationshipsPath];
  if (!relationshipsFile) return new Map();
  const document = parseXml(relationshipsFile, "presentation relationships");
  const relationships = new Map();
  for (const node of document.getElementsByTagNameNS(PACKAGE_REL_NS, "Relationship")) {
    relationships.set(node.getAttribute("Id"), node.getAttribute("Target"));
  }
  return relationships;
}

function themeColorsFor(files) {
  const themeFile = files["ppt/theme/theme1.xml"];
  if (!themeFile) return {};
  const document = parseXml(themeFile, "theme colors");
  const scheme = firstDescendant(document, DRAWING_NS, "clrScheme");
  const colors = {};
  for (const entry of Array.from(scheme?.children || [])) {
    const color = entry.firstElementChild;
    const value = color?.getAttribute("lastClr") || color?.getAttribute("val");
    if (/^[\da-f]{6}$/i.test(value || "")) colors[entry.localName] = `#${value}`;
  }
  return colors;
}

function solidColor(node, themeColors, fallback = "transparent") {
  if (!node) return fallback;
  if (directChild(node, DRAWING_NS, "noFill")) return "transparent";
  const solidFill = directChild(node, DRAWING_NS, "solidFill");
  const color = solidFill?.firstElementChild;
  if (!color) return fallback;

  if (color.localName === "srgbClr" && /^[\da-f]{6}$/i.test(color.getAttribute("val") || "")) {
    return `#${color.getAttribute("val")}`;
  }
  if (color.localName === "sysClr") {
    const value = color.getAttribute("lastClr");
    if (/^[\da-f]{6}$/i.test(value || "")) return `#${value}`;
  }
  if (color.localName === "schemeClr") {
    return themeColors[color.getAttribute("val")] || fallback;
  }
  const presetColors = {
    black: "#000000",
    white: "#ffffff",
    red: "#ff0000",
    green: "#008000",
    blue: "#0000ff",
    yellow: "#ffff00",
    gray: "#808080",
    dkGray: "#404040",
    ltGray: "#c0c0c0",
  };
  return presetColors[color.getAttribute("val")] || fallback;
}

function transformForGroup(group, parent) {
  const groupProperties = firstDescendant(group, PRESENTATION_NS, "grpSpPr");
  const transform = firstDescendant(groupProperties, DRAWING_NS, "xfrm");
  const offset = firstDescendant(transform, DRAWING_NS, "off");
  const extent = firstDescendant(transform, DRAWING_NS, "ext");
  const childOffset = firstDescendant(transform, DRAWING_NS, "chOff");
  const childExtent = firstDescendant(transform, DRAWING_NS, "chExt");
  if (!offset || !extent || !childOffset || !childExtent) return parent;

  const extX = Number(extent.getAttribute("cx"));
  const extY = Number(extent.getAttribute("cy"));
  const childExtX = Number(childExtent.getAttribute("cx"));
  const childExtY = Number(childExtent.getAttribute("cy"));
  if (!extX || !extY || !childExtX || !childExtY) return parent;

  const localScaleX = extX / childExtX;
  const localScaleY = extY / childExtY;
  return {
    scaleX: parent.scaleX * localScaleX,
    scaleY: parent.scaleY * localScaleY,
    offsetX: parent.offsetX + parent.scaleX * (Number(offset.getAttribute("x")) - Number(childOffset.getAttribute("x")) * localScaleX),
    offsetY: parent.offsetY + parent.scaleY * (Number(offset.getAttribute("y")) - Number(childOffset.getAttribute("y")) * localScaleY),
  };
}

function boundsFor(node, transform) {
  const properties = firstDescendant(node, PRESENTATION_NS, "spPr");
  const shapeTransform = firstDescendant(properties, DRAWING_NS, "xfrm");
  const offset = firstDescendant(shapeTransform, DRAWING_NS, "off");
  const extent = firstDescendant(shapeTransform, DRAWING_NS, "ext");
  if (!offset || !extent) return null;

  const x = transform.offsetX + Number(offset.getAttribute("x")) * transform.scaleX;
  const y = transform.offsetY + Number(offset.getAttribute("y")) * transform.scaleY;
  const width = Number(extent.getAttribute("cx")) * transform.scaleX;
  const height = Number(extent.getAttribute("cy")) * transform.scaleY;
  if (![x, y, width, height].every(Number.isFinite)) return null;
  return { x, y, width: Math.max(1, width), height: Math.max(1, height), properties, shapeTransform };
}

function shapeNameFor(properties, bounds) {
  const geometry = firstDescendant(properties, DRAWING_NS, "prstGeom");
  const preset = geometry?.getAttribute("prst");
  const knownShapes = {
    rect: "rectangle",
    roundRect: "rounded",
    ellipse: Math.abs(bounds.width - bounds.height) < 5 ? "circle" : "oval",
    triangle: "triangle",
    rtTriangle: "triangle",
    diamond: "diamond",
    hexagon: "hexagon",
    pentagon: "pentagon",
    star5: "star",
    line: bounds.width >= bounds.height ? "hline" : "vline",
    straightConnector1: bounds.width >= bounds.height ? "hline" : "vline",
  };
  return { shape: knownShapes[preset] || "rectangle", approximated: !knownShapes[preset] };
}

function lineStyle(properties, themeColors, scale) {
  const line = firstDescendant(properties, DRAWING_NS, "ln");
  if (!line || firstDescendant(line, DRAWING_NS, "noFill")) {
    return { stroke: "transparent", strokeWidth: 0 };
  }
  const width = Number(line.getAttribute("w")) * scale;
  return {
    stroke: solidColor(line, themeColors, "#26334d"),
    strokeWidth: Number.isFinite(width) && width > 0 ? Math.max(1, Math.min(20, width)) : 1,
  };
}

function textStyleFor(textBody, themeColors) {
  const paragraphs = Array.from(textBody.getElementsByTagNameNS(DRAWING_NS, "p"));
  const text = paragraphs.map(paragraph =>
    Array.from(paragraph.children).map(node => {
      if (node.localName === "br") return "\n";
      if (node.localName !== "r" && node.localName !== "fld") return "";
      return firstDescendant(node, DRAWING_NS, "t")?.textContent || "";
    }).join("")
  ).join("\n");
  if (!text.trim()) return null;

  const firstParagraph = paragraphs[0];
  const run = firstDescendant(firstParagraph, DRAWING_NS, "rPr") ||
    firstDescendant(firstParagraph, DRAWING_NS, "defRPr") ||
    firstDescendant(firstParagraph, DRAWING_NS, "endParaRPr");
  const paragraphProperties = firstDescendant(firstParagraph, DRAWING_NS, "pPr");
  const font = firstDescendant(run, DRAWING_NS, "latin")?.getAttribute("typeface");
  const sizeInPoints = Number(run?.getAttribute("sz")) / 100;
  const alignment = paragraphProperties?.getAttribute("algn");
  const lineSpacing = firstDescendant(paragraphProperties, DRAWING_NS, "spcPct");
  const lineHeight = lineSpacing ? Number(lineSpacing.getAttribute("val")) / 100000 : 1.2;
  const runs = paragraphs.flatMap(paragraph => Array.from(paragraph.getElementsByTagNameNS(DRAWING_NS, "r")));

  return {
    text,
    fontFamily: !font || font.startsWith("+") ? "Inter" : font,
    fontSize: Number.isFinite(sizeInPoints) && sizeInPoints > 0 ? Math.max(8, Math.min(120, sizeInPoints * 4 / 3)) : 24,
    color: solidColor(run, themeColors, "#26334d"),
    bold: run?.getAttribute("b") === "1" || run?.getAttribute("b") === "true",
    italic: run?.getAttribute("i") === "1" || run?.getAttribute("i") === "true",
    underline: !!run?.getAttribute("u") && run.getAttribute("u") !== "none",
    align: alignment === "ctr" ? "center" : alignment === "r" ? "right" : "left",
    lineHeight: Number.isFinite(lineHeight) ? Math.max(0.7, Math.min(3, lineHeight)) : 1.2,
    simplifiedRuns: runs.length > 1,
  };
}

function mediaDataUrl(bytes, path) {
  const extension = path.split(".").pop().toLowerCase();
  const mimeTypes = {
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    webp: "image/webp",
    gif: "image/gif",
    svg: "image/svg+xml",
  };
  const mimeType = mimeTypes[extension];
  if (!mimeType) return null;

  let binary = "";
  const chunkSize = 0x8000;
  for (let index = 0; index < bytes.length; index += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(index, index + chunkSize));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

async function optimizeEmbeddedImage(src) {
  if (src.startsWith("data:image/svg+xml")) return src;
  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("An embedded PPTX image could not be decoded."));
    image.src = src;
  });

  const maxDimension = 1800;
  const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/webp", 0.82);
}

function elementName(node, fallback) {
  const properties = firstDescendant(node, PRESENTATION_NS, "cNvPr");
  const name = properties?.getAttribute("name");
  return name && !/^(shape|textbox|picture)\s*\d*$/i.test(name) ? name : fallback;
}

function pictureElement(node, bounds, relationships, slidePath, files) {
  const blip = firstDescendant(node, DRAWING_NS, "blip");
  const relationshipId = blip?.getAttributeNS(OFFICE_REL_NS, "embed");
  const target = relationships.get(relationshipId);
  if (!target) return null;
  const mediaPath = resolveArchivePath(slidePath, target);
  const media = files[mediaPath];
  if (!media) return null;
  const src = mediaDataUrl(media, mediaPath);
  if (!src) return null;
  const { x, y, width, height } = bounds;

  return {
    id: crypto.randomUUID(),
    type: "image",
    text: elementName(node, "Imported image"),
    src,
    x,
    y,
    width,
    height,
    stroke: "transparent",
    strokeWidth: 0,
    opacity: 1,
  };
}

function convertShape(node, transform, themeColors, warnings) {
  const bounds = boundsFor(node, transform);
  if (!bounds) {
    warnings.unsupported += 1;
    return [];
  }

  const { shape, approximated } = shapeNameFor(bounds.properties, bounds);
  if (approximated || bounds.shapeTransform?.getAttribute("rot") ||
      bounds.shapeTransform?.getAttribute("flipH") || bounds.shapeTransform?.getAttribute("flipV")) {
    warnings.approximated += 1;
  }
  const strokeInfo = lineStyle(bounds.properties, themeColors, Math.max(transform.scaleX, transform.scaleY));
  const fill = solidColor(bounds.properties, themeColors, "transparent");
  const isLine = shape === "hline" || shape === "vline";
  const textBody = firstDescendant(node, PRESENTATION_NS, "txBody");
  const text = textBody && textStyleFor(textBody, themeColors);
  const { x, y, width, height } = bounds;
  const elements = [];

  if (isLine) {
    elements.push({
      id: crypto.randomUUID(),
      type: "shape",
      text: elementName(node, "Divider"),
      shape,
      fill: "transparent",
      ...strokeInfo,
      opacity: 1,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  } else if (fill !== "transparent" || strokeInfo.stroke !== "transparent") {
    elements.push({
      id: crypto.randomUUID(),
      type: "shape",
      text: elementName(node, "Shape"),
      shape,
      fill,
      ...strokeInfo,
      opacity: 1,
      x: bounds.x,
      y: bounds.y,
      width: bounds.width,
      height: bounds.height,
    });
  }

  if (text) {
    if (text.simplifiedRuns) warnings.simplifiedText += 1;
    elements.push({
      id: crypto.randomUUID(),
      type: "text",
      text: text.text,
      x,
      y,
      width,
      height,
      fontFamily: text.fontFamily,
      fontSize: text.fontSize,
      color: text.color,
      align: text.align,
      bold: text.bold,
      italic: text.italic,
      underline: text.underline,
      lineHeight: text.lineHeight,
      opacity: 1,
    });
  }
  return elements;
}

function convertSlide(slide, slidePath, files, themeColors, slideWidth, slideHeight, canvaUrl, baseName, index, slideCount) {
  const orientation = slideHeight > slideWidth ? "portrait" : "landscape";
  const width = orientation === "portrait" ? DEFAULT_PORTRAIT_WIDTH : DEFAULT_LANDSCAPE_WIDTH;
  const height = width * slideHeight / slideWidth;
  const transform = { scaleX: width / slideWidth, scaleY: height / slideHeight, offsetX: 0, offsetY: 0 };
  const relationships = relationshipsFor(files, slidePath);
  const warnings = { unsupported: 0, approximated: 0, simplifiedText: 0 };
  const elements = [];

  const visit = (container, parentTransform) => {
    for (const node of Array.from(container.children || [])) {
      if (node.namespaceURI !== PRESENTATION_NS) continue;
      if (node.localName === "grpSp") {
        visit(node, transformForGroup(node, parentTransform));
      } else if (node.localName === "sp" || node.localName === "cxnSp") {
        elements.push(...convertShape(node, parentTransform, themeColors, warnings));
      } else if (node.localName === "pic") {
        const bounds = boundsFor(node, parentTransform);
        const picture = bounds && pictureElement(node, bounds, relationships, slidePath, files);
        if (picture) elements.push(picture);
        else warnings.unsupported += 1;
      } else if (node.localName === "graphicFrame") {
        warnings.unsupported += 1;
      }
    }
  };

  const shapeTree = firstDescendant(slide, PRESENTATION_NS, "spTree");
  if (!shapeTree) throw new Error(`Slide ${index + 1} has no editable shape tree.`);
  visit(shapeTree, transform);

  const commonSlideData = directChild(slide.documentElement, PRESENTATION_NS, "cSld");
  const backgroundProperties = directChild(directChild(commonSlideData, PRESENTATION_NS, "bg"), PRESENTATION_NS, "bgPr");
  const name = slideCount > 1 ? `${baseName} - ${index + 1}` : baseName;
  return {
    id: crypto.randomUUID(),
    custom: true,
    name,
    category: "Custom",
    canvaUrl,
    sourceFormat: "PPTX",
    sourceSlideIndex: index + 1,
    sourceSlideCount: slideCount,
    importWarnings: warnings,
    background: solidColor(backgroundProperties, themeColors, "#ffffff"),
    bg: solidColor(backgroundProperties, themeColors, "#ffffff"),
    orientation,
    width,
    height,
    elements,
  };
}

export async function createCanvaPptxTemplates(file, { canvaUrl = "" } = {}) {
  if (!file || !/\.pptx$/i.test(file.name)) {
    throw new Error("Choose a Canva PowerPoint export (.pptx).");
  }
  const canvaDesignUrl = normalizeCanvaUrl(canvaUrl);
  if (file.size > MAX_FILE_SIZE) {
    throw new Error("Choose a PPTX file smaller than 25 MB.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  readZipBounds(bytes);
  const files = unzipSync(bytes);
  const presentationBytes = files["ppt/presentation.xml"];
  if (!presentationBytes) throw new Error("This PPTX does not contain a PowerPoint presentation.");

  const presentation = parseXml(presentationBytes, "presentation");
  const size = firstDescendant(presentation, PRESENTATION_NS, "sldSz");
  const slideWidth = Number(size?.getAttribute("cx"));
  const slideHeight = Number(size?.getAttribute("cy"));
  if (!slideWidth || !slideHeight) throw new Error("Could not read the slide dimensions from this PPTX.");

  const presentationRelationships = relationshipsFor(files, "ppt/presentation.xml");
  const slideIds = Array.from(presentation.getElementsByTagNameNS(PRESENTATION_NS, "sldId"));
  const slidePaths = slideIds.map(slideId => {
    const target = presentationRelationships.get(slideId.getAttributeNS(OFFICE_REL_NS, "id"));
    return target ? resolveArchivePath("ppt/presentation.xml", target) : null;
  }).filter(path => path && files[path]);
  const orderedSlidePaths = slidePaths.length ? slidePaths : Object.keys(files)
    .filter(path => /^ppt\/slides\/slide\d+\.xml$/.test(path))
    .sort((a, b) => Number(a.match(/slide(\d+)/)[1]) - Number(b.match(/slide(\d+)/)[1]));
  if (!orderedSlidePaths.length) throw new Error("No slides were found in this PPTX.");

  const themeColors = themeColorsFor(files);
  const baseName = file.name.replace(/\.pptx$/i, "").trim() || "Canva design";
  const templates = orderedSlidePaths.map((path, index) => {
    const slide = parseXml(files[path], `slide ${index + 1}`);
    return convertSlide(
      slide,
      path,
      files,
      themeColors,
      slideWidth,
      slideHeight,
      canvaDesignUrl,
      baseName,
      index,
      orderedSlidePaths.length
    );
  });
  const optimizedImages = new Map();
  for (const template of templates) {
    for (const element of template.elements) {
      if (element.type !== "image" || element.src.startsWith("data:image/svg+xml")) continue;
      if (!optimizedImages.has(element.src)) {
        optimizedImages.set(element.src, await optimizeEmbeddedImage(element.src));
      }
      element.src = optimizedImages.get(element.src);
    }
  }
  return templates;
}
