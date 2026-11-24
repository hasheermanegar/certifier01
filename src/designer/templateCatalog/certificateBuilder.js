import { createOrnaments } from "./ornaments.js";

export function buildPremiumDesign(item, orientation = "landscape") {
  const portrait = orientation === "portrait";
  const width = portrait ? 790 : 1120;
  const height = portrait ? 1120 : 790;
  const sx = width / 1120;
  const sy = height / 790;
  const p = item.palette;
  const elements = [];

  const shape = (name, x, y, w, h, fill, stroke = "transparent", sw = 0) => {
    elements.push({
      id: crypto.randomUUID(),
      type: "shape",
      shape: name === "border" ? "rectangle" : name,
      preciseShape: true,
      x: Math.round(x * sx),
      y: Math.round(y * sy),
      width: Math.round(w * sx),
      height: Math.round(h * sy),
      fill,
      stroke,
      strokeWidth: sw,
      opacity: 1
    });
  };

  const text = (value, x, y, w, h, size, color, options = {}) => {
    elements.push({
      id: crypto.randomUUID(),
      type: options.attribute ? "attribute" : "text",
      text: value,
      x: Math.round(x * sx),
      y: Math.round(y * sy),
      width: Math.round(w * sx),
      height: Math.round(h * sy),
      fontSize: Math.round(size * Math.min(sx, sy)),
      color,
      fontFamily: options.font || "Arial",
      bold: !!options.bold,
      italic: !!options.italic,
      align: options.align || "center",
      letterSpacing: options.spacing || 0,
      opacity: 1
    });
  };

  createOrnaments(shape, p, item.style);

  const modern = ["corporate", "minimal", "technology", "artistic"].includes(item.style);
  const font = modern ? "Arial" : "Georgia";
  const titleY = item.style === "academic" ? 160 : 135;

  text("{{issuer_name}}", 220, 92, 680, 32, 16, p.primary,
    { attribute: true, spacing: 2 });

  if (item.style === "academic") {
    elements[elements.length - 1].y = Math.round(145 * sy);
  }

  text("CERTIFICATE", 120, titleY + 35, 880, 75, 48, p.primary,
    { font, bold: true, spacing: modern ? 5 : 2 });

  text(item.subtitle, 120, titleY + 112, 880, 40, 22, p.primary,
    { spacing: 3 });

  shape("rectangle", 460, 305, 200, 2, p.accent);

  text("PROUDLY PRESENTED TO", 140, 335, 840, 32, 14, p.ink,
    { spacing: 2 });

  text("{{recipient_name}}", 110, 380, 900, 80, 49, p.primary,
    { attribute: true, font: "Georgia", italic: !modern, bold: true });

  shape("rectangle", 260, 465, 600, 2, p.accent);

  text(item.description, 150, 490, 820, 40, 17, p.ink);

  text("{{issue_date}}", 360, 555, 400, 36, 16, p.primary,
    { attribute: true });

  shape("rectangle", 180, 645, 240, 2, p.accent);
  shape("rectangle", 700, 645, 240, 2, p.accent);

  text("AUTHORISED SIGNATURE", 150, 658, 300, 30, 12, p.ink);
  text("ISSUED BY", 670, 658, 300, 30, 12, p.ink);

  text("{{credential_id}}", 360, 695, 400, 25, 11, p.ink,
    { attribute: true });

  return {
    id: crypto.randomUUID(),
    name: item.name,
    orientation,
    width,
    height,
    background: p.background,
    elements
  };
}
