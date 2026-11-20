import { useState } from "react";

const defaults = {
  organization: "My Organization",
  email: "",
  website: "",
  description: "",
  brandColor: "#315eea",
  certificatePrefix: "CP",
  defaultValidity: "No expiry",
  timezone: "Asia/Kolkata",
  emailNotifications: true,
  issuanceNotifications: true,
  securityNotifications: true
};

function Field({ label, name, placeholder, type = "text", settings, update, fieldStyle, labelStyle }) {
  return (
    <div>
      <label style={labelStyle} htmlFor={name}>{label}</label>
      <input
        id={name}
        type={type}
        value={settings[name]}
        placeholder={placeholder || ""}
        onChange={e => update(name, e.target.value)}
        style={fieldStyle}
      />
    </div>
  );
}

function Toggle({ label, description, name, settings, update }) {
  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      gap: 15,
      padding: "15px 0",
      borderBottom: "1px solid #edf0f5"
    }}>
      <div>
        <strong style={{ fontSize: 14 }}>{label}</strong>
        <p style={{ margin: "5px 0 0", fontSize: 12, color: "#8290a7" }}>{description}</p>
      </div>
      <input
        type="checkbox"
        checked={settings[name]}
        onChange={e => update(name, e.target.checked)}
        style={{ width: 19, height: 19, accentColor: "#315eea" }}
      />
    </div>
  );
}

export default function Settings() {
  const [settings, setSettings] = useState(() => {
    try {
      return { ...defaults, ...JSON.parse(localStorage.getItem("cp-settings") || "{}") };
    } catch {
      return defaults;
    }
  });
  const [saved, setSaved] = useState(false);

  function update(key, value) {
    setSettings(previous => ({ ...previous, [key]: value }));
    setSaved(false);
  }

  function saveSettings(event) {
    event.preventDefault();
    localStorage.setItem("cp-settings", JSON.stringify(settings));
    setSaved(true);
  }

  function resetSettings() {
    if (!window.confirm("Reset all workspace settings to their defaults?")) return;
    setSettings(defaults);
    localStorage.setItem("cp-settings", JSON.stringify(defaults));
    setSaved(true);
  }

  const fieldStyle = {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #dce3ed",
    borderRadius: 8,
    background: "var(--input-bg, white)",
    color: "inherit",
    fontSize: 14,
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 7
  };

  const sectionStyle = {
    padding: 24,
    marginTop: 20
  };


  return (
    <div className="page-content">
      <div className="page-heading">
        <div>
          <small className="eyebrow">WORKSPACE CONFIGURATION</small>
          <h1>Settings</h1>
          <p>Manage your organization, branding and certificate preferences.</p>
        </div>
      </div>

      <form onSubmit={saveSettings}>
        <div className="table-wrap" style={sectionStyle}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Organization profile</h2>
          <p style={{ color: "#8290a7", fontSize: 13 }}>Manage your organization's basic information.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 20, marginTop: 22 }}>
            <Field label="Organization name" name="organization" placeholder="Your organization name" settings={settings} update={update} fieldStyle={fieldStyle} labelStyle={labelStyle} />
            <Field label="Contact email" name="email" placeholder="admin@example.com" type="email" settings={settings} update={update} fieldStyle={fieldStyle} labelStyle={labelStyle} />
            <Field label="Website" name="website" placeholder="https://example.com" settings={settings} update={update} fieldStyle={fieldStyle} labelStyle={labelStyle} />
            <Field label="Timezone" name="timezone" placeholder="Asia/Kolkata" settings={settings} update={update} fieldStyle={fieldStyle} labelStyle={labelStyle} />
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={labelStyle} htmlFor="description">Organization description</label>
            <textarea
              id="description"
              value={settings.description}
              onChange={e => update("description", e.target.value)}
              placeholder="Tell us about your organization..."
              rows={3}
              style={{ ...fieldStyle, resize: "vertical" }}
            />
          </div>
        </div>

        <div className="table-wrap" style={sectionStyle}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Workspace branding</h2>
          <p style={{ color: "#8290a7", fontSize: 13 }}>Choose the primary brand colour for your workspace.</p>
          <div style={{ display: "flex", alignItems: "center", gap: 16, marginTop: 20, flexWrap: "wrap" }}>
            <input
              type="color"
              value={settings.brandColor}
              onChange={e => update("brandColor", e.target.value)}
              aria-label="Brand colour"
              style={{ width: 55, height: 45, border: 0, background: "none", cursor: "pointer" }}
            />
            <div>
              <strong style={{ fontSize: 14 }}>Primary brand colour</strong>
              <p style={{ color: "#8290a7", fontSize: 12, margin: "5px 0" }}>{settings.brandColor}</p>
            </div>
            <div style={{ background: settings.brandColor, color: "white", padding: "10px 18px", borderRadius: 8, fontSize: 13, marginLeft: "auto" }}>
              Brand preview
            </div>
          </div>
        </div>

        <div className="table-wrap" style={sectionStyle}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Certificate preferences</h2>
          <p style={{ color: "#8290a7", fontSize: 13 }}>Set defaults for your organization's certificates.</p>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(230px,1fr))", gap: 20, marginTop: 22 }}>
            <div>
              <label style={labelStyle} htmlFor="certificatePrefix">Certificate ID prefix</label>
              <input id="certificatePrefix" value={settings.certificatePrefix} onChange={e => update("certificatePrefix", e.target.value)} style={fieldStyle} />
            </div>
            <div>
              <label style={labelStyle} htmlFor="defaultValidity">Default certificate validity</label>
              <select id="defaultValidity" value={settings.defaultValidity} onChange={e => update("defaultValidity", e.target.value)} style={fieldStyle}>
                <option>No expiry</option>
                <option>6 months</option>
                <option>1 year</option>
                <option>2 years</option>
                <option>5 years</option>
              </select>
            </div>
          </div>
          <p style={{ fontSize: 12, color: "#8290a7", marginTop: 14 }}>
            These are workspace preferences. They will be applied to certificate generation when that feature is connected.
          </p>
        </div>

        <div className="table-wrap" style={sectionStyle}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Notifications</h2>
          <p style={{ color: "#8290a7", fontSize: 13 }}>Choose which workspace notifications you want to receive.</p>
          <Toggle name="emailNotifications" label="Email notifications" description="General workspace email notifications." settings={settings} update={update} />
          <Toggle name="issuanceNotifications" label="Certificate issuance" description="Notifications when certificates are issued." settings={settings} update={update} />
          <Toggle name="securityNotifications" label="Security notifications" description="Important account and security alerts." settings={settings} update={update} />
        </div>

        <div className="table-wrap" style={sectionStyle}>
          <h2 style={{ fontSize: 18, marginTop: 0 }}>Account and data</h2>
          <p style={{ color: "#8290a7", fontSize: 13 }}>Your current settings are saved in this browser.</p>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 15, flexWrap: "wrap" }}>
            <div>
              <strong style={{ fontSize: 14 }}>Reset workspace preferences</strong>
              <p style={{ fontSize: 12, color: "#8290a7" }}>Restore the settings on this page to their defaults.</p>
            </div>
            <button type="button" onClick={resetSettings} style={{ padding: "10px 15px", border: "1px solid #e0e5ed", borderRadius: 8, background: "transparent", cursor: "pointer", color: "inherit" }}>
              Reset preferences
            </button>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", alignItems: "center", gap: 14, marginTop: 20, flexWrap: "wrap" }}>
          {saved && <span style={{ color: "#16804d", fontSize: 13 }}>Settings saved successfully.</span>}
          <button
            type="submit"
            style={{
              background: "#315eea",
              color: "#ffffff",
              border: "none",
              borderRadius: 9,
              padding: "12px 24px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 3px 8px rgba(49,94,234,0.2)",
              transition: "all 0.2s ease"
            }}
          >
            Save settings
          </button>
        </div>
      </form>
    </div>
  );
}
