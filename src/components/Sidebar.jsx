import { useEffect, useRef, useState } from "react";

const items = ["Dashboard","Credential Templates","All Credentials","Recipients","Bulk Issuing","Pathways","Analytics","Design Templates","Email Templates","Forms","Integrations","Getting Started","Credential Usage","Settings","Help Center"];
const icons = ["⌂","▤","▧","♙","⇧","◇","▥","▧","✉","▣","⌘","✦","◷","⚙","?"];

export default function Sidebar({ page, setPage }) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const inputRef = useRef(null);

  const results = items.filter(x => x.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    const handler = e => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const openPage = name => {
    setPage(name);
    setSearchOpen(false);
    setQuery("");
  };

  const handleSearchKey = e => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex(i => Math.max(i - 1, 0));
    } else if (e.key === "Enter" && results.length) {
      openPage(results[activeIndex] || results[0]);
    }
  };

  return <>
    <aside className="sidebar">
      <div className="brand"><b className="brand-mark">C</b>certify<span>pro</span></div>
      <div className="workspace-switch"><b>H</b><span>My workspace<small>Free plan</small></span>⌄</div>
      <button className="quick-search" onClick={() => { setQuery(""); setActiveIndex(0); setSearchOpen(true); setTimeout(() => inputRef.current?.focus(), 30); }} type="button">
        <span>⌕ Quick search</span><kbd>⌘ K</kbd>
      </button>
      <small className="nav-label">WORKSPACE</small>
      {items.slice(0, 11).map((x, i) =>
        <button key={x} className={`nav-item ${page === x ? "active" : ""}`} onClick={() => openPage(x)}>
          <span>{icons[i]}</span>{x}
        </button>
      )}
      <small className="nav-label support">SUPPORT</small>
      {items.slice(11).map((x, i) =>
        <button key={x} className={`nav-item ${page === x ? "active" : ""}`} onClick={() => openPage(x)}>
          <span>{icons[i + 11]}</span>{x}
        </button>
      )}
      <div className="sidebar-bottom">
        <b>Make every achievement count</b>
        <p>Explore more ways to issue credentials.</p>
        <div className="profile"><b>MH</b><span>Mohammad Hasheer<small>Administrator</small></span></div>
      </div>
    </aside>

    {searchOpen && <div className="cp-command-overlay" onMouseDown={e => {
      if (e.target === e.currentTarget) setSearchOpen(false);
    }}>
      <div className="cp-command-dialog" role="dialog" aria-modal="true" aria-label="Quick search">
        <div className="cp-command-input">
          <span>⌕</span>
          <input ref={inputRef} value={query} onChange={e => {
            setQuery(e.target.value);
            setActiveIndex(0);
          }} onKeyDown={handleSearchKey} placeholder="Search pages and workspace..." />
          <kbd>ESC</kbd>
        </div>
        <div className="cp-command-label">WORKSPACE PAGES</div>
        <div className="cp-command-results">
          {results.length ? results.map((name, i) =>
            <button key={name} className={i === activeIndex ? "selected" : ""} onMouseEnter={() => setActiveIndex(i)} onClick={() => openPage(name)}>
              <span className="cp-command-icon">{icons[items.indexOf(name)]}</span>
              <span>{name}</span>
              <small>Open page ↵</small>
            </button>
          ) : <div className="cp-command-empty">No matching pages found.</div>}
        </div>
        <div className="cp-command-footer">↑↓ Navigate <span>↵ Open</span><span>ESC Close</span></div>
      </div>
    </div>}
  </>;
}
