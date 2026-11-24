import { useEffect, useState } from "react";
import { Plug, KeyRound, Webhook, Copy, Plus, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";

const services = [
  { id: "google", name: "Google Sheets", category: "Productivity", description: "Export recipient and credential data to spreadsheets.", icon: "📊" },
  { id: "zapier", name: "Zapier", category: "Automation", description: "Connect VistaraCertification to thousands of applications.", icon: "⚡" },
  { id: "slack", name: "Slack", category: "Communication", description: "Receive notifications about certificate activity.", icon: "💬" },
  { id: "sheets", name: "Webhooks", category: "Developer tools", description: "Send real-time event notifications to your server.", icon: "🔗" },
  { id: "resend", name: "Resend", category: "Email", description: "Prepare email delivery integration.", icon: "✉️" },
  { id: "make", name: "Make", category: "Automation", description: "Build automated workflows with VistaraCertification.", icon: "⚙️" }
];

const read = key => {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
};

export default function Integrations() {
  const [tab, setTab] = useState("services");
  const [connected, setConnected] = useState(read("cp-integrations"));
  const [webhooks, setWebhooks] = useState(read("cp-webhooks"));
  const [keys, setKeys] = useState(read("cp-api-keys"));
  const [showKeys, setShowKeys] = useState({});
  const [showWebhook, setShowWebhook] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookName, setWebhookName] = useState("");
  const [events, setEvents] = useState(["credential.issued"]);

  useEffect(() => localStorage.setItem("cp-integrations", JSON.stringify(connected)), [connected]);
  useEffect(() => localStorage.setItem("cp-webhooks", JSON.stringify(webhooks)), [webhooks]);
  useEffect(() => localStorage.setItem("cp-api-keys", JSON.stringify(keys)), [keys]);

  const toggleService = id => {
    setConnected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const createKey = () => {
    const key = {
      id: crypto.randomUUID(),
      name: "New API key",
      value: "cp_demo_" + crypto.randomUUID().replaceAll("-", ""),
      createdAt: new Date().toISOString()
    };
    setKeys(prev => [key, ...prev]);
  };

  const addWebhook = e => {
    e.preventDefault();
    if (!webhookName.trim() || !webhookUrl.trim()) return;
    try {
      const url = new URL(webhookUrl);
      if (!["http:", "https:"].includes(url.protocol)) throw new Error();
    } catch {
      alert("Enter a valid HTTP or HTTPS URL.");
      return;
    }
    setWebhooks(prev => [{
      id: crypto.randomUUID(),
      name: webhookName,
      url: webhookUrl,
      events,
      active: true,
      createdAt: new Date().toISOString()
    }, ...prev]);
    setWebhookName("");
    setWebhookUrl("");
    setEvents(["credential.issued"]);
    setShowWebhook(false);
  };

  const copy = value => {
    navigator.clipboard?.writeText(value);
    alert("Copied to clipboard.");
  };

  return (
    <div className="page-content integrations-page">
      <div className="integrations-heading">
        <div>
          <small className="eyebrow">DEVELOPER WORKSPACE</small>
          <h1>Integrations</h1>
          <p>Connect VistaraCertification with your tools, applications and workflows.</p>
        </div>
      </div>

      <div className="integration-stats">
        <div className="stat-card"><span>Available services</span><h2>{services.length}</h2></div>
        <div className="stat-card"><span>Configured services</span><h2>{connected.length}</h2></div>
        <div className="stat-card"><span>Webhooks</span><h2>{webhooks.length}</h2></div>
        <div className="stat-card"><span>API keys</span><h2>{keys.length}</h2></div>
      </div>

      <div className="integration-tabs">
        <button className={tab === "services" ? "active" : ""} onClick={() => setTab("services")}><Plug size={16}/> Services</button>
        <button className={tab === "api" ? "active" : ""} onClick={() => setTab("api")}><KeyRound size={16}/> API keys</button>
        <button className={tab === "webhooks" ? "active" : ""} onClick={() => setTab("webhooks")}><Webhook size={16}/> Webhooks</button>
        <button className={tab === "docs" ? "active" : ""} onClick={() => setTab("docs")}><ExternalLink size={16}/> API guide</button>
      </div>

      {tab === "services" && (
        <>
          <div className="integration-section-heading">
            <div><h2>Available integrations</h2><p>Choose the services you want to configure.</p></div>
          </div>
          <div className="integration-grid">
            {services.map(service => {
              const isConnected = connected.includes(service.id);
              return (
                <div className="integration-card" key={service.id}>
                  <div className="integration-card-top">
                    <div className="integration-service-icon">{service.icon}</div>
                    <span className={isConnected ? "integration-status connected" : "integration-status"}>{isConnected ? "Configured" : "Not connected"}</span>
                  </div>
                  <small>{service.category}</small>
                  <h3>{service.name}</h3>
                  <p>{service.description}</p>
                  <button className={isConnected ? "btn-secondary" : "btn-primary"} onClick={() => toggleService(service.id)}>
                    {isConnected ? "Remove configuration" : "Configure"}
                  </button>
                </div>
              );
            })}
          </div>
          <p className="integration-notice">Service configuration is currently a local demo. Live third-party authentication and API connections require backend setup.</p>
        </>
      )}

      {tab === "api" && (
        <div className="integration-panel">
          <div className="integration-section-heading">
            <div><h2>API key management</h2><p>Create and manage development keys for your workspace.</p></div>
            <button className="btn-primary" onClick={createKey}><Plus size={16}/> Generate demo key</button>
          </div>
          <div className="integration-warning">Demo keys only — these are locally generated placeholders, not active credentials. Do not use them in production.</div>
          {keys.length === 0 ? (
            <div className="empty-state"><KeyRound size={32}/><h2>No API keys yet</h2><p>Generate a demo key to explore the interface.</p></div>
          ) : keys.map(key => (
            <div className="api-key-card" key={key.id}>
              <div><strong>{key.name}</strong><small>Created {new Date(key.createdAt).toLocaleDateString()}</small>
                <code>{showKeys[key.id] ? key.value : "•".repeat(28)}</code>
              </div>
              <div className="form-card-actions">
                <button className="btn-secondary" onClick={() => setShowKeys(p => ({...p,[key.id]:!p[key.id]}))}>{showKeys[key.id] ? <EyeOff size={15}/> : <Eye size={15}/>}</button>
                <button className="btn-secondary" onClick={() => copy(key.value)}><Copy size={15}/></button>
                <button className="btn-danger" onClick={() => setKeys(p => p.filter(k => k.id !== key.id))}><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "webhooks" && (
        <div className="integration-panel">
          <div className="integration-section-heading">
            <div><h2>Webhook endpoints</h2><p>Configure URLs for future event notifications.</p></div>
            <button className="btn-primary" onClick={() => setShowWebhook(true)}><Plus size={16}/> Add webhook</button>
          </div>
          <div className="integration-warning">Webhook records are saved locally. Events are not sent to these URLs until backend delivery is implemented.</div>
          {showWebhook && (
            <form className="webhook-form" onSubmit={addWebhook}>
              <h3>New webhook endpoint</h3>
              <label>Webhook name<input value={webhookName} onChange={e => setWebhookName(e.target.value)} placeholder="My event notifications" required/></label>
              <label>Endpoint URL<input type="url" value={webhookUrl} onChange={e => setWebhookUrl(e.target.value)} placeholder="https://example.com/webhook" required/></label>
              <label>Events to subscribe</label>
              {["credential.issued","credential.revoked","recipient.created","form.submitted"].map(event => (
                <label className="webhook-event" key={event}><input type="checkbox" checked={events.includes(event)} onChange={e => setEvents(p => e.target.checked ? [...p,event] : p.filter(x => x !== event))}/>{event}</label>
              ))}
              <div className="form-card-actions"><button type="button" className="btn-secondary" onClick={() => setShowWebhook(false)}>Cancel</button><button className="btn-primary" type="submit" disabled={!events.length}>Save webhook</button></div>
            </form>
          )}
          {webhooks.length === 0 && !showWebhook ? <div className="empty-state"><Webhook size={32}/><h2>No webhooks configured</h2><p>Add an endpoint to prepare event notifications.</p></div> : webhooks.map(hook => (
            <div className="api-key-card" key={hook.id}>
              <div><strong>{hook.name}</strong><small>{hook.url}</small><p>{hook.events.join(", ")}</p></div>
              <div className="form-card-actions">
                <button className="btn-secondary" onClick={() => setWebhooks(p => p.map(h => h.id === hook.id ? {...h,active:!h.active} : h))}>{hook.active ? "Disable" : "Enable"}</button>
                <button className="btn-danger" onClick={() => setWebhooks(p => p.filter(h => h.id !== hook.id))}><Trash2 size={15}/></button>
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "docs" && (
        <div className="integration-panel api-guide">
          <h2>VistaraCertification API guide</h2>
          <p>Plan how your applications will communicate with VistaraCertification.</p>
          <h3>Authentication</h3>
          <p>Production API requests will use a server-side API key in the Authorization header.</p>
          <pre>Authorization: Bearer YOUR_API_KEY</pre>
          <h3>Planned endpoints</h3>
          {[
            ["GET","/api/credentials","List credentials"],
            ["POST","/api/credentials","Issue a credential"],
            ["GET","/api/recipients","List recipients"],
            ["POST","/api/webhooks","Register a webhook"],
            ["GET","/api/analytics","Retrieve workspace analytics"]
          ].map(([method,path,description]) => (
            <div className="api-endpoint" key={method+path}><code>{method}</code><strong>{path}</strong><span>{description}</span></div>
          ))}
          <div className="integration-warning">These are planned API routes for the future backend. They are documentation examples, not live endpoints.</div>
        </div>
      )}
    </div>
  );
}
