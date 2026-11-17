import React, { useState } from "react";

const uid = () => crypto.randomUUID();

export default function Pathways({
  pathways = [],
  designs = [],
  recipients = [],
  onSave,
  onDelete
}) {
  const [showForm, setShowForm] = useState(false);
  const [managed, setManaged] = useState(null);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState("");

  const blank = {
    id: uid(),
    name: "",
    description: "",
    designIds: [],
    enrolled: [],
    progress: {},
    createdAt: new Date().toISOString()
  };

  const [form, setForm] = useState(blank);

  const openNew = () => {
    setForm({ ...blank, id: uid(), designIds: [], enrolled: [], progress: {} });
    setSelected(null);
    setShowForm(true);
  };

  const openEdit = p => {
    setForm({
      ...p,
      designIds: p.designIds || [],
      enrolled: p.enrolled || [],
      progress: p.progress || {}
    });
    setSelected(p.id);
    setShowForm(true);
  };

  const save = e => {
    e.preventDefault();
    if (!form.name.trim()) return;
    onSave({
      ...form,
      name: form.name.trim(),
      description: form.description.trim()
    });
    setShowForm(false);
  };

  const toggleDesign = id => {
    setForm(p => ({
      ...p,
      designIds: p.designIds.includes(id)
        ? p.designIds.filter(x => x !== id)
        : [...p.designIds, id]
    }));
  };

  const updatePathway = (pathway, changes) => {
    const updated = { ...pathway, ...changes };
    onSave(updated);
    setManaged(updated);
  };

  const toggleRecipient = (pathway, recipientId) => {
    const enrolled = pathway.enrolled || [];
    const next = enrolled.includes(recipientId)
      ? enrolled.filter(id => id !== recipientId)
      : [...enrolled, recipientId];

    const progress = { ...(pathway.progress || {}) };
    if (!next.includes(recipientId)) delete progress[recipientId];

    updatePathway(pathway, { enrolled: next, progress });
  };

  const toggleProgress = (pathway, recipientId, designId) => {
    const progress = { ...(pathway.progress || {}) };
    const completed = [...(progress[recipientId] || [])];

    progress[recipientId] = completed.includes(designId)
      ? completed.filter(id => id !== designId)
      : [...completed, designId];

    updatePathway(pathway, { progress });
  };

  const filtered = pathways.filter(p =>
    `${p.name} ${p.description}`.toLowerCase().includes(search.toLowerCase())
  );

  const getDesignName = id =>
    designs.find(d => d.id === id)?.name || "Deleted template";

  const enrolledRecipients = managed
    ? recipients.filter(r => (managed.enrolled || []).includes(r.id))
    : [];

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <small className="eyebrow">LEARNING & CREDENTIAL JOURNEYS</small>
          <h1>Pathways</h1>
          <p>Connect multiple credentials into structured achievement journeys.</p>
        </div>
        <button className="btn-primary" onClick={openNew}>＋ Create pathway</button>
      </div>

      <div className="cp-pathway-stats">
        <div className="cp-pathway-stat">
          <span>Total pathways</span>
          <strong>{pathways.length}</strong>
          <small>Created in your workspace</small>
        </div>
        <div className="cp-pathway-stat">
          <span>Available templates</span>
          <strong>{designs.length}</strong>
          <small>Credential designs available</small>
        </div>
        <div className="cp-pathway-stat">
          <span>Recipients enrolled</span>
          <strong>{pathways.reduce((n, p) => n + (p.enrolled?.length || 0), 0)}</strong>
          <small>Across all pathways</small>
        </div>
      </div>

      <section className="cp-pathway-library">
        <div className="cp-pathway-library-heading">
          <div>
            <h2>Your pathways</h2>
            <p>Organise credentials into structured learning journeys.</p>
          </div>
          <span className="cp-pathway-count">{filtered.length} {filtered.length === 1 ? "pathway" : "pathways"}</span>
        </div>

        <div className="cp-pathway-toolbar">
          <div className="cp-pathway-search">
            <span>⌕</span>
            <input
              placeholder="Search pathways by name or description..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && <button type="button" onClick={() => setSearch("")}>×</button>}
          </div>
        </div>

        {filtered.length ? (
          <div className="cp-pathway-grid">
            {filtered.map(p => (
              <article className="cp-pathway-card" key={p.id}>
                <div className="cp-pathway-card-top">
                  <span className="cp-pathway-label">CREDENTIAL PATHWAY</span>
                  <span className="cp-pathway-card-menu">{(p.enrolled?.length || 0)} enrolled</span>
                </div>

                <h3>{p.name}</h3>
                <p className="cp-pathway-description">
                  {p.description || "No description added yet."}
                </p>

                <div className="cp-pathway-metrics">
                  <div>
                    <strong>{p.designIds?.length || 0}</strong>
                    <span>Credentials</span>
                  </div>
                  <div>
                    <strong>{p.enrolled?.length || 0}</strong>
                    <span>Recipients</span>
                  </div>
                </div>

                <div className="cp-pathway-sequence">
                  <span>PATHWAY CONTENT</span>
                  {(p.designIds || []).length ? (
                    <div className="cp-pathway-sequence-list">
                      {p.designIds.slice(0, 3).map((id, index) => (
                        <div className="cp-pathway-sequence-item" key={id}>
                          <span className="cp-pathway-sequence-number">{index + 1}</span>
                          <span>{getDesignName(id)}</span>
                        </div>
                      ))}
                      {p.designIds.length > 3 && (
                        <small>+{p.designIds.length - 3} more credentials</small>
                      )}
                    </div>
                  ) : (
                    <p className="cp-pathway-no-content">No credential templates added.</p>
                  )}
                </div>

                <div className="cp-pathway-card-actions">
                  <button className="cp-pathway-manage" onClick={() => setManaged(p)}>Manage pathway</button>
                  <button className="cp-pathway-edit" onClick={() => openEdit(p)}>Edit</button>
                  <button className="cp-pathway-delete" onClick={() => {
                    if (window.confirm(`Delete pathway "${p.name}"?`)) onDelete(p.id);
                  }}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="cp-pathway-empty">
            <div className="cp-pathway-empty-icon">◇</div>
            <h3>{search ? "No matching pathways" : "No pathways yet"}</h3>
            <p>{search ? "Try a different search term." : "Create your first pathway to group credential templates into a learning journey."}</p>
            {search ? (
              <button className="cp-pathway-edit" onClick={() => setSearch("")}>Clear search</button>
            ) : (
              <button className="cp-pathway-manage" onClick={openNew}>＋ Create your first pathway</button>
            )}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-backdrop">
          <form className="modal-card" onSubmit={save}>
            <div className="modal-head">
              <div>
                <small className="eyebrow">PATHWAY BUILDER</small>
                <h2>{selected ? "Edit pathway" : "Create pathway"}</h2>
              </div>
              <button type="button" className="icon-btn" onClick={() => setShowForm(false)}>×</button>
            </div>

            <label>
              Pathway name
              <input required value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Full Stack Development" />
            </label>

            <label>
              Description
              <textarea rows="3" value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} placeholder="Describe this learning journey..." />
            </label>

            <label>Credential templates — select in pathway order</label>
            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, maxHeight: 220, overflowY: "auto" }}>
              {!designs.length && <p>No design templates available. Create one in Design Templates first.</p>}
              {designs.map(d => (
                <label key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
                  <input type="checkbox" checked={form.designIds.includes(d.id)} onChange={() => toggleDesign(d.id)} />
                  <span>{d.name}</span>
                </label>
              ))}
            </div>

            {form.designIds.length > 0 && (
              <div style={{ marginTop: 12 }}>
                <b>Selected sequence</b>
                {form.designIds.map((id, i) => (
                  <div key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 7 }}>
                    <span>{i + 1}.</span>
                    <span style={{ flex: 1 }}>{getDesignName(id)}</span>
                    <button type="button" className="btn-secondary" disabled={i === 0} onClick={() => setForm(p => {
                      const a = [...p.designIds];
                      [a[i - 1], a[i]] = [a[i], a[i - 1]];
                      return { ...p, designIds: a };
                    })}>↑</button>
                    <button type="button" className="btn-secondary" disabled={i === form.designIds.length - 1} onClick={() => setForm(p => {
                      const a = [...p.designIds];
                      [a[i + 1], a[i]] = [a[i], a[i + 1]];
                      return { ...p, designIds: a };
                    })}>↓</button>
                  </div>
                ))}
              </div>
            )}

            <div className="modal-actions">
              <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button className="btn-primary">{selected ? "Save changes" : "Create pathway"}</button>
            </div>
          </form>
        </div>
      )}

      {managed && (
        <div className="modal-backdrop">
          <div className="modal-card" style={{ maxWidth: 760, maxHeight: "85vh", overflowY: "auto" }}>
            <div className="modal-head">
              <div>
                <small className="eyebrow">PATHWAY MANAGEMENT</small>
                <h2>{managed.name}</h2>
                <p>{managed.description}</p>
              </div>
              <button className="icon-btn" onClick={() => setManaged(null)}>×</button>
            </div>

            <h3>1. Enroll recipients</h3>
            <p>Select recipients to add them to this pathway.</p>

            <div style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 12, maxHeight: 220, overflowY: "auto" }}>
              {recipients.length === 0 && <p>No recipients found. Add recipients first.</p>}
              {recipients.map(r => (
                <label key={r.id} style={{ display: "flex", alignItems: "center", gap: 12, padding: 10, borderBottom: "1px solid #edf0f5" }}>
                  <input
                    type="checkbox"
                    checked={(managed.enrolled || []).includes(r.id)}
                    onChange={() => toggleRecipient(managed, r.id)}
                  />
                  <span style={{ flex: 1 }}>
                    <b>{r.name || r.recipient || "Unnamed recipient"}</b>
                    <small style={{ display: "block", color: "#8290a7" }}>{r.email}</small>
                  </span>
                  <small>{(managed.enrolled || []).includes(r.id) ? "Enrolled" : "Not enrolled"}</small>
                </label>
              ))}
            </div>

            <h3 style={{ marginTop: 24 }}>2. Recipient progress</h3>
            {!enrolledRecipients.length && <p>No recipients enrolled yet.</p>}

            {enrolledRecipients.map(r => {
              const completed = managed.progress?.[r.id] || [];
              const total = managed.designIds?.length || 0;
              const percent = total ? Math.round(completed.length / total * 100) : 0;

              return (
                <div key={r.id} style={{ border: "1px solid #e2e8f0", borderRadius: 10, padding: 14, marginTop: 12 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                    <b>{r.name || r.recipient || "Unnamed recipient"}</b>
                    <b>{percent}% complete</b>
                  </div>
                  <p style={{ color: "#8290a7", fontSize: 12 }}>{r.email}</p>
                  <div style={{ height: 8, background: "#e9eef8", borderRadius: 10, overflow: "hidden", margin: "10px 0 16px" }}>
                    <div style={{ width: `${percent}%`, height: "100%", background: "#315eea" }} />
                  </div>

                  {(managed.designIds || []).map((id, index) => (
                    <label key={id} style={{ display: "flex", alignItems: "center", gap: 10, padding: 8 }}>
                      <input
                        type="checkbox"
                        checked={completed.includes(id)}
                        onChange={() => toggleProgress(managed, r.id, id)}
                      />
                      <span>{index + 1}. {getDesignName(id)}</span>
                      <small style={{ marginLeft: "auto", color: completed.includes(id) ? "#15945a" : "#8290a7" }}>
                        {completed.includes(id) ? "Completed" : "Pending"}
                      </small>
                    </label>
                  ))}

                  {total > 0 && percent === 100 && (
                    <p style={{ color: "#15945a", fontWeight: 600 }}>✓ Pathway completed</p>
                  )}
                </div>
              );
            })}

            <div className="modal-actions">
              <button className="btn-primary" onClick={() => setManaged(null)}>Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
