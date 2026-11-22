import { useMemo, useState } from "react";
import {
  Search, Download, Plus, Award, CheckCircle2,
  Ban, Clock3, Filter, RotateCcw, CalendarDays,
  Users, ChevronDown, FileCheck2, Mail
} from "lucide-react";

function getCredentialStatus(c) {
  const today = new Date().toISOString().slice(0, 10);
  if (String(c.status || "").toLowerCase() === "revoked") return "Revoked";
  if (String(c.status || "").toLowerCase() === "expired") return "Expired";
  if (c.expiresAt && String(c.expiresAt).slice(0, 10) < today) return "Expired";
  return "Issued";
}

export default function AllCredentials({ credentials = [], onCreate, onUpdate, onDownload, onRevoke, onResend }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [payment, setPayment] = useState("All");
  const [editing, setEditing] = useState(null);
  const [resending, setResending] = useState(null);

  const rows = useMemo(() => credentials.filter(c => {
    const term = search.toLowerCase();
    const matchesSearch =
      `${c.recipient || ""} ${c.email || ""} ${c.title || ""} ${c.id || ""}`
        .toLowerCase().includes(term);
    const matchesStatus = status === "All" || getCredentialStatus(c) === status;
    const matchesPayment = payment === "All" ||
      (c.paymentStatus || "Unverified") === payment;
    return matchesSearch && matchesStatus && matchesPayment;
  }), [credentials, search, status, payment]);

  const update = (id, changes) => onUpdate?.(id, changes);

  const exportCSV = () => {
    const headers = ["Recipient", "Email", "Credential", "Issued", "Status", "Payment", "Expiry"];
    const data = rows.map(c => [
      c.recipient, c.email, c.title,
      c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "",
      getCredentialStatus(c), c.paymentStatus || "Unverified", c.expiresAt || ""
    ]);
    const csv = [headers, ...data].map(row =>
      row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");

    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "certifypro-credentials.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const counts = {
    total: credentials.length,
    issued: credentials.filter(c => getCredentialStatus(c) === "Issued").length,
    revoked: credentials.filter(c => getCredentialStatus(c) === "Revoked").length,
    expired: credentials.filter(c => getCredentialStatus(c) === "Expired").length
  };

  const stats = [
    { label: "Total credentials", value: counts.total, icon: Award, color: "blue", note: "All credentials" },
    { label: "Issued", value: counts.issued, icon: CheckCircle2, color: "green", note: "Active credentials" },
    { label: "Revoked", value: counts.revoked, icon: Ban, color: "red", note: "Access withdrawn" },
    { label: "Expired", value: counts.expired, icon: Clock3, color: "amber", note: "Past expiry date" }
  ];

  const clearFilters = () => {
    setSearch("");
    setStatus("All");
    setPayment("All");
  };

  return (
    <div className="page-content cp-credentials-page">
      <div className="cp-credentials-heading">
        <div>
          <div className="cp-credentials-eyebrow">
            <FileCheck2 size={14}/> CREDENTIAL MANAGEMENT
          </div>
          <h1>All credentials</h1>
          <p>Track, manage and monitor every credential in your workspace.</p>
        </div>
        <div className="cp-credentials-heading-actions">
          <button className="cp-credential-btn secondary" onClick={exportCSV}>
            <Download size={15}/> Export CSV
          </button>
          <button className="cp-credential-btn primary" onClick={onCreate}>
            <Plus size={16}/> Issue credential
          </button>
        </div>
      </div>

      <div className="cp-credential-stats">
        {stats.map(item => {
          return (
            <div className="cp-credential-stat" key={item.label}>
              <div className="cp-credential-stat-content">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
                <small>{item.note}</small>
              </div>
            </div>
          );
        })}
      </div>

      <section className="cp-credential-records">
        <div className="cp-records-heading">
          <div>
            <h2>Credential records</h2>
            <p>View and manage credentials issued to your recipients.</p>
          </div>
          <span className="cp-record-count">
            <Users size={14}/> {rows.length} records
          </span>
        </div>

        <div className="cp-credential-toolbar">
          <div className="cp-credential-search">
            <Search size={17}/>
            <input
              placeholder="Search recipient, email, credential..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}
          </div>

          <div className="cp-credential-filter">
            <Filter size={15}/>
            <select value={status} onChange={e => setStatus(e.target.value)}>
              {["All", "Issued", "Revoked", "Expired"].map(x =>
                <option key={x}>{x}</option>
              )}
            </select>
            <ChevronDown size={13}/>
          </div>

          <div className="cp-credential-filter">
            <select value={payment} onChange={e => setPayment(e.target.value)}>
              {["All", "Paid", "Unpaid", "Pending", "Unverified"].map(x =>
                <option key={x}>{x === "All" ? "All payments" : x}</option>
              )}
            </select>
            <ChevronDown size={13}/>
          </div>

          {(search || status !== "All" || payment !== "All") && (
            <button className="cp-clear-filters" onClick={clearFilters}>
              <RotateCcw size={13}/> Clear
            </button>
          )}
        </div>

        <div className="cp-credential-table-wrap">
          <table className="cp-credential-table">
            <thead>
              <tr>
                <th>RECIPIENT</th>
                <th>CREDENTIAL</th>
                <th>ISSUED DATE</th>
                <th>PAYMENT</th>
                <th>STATUS</th>
                <th>EXPIRY DATE</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(c => {
                const currentStatus = getCredentialStatus(c);
                const emailPending = c.emailStatus === "pending" || c.emailStatus === "sending";
                return (
                  <tr key={c.id}>
                    <td>
                      <div className="cp-recipient-cell">
                        <div className="cp-recipient-avatar">
                          {(c.recipient || "?").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <strong>{c.recipient || "Unknown recipient"}</strong>
                          <span>{c.email || "No email provided"}</span>
                          {c.emailStatus && <small className="cp-email-status">Email: {String(c.emailStatus).replace(/_/g, " ")}</small>}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="cp-credential-name">
                        <Award size={16}/>
                        <span>{c.title || "Certificate"}</span>
                      </div>
                    </td>
                    <td>
                      <span className="cp-date-cell">
                        {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "—"}
                      </span>
                    </td>
                    <td>
                      <select
                        className={`cp-payment-select ${String(c.paymentStatus || "Unverified").toLowerCase()}`}
                        value={c.paymentStatus || "Unverified"}
                        onChange={e => update(c.id, { paymentStatus: e.target.value })}
                        aria-label="Payment status"
                      >
                        {["Unverified", "Paid", "Unpaid", "Pending"].map(x =>
                          <option key={x}>{x}</option>
                        )}
                      </select>
                    </td>
                    <td>
                      <span className={`cp-credential-status ${currentStatus.toLowerCase()}`}>
                        <span className="cp-status-dot"/>
                        {currentStatus}
                      </span>
                    </td>
                    <td>
                      {editing === c.id ? (
                        <input
                          className="cp-expiry-input"
                          type="date"
                          value={c.expiresAt || ""}
                          onChange={e => update(c.id, { expiresAt: e.target.value })}
                          onBlur={() => setEditing(null)}
                          autoFocus
                        />
                      ) : (
                        <button className="cp-expiry-btn" onClick={() => setEditing(c.id)}>
                          <CalendarDays size={13}/>
                          {c.expiresAt || "Set expiry"}
                        </button>
                      )}
                    </td>
                    <td>
                      <div style={{display:"flex",gap:"6px",alignItems:"center",flexWrap:"wrap"}}>
                        {c.certificateId && <>
                          <button className="cp-row-action" onClick={()=>onDownload?.(c)}>
                            <Download size={13}/> PDF
                          </button>
                          {onResend && currentStatus === "Issued" && <button
                            className="cp-row-action"
                            disabled={resending === c.id || emailPending}
                            onClick={async()=>{
                              setResending(c.id);
                              try { await onResend(c.id); }
                              catch(error) { window.alert("Could not resend email: " + error.message); }
                              finally { setResending(null); }
                            }}>
                            <Mail size={13}/> {resending === c.id||c.emailStatus==="sending" ? "Sending..." : emailPending ? "Email queued" : "Resend email"}
                          </button>}
                          {c.verificationUrl && <a className="cp-row-action" href={`${window.location.origin}/verify/${encodeURIComponent(c.certificateId)}`} target="_blank" rel="noreferrer">
                            <CheckCircle2 size={13}/> Verify
                          </a>}
                        </>}
                        {currentStatus === "Revoked" ? (
                          <span className="cp-credential-status revoked">Revoked</span>
                        ) : (
                          <button className="cp-row-action revoke" onClick={() => {
                            if (window.confirm("Revoke this credential?")) {
                              if(c.certificateId) onRevoke?.(c.id);
                              else update(c.id, { status: "Revoked" });
                            }
                          }}>
                            <Ban size={13}/> Revoke
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!rows.length && (
            <div className="cp-credentials-empty">
              <div><Search size={22}/></div>
              <strong>No credentials found</strong>
              <p>Try changing your search or filters to find what you're looking for.</p>
              <button onClick={clearFilters}>Clear filters</button>
            </div>
          )}
        </div>

        <div className="cp-credential-table-footer">
          <span>Showing <strong>{rows.length}</strong> of <strong>{credentials.length}</strong> credentials</span>
          <span>CertifyPro Credential Management</span>
        </div>
      </section>
    </div>
  );
}
