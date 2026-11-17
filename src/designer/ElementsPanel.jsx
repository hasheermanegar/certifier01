import React from "react";

const shapes = [
  { name: "Rectangle", icon: "▭", shape: "rectangle" },
  { name: "Rounded rectangle", icon: "▢", shape: "rounded" },
  { name: "Circle", icon: "●", shape: "circle" },
  { name: "Triangle", icon: "▲", shape: "triangle" },
  { name: "Star", icon: "★", shape: "star" },
  { name: "Diamond", icon: "◆", shape: "diamond" },
];

const lines = [
  { name: "Horizontal line", icon: "―", shape: "hline" },
  { name: "Vertical line", icon: "│", shape: "vline" },
  { name: "Dashed line", icon: "┄", shape: "dashed" },
];

export default function ElementsPanel({ onAdd }) {
  const addShape = shape => {
    const line = ["hline", "vline", "dashed"].includes(shape);
    onAdd("shape", "", {
      shape,
      fill: line ? "transparent" : "#315eea",
      stroke: line ? "#315eea" : "transparent",
      strokeWidth: line ? 3 : 0,
      opacity: 1,
      width: shape === "vline" ? 8 : line ? 300 : 150,
      height: shape === "hline" ? 8 : line ? 150 : 110
    });
  };

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
    onAdd("image", "SVG graphic", {
      src, width: 180, height: 140
    });
  };

  return (
    <div className="designer-panel cp-elements-panel">
      <div className="cp-elements-heading">
        <h3>Elements</h3>
        <p>Add shapes and decorative graphics to your certificate.</p>
      </div>

      <div className="cp-elements-search">
        <span>⌕</span>
        <input placeholder="Search elements" onChange={() => {}} />
      </div>

      <section className="cp-elements-section">
        <h4>Basic shapes <span>6</span></h4>
        <div className="cp-elements-grid">
          {shapes.map(item => (
            <button key={item.shape} onClick={() => addShape(item.shape)}>
              <b>{item.icon}</b><small>{item.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="cp-elements-section">
        <h4>Lines and dividers</h4>
        <div className="cp-elements-grid cp-line-grid">
          {lines.map(item => (
            <button key={item.shape} onClick={() => addShape(item.shape)}>
              <b>{item.icon}</b><small>{item.name}</small>
            </button>
          ))}
        </div>
      </section>

      <section className="cp-elements-section">
        <h4>Certificate decorations</h4>
        <div className="cp-decoration-list">
          <button onClick={() => addShape("border")}>
            <b>▣</b><span><strong>Certificate border</strong><small>Decorative double-line frame</small></span>
          </button>
          <button onClick={() => addShape("corner")}>
            <b>❖</b><span><strong>Corner ornament</strong><small>Elegant corner decoration</small></span>
          </button>
        </div>
      </section>

      <section className="cp-elements-section">
        <h4>Custom graphics</h4>
        <label className="cp-svg-upload">
          <span>＋</span>
          <strong>Upload SVG graphic</strong>
          <small>Choose an SVG file · Maximum 2 MB</small>
          <input type="file" accept=".svg,image/svg+xml"
            onChange={e => { uploadSVG(e.target.files?.[0]); e.target.value = ""; }} />
        </label>
      </section>
    </div>
  );
}
