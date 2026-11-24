import { createPortal } from "react-dom";
import "./FontPicker.css";
import { useState, useEffect, useMemo } from "react";
import { Search, Star, ChevronDown, X } from "lucide-react";
import { fontCatalog, loadFont } from "./fontLoader";

const systemFonts = [
  "Arial", "Georgia", "Times New Roman",
  "Verdana", "Courier New"
].map(family => ({ family, category: "System" }));

const allFonts = [...systemFonts, ...fontCatalog];

const categories = [
  "All", "Favourites", "Recent", "Serif",
  "Sans Serif", "Handwriting", "Display",
  "Monospace", "System"
];

function readStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function FontSample({ family }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadFont(family).then(() => {
      if (active) setReady(true);
    }).catch(() => {});
    return () => { active = false; };
  }, [family]);

  return (
    <span
      className="vistara-font-sample"
      style={{ fontFamily: ready ? family : "sans-serif" }}
    >
      {family}
    </span>
  );
}

export default function FontPicker({ value = "Inter", onChange }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [limit, setLimit] = useState(24);
  const [favourites, setFavourites] = useState(
    () => readStorage("vistara-font-favourites")
  );
  const [recent, setRecent] = useState(
    () => readStorage("vistara-font-recent")
  );
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return allFonts.filter(font => {
      const matches = font.family.toLowerCase()
        .includes(query.toLowerCase());

      const group = category === "All"
        || font.category === category
        || (category === "Favourites" && favourites.includes(font.family))
        || (category === "Recent" && recent.includes(font.family));

      return matches && group;
    });
  }, [query, category, favourites, recent]);

  function toggleFavourite(family) {
    const next = favourites.includes(family)
      ? favourites.filter(item => item !== family)
      : [...favourites, family];

    setFavourites(next);
    localStorage.setItem("vistara-font-favourites", JSON.stringify(next));
  }

  async function choose(family) {
    setBusy(true);
    setError("");

    try {
      await loadFont(family);
      const next = [family, ...recent.filter(f => f !== family)].slice(0, 20);

      setRecent(next);
      localStorage.setItem("vistara-font-recent", JSON.stringify(next));
      onChange(family);
      setOpen(false);
    } catch {
      setError("Unable to load this font. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="vistara-font-picker">
      <button
        type="button"
        className="vistara-font-trigger"
        aria-label="Choose font family"
        aria-expanded={open}
        onClick={() => setOpen(true)}
      >
        <span>{value}</span>
        <ChevronDown size={14} />
      </button>

      {open && createPortal(
        <div className="vistara-font-overlay"
          onMouseDown={event => {
            event.stopPropagation();
            if (event.target === event.currentTarget) setOpen(false);
          }}
        >
          <section className="vistara-font-dialog"
            role="dialog"
            aria-label="Font library"
            aria-modal="true"
            onKeyDown={event => {
              if (event.key === "Escape") setOpen(false);
            }}
          >
            <header className="vistara-font-header">
              <div>
                <h3>Font library</h3>
                <p>{fontCatalog.length.toLocaleString()} Google font families</p>
              </div>
              <button type="button" aria-label="Close font library"
                onClick={() => setOpen(false)}>
                <X size={20} />
              </button>
            </header>

            <div className="vistara-font-search">
              <Search size={18} />
              <input autoFocus value={query}
                placeholder="Search fonts..."
                aria-label="Search fonts"
                onChange={event => {
                  setQuery(event.target.value);
                  setLimit(24);
                }}
              />
            </div>

            <nav className="vistara-font-categories">
              {categories.map(item => (
                <button type="button" key={item}
                  className={category === item ? "active" : ""}
                  onClick={() => {
                    setCategory(item);
                    setLimit(24);
                  }}>
                  {item}
                </button>
              ))}
            </nav>

            <div className="vistara-font-count">
              {filtered.length.toLocaleString()} fonts
            </div>

            {error && <p role="alert">{error}</p>}

            <div className="vistara-font-results">
              {filtered.slice(0, limit).map(font => (
                <div key={font.family}
                  className={`vistara-font-row ${value === font.family ? "selected" : ""}`}>
                  <button type="button"
                    className="vistara-font-option"
                    disabled={busy}
                    onClick={() => choose(font.family)}>
                    <FontSample family={font.family} />
                    <small>{font.category}</small>
                  </button>

                  <button type="button"
                    className="vistara-font-star"
                    aria-label={`Favourite ${font.family}`}
                    aria-pressed={favourites.includes(font.family)}
                    onClick={() => toggleFavourite(font.family)}>
                    <Star size={17}
                      fill={favourites.includes(font.family) ? "currentColor" : "none"} />
                  </button>
                </div>
              ))}

              {!filtered.length && <p>No matching fonts.</p>}

              {filtered.length > limit && (
                <button type="button" className="vistara-font-more"
                  onClick={() => setLimit(old => old + 24)}>
                  Load more fonts
                </button>
              )}
            </div>
          </section>
        </div>, document.body
      )}
    </div>
  );
}
