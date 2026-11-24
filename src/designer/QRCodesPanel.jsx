import { useState } from "react";
import { QrCode, ShieldCheck, Link2, Plus, Info } from "lucide-react";

export default function QRCodesPanel({ onAdd }) {
  const [mode, setMode] = useState("automatic");
  const [url, setUrl] = useState("https://example.com");

  return (
    <div className="designer-panel cp-qr-panel">
      <div className="cp-qr-heading">
        <span className="cp-panel-eyebrow">CERTIFICATE ELEMENTS</span>
        <h3>QR Codes</h3>
        <p>Add a QR code to your certificate for easy digital verification.</p>
      </div>

      <div className="cp-qr-mode-list">
        <button
          type="button"
          className={`cp-qr-mode-card ${mode === "automatic" ? "active" : ""}`}
          onClick={() => setMode("automatic")}
        >
          <span className="cp-qr-mode-icon automatic"><ShieldCheck size={20}/></span>
          <span className="cp-qr-mode-copy">
            <strong>Automatic verification</strong>
            <small>Unique QR code for every recipient</small>
          </span>
          <span className="cp-qr-radio">{mode === "automatic" ? "✓" : ""}</span>
        </button>

        <button
          type="button"
          className={`cp-qr-mode-card ${mode === "custom" ? "active" : ""}`}
          onClick={() => setMode("custom")}
        >
          <span className="cp-qr-mode-icon custom"><Link2 size={20}/></span>
          <span className="cp-qr-mode-copy">
            <strong>Custom QR code</strong>
            <small>Use your own website or URL</small>
          </span>
          <span className="cp-qr-radio">{mode === "custom" ? "✓" : ""}</span>
        </button>
      </div>

      {mode === "automatic" ? (
        <div className="cp-qr-detail-card">
          <div className="cp-qr-detail-title">
            <QrCode size={18}/>
            <strong>Automatic verification QR</strong>
          </div>
          <p>
            VistaraCertification will generate a unique verification link for each
            certificate when you issue credentials individually or in bulk.
          </p>
          <div className="cp-qr-token">
            <span>Dynamic field</span>
            <code>{"{{verification_url}}"}</code>
          </div>
          <div className="cp-qr-note">
            <Info size={15}/>
            <span>The QR shown in the editor is a sample preview. A real unique link is assigned during issuing.</span>
          </div>
          <button
            type="button"
            className="cp-qr-add-button"
            onClick={() => onAdd("{{verification_url}}", { qrMode: "automatic" })}
          >
            <Plus size={16}/> Add automatic QR code
          </button>
        </div>
      ) : (
        <div className="cp-qr-detail-card">
          <div className="cp-qr-detail-title">
            <Link2 size={18}/>
            <strong>Custom QR destination</strong>
          </div>
          <label className="cp-qr-url-label">
            Destination URL
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://yourwebsite.com"
            />
          </label>
          <p className="cp-qr-help">Anyone scanning this QR code will be directed to your chosen URL.</p>
          <button
            type="button"
            className="cp-qr-add-button"
            disabled={!/^https?:\/\/.+/i.test(url.trim())}
            onClick={() => onAdd(url.trim(), { qrMode: "custom" })}
          >
            <Plus size={16}/> Add custom QR code
          </button>
        </div>
      )}
    </div>
  );
}
