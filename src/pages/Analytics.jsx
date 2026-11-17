import React, { useMemo } from "react";

export default function Analytics({ credentials = [], recipients = [], pathways = [], designs = [] }) {
  const stats = useMemo(() => {
    const status = c => String(c.status || "Issued").toLowerCase();
    const issued = credentials.filter(c => status(c) === "issued").length;
    const revoked = credentials.filter(c => status(c) === "revoked").length;
    const expired = credentials.filter(c =>
      status(c) === "expired" ||
      ((c.expiresAt || c.expiry) && new Date(c.expiresAt || c.expiry) < new Date())
    ).length;

    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date();
      d.setDate(1);
      d.setMonth(d.getMonth() - (5 - i));
      return {
        label: d.toLocaleDateString("en", { month: "short" }),
        key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
        count: 0
      };
    });

    credentials.forEach(c => {
      if (!c.issuedAt) return;
      const key = c.issuedAt.slice(0, 7);
      const month = months.find(m => m.key === key);
      if (month) month.count++;
    });

    const enrolled = pathways.reduce((n, p) => n + (p.enrolled?.length || 0), 0);
    const completed = pathways.reduce((n, p) => {
      return n + (p.enrolled || []).filter(id =>
        (p.progress?.[id] || []).length >= (p.designIds?.length || 0) &&
        (p.designIds?.length || 0) > 0
      ).length;
    }, 0);

    return { issued, revoked, expired, months, enrolled, completed };
  }, [credentials, pathways]);

  const max = Math.max(1, ...stats.months.map(m => m.count));

  const cards = [
    ["Total credentials", credentials.length, "All credential records"],
    ["Issued", stats.issued, "Currently issued"],
    ["Revoked", stats.revoked, "Credentials revoked"],
    ["Expired", stats.expired, "Expired credentials"],
    ["Recipients", recipients.length, "Registered recipients"],
    ["Design templates", designs.length, "Available designs"]
  ];

  const overview = [
    ["Credential templates", designs.length],
    ["Registered recipients", recipients.length],
    ["Created pathways", pathways.length],
    ["Total credentials", credentials.length]
  ];

  return (
    <div className="page-content cp-analytics-page">
      <div className="cp-analytics-heading">
        <div>
          <span className="cp-analytics-eyebrow">WORKSPACE PERFORMANCE</span>
          <h1>Analytics</h1>
          <p>Monitor credential activity and recipient engagement.</p>
        </div>
      </div>

      <section className="cp-analytics-section">
        <div className="cp-analytics-section-heading">
          <div>
            <h2>Performance overview</h2>
            <p>A snapshot of your workspace activity.</p>
          </div>
        </div>

        <div className="cp-analytics-kpis">
          {cards.map(([label, value, note]) => (
            <article className="cp-analytics-kpi" key={label}>
              <span>{label}</span>
              <strong>{value}</strong>
              <small>{note}</small>
            </article>
          ))}
        </div>
      </section>

      <section className="cp-analytics-chart-card">
        <div className="cp-analytics-card-heading">
          <div>
            <h2>Credential issuing activity</h2>
            <p>Credentials created over the last six months.</p>
          </div>
          <span className="cp-analytics-period">LAST 6 MONTHS</span>
        </div>

        <div className="cp-analytics-chart">
          {stats.months.map(m => (
            <div className="cp-analytics-bar-column" key={m.key}>
              <strong>{m.count}</strong>
              <div className="cp-analytics-bar-area">
                <div
                  className={`cp-analytics-bar ${m.count ? "has-data" : ""}`}
                  style={{ height: `${Math.max(4, m.count / max * 145)}px` }}
                  title={`${m.label}: ${m.count} credentials`}
                />
              </div>
              <span>{m.label}</span>
            </div>
          ))}
        </div>
        <div className="cp-analytics-chart-footer">
          <span>Monthly credential issuance</span>
          <span>{credentials.length} total credentials</span>
        </div>
      </section>

      <div className="cp-analytics-bottom-grid">
        <section className="cp-analytics-info-card">
          <div className="cp-analytics-card-heading">
            <div>
              <h2>Pathway engagement</h2>
              <p>Recipient participation and completion.</p>
            </div>
          </div>

          <div className="cp-analytics-engagement">
            <div className="cp-analytics-engagement-item">
              <span>Total enrolments</span>
              <strong>{stats.enrolled}</strong>
            </div>
            <div className="cp-analytics-engagement-item">
              <span>Completed pathways</span>
              <strong>{stats.completed}</strong>
            </div>
          </div>

          <div className="cp-analytics-engagement-footer">
            <span>Completion progress</span>
            <strong>{stats.enrolled ? Math.round(stats.completed / stats.enrolled * 100) : 0}%</strong>
          </div>
          <div className="cp-analytics-progress-track">
            <div
              className="cp-analytics-progress-fill"
              style={{ width: `${stats.enrolled ? Math.min(100, stats.completed / stats.enrolled * 100) : 0}%` }}
            />
          </div>
        </section>

        <section className="cp-analytics-info-card">
          <div className="cp-analytics-card-heading">
            <div>
              <h2>Workspace overview</h2>
              <p>Resources available in your workspace.</p>
            </div>
          </div>

          <div className="cp-analytics-overview-list">
            {overview.map(([label, value]) => (
              <div className="cp-analytics-overview-row" key={label}>
                <span>{label}</span>
                <strong>{value}</strong>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
