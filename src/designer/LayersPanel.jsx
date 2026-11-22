import { useState } from "react";
import {
  Type, QrCode, Image, Shapes, Braces,
  Eye, EyeOff, ChevronUp, ChevronDown,
  Trash2, Layers, Search, Lock, Unlock, PenTool, GripVertical
} from "lucide-react";

function getLayerInfo(element) {
  const types = {
    text: { label: "Text", icon: Type, color: "#1A4D2E", bg: "#E7F3EB" },
    attribute: { label: "Dynamic field", icon: Braces, color: "#2F7D57", bg: "#E7F3EB" },
    qr: { label: "QR code", icon: QrCode, color: "#11D452", bg: "#E7F3EB" },
    image: { label: "Image", icon: Image, color: "#4C9A66", bg: "#F8FCF9" },
    shape: { label: "Shape", icon: Shapes, color: "#1A4D2E", bg: "#E7F3EB" }
  };

  const info = types[element.type] || types.text;
  let name = element.text || info.label;
  let preview = "";

  if (element.type === "qr") {
    name = element.qrMode === "automatic"
      ? "Verification QR"
      : "Custom QR code";
    preview = element.qrMode === "automatic" ? "Automatic verification" : "Custom destination";
  } else if (element.type === "image") {
    const sourceName = element.name || element.text || "";
    if (/signature|sign here|signatory/i.test(sourceName)) {
      name = sourceName && sourceName !== "Image" ? sourceName : "Signature";
      info.label = "Signature";
      info.icon = PenTool;
    } else if (/logo/i.test(sourceName)) {
      name = sourceName || "Logo";
      info.label = "Logo";
    } else {
      name = sourceName || "Image";
      info.label = "Image";
    }
    preview = `${Math.round(element.width || 0)} × ${Math.round(element.height || 0)} px`;
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
    preview = element.text || "";
  }
  if (element.type === "text") preview = element.text || "";
  if (element.type === "shape") preview = `${element.shape || "Shape"} · ${Math.round(element.width || 0)} × ${Math.round(element.height || 0)} px`;

  return { ...info, name, preview };
}

export default function LayersPanel({
  elements, selected, onSelect, onDelete, onMove, onVisibilityChange, onLockChange,
  background, backgroundImage
}) {
  const [search, setSearch] = useState("");

  const ordered = [...elements].reverse();
  const filtered = ordered.filter(element => {
    const info = getLayerInfo(element);
    return info.name.toLowerCase().includes(search.toLowerCase()) ||
      info.label.toLowerCase().includes(search.toLowerCase());
  });

  const toggleVisibility = element => {
    onVisibilityChange?.(element.id, !!element.hidden);
  };

  const toggleLock = element => {
    onLockChange?.(element.id, !element.locked);
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

      <div className="cp-layer-canvas-row">
        <span
          className="cp-layer-canvas-thumbnail"
          style={{
            background: backgroundImage ? `url("${backgroundImage}") center/cover` : background || "#ffffff"
          }}
        />
        <span className="cp-layer-name">
          <strong>Canvas background</strong>
          <small>{backgroundImage ? "Background image" : "Solid colour"}</small>
        </span>
        <span className="cp-layer-canvas-lock"><Lock size={12}/></span>
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
          const isHidden = !!element.hidden;
          const isLocked = !!element.locked;
          const actualIndex = ordered.findIndex(item => item.id === element.id);

          return (
            <div
              key={element.id}
              className={`cp-layer-card ${isSelected ? "selected" : ""} ${isHidden ? "hidden" : ""} ${isLocked ? "locked" : ""}`}
            >
              <button
                type="button"
                className="cp-layer-select"
                onClick={() => onSelect(element.id)}
                title={`Select ${info.name}`}
              >
                {element.type === "image" ? (
                  <span className="cp-layer-icon cp-layer-thumbnail">
                    <img src={element.src} alt=""/>
                  </span>
                ) : element.type === "shape" ? (
                  <span
                    className="cp-layer-icon cp-layer-shape-preview"
                    style={{ color: element.stroke || info.color, background: element.fill && element.fill !== "transparent" ? element.fill : info.bg }}
                  >
                    <Shapes size={16}/>
                  </span>
                ) : (
                  <span
                    className="cp-layer-icon"
                    style={{ color: info.color, background: info.bg }}
                  >
                    {element.type === "text" && element.text ? (
                      <span className="cp-layer-text-preview" style={{color:element.color||info.color,fontSize:Math.min(14,Math.max(8,element.fontSize||11))}}>T</span>
                    ) : <Icon size={16}/>}
                  </span>
                )}
                <span className="cp-layer-name">
                  <strong>{info.name}</strong>
                  <small>{info.preview ? `${info.label} · ${info.preview}` : info.label}</small>
                </span>
              </button>

              <div className="cp-layer-actions">
                <span className="cp-layer-grip" title="Layer order"><GripVertical size={13}/></span>
                <button
                  type="button"
                  onClick={() => toggleVisibility(element)}
                  title={isHidden ? "Show element" : "Hide element"}
                  className="cp-layer-action"
                >
                  {isHidden ? <EyeOff size={14}/> : <Eye size={14}/>}
                </button>
                <button
                  type="button"
                  onClick={() => toggleLock(element)}
                  title={isLocked ? "Unlock element" : "Lock element"}
                  className={`cp-layer-action ${isLocked ? "active" : ""}`}
                >
                  {isLocked ? <Lock size={14}/> : <Unlock size={14}/>}
                </button>
                <button
                  type="button"
                  onClick={() => onMove(element.id, -1)}
                  disabled={actualIndex === 0}
                  title="Move layer up"
                  className="cp-layer-action"
                >
                  <ChevronUp size={15}/>
                </button>
                <button
                  type="button"
                  onClick={() => onMove(element.id, 1)}
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
        <span>{elements.filter(element => element.hidden).length} hidden</span>
        <span>{elements.filter(element => element.locked).length} locked · {elements.length} total</span>
      </div>
    </div>
  );
}
