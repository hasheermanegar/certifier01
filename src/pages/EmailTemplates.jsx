import { useState } from "react";

const uid = () => crypto.randomUUID();



const variables = [
  "{{recipient_name}}",
  "{{credential_title}}",
  "{{issue_date}}",
  "{{recipient_email}}",
  "{{certificate_link}}"
];

export default function EmailTemplates({ templates = [], onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [preview, setPreview] = useState(null);
  const [form, setForm] = useState({ name: "", subject: "", body: "" });
  const [search, setSearch] = useState("");
  const filtered = templates.filter(t => `${t.name || ""} ${t.subject || ""}`.toLowerCase().includes(search.toLowerCase()));

  const openNew = () => {
    setForm({ name: "", subject: "", body: "" });
    setEditing("new");
  };

  const openEdit = template => {
    setForm({ ...template });
    setEditing(template.id);
  };

  const save = e => {
    e.preventDefault();
    if (!form.name.trim() || !form.subject.trim() || !form.body.trim()) return;
    onSave({
      ...form,
      id: editing === "new" ? uid() : editing,
      updatedAt: new Date().toISOString()
    });
    setEditing(null);
  };

  const renderPreview = value =>
    value
      .replaceAll("{{recipient_name}}", "Alex Johnson")
      .replaceAll("{{credential_title}}", "Certificate of Achievement")
      .replaceAll("{{issue_date}}", new Date().toLocaleDateString())
      .replaceAll("{{recipient_email}}", "alex@example.com")
      .replaceAll("{{certificate_link}}", "https://certifypro.example/verify");

  return (
    <div className="page-content cp-email-page">
      <div className="page-heading">
        <div>
          <small className="eyebrow">COMMUNICATION MANAGEMENT</small>
          <h1>Email Templates</h1>
          <p>Create reusable emails for certificate delivery and recipient communication.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>＋ Create email template</button>
      </div>

      <div className="stats-grid cp-email-stats">
        <div className="stat-card"><span>Total templates</span><strong>{templates.length}</strong></div>
        <div className="stat-card"><span>Available variables</span><strong>{variables.length}</strong></div>
        <div className="stat-card"><span>Email delivery</span><strong>Not connected</strong></div>
      </div>

      <section className="cp-email-library">
        <div className="cp-email-library-heading">
          <div>
            <h2>Your email templates</h2>
            <p>Manage reusable messages sent to your certificate recipients.</p>
          </div>
          <span className="cp-email-count">{filtered.length} {filtered.length === 1 ? "template" : "templates"}</span>
        </div>

        <div className="cp-email-toolbar">
          <span className="cp-email-search-icon">⌕</span>
          <input
            placeholder="Search templates by name or subject..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")}>×</button>}
        </div>

        {filtered.length ? (
          <div className="cp-email-grid">
            {filtered.map(t => (
              <article className="cp-email-card" key={t.id}>
                <div className="cp-email-card-top">
                  <div className="cp-email-icon">✉</div>
                  <span className="cp-email-type">EMAIL TEMPLATE</span>
                </div>
                <h3>{t.name}</h3>
                <div className="cp-email-subject">
                  <span>SUBJECT</span>
                  <p>{t.subject}</p>
                </div>
                <div className="cp-email-message">
                  <span>MESSAGE PREVIEW</span>
                  <p>{t.body}</p>
                </div>
                <div className="cp-email-card-actions">
                  <button className="cp-email-preview-btn" onClick={() => setPreview(t)}>Preview</button>
                  <button className="cp-email-edit-btn" onClick={() => openEdit(t)}>Edit</button>
                  <button className="cp-email-delete-btn" onClick={() => {
                    if (window.confirm(`Delete "${t.name}"?`)) onDelete(t.id);
                  }}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cp-email-empty">
            <div>✉</div>
            <h3>{search ? "No matching templates" : "No email templates yet"}</h3>
            <p>{search ? "Try searching with a different name or subject." : "Create your first reusable email template to get started."}</p>
            {search
              ? <button className="cp-email-preview-btn" onClick={() => setSearch("")}>Clear search</button>
              : <button className="btn-primary" onClick={openNew}>＋ Create template</button>}
          </div>
        )}
      </section>

      {editing && (
        <div className="modal-backdrop">
          <form className="modal-card email-editor" onSubmit={save}>
            <div className="modal-head">
              <div>
                <small className="eyebrow">EMAIL DESIGNER</small>
                <h2>{editing === "new" ? "Create email template" : "Edit email template"}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setEditing(null)}>×</button>
            </div>

            <label>Template name
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="Certificate delivery email" />
            </label>

            <label>Email subject
              <input required value={form.subject} onChange={e => setForm(p => ({ ...p, subject: e.target.value }))} placeholder="Your certificate is ready!" />
            </label>

            <label>Email body
              <textarea required rows="9" value={form.body} onChange={e => setForm(p => ({ ...p, body: e.target.value }))} placeholder="Write your email here..." />
            </label>

            <div className="variable-list">
              <b>Available placeholders</b>
              <div>
                {variables.map(v => (
                  <button type="button" key={v} className="variable-chip"
                    onClick={() => setForm(p => ({ ...p, body: p.body + v }))}>
                    {v}
                  </button>
                ))}
              </div>
              <small>Click a placeholder to insert it at the end of the email body.</small>
            </div>

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setEditing(null)}>Cancel</button>
              <button type="button" className="btn-secondary" onClick={() => setPreview(form)}>Preview</button>
              <button className="btn-primary">Save template</button>
            </div>
          </form>
        </div>
      )}

      {preview && (
        <div className="modal-backdrop">
          <div className="modal-card email-preview">
            <div className="modal-head">
              <div>
                <small className="eyebrow">EMAIL PREVIEW</small>
                <h2>{preview.name}</h2>
              </div>
              <button className="icon-btn" onClick={() => setPreview(null)}>×</button>
            </div>
            <div className="preview-email">
              <small>SUBJECT</small>
              <h3>{renderPreview(preview.subject)}</h3>
              <hr />
              <div>{renderPreview(preview.body)}</div>
            </div>
            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setPreview(null)}>Close preview</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
