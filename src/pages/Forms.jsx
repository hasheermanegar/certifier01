import React, { useState } from "react";

export default function Forms({ forms = [], onSave, onDelete }) {
  const [editing, setEditing] = useState(null);
  const [mode, setMode] = useState("editor");
  const [responses, setResponses] = useState({});
  const [selectedForm, setSelectedForm] = useState(null);
  const [search, setSearch] = useState("");
  const filteredForms = forms.filter(f =>
    `${f.title || ""} ${f.description || ""}`.toLowerCase().includes(search.toLowerCase())
  );

  const createForm = () => {
    setEditing({
      id: crypto.randomUUID(),
      title: "New Registration Form",
      description: "Complete the details below.",
      fields: [
        { id: crypto.randomUUID(), label: "Full Name", type: "text", required: true },
        { id: crypto.randomUUID(), label: "Email Address", type: "email", required: true }
      ],
      submissions: []
    });
    setMode("editor");
  };

  const updateField = (id, changes) => {
    setEditing(prev => ({
      ...prev,
      fields: prev.fields.map(f => f.id === id ? { ...f, ...changes } : f)
    }));
  };

  const addField = () => {
    setEditing(prev => ({
      ...prev,
      fields: [...prev.fields, {
        id: crypto.randomUUID(),
        label: "New Question",
        type: "text",
        required: false
      }]
    }));
  };

  const saveForm = () => {
    if (!editing.title.trim()) {
      alert("Please enter a form title.");
      return;
    }
    onSave?.({ ...editing, updatedAt: new Date().toISOString() });
    setEditing(null);
    setMode("editor");
  };

  const submitResponse = e => {
    e.preventDefault();
    const submission = {
      id: crypto.randomUUID(),
      submittedAt: new Date().toISOString(),
      answers: responses
    };
    const updated = {
      ...editing,
      submissions: [...(editing.submissions || []), submission]
    };
    onSave?.(updated);
    setEditing(updated);
    setResponses({});
    alert("Your response has been submitted successfully!");
  };

  const exportCSV = form => {
    const fields = form.fields || [];
    const rows = [
      ["Submission ID", "Submitted At", ...fields.map(f => f.label)],
      ...(form.submissions || []).map(s => [
        s.id,
        s.submittedAt,
        ...fields.map(f => s.answers?.[f.id] || "")
      ])
    ];
    const csv = rows.map(row =>
      row.map(value => `"${String(value ?? "").replace(/"/g, '""')}"`).join(",")
    ).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${form.title.replace(/[^a-z0-9]/gi, "_")}_submissions.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (mode === "submissions" && selectedForm) {
    const submissions = selectedForm.submissions || [];
    return (
      <div className="page-content forms-page">
        <div className="forms-heading">
          <div>
            <small className="eyebrow">RESPONSE MANAGEMENT</small>
            <h1>{selectedForm.title}</h1>
            <p>{submissions.length} submissions received</p>
          </div>
          <div className="form-card-actions">
            <button className="btn-secondary" onClick={() => exportCSV(selectedForm)}>Export CSV</button>
            <button className="btn-secondary" onClick={() => {setMode("editor");setSelectedForm(null);}}>Back</button>
          </div>
        </div>
        {submissions.length === 0 ? (
          <div className="empty-state"><h2>No submissions yet</h2><p>Responses will appear here when someone submits the form.</p></div>
        ) : (
          <div className="form-submissions">
            {submissions.map((submission, index) => (
              <div className="form-submission-card" key={submission.id}>
                <h3>Submission #{index + 1}</h3>
                <small>{new Date(submission.submittedAt).toLocaleString()}</small>
                {selectedForm.fields.map(field => (
                  <p key={field.id}><strong>{field.label}:</strong> {submission.answers?.[field.id] || "—"}</p>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div className="page-content forms-page">
        <div className="forms-heading">
          <div>
            <small className="eyebrow">FORM BUILDER</small>
            <h1>{mode === "preview" ? "Form Preview" : "Build your form"}</h1>
            <p>Create a registration form for your recipients.</p>
          </div>
          <button className="btn-secondary" onClick={() => {setEditing(null);setMode("editor");}}>Back</button>
        </div>

        {mode === "editor" ? (
          <div className="form-builder">
            <div className="form-builder-main">
              <label>Form title</label>
              <input value={editing.title} onChange={e => setEditing({...editing,title:e.target.value})} />

              <label>Description</label>
              <textarea value={editing.description} onChange={e => setEditing({...editing,description:e.target.value})} />

              <div className="form-fields-heading">
                <h3>Form questions</h3>
                <button className="btn-primary" onClick={addField}>+ Add field</button>
              </div>

              {editing.fields.map((field,index) => (
                <div className="form-field-editor" key={field.id}>
                  <div className="form-field-top">
                    <strong>Question {index+1}</strong>
                    <button className="btn-danger" onClick={() => setEditing(prev => ({...prev,fields:prev.fields.filter(f=>f.id!==field.id)}))}>Remove</button>
                  </div>
                  <label>Field label</label>
                  <input value={field.label} onChange={e=>updateField(field.id,{label:e.target.value})}/>
                  <label>Field type</label>
                  <select value={field.type} onChange={e=>updateField(field.id,{type:e.target.value})}>
                    <option value="text">Short text</option>
                    <option value="email">Email</option>
                    <option value="tel">Phone</option>
                    <option value="number">Number</option>
                    <option value="date">Date</option>
                    <option value="textarea">Long text</option>
                  </select>
                  <label className="required-toggle">
                    <input type="checkbox" checked={field.required} onChange={e=>updateField(field.id,{required:e.target.checked})}/>
                    Required field
                  </label>
                </div>
              ))}
              <div className="form-actions">
                <button className="btn-secondary" onClick={()=>setMode("preview")}>Preview form</button>
                <button className="btn-primary" onClick={saveForm}>Save form</button>
              </div>
            </div>
          </div>
        ) : (
          <div className="form-preview-card">
            <h2>{editing.title}</h2>
            <p>{editing.description}</p>
            <form onSubmit={submitResponse}>
              {editing.fields.map(field => (
                <label key={field.id}>
                  {field.label} {field.required && <span>*</span>}
                  {field.type === "textarea"
                    ? <textarea required={field.required} value={responses[field.id]||""} onChange={e=>setResponses(p=>({...p,[field.id]:e.target.value}))}/>
                    : <input type={field.type} required={field.required} value={responses[field.id]||""} onChange={e=>setResponses(p=>({...p,[field.id]:e.target.value}))}/>}
                </label>
              ))}
              <button className="btn-primary" type="submit">Submit response</button>
              <button className="btn-secondary" type="button" onClick={()=>setMode("editor")}>Back to editor</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="page-content forms-page">
      <div className="forms-heading">
        <div>
          <small className="eyebrow">REGISTRATION MANAGEMENT</small>
          <h1>Forms</h1>
          <p>Create and manage registration forms for events and certificates.</p>
        </div>
        <button className="btn-primary" onClick={createForm}>+ Create form</button>
      </div>

      <div className="forms-stats">
        <div className="stat-card"><span>Total forms</span><h2>{forms.length}</h2></div>
        <div className="stat-card"><span>Total questions</span><h2>{forms.reduce((n,f)=>n+(f.fields?.length||0),0)}</h2></div>
        <div className="stat-card"><span>Total submissions</span><h2>{forms.reduce((n,f)=>n+(f.submissions?.length||0),0)}</h2></div>
      </div>

      <section className="cp-forms-library">
        <div className="cp-forms-library-heading">
          <div>
            <h2>Your forms</h2>
            <p>Manage registration forms and review incoming submissions.</p>
          </div>
          <span className="cp-forms-count">
            {filteredForms.length} {filteredForms.length === 1 ? "form" : "forms"}
          </span>
        </div>

        <div className="cp-forms-search">
          <span>⌕</span>
          <input
            placeholder="Search forms by title or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          {search && <button onClick={() => setSearch("")}>×</button>}
        </div>

        {filteredForms.length === 0 ? (
          <div className="cp-forms-empty">
            <div className="cp-forms-empty-icon">▤</div>
            <h3>{search ? "No matching forms" : "No forms yet"}</h3>
            <p>{search ? "Try another search term." : "Create your first registration form to collect recipient information."}</p>
            {search ? (
              <button className="cp-forms-secondary" onClick={() => setSearch("")}>Clear search</button>
            ) : (
              <button className="btn-primary" onClick={createForm}>＋ Create your first form</button>
            )}
          </div>
        ) : (
          <div className="cp-forms-grid">
            {filteredForms.map(form => (
              <article className="cp-form-card" key={form.id}>
                <div className="cp-form-card-top">
                  <div className="cp-form-icon">▤</div>
                  <span className="cp-form-label">REGISTRATION FORM</span>
                </div>

                <h3>{form.title}</h3>
                <p className="cp-form-description">
                  {form.description || "No description added."}
                </p>

                <div className="cp-form-preview-box">
                  <div className="cp-form-preview-heading">
                    <span>FORM CONTENT</span>
                    <span>{form.fields?.length || 0} questions</span>
                  </div>
                  {(form.fields || []).slice(0, 3).map((field, index) => (
                    <div className="cp-form-question" key={field.id}>
                      <span className="cp-form-question-number">{index + 1}</span>
                      <span>{field.label || "Untitled question"}</span>
                      {field.required && <small>Required</small>}
                    </div>
                  ))}
                  {(form.fields || []).length > 3 && (
                    <small className="cp-form-more">+{form.fields.length - 3} more questions</small>
                  )}
                  {!(form.fields || []).length && (
                    <p className="cp-form-no-questions">No questions added yet.</p>
                  )}
                </div>

                <div className="cp-form-metrics">
                  <div>
                    <strong>{form.fields?.length || 0}</strong>
                    <span>Questions</span>
                  </div>
                  <div>
                    <strong>{form.submissions?.length || 0}</strong>
                    <span>Submissions</span>
                  </div>
                </div>

                <div className="cp-form-actions">
                  <button className="cp-form-preview-btn" onClick={() => {
                    setEditing(form); setMode("preview"); setResponses({});
                  }}>Preview</button>
                  <button className="cp-form-edit-btn" onClick={() => {
                    setEditing(form); setMode("editor");
                  }}>Edit</button>
                  <button className="cp-form-responses-btn" onClick={() => {
                    setSelectedForm(form); setMode("submissions");
                  }}>Responses</button>
                  <button className="cp-form-delete-btn" onClick={() => {
                    if (window.confirm(`Delete form "${form.title}"?`)) onDelete?.(form.id);
                  }}>Delete</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
