import { useMemo } from "react";

export default function CredentialUsage({ credentials = [], designs = [] }) {
  const stats = useMemo(() => {
    const issued = credentials.filter(c => String(c.status || "").toLowerCase() === "issued");
    const revoked = credentials.filter(c => String(c.status || "").toLowerCase() === "revoked");

    const templates = designs.map(d => {
      const items = credentials.filter(c => c.templateId === d.id);
      return {
        name: d.name,
        total: items.length,
        issued: items.filter(c => String(c.status || "").toLowerCase() === "issued").length
      };
    }).sort((a, b) => b.total - a.total);

    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - i));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
      return { key, label: date.toLocaleDateString("en", { month: "short" }), count: 0 };
    });

    credentials.forEach(c => {
      if (!c.issuedAt) return;
      const month = months.find(m => m.key === c.issuedAt.slice(0, 7));
      if (month) month.count++;
    });

    return { issued, revoked, templates, months };
  }, [credentials, designs]);

  const max = Math.max(1, ...stats.months.map(m => m.count));

  function exportCSV() {
    const rows = [
      ["Recipient", "Email", "Certificate", "Template ID", "Status", "Issued Date"],
      ...credentials.map(c => [
        c.recipient || "", c.email || "", c.title || "",
        c.templateId || "", c.status || "", c.issuedAt || ""
      ])
    ];
    const csv = rows.map(row =>
      row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = "vistaracertifications-credential-usage.csv";
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="page-content cp-credential-usage-page">
      <div className="page-heading">
        <div>
          <small className="eyebrow">CREDENTIAL MANAGEMENT</small>
          <h1>Credential Usage</h1>
          <p>Monitor certificate issuance, template usage and workspace activity.</p>
        </div>
        <button
          onClick={exportCSV}
          style={{
            background: "#1A4D2E",
            color: "#ffffff",
            border: "none",
            borderRadius: 9,
            padding: "12px 22px",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            boxShadow: "none",
            transition: "all 0.2s ease"
          }}
        >
          Export CSV
        </button>
      </div>

      <div className="stats-grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(175px,1fr))" }}>
        {[
          ["Total credentials", credentials.length, "All credential records"],
          ["Successfully issued", stats.issued.length, "Currently issued"],
          ["Revoked credentials", stats.revoked.length, "Revoked records"],
          ["Design templates", designs.length, "Available templates"]
        ].map(([label, value, note]) => (
          <div className="stat-card" key={label}>
            <span>{label}</span>
            <strong>{value}</strong>
            <small style={{ color: "#8290a7" }}>{note}</small>
          </div>
        ))}
      </div>

      <div className="table-wrap" style={{ padding: 24, marginTop: 22 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Monthly issuance activity</h2>
        <p style={{ color: "#8290a7", fontSize: 13 }}>Credential records created over the last six months</p>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(6,minmax(0,1fr))", gap: 16, alignItems: "end", height: 210, paddingTop: 20 }}>
          {stats.months.map(m => (
            <div key={m.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "end", height: "100%", gap: 8 }}>
              <b style={{ fontSize: 12 }}>{m.count}</b>
              <div style={{ width: "65%", minWidth: 18, height: `${Math.max(5, m.count / max * 135)}px`, background: "#1A4D2E", borderRadius: "6px 6px 0 0" }} />
              <small style={{ color: "#8290a7" }}>{m.label}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="table-wrap" style={{ padding: 24, marginTop: 22 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Usage by certificate template</h2>
        {stats.templates.length === 0 ? (
          <p style={{ color: "#8290a7" }}>No certificate templates have been created yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr>
                {["Template", "Total credentials", "Issued", "Usage"].map(x => (
                  <th key={x} style={{ padding: 12, color: "#8290a7", fontSize: 12, borderBottom: "1px solid #e8edf4" }}>{x}</th>
                ))}
              </tr></thead>
              <tbody>
                {stats.templates.map(t => (
                  <tr key={t.name}>
                    <td style={{ padding: 12 }}>{t.name}</td>
                    <td style={{ padding: 12 }}>{t.total}</td>
                    <td style={{ padding: 12 }}>{t.issued}</td>
                    <td style={{ padding: 12, minWidth: 130 }}>
                      <div style={{ background: "#e9edf5", height: 7, borderRadius: 10 }}>
                        <div style={{ width: `${credentials.length ? t.total / credentials.length * 100 : 0}%`, background: "#1A4D2E", height: 7, borderRadius: 10 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="table-wrap" style={{ padding: 24, marginTop: 22 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Recent credential activity</h2>
        {credentials.length === 0 ? (
          <p style={{ color: "#8290a7" }}>No credentials have been issued yet.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr>
                {["Recipient", "Certificate", "Status", "Issued date"].map(x => (
                  <th key={x} style={{ padding: 12, color: "#8290a7", fontSize: 12, borderBottom: "1px solid #e8edf4" }}>{x}</th>
                ))}
              </tr></thead>
              <tbody>
                {[...credentials].sort((a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0)).slice(0, 10).map(c => (
                  <tr key={c.id}>
                    <td style={{ padding: 12 }}>{c.recipient || c.email || "—"}</td>
                    <td style={{ padding: 12 }}>{c.title || "Certificate"}</td>
                    <td style={{ padding: 12 }}>{c.status || "Unknown"}</td>
                    <td style={{ padding: 12 }}>{c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
