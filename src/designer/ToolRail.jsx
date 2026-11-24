import {
  LayoutTemplate, ImagePlus, Shapes, Type,
  Braces, QrCode, Layers
} from "lucide-react";

const tools = [
  ["Templates", LayoutTemplate],
  ["Uploads", ImagePlus],
  ["Elements", Shapes],
  ["Text", Type],
  ["Attributes", Braces],
  ["QR Codes", QrCode],
  ["Layers", Layers]
];

export default function ToolRail({ active, onSelect }) {
  return (
    <aside className="tool-rail cp-tool-rail" aria-label="Certificate editor tools">
      {tools.map(([name, Icon]) => (
        <button
          key={name}
          type="button"
          title={name}
          aria-label={name}
          aria-pressed={active === name}
          className={`cp-tool-button ${active === name ? "selected" : ""}`}
          onClick={() => onSelect(name)}
        >
          <Icon size={19} strokeWidth={1.8} />
          <span>{name}</span>
        </button>
      ))}
    </aside>
  );
}
