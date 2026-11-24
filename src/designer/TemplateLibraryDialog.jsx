import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, ChevronRight, LayoutTemplate, Search, Trash2, X, ExternalLink, Upload } from "lucide-react";
import CertificateThumbnail from "./CertificateThumbnail";

const EXPLORE = "explore";
const CUSTOM = "my-templates";

function TemplateCard({ item, design, onSelect, onPreview, onDelete }) {
  return (
    <article className="cp-template-browser-card">
      <div className="cp-template-browser-preview">
        <CertificateThumbnail design={design} />
        <div className="cp-template-browser-hover">
          <button type="button" onClick={() => onSelect(item)}>Use design</button>
          <button type="button" className="preview" onClick={() => onPreview(item)}>Preview</button>
        </div>
        {item.custom && onDelete && (
          <button
            type="button"
            className="cp-template-browser-delete"
            aria-label={`Delete ${item.name}`}
            onClick={() => onDelete(item)}
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      <div className="cp-template-browser-card-copy">
        <strong title={item.name}>{item.name || "Untitled template"}</strong>
        <span>{item.custom ? "My template" : item.category}</span>
        {item.canvaUrl && (
          <a href={item.canvaUrl} target="_blank" rel="noopener noreferrer" onClick={event => event.stopPropagation()}>
            <ExternalLink size={12} /> Open in Canva
          </a>
        )}
      </div>
    </article>
  );
}

export default function TemplateLibraryDialog({
  open,
  templates = [],
  customTemplates = [],
  initialOrientation = "landscape",
  buildDesign,
  onClose,
  onSelect,
  onDeleteCustom,
  onImportFile
}) {
  const dialogRef = useRef(null);
  const [section, setSection] = useState(EXPLORE);
  const [orientation, setOrientation] = useState(initialOrientation);
  const [search, setSearch] = useState("");
  const [previewItem, setPreviewItem] = useState(null);
  const [pagination, setPagination] = useState({ key: "", count: 48 });
  const categories = useMemo(
    () => [...new Set(templates.map(item => item.category).filter(Boolean))],
    [templates]
  );
  const preparedTemplates = useMemo(
    () => templates.map(item => ({ item })),
    [templates]
  );
  const query = search.trim().toLowerCase();
  const paginationKey = `${section}|${orientation}|${query}`;
  const visibleCount = pagination.key === paginationKey ? pagination.count : 48;
  const matches = item => `${item.name || ""} ${item.category || ""}`.toLowerCase().includes(query);
  const filteredTemplates = preparedTemplates.filter(({ item }) =>
    matches(item) && (section === EXPLORE || item.category === section)
  );
  const filteredCustom = customTemplates.filter(matches);
  const designFor = item => buildDesign?.(item, orientation) || {
    ...item,
    orientation,
    width: orientation === "portrait" ? 790 : 1120,
    height: orientation === "portrait" ? 1120 : 790
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (open && dialog && !dialog.open) dialog.showModal();
    return () => {
      if (dialog?.open) dialog.close();
    };
  }, [open]);

  const close = () => {
    setSection(EXPLORE);
    setOrientation(initialOrientation);
    setSearch("");
    setPreviewItem(null);
    onClose?.();
  };

  const choose = item => {
    onSelect?.(item, item.custom ? item.orientation || orientation : orientation);
    close();
  };

  const previewDesign = item => item.custom
    ? item
    : designFor(item);

  const importFile = () => {
    setSection(CUSTOM);
    setPreviewItem(null);
    onImportFile?.();
  };

  const renderCards = entries => (
    <div className="cp-template-browser-grid">
      {entries.map(({ item, design }) => (
        <TemplateCard
          key={item.id}
          item={item}
          design={design || designFor(item)}
          onSelect={choose}
          onPreview={setPreviewItem}
        />
      ))}
    </div>
  );
  const renderLoadMore = total => total > visibleCount && (
    <div className="cp-template-browser-load-more">
      <span>Showing {Math.min(visibleCount, total).toLocaleString()} of {total.toLocaleString()}</span>
      <button type="button" onClick={() => setPagination({ key: paginationKey, count: visibleCount + 48 })}>
        Load {Math.min(48, total - visibleCount).toLocaleString()} more
      </button>
    </div>
  );

  return (
    <dialog
      ref={dialogRef}
      className="cp-template-browser-dialog"
      aria-labelledby="cp-template-browser-title"
      onClose={close}
      onClick={event => {
        if (event.target === dialogRef.current) close();
      }}
    >
      <div className="cp-template-browser">
        <header className="cp-template-browser-header">
          <div>
            <span className="cp-design-eyebrow">DESIGN LIBRARY</span>
            <h2 id="cp-template-browser-title">Choose a design</h2>
            <p>Browse {templates.length.toLocaleString()} editable designs, preview a template, then open it in the editor.</p>
          </div>
          <div className="cp-template-browser-header-actions">
            {onImportFile && (
              <button type="button" className="cp-design-create cp-template-browser-import" onClick={importFile}>
                <Upload size={14} /> Upload file
              </button>
            )}
            <button type="button" className="cp-template-browser-close" onClick={close} aria-label="Close template library">
              <X size={18} />
            </button>
          </div>
        </header>

        <div className="cp-template-browser-body">
          <nav className="cp-template-browser-nav" aria-label="Template categories">
            <button type="button" className={section === EXPLORE ? "active" : ""} onClick={() => { setSection(EXPLORE); setPreviewItem(null); }}>
              <LayoutTemplate size={15} /> Explore
            </button>
            {categories.map(category => (
              <button
                type="button"
                key={category}
                className={section === category ? "active" : ""}
                onClick={() => { setSection(category); setPreviewItem(null); }}
              >
                <span>{category}</span>
                <ChevronRight size={14} />
              </button>
            ))}
            <button type="button" className={section === CUSTOM ? "active" : ""} onClick={() => { setSection(CUSTOM); setPreviewItem(null); }}>
              <span>My templates</span>
              <span className="cp-template-browser-nav-count">{customTemplates.length}</span>
            </button>
          </nav>

          <main className="cp-template-browser-main">
            {previewItem ? (
              <section className="cp-template-browser-preview-detail">
                <button type="button" className="cp-template-browser-back" onClick={() => setPreviewItem(null)}>
                  <ArrowLeft size={14} /> Back to templates
                </button>
                <div className="cp-template-browser-preview-canvas">
                  <CertificateThumbnail design={previewDesign(previewItem)} />
                </div>
                <div className="cp-template-browser-preview-info">
                  <div>
                    <h3>{previewItem.name}</h3>
                    <p>{previewItem.custom ? "My template" : previewItem.category} · {previewItem.orientation || orientation}</p>
                  </div>
                  <button type="button" onClick={() => choose(previewItem)}>Use this design</button>
                </div>
              </section>
            ) : (
              <>
                <div className="cp-template-browser-controls">
                  <label className="cp-template-browser-search">
                    <Search size={16} />
                    <input
                      value={search}
                      onChange={event => setSearch(event.target.value)}
                      placeholder="Search templates"
                      aria-label="Search templates"
                    />
                    {search && <button type="button" onClick={() => setSearch("")} aria-label="Clear search">×</button>}
                  </label>
                  {section !== CUSTOM && (
                    <div className="cp-template-browser-orientation" aria-label="Template orientation">
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
                  )}
                </div>

                <div className="cp-template-browser-results">
                  {section === CUSTOM ? (
                    <>
                      <div className="cp-template-browser-section-heading">
                        <div>
                          <h3>My templates</h3>
                          <p>Your uploaded and saved reusable designs.</p>
                        </div>
                        <span>{filteredCustom.length} templates</span>
                      </div>
                      {filteredCustom.length ? (
                        <div className="cp-template-browser-grid">
                          {filteredCustom.map(item => (
                            <TemplateCard
                              key={item.id}
                              item={item}
                              design={item}
                              onSelect={choose}
                              onPreview={setPreviewItem}
                              onDelete={onDeleteCustom}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="cp-template-browser-empty">
                          <LayoutTemplate size={22} />
                          <strong>{query ? "No matching templates" : "Your library is empty"}</strong>
                          <p>{query ? "Try another search." : "Upload artwork or save a design from the editor to reuse it here."}</p>
                        </div>
                      )}
                    </>
                  ) : section === EXPLORE && !query ? (
                    categories.map(category => {
                      const entries = filteredTemplates.filter(({ item }) => item.category === category);
                      if (!entries.length) return null;
                      return (
                        <section className="cp-template-browser-category" key={category}>
                          <div className="cp-template-browser-section-heading">
                            <div>
                              <h3>{category}</h3>
                              <p>Designs for your {category.toLowerCase()}.</p>
                            </div>
                            <button type="button" onClick={() => setSection(category)}>View all</button>
                          </div>
                          {renderCards(entries.slice(0, 3))}
                        </section>
                      );
                    })
                  ) : (
                    <>
                      <div className="cp-template-browser-section-heading">
                        <div>
                          <h3>{section === EXPLORE ? "Search results" : section}</h3>
                          <p>Choose a design to continue in the editor.</p>
                        </div>
                        <span>{filteredTemplates.length} templates</span>
                      </div>
                      {filteredTemplates.length ? (
                        <>
                          {renderCards(filteredTemplates.slice(0, visibleCount))}
                          {renderLoadMore(filteredTemplates.length)}
                        </>
                      ) : (
                        <div className="cp-template-browser-empty">
                          <Search size={22} />
                          <strong>No templates found</strong>
                          <p>Try a different search or category.</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </dialog>
  );
}
