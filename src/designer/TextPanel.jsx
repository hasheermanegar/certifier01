import { useState } from "react";

const presets = [
  { name: "Heading", text: "Certificate of Achievement", size: 38, fontFamily: "Manrope", bold: true },
  { name: "Subheading", text: "Awarded in recognition of excellence", size: 24, fontFamily: "Playfair Display", bold: false },
  { name: "Body text", text: "For successfully completing the programme", size: 17, fontFamily: "Inter", bold: false },
  { name: "Signature", text: "Authorised Signature", size: 23, fontFamily: "Great Vibes", bold: false, italic: true },
];

const fonts = [
  "Inter", "Roboto", "Open Sans", "Poppins", "Manrope",
  "Montserrat", "Playfair Display", "Cormorant Garamond",
  "Merriweather", "Georgia", "Allura", "Great Vibes", "Dancing Script"
];

export default function TextPanel({ onAdd }) {
  const [value, setValue] = useState("Your text here");
  const [font, setFont] = useState("Inter");
  const [size, setSize] = useState(24);

  return (
    <div className="designer-panel cp-text-panel">
      <h3>Text</h3>
      <p>Add typography to your certificate.</p>

      <section className="cp-text-section">
        <h4>Quick add</h4>
        <div className="cp-text-presets">
          {presets.map(p => (
            <button key={p.name} onClick={() => onAdd(p.text, {
              fontFamily: p.fontFamily, fontSize: p.size,
              bold: !!p.bold, italic: !!p.italic,
              color: "#26334d", align: "center"
            })}>
              <strong style={{fontFamily:p.fontFamily,fontSize:p.size>30?19:15,fontWeight:p.bold?800:500,fontStyle:p.italic?"italic":"normal"}}>{p.name === "Heading" ? "Aa" : p.name === "Subheading" ? "Ab" : p.name === "Body text" ? "Ag" : "Signature"}</strong>
              <span>{p.name}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="cp-text-section">
        <h4>Custom text</h4>
        <textarea rows="3" value={value} onChange={e => setValue(e.target.value)} />
        <label>Font family
          <select value={font} onChange={e => setFont(e.target.value)}>
            {fonts.map(f => <option key={f}>{f}</option>)}
          </select>
        </label>
        <label>Font size
          <input type="number" min="8" max="120" value={size}
            onChange={e => setSize(Number(e.target.value))}/>
        </label>
        <button className="btn-primary full" onClick={() => onAdd(value, {
          fontFamily: font, fontSize: size, color: "#26334d", align: "center"
        })}>＋ Add text to certificate</button>
      </section>

      <section className="cp-text-section">
        <h4>Typography tips</h4>
        <p>Use large headings, elegant serif fonts for awards and readable fonts for supporting details.</p>
      </section>
    </div>
  );
}
