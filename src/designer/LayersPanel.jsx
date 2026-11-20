import { useState } from "react";
import {
  Type, QrCode, Image, Shapes, Braces,
  Eye, EyeOff, ChevronUp, ChevronDown,
  Trash2, Layers, Search
} from "lucide-react";

function getLayerInfo(element) {
  const types = {
    text: { label: "Text", icon: Type, color: "#315eea", bg: "#edf2ff" },
    attribute: { label: "Dynamic field", icon: Braces, color: "#8754c7", bg: "#f3edff" },
    qr: { label: "QR code", icon: QrCode, color: "#16865b", bg: "#e9f8f0" },
    image: { label: "Image", icon: Image, color: "#c17a24", bg: "#fff5e8" },
    shape: { label: "Shape", icon: Shapes, color: "#1689a5", bg: "#e9f8fc" }
  };

  const info = types[element.type] || types.text;
  let name = element.text || info.label;

  if (element.type === "qr") {
    name = element.qrMode === "automatic"
      ? "Verification QR"
      : "Custom QR code";
  } else if (element.type === "image") {
    name = "Image element";
  } else if (element.type === "shape") {
    name = element.shape
      ? element.shape.charAt(0).toUpperCase() + element.shape.slice(1)
      : "Shape element";
  } else if (element.type === "attribute") {
    const names = {
      "{{recipient_name}}": "Recipient Name",
      "{{recipient_email}}": "Recipient Email",
      "{{credential_title}}": "Credential Title",
      "{{issue_date}}": "Issue Date",
      "{{expiry_date}}": "Expiry Date",
      "{{credential_id}}": "Credential ID",
      "{{issuer_name}}": "Issuer Name",
      "{{verification_url}}": "Verification URL"
    };
    name = names[name] || name.replace(/[{}]/g, "").replaceAll("_", " ");
  }

  return { ...info, name };
}

export default function LayersPanel({
  elements, selected, onSelect, onDelete, onMove, onVisibilityChange
}) {
  const [search, setSearch] = useState("");
  const [hidden, setHidden] = useState([]);

  const ordered = [...elements].reverse();
  const filtered = ordered.filter(element => {
    const info = getLayerInfo(element);
    return info.name.toLowerCase().includes(search.toLowerCase()) ||
      info.label.toLowerCase().includes(search.toLowerCase());
  });

  const toggleVisibility = id => {
    setHidden(previous => {
      const next = previous.includes(id)
        ? previous.filter(item => item !== id)
        : [...previous, id];
      onVisibilityChange?.(id, !next.includes(id));
      return next;
    });
  };

  return (
    <div className="designer-panel cp-layers-panel">
      <div className="cp-layers-heading">
        <div>
          <span className="cp-panel-eyebrow">CANVAS ORGANISATION</span>
          <h3>Layers</h3>
          <p>Manage and organise the elements in your design.</p>
        </div>
        <span className="cp-layers-heading-icon"><Layers size={20}/></span>
      </div>

      <div className="cp-layers-summary">
        <span><Layers size={14}/> All elements</span>
        <strong>{elements.length}</strong>
      </div>

      <div className="cp-layers-search">
        <Search size={15}/>
        <input
          value={search}
          onChange={event => setSearch(event.target.value)}
          placeholder="Search layers..."
        />
      </div>

      <div className="cp-layers-list-heading">
        <strong>DESIGN ELEMENTS</strong>
        <span>{filtered.length} layers</span>
      </div>

      <div className="cp-layer-list">
        {filtered.map(element => {
          const info = getLayerInfo(element);
          const Icon = info.icon;
          const isSelected = selected === element.id;
          const isHidden = hidden.includes(element.id);
          const actualIndex = ordered.findIndex(item => item.id === element.id);

          return (
            <div
              key={element.id}
              className={`cp-layer-card ${isSelected ? "selected" : ""} ${isHidden ? "hidden" : ""}`}
            >
              <button
                type="button"
                className="cp-layer-select"
                onClick={() => onSelect(element.id)}
                title={`Select ${info.name}`}
              >
                <span
                  className="cp-layer-icon"
                  style={{ color: info.color, background: info.bg }}
                >
                  <Icon size={16}/>
                </span>
                <span className="cp-layer-name">
                  <strong>{info.name}</strong>
                  <small>{info.label}</small>
                </span>
              </button>

              <div className="cp-layer-actions">
                <button
                  type="button"
                  onClick={() => toggleVisibility(element.id)}
                  title={isHidden ? "Show element" : "Hide element"}
                  className="cp-layer-action"
                >
                  {isHidden ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
                <button
                  type="button"
                  onClick={() => onMove(element.id, 1)}
                  disabled={actualIndex === 0}
                  title="Move layer up"
                  className="cp-layer-action"
                >
                  <ChevronUp size={15}/>
                </button>
                <button
                  type="button"
                  onClick={() => onMove(element.id, -1)}
                  disabled={actualIndex === ordered.length - 1}
                  title="Move layer down"
                  className="cp-layer-action"
                >
                  <ChevronDown size={15}/>
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(element.id)}
                  title="Delete layer"
                  className="cp-layer-action delete"
                >
                  <Trash2 size={14}/>
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="cp-layers-empty">
            <Layers size={24}/>
            <strong>No layers found</strong>
            <span>Try another search or add an element.</span>
          </div>
        )}
      </div>

      <div className="cp-layers-footer">
        <span>{hidden.length} hidden</span>
        <span>{elements.length} total elements</span>
      </div>
    </div>
  );
}
