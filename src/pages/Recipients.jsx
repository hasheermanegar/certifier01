import { useMemo, useRef, useState } from "react";

const uid = () => crypto.randomUUID();

export default function Recipients({
  recipients = [],
  credentials = [],
  onAdd,
  onUpdate,
  onDelete
}) {
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(null);
  const [form, setForm] = useState({ name: "", email: "", organization: "" });
  const fileRef = useRef(null);

  const filtered = useMemo(() => recipients.filter(r =>
    `${r.name} ${r.email} ${r.organization || ""}`
      .toLowerCase().includes(search.toLowerCase())
  ), [recipients, search]);

  const openAdd = () => {
    setEditing(null);
    setForm({ name: "", email: "", organization: "" });
    setModal(true);
  };

  const openEdit = r => {
    setEditing(r);
    setForm({
      name: r.name || "",
      email: r.email || "",
      organization: r.organization || ""
    });
    setModal(true);
  };

  const save = e => {
    e.preventDefault();
    const value = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim().toLowerCase()
    };

    if (editing) onUpdate(editing.id, value);
    else onAdd({ ...value, id: uid(), createdAt: new Date().toISOString() });

    setModal(false);
  };

  const recipientCredentials = r =>
    credentials.filter(c =>
      c.email?.toLowerCase() === r.email?.toLowerCase()
    );

  const exportCSV = () => {
    const rows = [
      ["Name", "Email", "Organization", "Date Added"],
      ...filtered.map(r => [
        r.name, r.email, r.organization || "", r.createdAt || ""
      ])
    ];
    const csv = rows.map(row =>
      row.map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certifypro-recipients.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const importCSV = async e => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const lines = text.split(/\r?\n/).filter(Boolean);
    const parse = line => {
      const values = [];
      let value = "", quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"' && line[i + 1] === '"' && quoted) {
          value += '"'; i++;
        } else if (ch === '"') quoted = !quoted;
        else if (ch === "," && !quoted) {
          values.push(value.trim()); value = "";
        } else value += ch;
      }
      values.push(value.trim());
      return values;
    };
    const data = lines.slice(1).map(parse);
    data.forEach(row => {
      const [name, email, organization] = row;
      if (name && email && email.includes("@")) {
        onAdd({
          id: uid(),
          name,
          email: email.toLowerCase(),
          organization: organization || "",
          createdAt: new Date().toISOString()
        });
      }
    });
    e.target.value = "";
  };

  const card = {
    background: "#fff",
    border: "1px solid #e5eaf2",
    borderRadius: 12,
    padding: 20
  };

  const button = {
    border: 0,
    borderRadius: 8,
    padding: "11px 16px",
    background: "#315eea",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer"
  };

  const input = {
    width: "100%",
    padding: 11,
    border: "1px solid #dce3ed",
    borderRadius: 8,
    marginTop: 7,
    boxSizing: "border-box"
  };

  return (
    <div className="page-content" style={{ padding: 30, background: "#f6f8fc", minHeight: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap", marginBottom: 25 }}>
        <div>
          <small style={{ color: "#8492aa", letterSpacing: 1.5, fontWeight: 700 }}>WORKSPACE MANAGEMENT</small>
          <h1 style={{ margin: "8px 0", color: "#1d2b45" }}>Recipients</h1>
          <p style={{ margin: 0, color: "#8190a8" }}>Manage people who receive your digital credentials.</p>
        </div>
        <div style={{ display: "flex", gap: 9, flexWrap: "wrap" }}>
          <button style={{ ...button, background: "#fff", color: "#34435e", border: "1px solid #dce3ed" }} onClick={exportCSV}>↓ Export CSV</button>
          <button style={{ ...button, background: "#fff", color: "#34435e", border: "1px solid #dce3ed" }} onClick={() => fileRef.current?.click()}>↑ Import CSV</button>
          <input ref={fileRef} type="file" accept=".csv,text/csv" hidden onChange={importCSV} />
          <button style={button} onClick={openAdd}>+ Add recipient</button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 15, marginBottom: 22 }}>
        {[
          ["Total recipients", recipients.length],
          ["With credentials", recipients.filter(r => recipientCredentials(r).length > 0).length],
          ["Credentials issued", credentials.length]
        ].map(([label, value]) => (
          <div key={label} style={card}>
            <div style={{ color: "#8290a7", fontSize: 13 }}>{label}</div>
            <div style={{ fontSize: 29, fontWeight: 700, color: "#1d2b45", marginTop: 9 }}>{value}</div>
          </div>
        ))}
      </div>

      <div style={card}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <h3 style={{ margin: 0, color: "#24334d" }}>All recipients</h3>
          <input
            aria-label="Search recipients"
            placeholder="Search by name, email or organization..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ ...input, maxWidth: 330, margin: 0 }}
          />
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", minWidth: 650 }}>
            <thead>
              <tr style={{ background: "#f8fafd", color: "#8390a5", fontSize: 11, letterSpacing: 1 }}>
                {["RECIPIENT", "ORGANIZATION", "CREDENTIALS", "DATE ADDED", "ACTIONS"].map(h =>
                  <th key={h} style={{ padding: 13 }}>{h}</th>
                )}
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderTop: "1px solid #edf0f5" }}>
                  <td style={{ padding: 14 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
                      <div style={{ width: 36, height: 36, borderRadius: "50%", background: "#eaf0ff", color: "#315eea", display: "grid", placeItems: "center", fontWeight: 700 }}>
                        {(r.name || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontWeight: 650, color: "#293750" }}>{r.name}</div>
                        <div style={{ color: "#8491a7", fontSize: 12 }}>{r.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: 14, color: "#687891" }}>{r.organization || "—"}</td>
                  <td style={{ padding: 14 }}>
                    <button onClick={() => setSelected(r)} style={{ border: 0, background: "#edf2ff", color: "#315eea", padding: "6px 10px", borderRadius: 15, cursor: "pointer" }}>
                      {recipientCredentials(r).length} issued
                    </button>
                  </td>
                  <td style={{ padding: 14, color: "#687891", fontSize: 13 }}>
                    {r.createdAt ? new Date(r.createdAt).toLocaleDateString() : "—"}
                  </td>
                  <td style={{ padding: 14, whiteSpace: "nowrap" }}>
                    <button onClick={() => openEdit(r)} style={{ border: 0, background: "transparent", color: "#315eea", cursor: "pointer", marginRight: 10 }}>Edit</button>
                    <button onClick={() => {
                      if (window.confirm(`Delete ${r.name}? Their issued credentials will not be deleted.`)) onDelete(r.id);
                    }} style={{ border: 0, background: "transparent", color: "#d34d58", cursor: "pointer" }}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 45, color: "#8491a7" }}>
            <div style={{ fontSize: 32, marginBottom: 10 }}>♙</div>
            <h3 style={{ color: "#34435e" }}>{search ? "No matching recipients" : "No recipients yet"}</h3>
            <p>Add a recipient or import a CSV file to get started.</p>
            {!search && <button style={button} onClick={openAdd}>+ Add your first recipient</button>}
          </div>
        )}
      </div>

      {modal && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={save}>
            <div className="modal-head">
              <div>
                <small className="eyebrow">{editing ? "UPDATE CONTACT" : "NEW CONTACT"}</small>
                <h2>{editing ? "Edit recipient" : "Add recipient"}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setModal(false)}>×</button>
            </div>
            <label>Full name<input required style={input} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} /></label>
            <label>Email address<input required type="email" style={input} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></label>
            <label>Organization (optional)<input style={input} value={form.organization} onChange={e => setForm({ ...form, organization: e.target.value })} /></label>
            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setModal(false)}>Cancel</button>
              <button className="btn-primary">{editing ? "Save changes" : "Add recipient"}</button>
            </div>
          </form>
        </div>
      )}

      {selected && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div className="modal-head">
              <div><small className="eyebrow">RECIPIENT PROFILE</small><h2>{selected.name}</h2><p style={{ color: "#8290a7" }}>{selected.email}</p></div>
              <button className="icon-btn" onClick={() => setSelected(null)}>×</button>
            </div>
            <h3>Issued credentials</h3>
            {recipientCredentials(selected).length === 0
              ? <p style={{ color: "#8290a7" }}>No credentials have been issued to this recipient yet.</p>
              : recipientCredentials(selected).map(c => (
                <div key={c.id} style={{ padding: 12, border: "1px solid #e5eaf2", borderRadius: 8, marginBottom: 9 }}>
                  <strong>{c.title || "Untitled credential"}</strong>
                  <div style={{ color: "#8290a7", fontSize: 13, marginTop: 5 }}>
                    {c.status || "Issued"} · {c.issuedAt ? new Date(c.issuedAt).toLocaleDateString() : "Date unavailable"}
                  </div>
                </div>
              ))}
            <div className="modal-actions"><button className="btn-primary" onClick={() => setSelected(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
