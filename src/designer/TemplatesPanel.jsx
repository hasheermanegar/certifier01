import { useRef, useState } from "react";
import { ChevronRight, LayoutTemplate } from "lucide-react";
import CertificateThumbnail from "./CertificateThumbnail";
import TemplateLibraryDialog from "./TemplateLibraryDialog";
import { createArtworkTemplate, normalizeCustomTemplate } from "./customTemplates";

const baseTemplates = [
  { id: 1, name: "Classic Achievement", category: "Certificates", bg: "#ffffff", border: "#315eea", accent: "#172554", title: "CERTIFICATE", subtitle: "OF ACHIEVEMENT" },
  { id: 2, name: "Elegant Gold", category: "Certificates", bg: "#fffdf7", border: "#c5a45c", accent: "#604b24", title: "Certificate of", subtitle: "Excellence" },
  { id: 3, name: "Modern Minimal", category: "Certificates", bg: "#ffffff", border: "#d7dee9", accent: "#25334d", title: "CERTIFICATE", subtitle: "OF COMPLETION" },
  { id: 4, name: "Midnight Honour", category: "Certificates", bg: "#17233d", border: "#d7b76b", accent: "#ffffff", title: "CERTIFICATE", subtitle: "OF RECOGNITION" },
  { id: 5, name: "Rose Appreciation", category: "Certificates", bg: "#fff8f8", border: "#d9a4a8", accent: "#854b55", title: "Certificate of", subtitle: "Appreciation" },
  { id: 6, name: "Fresh Green", category: "Certificates", bg: "#f8fffb", border: "#70a88b", accent: "#285b43", title: "CERTIFICATE", subtitle: "OF PARTICIPATION" },
  { id: 7, name: "Merit Badge", category: "Badges", bg: "#f4f7ff", border: "#5576d8", accent: "#203b83", title: "MERIT", subtitle: "BADGE OF HONOUR" },
  { id: 8, name: "Star Performer", category: "Badges", bg: "#fff9e9", border: "#d6a943", accent: "#79551b", title: "STAR", subtitle: "PERFORMER" },
  { id: 9, name: "Excellence Emblem", category: "Badges", bg: "#f3fbf7", border: "#4d9b78", accent: "#205d43", title: "EXCELLENCE", subtitle: "AWARD BADGE" },
  { id: 10, name: "Academic Record", category: "Transcripts", bg: "#ffffff", border: "#526b91", accent: "#263c5c", title: "ACADEMIC", subtitle: "TRANSCRIPT" },
  { id: 11, name: "Modern Transcript", category: "Transcripts", bg: "#f7f9fc", border: "#8b9bb2", accent: "#34445d", title: "STUDENT", subtitle: "RECORD" },
  { id: 12, name: "Course Transcript", category: "Transcripts", bg: "#fffdf7", border: "#b69a62", accent: "#65502d", title: "COURSE", subtitle: "TRANSCRIPT" },
  { id: 13, name: "Training Completion", category: "Training Records", bg: "#f5fbff", border: "#6ba4c9", accent: "#245474", title: "TRAINING", subtitle: "COMPLETION RECORD" },
  { id: 14, name: "Workshop Record", category: "Training Records", bg: "#f7fbf8", border: "#79a58a", accent: "#315d42", title: "WORKSHOP", subtitle: "PARTICIPATION RECORD" },
  { id: 15, name: "Skills Development", category: "Training Records", bg: "#fbf8ff", border: "#9a83bd", accent: "#594477", title: "SKILLS", subtitle: "DEVELOPMENT" },
  { id: 16, name: "Assessment Result", category: "Assessments", bg: "#ffffff", border: "#5977ba", accent: "#263f75", title: "ASSESSMENT", subtitle: "RESULT" },
  { id: 17, name: "Achievement Score", category: "Assessments", bg: "#fffaf2", border: "#c59a5c", accent: "#74501f", title: "ACHIEVEMENT", subtitle: "ASSESSMENT" },
  { id: 18, name: "Formal Letter", category: "Letters", bg: "#ffffff", border: "#aab5c5", accent: "#34445d", title: "LETTER OF", subtitle: "RECOMMENDATION" },
  { id: 19, name: "Recognition Letter", category: "Letters", bg: "#fffdf8", border: "#c4a66b", accent: "#68502b", title: "LETTER OF", subtitle: "RECOGNITION" }
,

  { id: 20, name: "Royal Blue", category: "Certificates", bg: "#f8faff", border: "#263f83", accent: "#172c60", title: "CERTIFICATE", subtitle: "OF DISTINCTION" },
  { id: 21, name: "Emerald Prestige", category: "Certificates", bg: "#f7fcf8", border: "#43876a", accent: "#20553e", title: "CERTIFICATE", subtitle: "OF EXCELLENCE" },
  { id: 22, name: "Classic Burgundy", category: "Certificates", bg: "#fffafa", border: "#963e50", accent: "#642a3a", title: "CERTIFICATE", subtitle: "OF MERIT" },
  { id: 23, name: "Silver Prestige", category: "Certificates", bg: "#fbfcfe", border: "#9aa7b8", accent: "#45546a", title: "CERTIFICATE", subtitle: "OF ACHIEVEMENT" },
  { id: 24, name: "Soft Lavender", category: "Certificates", bg: "#faf8ff", border: "#9b83c7", accent: "#594477", title: "CERTIFICATE", subtitle: "OF COMPLETION" },
  { id: 25, name: "Ocean Blue", category: "Certificates", bg: "#f4fbff", border: "#3988aa", accent: "#20536c", title: "CERTIFICATE", subtitle: "OF PARTICIPATION" },
  { id: 26, name: "Rose Gold", category: "Certificates", bg: "#fffaf8", border: "#bd8878", accent: "#825548", title: "CERTIFICATE", subtitle: "OF APPRECIATION" },
  { id: 27, name: "Charcoal Luxe", category: "Certificates", bg: "#252a32", border: "#c6aa70", accent: "#f5e9cc", title: "CERTIFICATE", subtitle: "OF HONOUR" },
  { id: 28, name: "Academic Excellence", category: "Transcripts", bg: "#fbfcff", border: "#304f7b", accent: "#203b60", title: "ACADEMIC", subtitle: "EXCELLENCE RECORD" },
  { id: 29, name: "University Record", category: "Transcripts", bg: "#fffefa", border: "#9d8655", accent: "#594b30", title: "UNIVERSITY", subtitle: "RECORD" },
  { id: 30, name: "Professional Training", category: "Training Records", bg: "#f8fbff", border: "#477fa5", accent: "#244d6c", title: "PROFESSIONAL", subtitle: "TRAINING RECORD" },
  { id: 31, name: "Leadership Workshop", category: "Training Records", bg: "#f8fcf9", border: "#4e896c", accent: "#28543c", title: "LEADERSHIP", subtitle: "WORKSHOP" },
  { id: 32, name: "Outstanding Performance", category: "Assessments", bg: "#fffaf0", border: "#c49a4a", accent: "#73501d", title: "OUTSTANDING", subtitle: "PERFORMANCE" },
  { id: 33, name: "Merit Recognition", category: "Assessments", bg: "#f8faff", border: "#536fae", accent: "#2d416f", title: "MERIT", subtitle: "RECOGNITION" },
  { id: 34, name: "Letter of Excellence", category: "Letters", bg: "#fffefa", border: "#ad9565", accent: "#645333", title: "LETTER OF", subtitle: "EXCELLENCE" },
  { id: 35, name: "Formal Commendation", category: "Letters", bg: "#fbfcff", border: "#7889a6", accent: "#34445e", title: "LETTER OF", subtitle: "COMMENDATION" }
];

const paletteFamilies = [
  { name: "Sapphire", light: ["#f7f9ff", "#4169e1", "#203a78"], dark: ["#172554", "#8eb3ff", "#ffffff"] },
  { name: "Emerald", light: ["#f5fbf7", "#4a9b71", "#245d43"], dark: ["#12382c", "#8bd5af", "#ffffff"] },
  { name: "Garnet", light: ["#fff7f8", "#b45766", "#7d2f43"], dark: ["#441e2a", "#f3a5b1", "#ffffff"] },
  { name: "Amethyst", light: ["#faf7ff", "#8c68b8", "#503878"], dark: ["#302044", "#c5a5f2", "#ffffff"] },
  { name: "Teal", light: ["#f3fbfa", "#31958c", "#1f5c58"], dark: ["#123b3b", "#80d9d0", "#ffffff"] },
  { name: "Amber", light: ["#fffaf0", "#c58a2b", "#79531b"], dark: ["#49300f", "#f2c56f", "#ffffff"] },
  { name: "Coral", light: ["#fff7f3", "#d4775d", "#87432f"], dark: ["#4a281f", "#f3a28b", "#ffffff"] },
  { name: "Slate", light: ["#f7f9fc", "#718096", "#3b4a60"], dark: ["#263344", "#bdc9dc", "#ffffff"] },
  { name: "Rose", light: ["#fff7fb", "#c45d8a", "#793453"], dark: ["#49243a", "#efa4c5", "#ffffff"] },
  { name: "Forest", light: ["#f7faf4", "#678344", "#3b522b"], dark: ["#29361f", "#b4cf84", "#ffffff"] },
  { name: "Indigo", light: ["#f6f7ff", "#5968c9", "#303b82"], dark: ["#222858", "#a9b5ff", "#ffffff"] },
  { name: "Copper", light: ["#fff8f2", "#bd764b", "#75452d"], dark: ["#452a1e", "#e7ae89", "#ffffff"] },
  { name: "Aqua", light: ["#f2fbff", "#3998b5", "#20566a"], dark: ["#143747", "#8bd9ed", "#ffffff"] },
  { name: "Plum", light: ["#fcf7fb", "#9d638f", "#613d5d"], dark: ["#3d283a", "#d6a5ca", "#ffffff"] },
  { name: "Olive", light: ["#faf9f0", "#91853d", "#5a5226"], dark: ["#3d391c", "#d4ca7a", "#ffffff"] },
  { name: "Charcoal", light: ["#f6f7f8", "#5b6572", "#343b45"], dark: ["#252a32", "#d1d8e2", "#ffffff"] }
];

const palettes = paletteFamilies.flatMap(family => [
  { name: `${family.name} Light`, bg: family.light[0], border: family.light[1], accent: family.light[2] },
  { name: `${family.name} Midnight`, bg: family.dark[0], border: family.dark[1], accent: family.dark[2] }
]);

const templatesByPalette = palettes.flatMap((palette, paletteIndex) =>
  baseTemplates.map((template, templateIndex) => ({
    ...template,
    ...palette,
    id: paletteIndex * baseTemplates.length + templateIndex + 1,
    name: `${template.name} · ${palette.name}`
  }))
);
const templates = Array.from({ length: templatesByPalette.length }, (_, index) =>
  templatesByPalette[(index % palettes.length) * baseTemplates.length + (index % baseTemplates.length)]
);

const categories = ["All", "Certificates", "Badges", "Transcripts", "Training Records", "Assessments", "Letters"];

// Keep the full-page library and editor gallery on the same template source.
// eslint-disable-next-line react-refresh/only-export-components
export const templateCatalog = templates;

const STORAGE_KEY = "cp-custom-templates";

function readCustomTemplates() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved)
      ? saved.filter(item => item && typeof item === "object").map(normalizeCustomTemplate)
      : [];
  }
  catch (error) {
    console.error("Could not read custom templates:", error);
    return [];
  }
}

function Preview({ item, portrait = false }) {
  return (
    <div className={`template-preview ${portrait ? "portrait" : ""} ${item.custom ? "has-design-preview" : ""}`} data-layout={item.custom ? "custom" : String(((Number(item.id) || 1) - 1) % 10)}
      style={{
        background: item.bg || item.background || "#fff",
        borderColor: item.border || "#d7dee9"
      }}>
      {item.custom ? (
        <CertificateThumbnail design={item} className="template-custom-thumbnail" />
      ) : (
        <div className="template-preview-inner" style={{ borderColor: item.border || "#d7dee9" }}>
          <span style={{ color: item.accent || "#25334d" }}>{item.title || item.name}</span>
          <strong style={{ color: item.accent || "#25334d" }}>{item.subtitle || "CUSTOM TEMPLATE"}</strong>
          <i style={{ background: item.border || "#d7dee9" }} />
          <small style={{ color: item.accent || "#25334d" }}>[recipient.name]</small>
        </div>
      )}
    </div>
  );
}


function buildDistinctTemplateElements(item, orientation) {
  const portrait = orientation === "portrait";
  const w = portrait ? 790 : 1120;
  const h = portrait ? 1120 : 790;
  const sx = w / 1120;
  const sy = h / 790;
  const x = n => Math.round(n * sx);
  const y = n => Math.round(n * sy);
  const id = () => crypto.randomUUID();
  const accent = item.accent || "#263b60";
  const border = item.border || "#b69a62";
  const background = (item.bg || "#ffffff").replace("#", "");
  const channels = background.match(/.{2}/g)?.map(value => parseInt(value, 16)) || [255, 255, 255];
  const ink = (channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722) < 140 ? "#ffffff" : "#344054";
  const variant = ((Number(item.id) || 1) - 1) % 10;
  const out = [];

  const shape = (name, px, py, pw, ph, fill, stroke = "transparent", sw = 0) => {
    out.push({
      id: id(), type: "shape", shape: name,
      x: x(px), y: y(py), width: x(pw), height: y(ph),
      fill, stroke, strokeWidth: sw, opacity: 1
    });
  };

  const text = (value, px, py, pw, ph, size, color = ink, options = {}) => {
    out.push({
      id: id(), type: options.attribute ? "attribute" : "text",
      text: value, x: x(px), y: y(py), width: x(pw), height: y(ph),
      fontSize: Math.round(size * Math.min(sx, sy)),
      color, align: options.align || "center",
      bold: !!options.bold,
      italic: !!options.italic,
      fontFamily: options.font || "Inter",
      letterSpacing: options.spacing || 0,
      ...(options.underline ? { underline: true } : {})
    });
  };

  const recipient = (py, color = accent, size = 43, px = 130, pw = 860) =>
    text("{{recipient_name}}", px, py, pw, 75, size, color,
      { attribute: true, bold: true, font: "Georgia" });

  const date = (py, px = 390, pw = 340) =>
    text("{{issue_date}}", px, py, pw, 34, 15, accent);

  const signatures = py => {
    shape("hline", 175, py, 210, 3, border);
    shape("hline", 735, py, 210, 3, border);
    text("AUTHORISED SIGNATURE", 145, py + 12, 270, 25, 11, ink);
    text("ISSUED BY", 705, py + 12, 270, 25, 11, ink);
  };

  if (variant === 0) {
    // Traditional formal certificate.
    shape("border", 24, 24, 1072, 742, "transparent", border, 5);
    shape("border", 39, 39, 1042, 712, "transparent", border, 2);
    text(item.title, 90, 135, 940, 65, 36, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 100, 205, 920, 45, 22, accent, { spacing: 2 });
    text("THIS HONOUR IS PROUDLY PRESENTED TO", 130, 290, 860, 35, 15, ink);
    recipient(340);
    shape("hline", 310, 423, 500, 2, border);
    text("For outstanding dedication, achievement and commitment", 130, 450, 860, 48, 17, ink);
    date(570);
    signatures(650);
  } else if (variant === 1) {
    // Contemporary left-aligned editorial layout.
    shape("rectangle", 0, 0, 260, 790, accent);
    shape("rectangle", 260, 0, 12, 790, border);
    text("CERTIFYPRO", 35, 75, 190, 35, 15, "#ffffff", { bold: true, spacing: 2 });
    text("AWARD\nOF\nDISTINCTION", 32, 250, 205, 190, 29, "#ffffff", { bold: true, align: "left", font: "Georgia" });
    text(item.title, 320, 100, 740, 80, 35, accent, { bold: true, align: "left", font: "Georgia" });
    text(item.subtitle, 320, 180, 740, 45, 19, border, { align: "left" });
    text("PRESENTED TO", 320, 295, 700, 30, 13, ink, { align: "left", spacing: 2 });
    recipient(335, accent, 38, 315, 730);
    shape("hline", 320, 435, 680, 2, border);
    text("In recognition of exceptional work and achievement.", 320, 460, 700, 65, 17, ink, { align: "left" });
    date(590, 320, 250);
    text("AUTHORISED SIGNATURE", 800, 590, 220, 30, 12, ink);
  } else if (variant === 2) {
    // Geometric corner composition.
    shape("triangle", 0, 0, 240, 190, accent);
    shape("triangle", 880, 600, 240, 190, border);
    shape("diamond", 930, 45, 95, 95, border);
    shape("diamond", 90, 620, 80, 80, accent);
    shape("border", 35, 35, 1050, 720, "transparent", border, 3);
    text(item.title, 130, 130, 860, 65, 37, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 150, 200, 820, 45, 20, border, { spacing: 2 });
    text("IS HEREBY AWARDED TO", 150, 300, 820, 32, 14, ink);
    recipient(350);
    text("For demonstrating excellence and outstanding performance", 145, 465, 830, 50, 17, ink);
    date(590);
    signatures(655);
  } else if (variant === 3) {
    // Award medallion layout.
    shape("circle", 470, 35, 180, 180, "transparent", border, 6);
    shape("circle", 485, 50, 150, 150, "transparent", accent, 2);
    text("★", 500, 86, 120, 75, 52, border);
    text(item.title, 110, 235, 900, 60, 35, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 120, 295, 880, 40, 20, border);
    text("AWARDED TO", 150, 365, 820, 30, 13, ink, { spacing: 2 });
    recipient(405, accent, 42);
    shape("hline", 330, 490, 460, 2, border);
    text("For exceptional merit and achievement", 160, 520, 800, 40, 17, ink);
    date(610);
    text("CERTIFYPRO  •  OFFICIAL RECOGNITION", 280, 690, 560, 25, 11, accent, { spacing: 1 });
  } else if (variant === 4) {
    // Split-panel professional design.
    shape("rectangle", 0, 0, 1120, 175, accent);
    shape("rectangle", 0, 175, 1120, 8, border);
    text(item.title, 75, 35, 970, 65, 35, "#ffffff", { bold: true, font: "Georgia" });
    text(item.subtitle, 75, 105, 970, 40, 19, "#ffffff");
    shape("rectangle", 65, 250, 12, 390, border);
    text("RECOGNITION", 115, 255, 870, 35, 13, border, { align: "left", spacing: 2 });
    recipient(330, accent, 42, 110, 900);
    text("For successfully completing the programme", 115, 430, 870, 45, 18, ink, { align: "left" });
    shape("hline", 115, 520, 870, 2, border);
    date(570, 120, 300);
    text("AUTHORISED SIGNATURE", 700, 570, 270, 30, 12, ink);
  } else if (variant === 5) {
    // Bold top banner and clean lower typography.
    shape("rectangle", 0, 0, 1120, 215, accent);
    shape("triangle", 0, 215, 110, 80, accent);
    shape("triangle", 1010, 215, 110, 80, accent);
    text(item.title, 90, 55, 940, 65, 38, "#ffffff", { bold: true, font: "Georgia" });
    text(item.subtitle, 100, 125, 920, 42, 20, "#ffffff", { spacing: 2 });
    text("PROUDLY PRESENTED TO", 130, 300, 860, 30, 14, border);
    recipient(350);
    shape("hline", 300, 445, 520, 3, border);
    text("In appreciation of your dedication and contribution.", 150, 475, 820, 45, 17, ink);
    date(590);
    signatures(650);
  } else if (variant === 6) {
    // Minimal typographic composition.
    text("CERTIFYPRO  /  RECOGNITION", 100, 75, 920, 25, 12, border, { spacing: 3 });
    text(item.title, 100, 175, 920, 75, 43, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 100, 250, 920, 42, 18, ink, { spacing: 3 });
    shape("hline", 440, 325, 240, 3, border);
    text("THIS CERTIFICATE IS PRESENTED TO", 130, 375, 860, 32, 13, ink, { spacing: 1 });
    recipient(420, accent, 45);
    text("For demonstrating commitment, skill and excellence.", 140, 535, 840, 45, 17, ink);
    date(625);
    text("________________________       ________________________", 140, 685, 840, 28, 15, border);
  } else if (variant === 7) {
    // Framed classic with corner ornaments.
    shape("border", 22, 22, 1076, 746, "transparent", accent, 7);
    shape("corner", 48, 48, 130, 130, border);
    shape("corner", 942, 48, 130, 130, border);
    shape("corner", 48, 612, 130, 130, border);
    shape("corner", 942, 612, 130, 130, border);
    text("❖", 470, 80, 180, 60, 38, border);
    text(item.title, 100, 165, 920, 65, 36, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 100, 230, 920, 45, 20, border);
    text("IS PROUDLY AWARDED TO", 130, 320, 860, 32, 14, ink);
    recipient(370);
    text("For exceptional performance and dedication", 150, 480, 820, 45, 17, ink);
    date(590);
    signatures(655);
  } else if (variant === 8) {
    // Asymmetric vertical colour strip.
    shape("rectangle", 0, 0, 95, 790, border);
    shape("rectangle", 95, 0, 8, 790, accent);
    text("A\nW\nA\nR\nD", 25, 250, 45, 240, 20, "#ffffff", { bold: true });
    text(item.title, 155, 100, 870, 70, 36, accent, { bold: true, align: "left", font: "Georgia" });
    text(item.subtitle, 155, 175, 870, 40, 19, border, { align: "left" });
    text("PRESENTED TO", 155, 310, 820, 30, 13, ink, { align: "left", spacing: 2 });
    recipient(355, accent, 39, 150, 850);
    shape("hline", 155, 465, 800, 2, border);
    text("For outstanding achievement and contribution", 155, 490, 820, 50, 17, ink, { align: "left" });
    date(625, 155, 280);
    text("AUTHORISED SIGNATURE", 700, 625, 260, 30, 12, ink);
  } else {
    // Decorative starburst and centred composition.
    shape("star", 505, 45, 110, 110, border);
    shape("circle", 470, 10, 180, 180, "transparent", border, 3);
    text(item.title, 100, 190, 920, 65, 36, accent, { bold: true, font: "Georgia" });
    text(item.subtitle, 100, 255, 920, 45, 20, border);
    text("AWARDED WITH APPRECIATION TO", 130, 340, 860, 35, 14, ink);
    recipient(390, accent, 42);
    shape("hline", 320, 495, 480, 2, border);
    text("For your remarkable effort and achievement", 150, 525, 820, 42, 17, ink);
    date(625);
    signatures(675);
  }

  return out;
}

// eslint-disable-next-line react-refresh/only-export-components
export function createTemplateDesign(item, orientation = "landscape") {
  const portrait = orientation === "portrait";
  return {
    id: crypto.randomUUID(),
    name: item.name,
    orientation,
    width: portrait ? 790 : 1120,
    height: portrait ? 1120 : 790,
    background: item.bg || "#ffffff",
    elements: buildDistinctTemplateElements(item, orientation)
  };
}

export default function TemplatesPanel({ design, backgroundImage = "", onApply }) {
  const [orientation, setOrientation] = useState(design.orientation || "landscape");
  const [recent, setRecent] = useState([]);
  const [custom, setCustom] = useState(readCustomTemplates);
  const [notice, setNotice] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const uploadInput = useRef(null);

  const recentTemplates = templates.filter(template => recent.includes(template.id));

  const applyTemplate = (item, selectedOrientation = orientation) => {
    const isCustom = !!item.custom;
    const itemOrientation = isCustom ? item.orientation || selectedOrientation : selectedOrientation;
    const portrait = itemOrientation === "portrait";
    const width = isCustom ? item.width || (portrait ? 790 : 1120) : (portrait ? 790 : 1120);
    const height = isCustom ? item.height || (portrait ? 1120 : 790) : (portrait ? 1120 : 790);

    const elements = isCustom ? (item.elements || []) : buildDistinctTemplateElements(item, itemOrientation);
    const background = item.background || item.bg || "#ffffff";

    onApply({
      ...design,
      name: item.name,
      bg: background,
      background,
      backgroundImage: item.backgroundImage || "",
      orientation: itemOrientation,
      width,
      height,
      elements
    });

    if (!isCustom) {
      setOrientation(itemOrientation);
      setRecent(old => [item.id, ...old.filter(id => id !== item.id)].slice(0, 4));
    }
    setNotice(`${item.name} applied`);
    setTimeout(() => setNotice(""), 2200);
  };

  const importTemplate = async file => {
    if (!file) return;
    try {
      let importedTemplates;
      if (/\.pptx$/i.test(file.name)) {
        const { createCanvaPptxTemplates } = await import("./canvaPptx");
        importedTemplates = await createCanvaPptxTemplates(file);
      } else {
        importedTemplates = [await createArtworkTemplate(file)];
      }
      const next = [...importedTemplates, ...custom];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (error) {
        console.error("Could not save imported template:", error);
        throw new Error("Browser storage is full. Remove an old custom template and try again.", { cause: error });
      }

      setCustom(next);
      setOrientation(importedTemplates[0]?.orientation || orientation);
      setNotice(/\.pptx$/i.test(file.name)
        ? `${importedTemplates.length} PowerPoint slide${importedTemplates.length === 1 ? "" : "s"} imported as editable layers.`
        : "Artwork uploaded as a template. It stays as a flat image layer; add text and fields from the editor.");
    } catch (error) {
      console.error(error);
      setNotice("Import failed: " + (error?.message || "unsupported or damaged file"));
    }
  };

  const saveCurrent = () => {
    const name = window.prompt("Name this reusable template:", design.name || "My Certificate");
    if (!name || !name.trim()) return;

    const item = normalizeCustomTemplate({
      id: crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      category: "Custom",
      bg: design.background || "#ffffff",
      backgroundImage: backgroundImage || design.backgroundImage || "",
      orientation: design.orientation || orientation,
      width: design.width || 1120,
      height: design.height || 790,
      elements: design.elements || []
    });

    const next = [item, ...custom];
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCustom(next);
      setNotice("Your design was saved as a template.");
    } catch {
      setNotice("Browser storage is full. Remove an old custom template first.");
    }
  };

  const removeCustom = item => {
    const next = custom.filter(t => t.id !== item.id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      setCustom(next);
    } catch {
      setNotice("Could not update saved templates.");
    }
  };

  return (
    <div className="designer-panel template-gallery">
      <div className="template-panel-heading">
        <span className="cp-gallery-eyebrow">DESIGN LIBRARY</span>
        <h3>Design templates</h3>
        <p>Browse a category, preview designs, and make one yours in the editor.</p>
      </div>

      <div className="cp-custom-template-actions">
        <button type="button" className="cp-upload-template" onClick={() => uploadInput.current?.click()}>
          <span>＋ Upload Template</span>
        </button>
        <input
          ref={uploadInput}
          type="file"
          accept=".pptx,.png,.jpg,.jpeg,.webp,.pdf,application/vnd.openxmlformats-officedocument.presentationml.presentation,image/png,image/jpeg,image/webp,application/pdf"
          style={{ display: "none" }}
          onChange={e => { importTemplate(e.target.files?.[0]); e.target.value = ""; }}
        />
        <button type="button" onClick={saveCurrent}>Save Current Design</button>
      </div>

      <p className="cp-template-upload-help">
        Uploaded artwork stays intact as a movable image layer. Add editable text and attributes on top; text baked into a flat image cannot be separated automatically.
      </p>

      {notice && <p className="cp-template-notice" role="status">{notice}</p>}

      <div className="template-orientation">
        <button type="button" className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button>
        <button type="button" className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button>
      </div>

      <button type="button" className="cp-open-template-library" onClick={() => setLibraryOpen(true)}>
        <span className="cp-open-template-library-icon"><LayoutTemplate size={17} /></span>
        <span>
          <strong>Browse the template library</strong>
          <small>{templates.length.toLocaleString()} designs across {categories.length - 1} categories</small>
        </span>
        <ChevronRight size={16} />
      </button>

      <section className="template-section cp-featured-templates">
        <h4>Featured templates <span>{templates.length.toLocaleString()} in library</span></h4>
        <div className="template-grid">
          {templates.slice(0, 6).map(item => (
            <button className="template-card" key={item.id} onClick={() => applyTemplate(item, orientation)}>
              <Preview item={item} portrait={orientation === "portrait"} />
              <span>{item.name}</span>
              <small className="cp-template-category-label">{item.category}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="template-section">
        <h4>My Templates <span>{custom.length} saved</span></h4>
        {custom.length ? (
          <div className="template-grid">
            {custom.map(item => (
              <div className="template-card-wrap" key={item.id}>
                <button className="template-card" onClick={() => applyTemplate(item)}>
                  <Preview item={item} portrait={item.orientation === "portrait"} />
                  <span>{item.name}</span>
                </button>
                <button className="cp-remove-template" type="button" onClick={() => removeCustom(item)} aria-label={`Delete ${item.name}`}>×</button>
              </div>
            ))}
          </div>
        ) : (
          <p className="cp-template-empty">Upload artwork or save a design to build your reusable collection.</p>
        )}
      </section>

      {recentTemplates.length > 0 && (
        <section className="template-section">
          <h4>Recently used</h4>
          <div className="template-grid">
            {recentTemplates.map(item => (
              <button className="template-card" key={item.id} onClick={() => applyTemplate(item)}>
                <Preview item={item} portrait={orientation === "portrait"} />
                <span>{item.name}</span>
              </button>
            ))}
          </div>
        </section>
      )}

      <TemplateLibraryDialog
        open={libraryOpen}
        templates={templates}
        customTemplates={custom}
        initialOrientation={orientation}
        buildDesign={createTemplateDesign}
        onClose={() => setLibraryOpen(false)}
        onSelect={applyTemplate}
        onImportCanva={() => uploadInput.current?.click()}
        onDeleteCustom={item => {
          if (window.confirm(`Delete custom template "${item.name}"?`)) removeCustom(item);
        }}
      />
    </div>
  );
}
