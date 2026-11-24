import "./LoadingScreen.css";

export default function LoadingScreen() {
  return (
    <div className="vistara-loading" role="status" aria-live="polite">
      <div className="vistara-loading-content">
        <img src="/vistara-flower.png" alt="" />
        <h1>VistaraCertification</h1>
        <div className="vistara-loading-track">
          <span />
        </div>
        <p>Preparing your workspace...</p>
      </div>
    </div>
  );
}
