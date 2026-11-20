import { useEffect, useState } from "react";
import { api } from "../services/api";

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

  const certificate = result?.certificate || result || {};
  const verified = result?.verified === true;
  const revoked = result?.status === "revoked" || certificate?.status === "revoked";

  const date = certificate.issuedAt
    ? new Date(certificate.issuedAt).toLocaleDateString()
    : "Not available";

  return (
    <main style={{minHeight:"100vh",background:"#f4f7fb",display:"grid",placeItems:"center",padding:24,fontFamily:"Arial,sans-serif",color:"#17233d"}}>
      <section style={{width:"100%",maxWidth:620,background:"#fff",borderRadius:18,padding:"38px 30px",boxShadow:"0 12px 45px rgba(20,40,80,.09)",textAlign:"center"}}>
        <div style={{fontSize:13,fontWeight:800,letterSpacing:2,color:"#315eea"}}>CERTIFYPRO</div>
        <h1 style={{fontSize:29,margin:"12px 0 8px"}}>Certificate Verification</h1>
        <p style={{color:"#64748b",margin:"0 0 28px"}}>Public certificate authenticity check</p>

        {loading ? (
          <p>Checking certificate authenticity...</p>
        ) : error ? (
          <>
            <div style={{fontSize:42}}>⚠️</div>
            <h2 style={{color:"#b45309"}}>Verification unavailable</h2>
            <p style={{color:"#64748b"}}>{error}</p>
          </>
        ) : revoked || !verified ? (
          <>
            <div style={{fontSize:42}}>{revoked ? "⛔" : "❌"}</div>
            <h2 style={{color:"#dc2626"}}>{revoked ? "Certificate Revoked" : "Certificate Not Verified"}</h2>
            <p style={{color:"#64748b"}}>{result?.message || "This certificate could not be confirmed as valid."}</p>
          </>
        ) : (
          <>
            <div style={{fontSize:42}}>✓</div>
            <h2 style={{color:"#15803d"}}>Certificate Verified</h2>
            <p style={{color:"#64748b"}}>This certificate is authentic and currently valid.</p>
          </>
        )}

        {!loading && result && (
          <div style={{marginTop:26,textAlign:"left",borderTop:"1px solid #e8edf5",paddingTop:18}}>
            {[
              ["Certificate ID", certificate.certificateId || certificateId],
              ["Recipient", certificate.recipientName || certificate.recipient?.name || "Not available"],
              ["Certificate", certificate.certificateTitle || certificate.template?.title || "Not available"],
              ["Organization", certificate.organization || "Not available"],
              ["Issue date", date],
              ["Status", revoked ? "Revoked" : verified ? "Valid" : "Not verified"]
            ].map(([label,value]) => (
              <div key={label} style={{display:"flex",justifyContent:"space-between",gap:16,padding:"12px 0",borderBottom:"1px solid #eef1f6",fontSize:14}}>
                <strong style={{color:"#64748b"}}>{label}</strong>
                <span style={{textAlign:"right",overflowWrap:"anywhere"}}>{value}</span>
              </div>
            ))}
          </div>
        )}

        <p style={{fontSize:12,color:"#94a3b8",marginTop:28}}>CertifyPro · Digital Certificate Verification</p>
      </section>
    </main>
  );
}
