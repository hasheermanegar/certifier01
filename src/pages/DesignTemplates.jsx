import React, { useState } from "react";
import { Search, Plus, Pencil, Trash2, FileText, LayoutTemplate } from "lucide-react";

function CertificateThumbnail({ design }) {
  const width = design.width || (design.orientation === "portrait" ? 790 : 1120);
  const height = design.height || (design.orientation === "portrait" ? 1120 : 790);
  const elements = design.elements || [];

  return (
    <div className="cp-design-thumbnail">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-label={`${design.name} certificate preview`}
      >
        <rect width={width} height={height} fill={design.background || "#ffffff"} />

        {elements.map((e, index) => {
          const x = Number(e.x) || 0;
          const y = Number(e.y) || 0;
          const w = Number(e.width) || 100;
          const h = Number(e.height) || 40;

          if (e.type === "image" && e.src) {
            return (
              <image
                key={e.id || index}
                href={e.src}
                x={x} y={y} width={w} height={h}
                preserveAspectRatio="xMidYMid meet"
              />
            );
          }

          if (e.type === "shape") {
            return (
              <rect
                key={e.id || index}
                x={x} y={y} width={w} height={h}
                fill={e.fill || "transparent"}
                stroke={e.stroke || "none"}
                strokeWidth={e.strokeWidth || 0}
                opacity={e.opacity ?? 1}
                rx={e.shape === "rounded" ? 14 : e.shape === "circle" ? Math.min(w,h)/2 : 0}
              />
            );
          }

          if (e.type === "qr") {
            return (
              <g key={e.id || index}>
                <rect x={x} y={y} width={w} height={h} fill="#fff" stroke="#333" strokeWidth="3"/>
                <path d={`M ${x+w*.12} ${y+h*.12} h ${w*.25} v ${h*.25} h -${w*.25} z M ${x+w*.63} ${y+h*.12} h ${w*.25} v ${h*.25} h -${w*.25} z M ${x+w*.12} ${y+h*.63} h ${w*.25} v ${h*.25} h -${w*.25} z`} fill="#222"/>
                <path d={`M ${x+w*.5} ${y+h*.5} h ${w*.12} v ${h*.12} h -${w*.12} z M ${x+w*.7} ${y+h*.55} h ${w*.15} v ${h*.15} h -${w*.15} z`} fill="#222"/>
              </g>
            );
          }

          if (!e.text) return null;

          const fontSize = Number(e.fontSize) || 20;
          const anchor = e.align === "left" ? "start" : e.align === "right" ? "end" : "middle";
          const textX = e.align === "left" ? x : e.align === "right" ? x + w : x + w / 2;

          return (
            <text
              key={e.id || index}
              x={textX}
              y={y + Math.min(h * .72, fontSize * 1.2)}
              textAnchor={anchor}
              fill={e.color || "#26334d"}
              fontSize={fontSize}
              fontFamily={e.fontFamily || "Inter, sans-serif"}
              fontWeight={e.bold ? 700 : 400}
              fontStyle={e.italic ? "italic" : "normal"}
              textDecoration={e.underline ? "underline" : "none"}
              opacity={e.opacity ?? 1}
            >
              {e.text}
            </text>
          );
        })}
      </svg>
    </div>
  );
}

export default function DesignTemplates({ designs = [], onCreate, onOpen, onDelete }) {
  const [search, setSearch] = useState("");

  const list = designs.filter(d =>
    (d.name || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="page-content cp-design-library">
      <div className="cp-design-heading">
        <div>
          <span className="cp-design-eyebrow">DESIGN LIBRARY</span>
          <h1>Design templates</h1>
          <p>Create and manage reusable certificate designs.</p>
        </div>
        <button className="cp-design-create" onClick={onCreate}>
          <Plus size={16}/> Create design
        </button>
      </div>

      <section className="cp-design-library-section">
        <div className="cp-design-library-title">
          <div>
            <h2>Your templates</h2>
            <p>Manage your saved certificate designs.</p>
          </div>
          <span className="cp-design-count">{list.length} {list.length === 1 ? "design" : "designs"}</span>
        </div>

        <div className="cp-design-toolbar">
          <div className="cp-design-search">
            <Search size={17}/>
            <input
              placeholder="Search designs by name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </div>
        </div>

        {list.length ? (
          <div className="cp-design-grid">
            {list.map(d => (
              <article className="cp-design-card" key={d.id}>
                <button
                  className="cp-design-preview-button"
                  onClick={() => onOpen(d)}
                  aria-label={`Open ${d.name}`}
                >
                  <CertificateThumbnail design={d}/>
                  <span className="cp-design-preview-overlay">
                    <Pencil size={15}/> Open designer
                  </span>
                </button>

                <div className="cp-design-card-details">
                  <div className="cp-design-card-title">
                    <div className="cp-design-file-icon"><FileText size={17}/></div>
                    <div>
                      <h3>{d.name || "Untitled certificate"}</h3>
                      <p>{d.orientation || "Landscape"} · {(d.elements || []).length} elements</p>
                    </div>
                  </div>

                  <div className="cp-design-card-actions">
                    <button className="cp-design-edit" onClick={() => onOpen(d)}>
                      <Pencil size={13}/> Edit
                    </button>
                    <button className="cp-design-delete" onClick={() => {
                      if (window.confirm(`Delete design "${d.name}"?`)) onDelete(d.id);
                    }}>
                      <Trash2 size={13}/> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cp-design-empty">
            <div><LayoutTemplate size={25}/></div>
            <h3>{search ? "No matching designs" : "Your design library is empty"}</h3>
            <p>{search ? "Try another search term." : "Create your first certificate design to get started."}</p>
            {search ? (
              <button className="cp-design-edit" onClick={() => setSearch("")}>Clear search</button>
            ) : (
              <button className="cp-design-create" onClick={onCreate}>
                <Plus size={15}/> Create your first design
              </button>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
