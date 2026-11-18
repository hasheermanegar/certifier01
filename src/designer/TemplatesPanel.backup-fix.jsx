import React, { useRef, useState } from "react";

const templates = [
  { id: 1, name: "Classic Blue", category: "Professional", bg: "#ffffff", border: "#315eea", accent: "#172554", title: "CERTIFICATE", subtitle: "OF ACHIEVEMENT" },
  { id: 2, name: "Elegant Gold", category: "Elegant", bg: "#fffdf7", border: "#c5a45c", accent: "#604b24", title: "Certificate of", subtitle: "Excellence" },
  { id: 3, name: "Modern Minimal", category: "Modern", bg: "#ffffff", border: "#d7dee9", accent: "#25334d", title: "CERTIFICATE", subtitle: "OF COMPLETION" },
  { id: 4, name: "Midnight", category: "Professional", bg: "#17233d", border: "#d7b76b", accent: "#ffffff", title: "CERTIFICATE", subtitle: "OF RECOGNITION" },
  { id: 5, name: "Rose Classic", category: "Elegant", bg: "#fff8f8", border: "#d9a4a8", accent: "#854b55", title: "Certificate of", subtitle: "Appreciation" },
  { id: 6, name: "Fresh Green", category: "Modern", bg: "#f8fffb", border: "#70a88b", accent: "#285b43", title: "CERTIFICATE", subtitle: "OF PARTICIPATION" },
  { id: 7, name: "Sky Blue", category: "Professional", bg: "#f5faff", border: "#82b4df", accent: "#24527c", title: "Certificate of", subtitle: "Achievement" },
  { id: 8, name: "Premium Black", category: "Elegant", bg: "#202124", border: "#d6bd80", accent: "#f8eac5", title: "CERTIFICATE", subtitle: "OF HONOUR" }
];

const categories = ["All", "Professional", "Elegant", "Modern"];
const STORAGE_KEY = "cp-custom-templates";

function readCustomTemplates() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}

function Preview({ item, portrait = false }) {
  return (
    <div className={`template-preview ${portrait ? "portrait" : ""}`}
      style={{
        background: item.backgroundImage ? `url("${item.backgroundImage}") center/100% 100% no-repeat` : item.bg || "#fff",
        borderColor: item.border || "#d7dee9"
      }}>
      {!item.backgroundImage && (
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

export default function TemplatesPanel({ design, onChange, onApply }) {
  const [orientation, setOrientation] = useState(design.orientation || "landscape");
  const [category, setCategory] = useState("All");
  const [recent, setRecent] = useState([1]);
  const [showCategories, setShowCategories] = useState(false);
  const [custom, setCustom] = useState(readCustomTemplates);
  const [notice, setNotice] = useState("");
  const uploadInput = useRef(null);

  const visible = templates.filter(t => category === "All" || t.category === category);
  const recentTemplates = templates.filter(t => recent.includes(t.id));

  const applyTemplate = item => {
    const portrait = orientation === "portrait";
    const isCustom = !!item.custom;
    const width = isCustom ? item.width : (portrait ? 790 : 1120);
    const height = isCustom ? item.height : (portrait ? 1120 : 790);

    const elements = isCustom ? (item.elements || []) : [
      { id: crypto.randomUUID(), type: "text", x: 100, y: 90, width: 920, height: 75, text: item.title, fontSize: 38, bold: true, color: item.accent, align: "center" },
      { id: crypto.randomUUID(), type: "text", x: 100, y: 165, width: 920, height: 45, text: item.subtitle, fontSize: 23, color: item.accent, align: "center" },
      { id: crypto.randomUUID(), type: "text", x: 150, y: 270, width: 820, height: 45, text: "This certificate is proudly presented to", fontSize: 19, color: item.accent, align: "center" },
      { id: crypto.randomUUID(), type: "attribute", x: 150, y: 330, width: 820, height: 70, text: "{{recipient_name}}", fontSize: 40, bold: true, color: item.border, align: "center" },
      { id: crypto.randomUUID(), type: "text", x: 150, y: 450, width: 820, height: 45, text: "For successfully completing the programme", fontSize: 18, color: item.accent, align: "center" },
      { id: crypto.randomUUID(), type: "attribute", x: 250, y: 550, width: 620, height: 40, text: "{{issue_date}}", fontSize: 16, color: item.accent, align: "center" }
    ];

    onApply({
      ...design,
      name: item.name,
      bg: item.bg,
      background: item.bg || "#ffffff",
      backgroundImage: item.backgroundImage || "",
      orientation: isCustom ? item.orientation : orientation,
      width,
      height,
      elements
    });

    if (!isCustom) setRecent(old => [item.id, ...old.filter(id => id !== item.id)].slice(0, 4));
    setNotice(`${item.name} applied`);
    setTimeout(() => setNotice(""), 2200);
  };

  const importTemplate = async file => {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) {
        setNotice("Please choose a file smaller than 2 MB.");
        return;
      }

      let dataUrl;
      let width = orientation === "portrait" ? 790 : 1120;
      let height = orientation === "portrait" ? 1120 : 790;

      if (file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf")) {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();
        const pdf = await pdfjs.getDocument({ data: new Uint8Array(await file.arrayBuffer()) }).promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(viewport.width);
        canvas.height = Math.round(viewport.height);
        await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
        dataUrl = canvas.toDataURL("image/jpeg", 0.82);
        await pdf.destroy();
      } else if (["image/png", "image/jpeg", "image/webp"].includes(file.type)) {
        dataUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      } else {
        setNotice("Use PNG, JPG, WebP or PDF files.");
        return;
      }

      const image = new Image();
      image.src = dataUrl;
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
      });

      const portrait = image.naturalHeight > image.naturalWidth;
      width = portrait ? 790 : 1120;
      height = portrait ? 1120 : 790;

      const item = {
        id: crypto.randomUUID(),
        custom: true,
        name: file.name.replace(/\.[^.]+$/, "") || "Uploaded template",
        category: "Custom",
        backgroundImage: dataUrl,
        bg: "#ffffff",
        orientation: portrait ? "portrait" : "landscape",
        width,
        height,
        elements: []
      };

      const next = [item, ...custom].slice(0, 5);
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        setNotice("Browser storage is full. Remove an old custom template first.");
        return;
      }

      setCustom(next);
      setOrientation(item.orientation);
      setNotice("Template uploaded. Select it under My Templates.");
    } catch (error) {
      console.error(error);
      setNotice("Could not import this file. Please try another file.");
    }
  };

  const saveCurrent = () => {
    const name = window.prompt("Name this reusable template:", design.name || "My Certificate");
    if (!name || !name.trim()) return;

    const item = {
      id: crypto.randomUUID(),
      custom: true,
      name: name.trim(),
      category: "Custom",
      bg: design.background || "#ffffff",
      backgroundImage: design.backgroundImage || "",
      orientation: design.orientation || orientation,
      width: design.width || 1120,
      height: design.height || 790,
      elements: design.elements || []
    };

    const next = [item, ...custom].slice(0, 5);
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
        <h3>Certificates</h3>
        <p>Choose a professionally designed certificate template.</p>
      </div>

      <div className="cp-custom-template-actions">
        <button type="button" className="cp-upload-template" onClick={() => uploadInput.current?.click()}>
          <span>＋ Upload Template</span>
        </button>
        <input
          ref={uploadInput}
          type="file"
          accept=".png,.jpg,.jpeg,.webp,.pdf,image/png,image/jpeg,image/webp,application/pdf"
          style={{ display: "none" }}
          onChange={e => { importTemplate(e.target.files?.[0]); e.target.value = ""; }}
        />
        <button type="button" onClick={saveCurrent}>Save Current Design</button>
      </div>

      {notice && <p className="cp-template-notice" role="status">{notice}</p>}

      <div className="template-orientation">
        <button className={orientation === "landscape" ? "active" : ""} onClick={() => setOrientation("landscape")}>Landscape</button>
        <button className={orientation === "portrait" ? "active" : ""} onClick={() => setOrientation("portrait")}>Portrait</button>
      </div>

      {custom.length > 0 && (
        <section className="template-section">
          <h4>My Templates <span>{custom.length} saved</span></h4>
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
        </section>
      )}

      <div className="template-filter-row">
        <button onClick={() => setShowCategories(!showCategories)}>▽ Category</button>
        <button onClick={() => setCategory("All")}>＋</button>
        <button className="template-clear" onClick={() => setCategory("All")}>Clear</button>
      </div>

      {showCategories && (
        <div className="template-categories">
          {categories.map(c => (
            <button className={category === c ? "active" : ""} key={c} onClick={() => { setCategory(c); setShowCategories(false); }}>{c}</button>
          ))}
        </div>
      )}

      {recentTemplates.length > 0 && (
        <section className="template-section">
          <h4>Recently Used</h4>
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

      <section className="template-section">
        <h4>All Results <span>{visible.length} templates</span></h4>
        <div className="template-grid">
          {visible.map(item => (
            <button className="template-card" key={item.id} onClick={() => applyTemplate(item)}>
              <Preview item={item} portrait={orientation === "portrait"} />
              <span>{item.name}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
