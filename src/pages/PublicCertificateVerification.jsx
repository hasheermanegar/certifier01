import { useEffect, useState } from "react";
import { api } from "../services/api";
import "./PublicCertificateVerification.css";

export default function PublicCertificateVerification() {
  const certificateId = decodeURIComponent(
    window.location.pathname.split("/").filter(Boolean)[1] || ""
  );
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api.verifyCertificate(certificateId)
      .then(data => {
        if (active) setResult(data);
      })
      .catch(err => {
        if (active) setError(err.message || "Unable to verify this certificate.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [certificateId]);

  const certificate = result?.certificate || {};
  const status = result?.status || certificate.status || (result?.verified ? "valid" : "invalid");
  const verified = result?.verified === true && status === "valid";
  const revoked = status === "revoked";
  const expired = status === "expired";
  const statusClass = verified ? "verified" : revoked ? "revoked" : expired ? "expired" : "invalid";
  const date = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString()
    : "Not available";

  const details = [
    ["Certificate ID", certificate.certificateId || result?.certificateId || certificateId],
    ["Recipient", certificate.recipientName || certificate.recipient?.name || "Not available"],
    ["Certificate", certificate.certificateTitle || certificate.template?.title || "Not available"],
    ["Organization", certificate.organization || "Not available"],
    ["Issue date", date],
    ["Status", verified ? "Valid" : revoked ? "Revoked" : expired ? "Expired" : "Not verified"]
  ];

  return (
    <main className="cp-verification-page">
      <section className={`cp-verification-card ${statusClass}`}>
        <header className="cp-verification-brand">
          <span>Certify</span><strong> pro</strong>
        </header>
        <div className="cp-verification-accent" aria-hidden="true"/>
        <div className="cp-verification-content">
          <div className="cp-verification-eyebrow"><span/> PUBLIC CHECK <span/></div>
          <h1>Certificate verification</h1>
          <p className="cp-verification-subtitle">Public certificate authenticity check</p>

          <div className={`cp-verification-result ${statusClass}`} aria-live="polite">
            {loading ? (
              <>
                <span className="cp-verification-spinner" aria-hidden="true"/>
                <h2>Checking certificate</h2>
                <p>Checking certificate authenticity...</p>
              </>
            ) : error ? (
              <>
                <span className="cp-verification-symbol" aria-hidden="true">!</span>
                <h2>Verification unavailable</h2>
                <p>{error}</p>
              </>
            ) : (
              <>
                <span className="cp-verification-symbol" aria-hidden="true">
                  {verified ? "✓" : revoked ? "×" : expired ? "!" : "×"}
                </span>
                <h2>
                  {verified ? "Certificate verified" :
                    revoked ? "Certificate revoked" :
                      expired ? "Certificate expired" : "Certificate not verified"}
                </h2>
                <p>{result?.message || (verified
                  ? "This certificate is authentic and currently valid."
                  : "This certificate could not be verified.")}</p>
              </>
            )}
          </div>

          {!loading && !error && (
            <dl className="cp-verification-details">
              {details.map(([label, value]) => (
                <div className="cp-verification-detail" key={label}>
                  <dt>{label}</dt>
                  <dd>{label === "Status" ? (
                    <span className={`cp-verification-status ${statusClass}`}>
                      <i aria-hidden="true"/> {value}
                    </span>
                  ) : value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
        <footer className="cp-verification-footer">CERTIFY PRO · DIGITAL CERTIFICATE VERIFICATION</footer>
      </section>
    </main>
  );
}
