import React, { useState } from "react";
import {
  UserRound, Mail, Award, CalendarDays,
  CalendarClock, Hash, Building2, Plus,
  Search, Braces
} from "lucide-react";

const groups = [
  {
    title: "Recipient information",
    description: "Details about the person receiving the certificate",
    fields: [
      { name: "Recipient Name", variable: "{{recipient_name}}", icon: UserRound, color: "#315eea", bg: "#edf2ff" },
      { name: "Recipient Email", variable: "{{recipient_email}}", icon: Mail, color: "#16865b", bg: "#e9f8f0" }
    ]
  },
  {
    title: "Credential information",
    description: "Information about the issued credential",
    fields: [
      { name: "Credential Title", variable: "{{credential_title}}", icon: Award, color: "#8754c7", bg: "#f3edff" },
      { name: "Credential ID", variable: "{{credential_id}}", icon: Hash, color: "#c17a24", bg: "#fff5e8" }
    ]
  },
  {
    title: "Date information",
    description: "Important certificate dates",
    fields: [
      { name: "Issue Date", variable: "{{issue_date}}", icon: CalendarDays, color: "#1689a5", bg: "#e9f8fc" },
      { name: "Expiry Date", variable: "{{expiry_date}}", icon: CalendarClock, color: "#c05b68", bg: "#fff0f1" }
    ]
  },
  {
    title: "Issuer information",
    description: "Details about the issuing organisation",
    fields: [
      { name: "Issuer Name", variable: "{{issuer_name}}", icon: Building2, color: "#64748b", bg: "#eef1f5" }
    ]
  }
];

export default function AttributesPanel({ onAdd }) {
  const [search, setSearch] = useState("");

  const filtered = groups.map(group => ({
    ...group,
    fields: group.fields.filter(field =>
      `${field.name} ${field.variable}`.toLowerCase().includes(search.toLowerCase())
    )
  })).filter(group => group.fields.length > 0);

  return (
    <div className="designer-panel cp-attributes-panel">
      <div className="cp-panel-heading">
        <div>
          <span className="cp-panel-eyebrow">PERSONALISATION</span>
          <h3>Attributes</h3>
          <p>Add dynamic fields that automatically populate for each recipient.</p>
        </div>
        <span className="cp-panel-heading-icon">
          <Braces size={19}/>
        </span>
      </div>

      <div className="cp-attribute-info">
        <Braces size={15}/>
        <span>Choose a field to add it to your certificate canvas.</span>
      </div>

      <div className="cp-attribute-search">
        <Search size={15}/>
        <input
          type="search"
          placeholder="Search attributes..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>

      {filtered.length === 0 && (
        <div className="cp-attribute-empty">
          No matching attributes found.
        </div>
      )}

      {filtered.map(group => (
        <section className="cp-attribute-group" key={group.title}>
          <div className="cp-attribute-group-heading">
            <h4>{group.title}</h4>
            <span>{group.fields.length}</span>
          </div>
          <p>{group.description}</p>

          <div className="cp-attribute-list">
            {group.fields.map(field => {
              const Icon = field.icon;
              return (
                <button
                  type="button"
                  className="cp-attribute-card"
                  key={field.variable}
                  onClick={() => onAdd(field.variable)}
                  title={`Add ${field.name} to certificate`}
                >
                  <span
                    className="cp-attribute-icon"
                    style={{ background: field.bg, color: field.color }}
                  >
                    <Icon size={17}/>
                  </span>

                  <span className="cp-attribute-details">
                    <strong>{field.name}</strong>
                    <code>{field.variable}</code>
                  </span>

                  <span className="cp-attribute-add">
                    <Plus size={15}/>
                  </span>
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
