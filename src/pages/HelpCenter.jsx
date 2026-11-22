import { useMemo, useState } from "react";

const articles = [
  {
    category: "Getting Started",
    title: "Getting started with CertifyPro",
    description: "Learn the basic steps to set up your workspace and start issuing certificates.",
    content: [
      "Open Getting Started from the sidebar.",
      "Create your first certificate design.",
      "Add recipients individually or import a CSV file.",
      "Issue certificates and review them under All Credentials."
    ]
  },
  {
    category: "Certificate Design",
    title: "How to create a certificate design",
    description: "Create and customize professional certificate templates.",
    content: [
      "Open Certificate Designer.",
      "Choose your preferred page orientation and dimensions.",
      "Add text, recipient attributes, images and other elements.",
      "Arrange and resize elements using the editor.",
      "Save your design for reuse."
    ]
  },
  {
    category: "Issuing Certificates",
    title: "How to issue certificates individually",
    description: "Understand the individual certificate issuing workflow.",
    content: [
      "Open the credential issuing area.",
      "Select a saved certificate design.",
      "Enter the recipient details and certificate information.",
      "Review the details before issuing.",
      "Check the created credential in All Credentials."
    ]
  },
  {
    category: "Issuing Certificates",
    title: "How to issue certificates in bulk",
    description: "Import recipient information using CSV or Excel files.",
    content: [
      "Prepare a spreadsheet with recipient names and email addresses.",
      "Open Bulk Issuing.",
      "Upload your CSV or Excel file.",
      "Review valid rows and rows that need attention.",
      "Select a certificate design and default title.",
      "Start the bulk issuing process and review the report."
    ]
  },
  {
    category: "Credential Management",
    title: "Managing issued credentials",
    description: "Find, review, export and manage certificate records.",
    content: [
      "Open All Credentials to see your credential records.",
      "Use search and filters to find specific credentials.",
      "Review issuance dates and credential status.",
      "Use available actions to revoke or restore credentials.",
      "Export records when required."
    ]
  },
  {
    category: "Credential Management",
    title: "Understanding Credential Usage",
    description: "Monitor issuance activity and template usage.",
    content: [
      "Open Credential Usage from the sidebar.",
      "Review total, issued and revoked credential counts.",
      "Check monthly issuance activity.",
      "Review usage by certificate template.",
      "Export credential usage data as a CSV file."
    ]
  },
  {
    category: "Email",
    title: "Managing email templates",
    description: "Create and customize reusable email messages.",
    content: [
      "Open Email Templates.",
      "Create a new email template.",
      "Add a subject and message content.",
      "Preview and save your template."
    ]
  },
  {
    category: "Troubleshooting",
    title: "My CSV upload contains invalid rows",
    description: "Understand common spreadsheet import problems.",
    content: [
      "Check that the spreadsheet contains recipient names and email addresses.",
      "Make sure email addresses are formatted correctly.",
      "Remove empty rows and duplicate entries.",
      "Check that the file uses a supported CSV or Excel format.",
      "Upload the corrected file again."
    ]
  },
  {
    category: "Troubleshooting",
    title: "My changes are not appearing",
    description: "What to check when workspace changes are not visible.",
    content: [
      "Check whether you clicked Save.",
      "Refresh the browser.",
      "Confirm that you are using the same browser and workspace.",
      "Check whether the relevant page has saved its data."
    ]
  }
];

const categories = ["All articles", ...new Set(articles.map(a => a.category))];

export default function HelpCenter() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All articles");
  const [active, setActive] = useState(null);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return articles.filter(a =>
      (category === "All articles" || a.category === category) &&
      (!q || [a.title, a.description, a.category, ...a.content].join(" ").toLowerCase().includes(q))
    );
  }, [search, category]);

  const cardStyle = {
    padding: 20,
    border: "1px solid #e5eaf2",
    borderRadius: 12,
    background: "white",
    cursor: "pointer",
    textAlign: "left",
    color: "#1d2a42",
    width: "100%"
  };

  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <small className="eyebrow">SUPPORT AND RESOURCES</small>
          <h1>Help Center</h1>
          <p>Find guides and answers to help you use CertifyPro.</p>
        </div>
      </div>

      <div style={{
        background: "linear-gradient(135deg,#2F7D57,#1A4D2E)",
        borderRadius: 14,
        padding: "32px 24px",
        color: "white",
        marginBottom: 24
      }}>
        <h2 style={{ margin: "0 0 8px", fontSize: 23 }}>How can we help you?</h2>
        <p style={{ margin: "0 0 20px", opacity: 0.85, fontSize: 14 }}>
          Search our guides, tutorials and troubleshooting articles.
        </p>
        <input
          value={search}
          onChange={e => { setSearch(e.target.value); setActive(null); }}
          placeholder="Search certificates, templates, issuing..."
          aria-label="Search help articles"
          style={{
            width: "100%",
            maxWidth: 650,
            padding: 14,
            borderRadius: 9,
            border: "1px solid #dce3ed",
            fontSize: 14,
            boxSizing: "border-box",
            color: "#1d2a42",
            background: "white"
          }}
        />
      </div>

      {active ? (
        <div className="table-wrap" style={{ padding: 26 }}>
          <button
            onClick={() => setActive(null)}
            style={{ border: 0, background: "transparent", color: "#1A4D2E", cursor: "pointer", fontWeight: 600, padding: 0 }}
          >
            ← Back to articles
          </button>
          <small className="eyebrow" style={{ display: "block", marginTop: 24 }}>{active.category}</small>
          <h2 style={{ fontSize: 24 }}>{active.title}</h2>
          <p style={{ color: "#8290a7", fontSize: 14 }}>{active.description}</p>
          <ol style={{ paddingLeft: 22, lineHeight: 2.1, marginTop: 24 }}>
            {active.content.map((step, i) => <li key={i}>{step}</li>)}
          </ol>
        </div>
      ) : (
        <>
          <div style={{ display: "flex", gap: 9, flexWrap: "wrap", marginBottom: 22 }}>
            {categories.map(c => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                style={{
                  padding: "9px 14px",
                  borderRadius: 20,
                  border: category === c ? "1px solid #1A4D2E" : "1px solid #D1E6D9",
                  background: category === c ? "#1A4D2E" : "white",
                  color: category === c ? "white" : "#52617a",
                  cursor: "pointer",
                  fontSize: 13,
                  fontWeight: 600
                }}
              >{c}</button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))", gap: 16 }}>
            {filtered.map(article => (
              <button key={article.title} onClick={() => setActive(article)} style={cardStyle}>
                <small style={{ color: "#1A4D2E", fontWeight: 600 }}>{article.category}</small>
                <h3 style={{ fontSize: 16, margin: "12px 0 7px" }}>{article.title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: "#8290a7", margin: 0 }}>{article.description}</p>
                <div style={{ marginTop: 16, color: "#1A4D2E", fontSize: 13, fontWeight: 600 }}>Read guide →</div>
              </button>
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="table-wrap" style={{ padding: 35, textAlign: "center" }}>
              <h3>No articles found</h3>
              <p style={{ color: "#8290a7" }}>Try another search or choose a different category.</p>
              <button onClick={() => { setSearch(""); setCategory("All articles"); }} style={{ color: "#1A4D2E", background: "transparent", border: 0, cursor: "pointer" }}>Clear filters</button>
            </div>
          )}
        </>
      )}

      <div className="table-wrap" style={{ padding: 24, marginTop: 24 }}>
        <h2 style={{ fontSize: 18, marginTop: 0 }}>Still need help?</h2>
        <p style={{ color: "#8290a7", fontSize: 13 }}>
          Contact your CertifyPro workspace administrator for account-specific assistance.
        </p>
        <p style={{ fontSize: 13, marginBottom: 0 }}>
          <strong>Note:</strong> This Help Center currently contains built-in guides. Live support and ticket submission will be connected in a future backend update.
        </p>
      </div>
    </div>
  );
}
