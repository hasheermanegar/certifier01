export default function Topbar({
  title,
  onCreate,
  onMenu,
  mobileNavOpen = false,
}) {
  return (
    <header className="topbar">
      <button
        type="button"
        className="mobile-menu-toggle"
        aria-label="Toggle navigation menu"
        aria-expanded={mobileNavOpen}
        aria-controls="primary-navigation"
        onClick={onMenu}
      >
        ☰
      </button>
      <div>Workspace / <b>{title}</b></div>
      <div>
        <button className="quiet">◎ Help</button>
        <button className="btn-primary" onClick={onCreate}>＋ Issue credential</button>
      </div>
    </header>
  );
}
