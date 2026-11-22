import { useState } from "react";
import { icons } from "lucide-react";

const basicShapes = [
  { name: "Rectangle", icon: "Square", shape: "rectangle" },
  { name: "Rounded rectangle", icon: "SquareRoundCorner", shape: "rounded" },
  { name: "Circle", icon: "Circle", shape: "circle" },
  { name: "Star", icon: "Star", shape: "star" },
  { name: "Diamond", icon: "Diamond", shape: "diamond" },
  { name: "Oval", icon: "Ellipse", shape: "oval" },
];

const shapes = basicShapes;

const lines = [
  { name: "Horizontal line", icon: "Minus", shape: "hline" },
  { name: "Vertical line", icon: "SeparatorVertical", shape: "vline" },
  { name: "Dashed line", icon: "Ellipsis", shape: "dashed" },
];

const decorations = [
  { name: "Certificate border", description: "Decorative double-line frame", icon: "SquareDashed", shape: "border" },
  { name: "Corner ornament", description: "Elegant corner decoration", icon: "Scan", shape: "corner" },
];

const iconGroups = [
  {
    name: "Awards & learning",
    icons: [
      "Award", "Medal", "Trophy", "Crown", "Badge", "BadgeCheck", "Certificate",
      "FileBadge", "Ribbon", "GraduationCap", "School", "BookOpen",
      "BookOpenCheck", "BookCheck", "Scroll", "ScrollText", "Stamp",
      "ShieldCheck", "Check", "CheckCheck", "CircleCheckBig", "CircleStar",
      "Star", "StarCheck", "Sparkles", "Target", "PartyPopper", "Flag",
      "Handshake", "HeartHandshake", "UserRoundCheck", "UserRoundStar",
      "UserStar", "CalendarCheck", "CalendarCheck2", "ClockCheck", "Globe",
      "Landmark", "MapPinCheck", "NotebookPen", "ClipboardCheck",
      "BookmarkCheck", "Signature", "PenLine", "Feather", "FileCheck",
      "FileCheckCorner",
    ],
  },
  {
    name: "Decorative accents",
    icons: [
      "Flower", "Flower2", "Leaf", "Sprout", "Sun", "MoonStar", "Heart",
      "Diamond", "Hexagon", "Circle", "Square", "Frame", "PanelTop",
      "PanelsTopLeft", "Gem", "SunMedium", "SunDim", "Sunrise", "Sunset",
      "CloudSun", "SeparatorHorizontal", "BetweenHorizontalStart",
      "BetweenHorizontalEnd", "CornerUpLeft", "CornerUpRight",
    ],
  },
].map(group => ({
  ...group,
  elements: group.icons
    .filter(iconName => icons[iconName])
    .map(iconName => ({
      iconName,
      name: iconName.replace(/([a-z0-9])([A-Z])/g, "$1 $2"),
    })),
}));
const textPresets = [
  { name: "Heading", text: "Certificate of Achievement", fontSize: 38, fontFamily: "Manrope", bold: true },
  { name: "Subheading", text: "Awarded in recognition of excellence", fontSize: 24, fontFamily: "Playfair Display" },
  { name: "Body text", text: "For successfully completing the programme", fontSize: 17, fontFamily: "Inter" },
];

export default function ElementsPanel({ onAdd }) {
  const [search, setSearch] = useState("");
  const [customText, setCustomText] = useState("");
  const query = search.trim().toLowerCase();
  const matches = item => !query || `${item.name} ${item.shape || ""} ${item.description || ""}`.toLowerCase().includes(query);
  const visibleShapes = shapes.filter(matches);
  const visibleLines = lines.filter(matches);
  const visibleDecorations = decorations.filter(matches);
  const visibleIconGroups = iconGroups
    .map(group => ({ ...group, elements: group.elements.filter(matches) }))
    .filter(group => group.elements.length > 0);
  const iconCount = visibleIconGroups.reduce((count, group) => count + group.elements.length, 0);
  const showText = !query || query.includes("text") || textPresets.some(preset => `${preset.name} ${preset.text}`.toLowerCase().includes(query));
  const showUpload = !query || ["custom", "graphics", "upload", "svg"].some(word => word.includes(query) || query.includes(word));
  const hasResults = visibleShapes.length || visibleLines.length || visibleDecorations.length || iconCount || showUpload || showText;

  const addShape = shape => {
    const line = ["hline", "vline", "dashed"].includes(shape);
    const decoration = ["border", "corner"].includes(shape);
    onAdd("shape", "", {
      shape,
      fill: "transparent",
      stroke: "#315eea",
      strokeWidth: line ? 3 : decoration ? 4 : 2,
      opacity: 1,
      width: shape === "vline" ? 8 : line ? 300 : decoration ? 500 : 150,
      height: shape === "vline" ? 150 : line ? 8 : decoration ? 350 : 110
    });
  };

  const addIcon = item => onAdd("shape", item.name, {
    shape: "icon",
    iconName: item.iconName,
    fill: "transparent",
    stroke: "#315eea",
    strokeWidth: 2,
    opacity: 1,
    width: 140,
    height: 140,
  });

  const addText = (text, style = {}) => onAdd("text", text, {
    fontFamily: "Inter",
    fontSize: 24,
    color: "#26334d",
    align: "center",
    ...style,
  });

  const uploadSVG = async file => {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("SVG must be smaller than 2 MB.");
      return;
    }
    const source = await file.text();
    if (!/<svg[\s>]/i.test(source) || /<script|foreignObject|javascript:/i.test(source)) {
      alert("Please select a valid, safe SVG file.");
      return;
    }
    const cleaned = source.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
    const src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(cleaned)));
    onAdd("image", "SVG graphic", { src, width: 180, height: 140 });
  };

  return (
    <div className="designer-panel cp-elements-panel">
      <div className="cp-elements-heading">
        <h3>Elements</h3>
        <p>Certificate-ready shapes, awards and finishing touches.</p>
      </div>

      <div className="cp-elements-search">
        <span>⌕</span>
        <input aria-label="Search elements" placeholder="Search certificate elements" value={search} onChange={e => setSearch(e.target.value)} />
        {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}>×</button>}
      </div>

      {visibleShapes.length > 0 && <section className="cp-elements-section">
        <h4>Basic shapes <span>{visibleShapes.length}</span></h4>
        <div className="cp-elements-grid">
          {visibleShapes.map(item => (
            <button type="button" key={item.shape} onClick={() => addShape(item.shape)}>
              <b className="cp-element-symbol">{ReactIcon(item.icon)}</b><small>{item.name}</small>
            </button>
          ))}
        </div>
      </section>}

      {visibleLines.length > 0 && <section className="cp-elements-section">
        <h4>Lines and dividers</h4>
        <div className="cp-elements-grid cp-line-grid">
          {visibleLines.map(item => (
            <button type="button" key={item.shape} onClick={() => addShape(item.shape)}>
              <b className="cp-element-symbol">{ReactIcon(item.icon)}</b><small>{item.name}</small>
            </button>
          ))}
        </div>
      </section>}

      {visibleDecorations.length > 0 && <section className="cp-elements-section">
        <h4>Certificate decorations</h4>
        <div className="cp-decoration-list">
          {visibleDecorations.map(item => (
            <button type="button" key={item.shape} onClick={() => addShape(item.shape)}>
              <b className="cp-element-symbol">{ReactIcon(item.icon)}</b><span><strong>{item.name}</strong><small>{item.description}</small></span>
            </button>
          ))}
        </div>
      </section>}

      {visibleIconGroups.map(group => (
        <section className="cp-elements-section" key={group.name}>
          <h4>{group.name} <span>{group.elements.length}</span></h4>
          <div className="cp-elements-grid cp-icon-grid">
            {group.elements.map(item => (
              <button type="button" key={item.iconName} title={item.name} aria-label={`Add ${item.name}`} onClick={() => addIcon(item)}>
                <b className="cp-element-symbol">{ReactIcon(item.iconName)}</b><small>{item.name}</small>
              </button>
            ))}
          </div>
        </section>
      ))}

      {showText && <section className="cp-elements-section cp-elements-text-section">
        <h4>Text</h4>
        <div className="cp-text-presets">
          {textPresets.map(preset => (
            <button type="button" key={preset.name} onClick={() => addText(preset.text, {
              fontSize: preset.fontSize,
              fontFamily: preset.fontFamily,
              bold: preset.bold,
            })}>
              <strong>{preset.name === "Heading" ? "Aa" : preset.name === "Subheading" ? "Ab" : "Ag"}</strong>
              <span>{preset.name}</span>
            </button>
          ))}
        </div>
        <label className="cp-elements-custom-text">
          <span>Custom text</span>
          <textarea rows="2" value={customText} onChange={e => setCustomText(e.target.value)} placeholder="Type your text" />
        </label>
        <button type="button" className="cp-elements-add-text" disabled={!customText.trim()} onClick={() => addText(customText.trim())}>
          + Add custom text
        </button>
      </section>}

      {showUpload && <section className="cp-elements-section">
        <h4>Custom graphics</h4>
        <label className="cp-svg-upload">
          <span>＋</span>
          <strong>Upload SVG graphic</strong>
          <small>Choose an SVG file · Maximum 2 MB</small>
          <input type="file" accept=".svg,image/svg+xml" onChange={e => { uploadSVG(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </section>}

      {!hasResults && <div className="cp-elements-empty">No elements match “{search}”. Try another search.</div>}
    </div>
  );
}

function ReactIcon(name) {
  const Icon = icons[name] || icons.CircleQuestionMark;
  return <Icon aria-hidden="true" size={25} strokeWidth={1.7} />;
}
