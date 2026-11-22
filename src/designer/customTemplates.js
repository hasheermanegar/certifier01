import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

export function normalizeCustomTemplate(template) {
  if (!template || typeof template !== "object" || !template.backgroundImage) return template;

  const elements = Array.isArray(template.elements) ? [...template.elements] : [];
  const hasArtworkLayer = elements.some(
    element => element.type === "image" && element.src === template.backgroundImage
  );
  if (!hasArtworkLayer) {
    elements.unshift({
      id: crypto.randomUUID(),
      type: "image",
      text: template.name || "Uploaded artwork",
      src: template.backgroundImage,
      x: 0,
      y: 0,
      width: template.width || (template.orientation === "portrait" ? 790 : 1120),
      height: template.height || (template.orientation === "portrait" ? 1120 : 790)
    });
  }

  return { ...template, backgroundImage: "", elements };
}

export function normalizeCanvaUrl(value) {
  const raw = typeof value === "string" ? value.trim() : "";
  if (!raw) return "";

  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new Error("Enter a valid Canva design link.");
  }
  if (url.protocol !== "https:" || !/(^|\.)canva\.com$/i.test(url.hostname)) {
    throw new Error("Use an HTTPS link from canva.com.");
  }
  return url.href;
}

export async function createArtworkTemplate(file, { canvaUrl = "" } = {}) {
  if (!file) throw new Error("Choose a file to import.");
  const canvaDesignUrl = normalizeCanvaUrl(canvaUrl);
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Choose a file smaller than 25 MB.");
  }

  const isPdf = file.type === "application/pdf" || /\.pdf$/i.test(file.name);
  const isImage = ["image/png", "image/jpeg", "image/webp"].includes(file.type) ||
    /\.(png|jpe?g|webp)$/i.test(file.name);
  if (!isPdf && !isImage) {
    throw new Error("Use a PDF, PNG, JPG or WebP file.");
  }

  let dataUrl;
  let pageCount = 1;
  if (isPdf) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
    pageCount = pdf.numPages;
    const page = await pdf.getPage(1);
    const viewport = page.getViewport({ scale: 1.5 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(viewport.width);
    canvas.height = Math.round(viewport.height);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("Canvas rendering is unavailable.");
    await page.render({ canvasContext: context, viewport }).promise;
    dataUrl = canvas.toDataURL("image/jpeg", 0.82);
  } else {
    dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => typeof reader.result === "string"
        ? resolve(reader.result)
        : reject(new Error("Could not read the selected image."));
      reader.onerror = () => reject(reader.error || new Error("Could not read the selected image."));
      reader.readAsDataURL(file);
    });
  }

  const image = new Image();
  await new Promise((resolve, reject) => {
    image.onload = resolve;
    image.onerror = () => reject(new Error("The exported design could not be decoded."));
    image.src = dataUrl;
  });

  const maxDimension = 1800;
  const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.naturalWidth * ratio));
  canvas.height = Math.max(1, Math.round(image.naturalHeight * ratio));
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Canvas rendering is unavailable.");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const name = file.name.replace(/\.[^.]+$/, "") || "Imported design";
  const width = canvas.width;
  const height = canvas.height;
  return {
    id: crypto.randomUUID(),
    custom: true,
    name,
    category: "Custom",
    canvaUrl: canvaDesignUrl,
    sourceFormat: isPdf ? "PDF" : file.name.split(".").pop().toUpperCase(),
    sourcePageCount: pageCount,
    backgroundImage: "",
    bg: "#ffffff",
    orientation: height > width ? "portrait" : "landscape",
    width,
    height,
    elements: [{
      id: crypto.randomUUID(),
      type: "image",
      text: name,
      src: canvas.toDataURL("image/jpeg", 0.72),
      x: 0,
      y: 0,
      width,
      height
    }]
  };
}

export async function createArtworkTemplates(file, options = {}) {
  if (!file) throw new Error("Choose a file to import.");
  if (file.type !== "application/pdf" && !/\.pdf$/i.test(file.name)) {
    return [await createArtworkTemplate(file, options)];
  }
  if (file.size > 25 * 1024 * 1024) {
    throw new Error("Choose a file smaller than 25 MB.");
  }

  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
  const loadingTask = pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) });
  const templates = [];
  const baseName = file.name.replace(/\.pdf$/i, "") || "Imported design";

  try {
    const pdf = await loadingTask.promise;
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      const page = await pdf.getPage(pageNumber);
      const viewport = page.getViewport({ scale: 1.5 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(viewport.width);
      canvas.height = Math.round(viewport.height);
      const context = canvas.getContext("2d");
      if (!context) throw new Error("Canvas rendering is unavailable.");
      await page.render({ canvasContext: context, viewport }).promise;
      const pageBlob = await new Promise((resolve, reject) => {
        canvas.toBlob(blob => blob
          ? resolve(blob)
          : reject(new Error(`Could not export PDF page ${pageNumber}.`)), "image/jpeg", 0.82);
      });
      const pageFile = new File([pageBlob], `${baseName}-page-${pageNumber}.jpg`, { type: "image/jpeg" });
      const template = await createArtworkTemplate(pageFile, options);
      template.name = pdf.numPages > 1 ? `${baseName} · Page ${pageNumber}` : baseName;
      template.sourceFormat = "PDF";
      template.sourcePageCount = pdf.numPages;
      template.sourcePageNumber = pageNumber;
      templates.push(template);
    }
  } finally {
    await loadingTask.destroy();
  }

  if (!templates.length) throw new Error("The PDF does not contain any pages.");
  return templates;
}

export async function createImportedTemplates(file, options = {}) {
  if (/\.pptx$/i.test(file?.name || "")) {
    const { createCanvaPptxTemplates } = await import("./canvaPptx");
    return createCanvaPptxTemplates(file, options);
  }
  return createArtworkTemplates(file, options);
}
