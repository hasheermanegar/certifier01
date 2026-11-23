import { useMemo, useRef, useState } from "react";
import { api } from "../services/api";

const uid = () => crypto.randomUUID();

function parseCSV(text) {
  const lines = text.replace(/^\uFEFF/, "").split(/\r?\n/).filter(x => x.trim());
  if (!lines.length) return [];

  const parseLine = line => {
    const result = [];
    let value = "", quoted = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"' && line[i + 1] === '"' && quoted) {
        value += '"'; i++;
      } else if (ch === '"') quoted = !quoted;
      else if (ch === "," && !quoted) {
        result.push(value.trim()); value = "";
      } else value += ch;
    }
    result.push(value.trim());
    return result;
  };

  const headers = parseLine(lines[0]).map(x => x.toLowerCase().trim());
  const nameIndex = headers.findIndex(x => ["name", "recipient", "recipient name", "full name"].includes(x));
  const emailIndex = headers.findIndex(x => ["email", "recipient email", "email address"].includes(x));
  const titleIndex = headers.findIndex(x => ["title", "credential", "credential title"].includes(x));

  if (nameIndex < 0 || emailIndex < 0) {
    throw new Error("Your CSV needs columns named Name and Email.");
  }

  return lines.slice(1).map((line, index) => {
    const cells = parseLine(line);
    return {
      row: index + 2,
      name: cells[nameIndex] || "",
      email: (cells[emailIndex] || "").toLowerCase().trim(),
      title: titleIndex >= 0 ? cells[titleIndex] || "" : ""
    };
  });
}

export default function BulkIssuing({
  designs = [],
  recipients = [],
  onIssue,
  onRecipients
}) {
  const fileRef = useRef(null);
  const [rows, setRows] = useState([]);
  const [templateId, setTemplateId] = useState("");
  const [defaultTitle, setDefaultTitle] = useState("Certificate of Achievement");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [report, setReport] = useState(null);
  const [issuing, setIssuing] = useState(false);

  const selectedTemplate = designs.find(d => d.id === templateId);

  const checkedRows = useMemo(() => {
    const seen = new Set();
    return rows.map(r => {
      let reason = "";
      if (!r.name.trim()) reason = "Missing name";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(r.email)) reason = "Invalid email";
      else if (seen.has(r.email)) reason = "Duplicate email in CSV";
      seen.add(r.email);
      return { ...r, valid: !reason, reason };
    });
  }, [rows]);

  const validRows = checkedRows.filter(r => r.valid);
  const invalidRows = checkedRows.filter(r => !r.valid);

  const styles = {
    card: { background: "#fff", border: "1px solid #D1E6D9", borderRadius: 8, padding: 20, boxShadow: "none" },
    button: { border: "1px solid #1A4D2E", borderRadius: 6, padding: "11px 16px", background: "#1A4D2E", color: "#fff", fontWeight: 650, cursor: "pointer", boxShadow: "none" },
    secondary: { border: "1px solid #D1E6D9", borderRadius: 6, padding: "10px 15px", background: "#fff", color: "#1A4D2E", cursor: "pointer", boxShadow: "none" },
    input: { width: "100%", padding: 11, border: "1px solid #dce3ed", borderRadius: 8, boxSizing: "border-box", marginTop: 7 }
  };

  const loadFile = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      setError("File is larger than 5 MB. Please upload a smaller file.");
      e.target.value = "";
      return;
    }
    setError("");
    setSuccess("");
    setReport(null);

    try {
      let parsed;
      if (file.name.toLowerCase().endsWith(".xlsx") ||
          file.name.toLowerCase().endsWith(".xls")) {
        const XLSX = await import("xlsx");
        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const data = XLSX.utils.sheet_to_json(sheet, { defval: "" });
        parsed = data.map((row, index) => {
          const normalized = {};
          Object.entries(row).forEach(([key, value]) => {
            normalized[key.toLowerCase().trim()] = String(value ?? "").trim();
          });
          return {
            row: index + 2,
            name: normalized.name || normalized.recipient || normalized["full name"] || "",
            email: (normalized.email || normalized["email address"] || normalized["recipient email"] || "").toLowerCase(),
            title: normalized.title || normalized.credential || normalized["credential title"] || ""
          };
        });
      } else {
        parsed = parseCSV(await file.text());
      }

      if (!parsed.length) throw new Error("The file contains no recipient rows.");
      if (parsed.length > 500) throw new Error("A maximum of 500 recipient rows is allowed per upload. Split the file into smaller batches.");
      if (!parsed.some(r => r.name || r.email)) {
        throw new Error("Could not find recipient data. Please use Name and Email column headings.");
      }
      setRows(parsed);
    } catch (err) {
      setRows([]);
      setError(err.message || "Unable to read this file.");
    }
    e.target.value = "";
  };

  const downloadSample = async () => {
    try {
      const XLSX = await import("xlsx");
      const worksheet = XLSX.utils.aoa_to_sheet([
        ["Name", "Email", "Title"],
        ["Aarav Sharma", "aarav@example.com", "Certificate of Achievement"],
        ["Priya Rao", "priya@example.com", "Workshop Completion"]
      ]);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Recipients");
      XLSX.writeFile(workbook, "vistaracertifications-bulk-template.xlsx");
    } catch {
      setError("Unable to create the Excel template. Please try again.");
    }
  };

  const issue = async () => {
    if (!selectedTemplate?.backendId) {
      setError("Please select a saved certificate design before issuing.");
      return;
    }
    if (!validRows.length) {
      setError("There are no valid recipients to issue certificates to.");
      return;
    }

    setIssuing(true);
    setError("");
    setSuccess("");
    const nextRecipients = [...recipients];
    const issued = [];
    const failed = [...invalidRows];

    try {
      for (const row of validRows) {
        try {
          let recipient = nextRecipients.find(r =>
            (r.email || "").trim().toLowerCase() === row.email
          );

          if (!recipient?.backendId) {
            const created = await api.createRecipient({
              name: row.name.trim(),
              email: row.email,
              organization: ""
            });
            recipient = {
              ...created.recipient,
              id: created.recipient._id,
              backendId: created.recipient._id
            };
            nextRecipients.push(recipient);
          }

          const response = await api.issueCertificate(
            selectedTemplate.backendId,
            recipient.backendId,
            { title: row.title.trim() || defaultTitle.trim() || selectedTemplate.name || "Certificate" }
          );
          const certificate = response.certificate;

          issued.push({
            id: certificate.id || certificate._id || uid(),
            backendId: certificate.id || certificate._id,
            certificateId: certificate.certificateId,
            recipient: recipient.name || row.name.trim(),
            email: recipient.email || row.email,
            title: row.title.trim() || defaultTitle.trim() || selectedTemplate.name || "Certificate",
            templateId: selectedTemplate.id,
            recipientId: recipient.id,
            status: certificate.status === "revoked" ? "Revoked" : "Issued",
            issuedAt: certificate.issuedAt || new Date().toISOString(),
            verificationUrl: certificate.verificationUrl,
            qrCode: certificate.qrCode,
            expiresAt: certificate.expiresAt || "",
            emailStatus: certificate.emailStatus || "not_configured"
          });
        } catch (rowError) {
          failed.push({ ...row, reason: rowError.message || "Issuing failed" });
        }
      }

      onRecipients(nextRecipients);
      if (issued.length) onIssue(issued);
      setReport({ issued, skipped: failed });
      const emailsQueued = issued.filter(certificate => certificate.emailStatus === "pending" || certificate.emailStatus === "sending").length;
      const emailsNotSent = issued.filter(certificate => !["sent", "pending", "sending"].includes(certificate.emailStatus)).length;
      setSuccess(`${issued.length} certificate(s) issued successfully${emailsQueued ? `; ${emailsQueued} email(s) queued for background delivery` : ""}${emailsNotSent ? `; ${emailsNotSent} email(s) were not sent. Check SMTP configuration and the email status in All Credentials` : ""}${failed.length ? `; ${failed.length} row(s) skipped or failed` : ""}.`);
      if (!issued.length) setError("No certificates were issued. Check the report below.");
    } finally {
      setIssuing(false);
    }
  };

  return (
    <div className="page-content cp-bulk-page" style={{ padding: 30, background: "#F8FCF9", minHeight: "100%" }}>
      <div style={{ marginBottom: 25 }}>
        <small style={{ color: "#8492aa", letterSpacing: 1.5, fontWeight: 700 }}>CREDENTIAL MANAGEMENT</small>
        <h1 style={{ margin: "8px 0", color: "#1d2b45" }}>Bulk issuing</h1>
        <p style={{ margin: 0, color: "#8190a8" }}>Create credential records for multiple recipients using a CSV file.</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(190px,1fr))", gap: 14, marginBottom: 20 }}>
        {[
          ["Total rows", checkedRows.length],
          ["Valid recipients", validRows.length],
          ["Needs attention", invalidRows.length]
        ].map(([label, value]) => (
          <div key={label} style={styles.card}>
            <div style={{ color: "#8290a7", fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 29, fontWeight: 750, color: "#1d2b45", marginTop: 8 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 18 }}>
        <section style={styles.card}>
          <h3 style={{ marginTop: 0, color: "#24334d" }}>1. Upload recipient list</h3>
          <p style={{ color: "#8290a7", fontSize: 14 }}>Upload Excel or CSV (maximum 5 MB and 500 recipients). Name and Email columns are required. Title is optional.</p>
          <div style={{ border: "2px dashed #cbd6e6", borderRadius: 10, padding: 28, textAlign: "center", background: "#fafcff" }}>
            <div style={{ fontSize: 32 }}>⇧</div>
            <strong style={{ display: "block", margin: "10px 0", color: "#34435e" }}>Choose your CSV file</strong>
            <p style={{ color: "#8290a7", fontSize: 12 }}>Excel (.xlsx, .xls) and CSV files</p>
            <button type="button" className="cp-bulk-primary" style={styles.button} onClick={(e) => { e.preventDefault(); e.stopPropagation(); fileRef.current?.click(); }}>Upload Excel / CSV</button>
            <input ref={fileRef} type="file" accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" hidden onChange={loadFile} />
          </div>
          <button className="cp-bulk-secondary" style={{ ...styles.secondary, width: "100%", marginTop: 12 }} onClick={downloadSample}>↓ Download sample Excel file</button>
        </section>

        <section style={styles.card}>
          <h3 style={{ marginTop: 0, color: "#24334d" }}>2. Credential settings</h3>
          <label style={{ display: "block", marginBottom: 18, color: "#52617a", fontSize: 13 }}>
            Certificate design
            <select value={templateId} onChange={e => setTemplateId(e.target.value)} style={styles.input}>
              <option value="">No design selected</option>
              {designs.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </label>
          <label style={{ display: "block", color: "#52617a", fontSize: 13 }}>
            Default credential title
            <input value={defaultTitle} onChange={e => setDefaultTitle(e.target.value)} style={styles.input} />
          </label>
          <p style={{ fontSize: 12, color: "#8290a7", lineHeight: 1.6 }}>
            A title provided in the CSV takes priority over this default title. The selected design is attached to each created credential record.
          </p>
          <button className="cp-bulk-primary" style={{ ...styles.button, width: "100%", marginTop: 12 }} disabled={!validRows.length || !selectedTemplate?.backendId || issuing} onClick={issue}>
            {issuing ? "Issuing..." : `Issue ${validRows.length} certificate${validRows.length === 1 ? "" : "s"}`}
          </button>
        </section>
      </div>

      {error && <div role="alert" style={{ marginTop: 18, padding: 14, background: "#fff0f0", color: "#b83240", borderRadius: 9 }}>{error}</div>}
      {success && <div role="status" style={{ marginTop: 18, padding: 14, background: "#eaf8f0", color: "#167447", borderRadius: 9 }}>{success}</div>}

      {checkedRows.length > 0 && (
        <section style={{ ...styles.card, marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <div><h3 style={{ margin: 0, color: "#24334d" }}>3. Review recipients</h3><p style={{ color: "#8290a7", fontSize: 13 }}>Invalid rows are skipped when issuing.</p></div>
            <button className="cp-bulk-secondary" style={styles.secondary} onClick={() => { setRows([]); setSuccess(""); setError(""); setReport(null); }}>Clear list</button>
          </div>
          <div style={{ overflowX: "auto", marginTop: 12 }}>
            <table style={{ width: "100%", minWidth: 650, borderCollapse: "collapse", textAlign: "left" }}>
              <thead><tr style={{ background: "#f8fafd", color: "#8390a5", fontSize: 11 }}>
                {["ROW", "NAME", "EMAIL", "TITLE", "VALIDATION"].map(x => <th key={x} style={{ padding: 12 }}>{x}</th>)}
              </tr></thead>
              <tbody>
                {checkedRows.map(r => (
                  <tr key={r.row} style={{ borderTop: "1px solid #edf0f5" }}>
                    <td style={{ padding: 12, color: "#8290a7" }}>{r.row}</td>
                    <td style={{ padding: 12 }}>{r.name || "—"}</td>
                    <td style={{ padding: 12 }}>{r.email || "—"}</td>
                    <td style={{ padding: 12 }}>{r.title || defaultTitle || "—"}</td>
                    <td style={{ padding: 12 }}>
                      <span style={{ color: r.valid ? "#16804d" : "#c0444c", fontSize: 12, fontWeight: 650 }}>
                        {r.valid ? "✓ Valid" : r.reason}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {report && (
        <section style={{ ...styles.card, marginTop: 20 }}>
          <h3 style={{ color: "#24334d", marginTop: 0 }}>Issuing report</h3>
          <p style={{ color: "#16804d" }}>{report.issued.length} credential record(s) created.</p>
          <p style={{ color: "#8290a7" }}>{report.skipped.length} invalid or failed row(s) skipped.</p>
          {report.skipped.length > 0 && <ul style={{ color: "#b45309", fontSize: 13 }}>{report.skipped.map((row, index) => <li key={`${row.row}-${index}`}>Row {row.row}: {row.reason}</li>)}</ul>}
          <button className="cp-bulk-secondary" style={styles.secondary} onClick={() => {
            const csv = ["Name,Email,Credential,Status", ...report.issued.map(c => [c.recipient,c.email,c.title,c.status].map(v => `"${String(v).replace(/"/g,'""')}"`).join(","))].join("\n");
            const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
            const a = document.createElement("a"); a.href = url; a.download = "vistaracertifications-issuing-report.csv"; a.click(); URL.revokeObjectURL(url);
          }}>↓ Download issuing report</button>
        </section>
      )}
    </div>
  );
}
