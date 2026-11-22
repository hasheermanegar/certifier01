import { useState } from "react";
import {
  AlignCenter, AlignLeft, AlignRight, Bold, Italic, Type, Underline
} from "lucide-react";

const presets = [
  {
    name: "Award title",
    category: "ELEGANT SERIF",
    sample: "Certificate of Excellence",
    text: "Certificate of Excellence",
    size: 38,
    fontFamily: "Playfair Display",
    color: "#243653",
    bold: false,
    letterSpacing: 0,
  },
  {
    name: "Modern heading",
    category: "CLEAN & BOLD",
    sample: "Achievement Award",
    text: "Achievement Award",
    size: 34,
    fontFamily: "Manrope",
    color: "#243653",
    bold: true,
    letterSpacing: 0,
  },
  {
    name: "Recipient name",
    category: "SIGNATURE SERIF",
    sample: "Alex Morgan",
    text: "Alex Morgan",
    size: 40,
    fontFamily: "Cormorant Garamond",
    color: "#315eea",
    bold: false,
    letterSpacing: 0,
  },
  {
    name: "Supporting line",
    category: "REFINED BODY",
    sample: "Awarded in recognition of outstanding achievement",
    text: "Awarded in recognition of outstanding achievement",
    size: 18,
    fontFamily: "Inter",
    color: "#536078",
    bold: false,
    letterSpacing: 0,
  },
  {
    name: "Small caps",
    category: "SPACED LABEL",
    sample: "PROFESSIONAL DEVELOPMENT",
    text: "PROFESSIONAL DEVELOPMENT",
    size: 13,
    fontFamily: "Manrope",
    color: "#536078",
    bold: true,
    letterSpacing: 2,
  },
  {
    name: "Signature",
    category: "HANDWRITTEN",
    sample: "With distinction",
    text: "With distinction",
    size: 34,
    fontFamily: "Great Vibes",
    color: "#315eea",
    italic: true,
    letterSpacing: 0,
  },
];

const fonts = [
  "Inter", "Roboto", "Open Sans", "Poppins", "Manrope",
  "Montserrat", "Playfair Display", "Cormorant Garamond",
  "Merriweather", "Georgia", "Allura", "Great Vibes", "Dancing Script"
];

const colors = ["#243653", "#315eea", "#536078", "#8a6c38", "#1f746b", "#873c50"];

export default function TextPanel({ onAdd }) {
  const [value, setValue] = useState("");
  const [font, setFont] = useState("Inter");
  const [size, setSize] = useState(24);
  const [color, setColor] = useState("#243653");
  const [align, setAlign] = useState("center");
  const [bold, setBold] = useState(false);
  const [italic, setItalic] = useState(false);
  const [underline, setUnderline] = useState(false);
  const [letterSpacing, setLetterSpacing] = useState(0);

  const addText = (text, style = {}) => onAdd(text, {
    fontFamily: font,
    fontSize: size,
    color,
    align,
    bold,
    italic,
    underline,
    letterSpacing,
    ...style,
  });

  const setFontSize = nextSize => {
    const parsed = Number(nextSize);
    if (Number.isFinite(parsed)) setSize(Math.max(8, Math.min(120, parsed)));
  };

  return (
    <div className="designer-panel cp-text-panel cp-text-studio">
      <div className="cp-text-studio-header">
        <span className="cp-text-studio-icon"><Type size={18} /></span>
        <div>
          <span className="cp-text-studio-eyebrow">TYPOGRAPHY STUDIO</span>
          <h3>Make it meaningful</h3>
          <p>Set the tone with thoughtful type.</p>
        </div>
      </div>

      <section className="cp-text-section cp-text-presets-section">
        <div className="cp-text-section-heading">
          <div><h4>Made for certificates</h4><p>One click to add a styled text layer</p></div>
          <span className="cp-text-count">{presets.length} styles</span>
        </div>
        <div className="cp-text-studio-presets">
          {presets.map(preset => (
            <button
              type="button"
              className="cp-text-style-card"
              key={preset.name}
              onClick={() => addText(preset.text, {
                fontFamily: preset.fontFamily,
                fontSize: preset.size,
                color: preset.color,
                align: "center",
                bold: !!preset.bold,
                italic: !!preset.italic,
                underline: false,
                letterSpacing: preset.letterSpacing,
              })}
            >
              <span className="cp-text-style-category">{preset.category}</span>
              <strong style={{
                fontFamily: preset.fontFamily,
                fontSize: preset.size >= 34 ? 19 : preset.size <= 14 ? 12 : 14,
                color: preset.color,
                fontWeight: preset.bold ? 700 : 500,
                fontStyle: preset.italic ? "italic" : "normal",
                letterSpacing: preset.letterSpacing,
              }}>{preset.sample}</strong>
              <span className="cp-text-style-name">{preset.name}<span aria-hidden="true">＋</span></span>
            </button>
          ))}
        </div>
      </section>

      <section className="cp-text-section cp-text-custom-section">
        <div className="cp-text-section-heading">
          <div><h4>Your own text</h4><p>Fine-tune every detail before adding it</p></div>
        </div>

        <label className="cp-text-control-label" htmlFor="cp-text-content">Text content</label>
        <textarea
          id="cp-text-content"
          rows="3"
          value={value}
          onChange={event => setValue(event.target.value)}
          placeholder="Type a name, title or message…"
        />

        <label className="cp-text-control-label" htmlFor="cp-text-font">Typeface</label>
        <select id="cp-text-font" value={font} onChange={event => setFont(event.target.value)}>
          {fonts.map(item => <option key={item} value={item}>{item}</option>)}
        </select>
        <div className="cp-text-font-preview" style={{ fontFamily: font }}>
          Aa <span>{font} · {size}px</span>
        </div>
        <div
          className="cp-text-live-preview"
          aria-label="Text preview"
          style={{
            fontFamily: font,
            fontSize: `${Math.min(size, 28)}px`,
            color,
            fontWeight: bold ? 700 : 400,
            fontStyle: italic ? "italic" : "normal",
            textDecoration: underline ? "underline" : "none",
            textAlign: align,
            letterSpacing: `${letterSpacing}px`,
          }}
        >{value.trim() || "Your text preview"}</div>

        <div className="cp-text-control-row">
          <label className="cp-text-control-label" htmlFor="cp-text-size">Size</label>
          <span className="cp-text-size-value">{size} px</span>
        </div>
        <div className="cp-text-size-controls">
          <input
            id="cp-text-size"
            aria-label="Font size"
            type="range"
            min="8"
            max="120"
            value={size}
            onChange={event => setFontSize(event.target.value)}
          />
          <input
            aria-label="Font size in pixels"
            type="number"
            min="8"
            max="120"
            value={size}
            onChange={event => setFontSize(event.target.value)}
          />
        </div>

        <span className="cp-text-control-label">Style & alignment</span>
        <div className="cp-text-toolbar">
          <button type="button" className={bold ? "active" : ""} aria-label="Bold" aria-pressed={bold} onClick={() => setBold(current => !current)}><Bold size={16} /></button>
          <button type="button" className={italic ? "active" : ""} aria-label="Italic" aria-pressed={italic} onClick={() => setItalic(current => !current)}><Italic size={16} /></button>
          <button type="button" className={underline ? "active" : ""} aria-label="Underline" aria-pressed={underline} onClick={() => setUnderline(current => !current)}><Underline size={16} /></button>
          <span className="cp-text-toolbar-divider" />
          <button type="button" className={align === "left" ? "active" : ""} aria-label="Align left" aria-pressed={align === "left"} onClick={() => setAlign("left")}><AlignLeft size={16} /></button>
          <button type="button" className={align === "center" ? "active" : ""} aria-label="Align center" aria-pressed={align === "center"} onClick={() => setAlign("center")}><AlignCenter size={16} /></button>
          <button type="button" className={align === "right" ? "active" : ""} aria-label="Align right" aria-pressed={align === "right"} onClick={() => setAlign("right")}><AlignRight size={16} /></button>
        </div>

        <span className="cp-text-control-label">Text colour</span>
        <div className="cp-text-color-row">
          <div className="cp-text-color-swatches" aria-label="Suggested text colours">
            {colors.map(swatch => (
              <button
                type="button"
                key={swatch}
                className={color.toLowerCase() === swatch ? "active" : ""}
                style={{ "--cp-text-swatch": swatch }}
                aria-label={`Use ${swatch} text`}
                aria-pressed={color.toLowerCase() === swatch}
                onClick={() => setColor(swatch)}
              />
            ))}
          </div>
          <input type="color" aria-label="Custom text colour" value={color} onChange={event => setColor(event.target.value)} />
        </div>

        <label className="cp-text-control-label cp-text-spacing-label" htmlFor="cp-text-spacing">
          Letter spacing <span>{letterSpacing} px</span>
        </label>
        <input
          id="cp-text-spacing"
          type="range"
          min="-2"
          max="12"
          step="0.5"
          value={letterSpacing}
          onChange={event => setLetterSpacing(Number(event.target.value))}
        />

        <button type="button" className="cp-text-add-button" disabled={!value.trim()} onClick={() => addText(value.trim())}>
          <Type size={16} /> Add text to certificate
        </button>
      </section>

      <div className="cp-text-studio-tip">
        <strong>A little design tip</strong>
        <p>Pair one expressive heading with a simple, readable font for supporting details.</p>
      </div>
    </div>
  );
}
