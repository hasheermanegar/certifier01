import { useEffect, useMemo, useRef, useState } from "react";
import { Search, Plus, Pencil, Trash2, FileText, LayoutTemplate, Library, Upload, ExternalLink, Cloud, Link2 } from "lucide-react";
import CertificateThumbnail from "../designer/CertificateThumbnail";
import { createTemplateDesign, templateCatalog } from "../designer/TemplatesPanel";
import TemplateLibraryDialog from "../designer/TemplateLibraryDialog";
import { createImportedTemplates, normalizeCustomTemplate } from "../designer/customTemplates";
import {
  getGoogleDriveSetupMessage,
  importPublicGoogleDriveTemplate,
  importSelectedGoogleDriveTemplates,
  preloadGoogleDrivePicker
} from "../designer/googleDrive";

function LibraryTemplateCard({ item, design, onUse }) {
  return (
    <article className="cp-catalog-template-card">
      <button
        type="button"
        className="cp-catalog-template-preview"
        onClick={() => onUse(item)}
        aria-label={`Customize ${item.name}`}
      >
        <CertificateThumbnail design={design} />
        <span><Pencil size={14} /> Customize</span>
      </button>
      <div className="cp-catalog-template-details">
        <div>
          <strong title={item.name}>{item.name}</strong>
          <span>{item.category} · Editable design</span>
        </div>
        <button type="button" onClick={() => onUse(item)}>Use</button>
      </div>
    </article>
  );
}

export default function DesignTemplates({ designs = [], onCreate, onOpen, onDelete, onUseTemplate }) {
  const [search, setSearch] = useState("");
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [category, setCategory] = useState("All");
  const [orientation, setOrientation] = useState("landscape");
  const [visibleCount, setVisibleCount] = useState(24);
  const importInput = useRef(null);
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState(null);
  const [canvaUrl, setCanvaUrl] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [drivePickerReady, setDrivePickerReady] = useState(false);
  const [drivePickerLoadError, setDrivePickerLoadError] = useState("");
  const [customTemplates, setCustomTemplates] = useState(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("cp-custom-templates") || "[]");
      return Array.isArray(saved)
        ? saved.filter(template => template && typeof template === "object").map(normalizeCustomTemplate)
        : [];
    } catch (error) {
      console.error("Could not read custom templates:", error);
      return [];
    }
  });
  const drivePickerSetupMessage = getGoogleDriveSetupMessage({ picker: true });
  const driveLinkSetupMessage = getGoogleDriveSetupMessage();

  useEffect(() => {
    if (drivePickerSetupMessage) return;

    let active = true;
    preloadGoogleDrivePicker().then(() => {
      if (active) setDrivePickerReady(true);
    }).catch(error => {
      if (active) setDrivePickerLoadError(error.message);
    });
    return () => { active = false; };
  }, [drivePickerSetupMessage]);
  const drivePickerError = drivePickerSetupMessage || drivePickerLoadError;

  const list = designs.filter(d =>
    (d.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const customList = customTemplates.filter(template =>
    (template.name || "").toLowerCase().includes(search.toLowerCase())
  );
  const categories = useMemo(
    () => ["All", ...new Set(templateCatalog.map(template => template.category).filter(Boolean))],
    []
  );
  const filteredCatalog = useMemo(() => {
    const query = search.trim().toLowerCase();
    return templateCatalog.filter(template =>
      (category === "All" || template.category === category) &&
      (!query || `${template.name} ${template.category}`.toLowerCase().includes(query))
    );
  }, [category, search]);
  const visibleCatalog = useMemo(
    () => filteredCatalog.slice(0, visibleCount).map(item => ({
      item,
      design: createTemplateDesign(item, orientation)
    })),
    [filteredCatalog, visibleCount, orientation]
  );

  const chooseTemplate = (template, orientation) => {
    onUseTemplate?.(template.custom ? template : createTemplateDesign(template, orientation));
  };

  const saveCustomTemplates = importedTemplates => {
    const next = [...importedTemplates, ...customTemplates];
    try {
      localStorage.setItem("cp-custom-templates", JSON.stringify(next));
    } catch (error) {
      console.error("Could not save imported templates:", error);
      throw new Error("Browser storage is full. Remove an old custom template and try again.", { cause: error });
    }
    setCustomTemplates(next);
  };

  const deleteCustomTemplate = template => {
    if (!window.confirm(`Delete custom template "${template.name}"?`)) return;
    const next = customTemplates.filter(item => item.id !== template.id);
    try {
      localStorage.setItem("cp-custom-templates", JSON.stringify(next));
      setCustomTemplates(next);
    } catch (error) {
      console.error("Could not delete custom template:", error);
      window.alert("Could not update your custom template library.");
    }
  };

  const importCanvaExport = async event => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setImporting(true);
    setImportMessage(null);
    try {
      const importedTemplates = await createImportedTemplates(file, { canvaUrl });
      saveCustomTemplates(importedTemplates);
      setCanvaUrl("");
      const isPptx = importedTemplates[0]?.sourceFormat === "PPTX";
      const warningCount = importedTemplates.reduce((total, template) =>
        total + (template.importWarnings?.unsupported || 0) +
        (template.importWarnings?.approximated || 0) +
        (template.importWarnings?.simplifiedText || 0), 0);
      const isPdf = importedTemplates[0]?.sourceFormat === "PDF";
      setImportMessage({
        type: "success",
        text: isPptx
          ? `${importedTemplates.length} slide${importedTemplates.length === 1 ? "" : "s"} added as editable layers.${warningCount ? " Some complex shapes or mixed text styles may look different." : ""}${importedTemplates[0]?.canvaUrl ? " Open the original in Canva from its template card." : ""}`
          : isPdf && importedTemplates.length > 1
            ? `${importedTemplates.length} PDF pages were added to My custom templates as separate designs. PDF artwork stays flat; use PPTX for editable text, shapes and images.`
            : `${importedTemplates[0].name} was added to My custom templates. This export is a flat image; use PPTX for editable text, shapes and images.`
      });
    } catch (error) {
      console.error("Could not import design file:", error);
      setImportMessage({
        type: "error",
        text: error.message || "Could not import this design. Try a PPTX, PDF, PNG, JPG or WebP export."
      });
    } finally {
      setImporting(false);
    }
  };

  const importPublicDriveLink = async () => {
    if (!driveLink.trim()) return;
    setImporting(true);
    setImportMessage(null);
    try {
      const imported = await importPublicGoogleDriveTemplate(driveLink);
      saveCustomTemplates(imported);
      setDriveLink("");
      setImportMessage({
        type: "success",
        text: `${imported.length} template${imported.length === 1 ? "" : "s"} imported from Google Drive.`
      });
    } catch (error) {
      console.error("Could not import public Google Drive file:", error);
      setImportMessage({ type: "error", text: error.message || "Could not import that Drive file." });
    } finally {
      setImporting(false);
    }
  };

  const importFromGoogleDrive = async () => {
    setImporting(true);
    setImportMessage(null);
    const imported = [];
    const failures = [];
    try {
      const result = await importSelectedGoogleDriveTemplates();
      imported.push(...result.templates);
      failures.push(...result.failures);
      if (imported.length) saveCustomTemplates(imported);
      if (!result.selectedCount) return;
      setImportMessage({
        type: failures.length ? "error" : "success",
        text: [
          imported.length ? `${imported.length} template${imported.length === 1 ? "" : "s"} imported from Google Drive.` : "",
          ...failures
        ].filter(Boolean).join(" ")
      });
    } catch (error) {
      console.error("Could not import from Google Drive:", error);
      setImportMessage({ type: "error", text: error.message || "Could not import from Google Drive." });
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="page-content cp-design-library">
      <div className="cp-design-heading">
        <div>
          <span className="cp-design-eyebrow">DESIGN LIBRARY</span>
          <h1>Design templates</h1>
          <p>Create and manage reusable certificate designs.</p>
        </div>
        <div className="cp-design-heading-actions">
          <button className="cp-design-browse" onClick={() => setLibraryOpen(true)}>
            <Library size={15}/> Browse templates
          </button>
          <button className="cp-design-create" onClick={onCreate}>
            <Plus size={16}/> Create design
          </button>
        </div>
      </div>

      <section className="cp-canva-import-card" aria-label="Import a design">
        <div className="cp-canva-import-copy">
          <span>DESIGN IMPORT</span>
          <h2>Bring a design into your library</h2>
          <p>Upload a file, choose a Google Drive file, or import a publicly shared Drive link.</p>
        </div>
        <div className="cp-canva-import-controls">
          <label className="cp-design-canva-url">
            <span>Canva design link <small>(optional)</small></span>
            <input
              type="url"
              value={canvaUrl}
              onChange={event => setCanvaUrl(event.target.value)}
              placeholder="https://www.canva.com/design/…"
              aria-label="Canva design link"
            />
          </label>
          <button type="button" className="cp-design-create" onClick={() => importInput.current?.click()} disabled={importing}>
            <Upload size={15} /> {importing ? "Importing…" : "Upload template file"}
          </button>
          <div className="cp-drive-import-controls">
            <label className="cp-design-drive-url">
              <span>Public Google Drive link</span>
              <input
                type="url"
                value={driveLink}
                onChange={event => setDriveLink(event.target.value)}
                placeholder="https://drive.google.com/file/d/…"
                aria-label="Public Google Drive file link"
              />
            </label>
            <button
              type="button"
              className="cp-design-create"
              onClick={() => { void importPublicDriveLink(); }}
              disabled={importing || !driveLink.trim() || !!driveLinkSetupMessage}
            >
              <Link2 size={15} /> Import link
            </button>
            <button
              type="button"
              className="cp-design-create"
              onClick={() => { void importFromGoogleDrive(); }}
              disabled={importing || !drivePickerReady || !!drivePickerSetupMessage}
            >
              <Cloud size={15} /> {drivePickerSetupMessage ? "Drive not configured" : drivePickerReady ? "Choose from Drive" : "Loading Drive…"}
            </button>
          </div>
          <input
            ref={importInput}
            type="file"
            accept=".pptx,.pdf,.png,.jpg,.jpeg,.webp,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/pdf,image/png,image/jpeg,image/webp"
            hidden
            onChange={event => { void importCanvaExport(event); }}
          />
        </div>
        {drivePickerError && <p className="cp-drive-setup-help" role="status">{drivePickerError}</p>}
      </section>
      <p className="cp-design-import-help">PowerPoint files and Google Slides can be imported as editable layers. Each page of a PDF is saved as a separate flat-artwork template. Public Drive links must be accessible to anyone with the link.</p>
      {importMessage && (
        <p className={`cp-design-import-status ${importMessage.type}`} role={importMessage.type === "error" ? "alert" : "status"}>
          {importMessage.text}
        </p>
      )}

      <div className="cp-design-toolbar">
        <div className="cp-design-search">
          <Search size={17}/>
          <input
            placeholder="Search the template library, saved designs, and custom uploads..."
            value={search}
            onChange={e => { setSearch(e.target.value); setVisibleCount(24); }}
          />
          {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
        </div>
      </div>

      <section className="cp-design-library-section cp-template-catalog-section">
        <div className="cp-design-library-title">
          <div>
            <h2>Template library</h2>
            <p>Choose a starting point and customize every text, shape, color, and image layer.</p>
          </div>
          <span className="cp-design-count">{filteredCatalog.length.toLocaleString()} templates</span>
        </div>

        <div className="cp-catalog-controls">
          <div className="cp-catalog-categories" aria-label="Filter templates by category">
            {categories.map(value => (
              <button
                type="button"
                key={value}
                className={category === value ? "active" : ""}
                onClick={() => { setCategory(value); setVisibleCount(24); }}
              >
                {value}
              </button>
            ))}
          </div>
          <div className="cp-catalog-orientation" aria-label="Template orientation">
            {["landscape", "portrait"].map(value => (
              <button
                type="button"
                key={value}
                className={orientation === value ? "active" : ""}
                onClick={() => setOrientation(value)}
              >
                {value === "landscape" ? "Landscape" : "Portrait"}
              </button>
            ))}
          </div>
        </div>

        {visibleCatalog.length ? (
          <div className="cp-catalog-template-grid">
            {visibleCatalog.map(({ item, design }) => (
              <LibraryTemplateCard
                key={item.id}
                item={item}
                design={design}
                onUse={template => chooseTemplate(template, orientation)}
              />
            ))}
          </div>
        ) : (
          <div className="cp-design-custom-empty">No templates match this search. Try another keyword or category.</div>
        )}

        {filteredCatalog.length > visibleCatalog.length && (
          <div className="cp-catalog-load-more">
            <span>Showing {visibleCatalog.length.toLocaleString()} of {filteredCatalog.length.toLocaleString()}</span>
            <button type="button" onClick={() => setVisibleCount(count => count + 24)}>
              Load {Math.min(24, filteredCatalog.length - visibleCatalog.length)} more templates
            </button>
          </div>
        )}
      </section>

      <section className="cp-design-library-section">
        <div className="cp-design-library-title">
          <div>
            <h2>Saved designs</h2>
            <p>Manage your saved certificate designs.</p>
          </div>
          <span className="cp-design-count">{list.length} {list.length === 1 ? "design" : "designs"}</span>
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

      <section className="cp-design-library-section cp-custom-library-section">
        <div className="cp-design-library-title">
          <div>
            <h2>My custom templates</h2>
            <p>Your imported designs and templates saved from the editor.</p>
          </div>
          <div className="cp-design-custom-import-actions">
            <span className="cp-design-count">{customList.length} {customList.length === 1 ? "template" : "templates"}</span>
          </div>
        </div>

        {customList.length ? (
          <div className="cp-design-grid">
            {customList.map(template => (
              <article className="cp-design-card" key={template.id}>
                <button
                  className="cp-design-preview-button"
                  onClick={() => onOpen(template)}
                  aria-label={`Use ${template.name}`}
                >
                  <CertificateThumbnail design={template} />
                  <span className="cp-design-preview-overlay">
                    <Pencil size={15}/> Use template
                  </span>
                </button>
                <div className="cp-design-card-details">
                  <div className="cp-design-card-title">
                    <div className="cp-design-file-icon"><FileText size={17}/></div>
                    <div>
                      <h3>{template.name || "Untitled custom template"}</h3>
                      <p>{template.orientation || "Landscape"} · {(template.elements || []).length} editable elements</p>
                    </div>
                  </div>
                  <div className="cp-design-card-actions">
                    <button className="cp-design-edit" onClick={() => onOpen(template)}>
                      <Pencil size={13}/> Use template
                    </button>
                    {template.canvaUrl && (
                      <a className="cp-design-edit cp-design-canva-link" href={template.canvaUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={13}/> Open in Canva
                      </a>
                    )}
                    {template.driveUrl && (
                      <a className="cp-design-edit cp-design-canva-link" href={template.driveUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink size={13}/> Open in Drive
                      </a>
                    )}
                    <button className="cp-design-delete" onClick={() => deleteCustomTemplate(template)}>
                      <Trash2 size={13}/> Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cp-design-custom-empty">
            <LayoutTemplate size={20}/>
            <span>{search ? "No custom templates match your search." : "Upload a design or save one from the editor to build your reusable library."}</span>
          </div>
        )}
      </section>

      <TemplateLibraryDialog
        open={libraryOpen}
        templates={templateCatalog}
        customTemplates={customTemplates}
        buildDesign={createTemplateDesign}
        onClose={() => setLibraryOpen(false)}
        onSelect={chooseTemplate}
        onImportFile={() => importInput.current?.click()}
        onImportDrive={() => { void importFromGoogleDrive(); }}
        onDeleteCustom={deleteCustomTemplate}
      />
    </div>
  );
}
