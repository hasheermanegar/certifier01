import { useState } from "react";
import { api } from "../services/api";
import "./AuthScreen.css";

export default function AuthScreen({ onLogin }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    try {
      const result = await api.login(form);

      if (!result.token || result.user?.role !== "admin") {
        api.logout();
        throw new Error("Administrator access required.");
      }

      onLogin(result.user);
    } catch (err) {
      setError(err.message || "Unable to sign in. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="auth-wordmark">VistaraCertifications</span>
        </div>
        <div className="auth-brand-copy">
          <span className="auth-eyebrow">DIGITAL CREDENTIAL PLATFORM</span>
          <h1>Recognize achievement.<br />Make it official.</h1>
          <p>Create, issue and manage professional digital certificates from one simple workspace.</p>
        </div>
        <div className="auth-brand-footer">Your achievements deserve to be recognized.</div>
      </section>

      <section className="auth-form-panel">
        <div className="auth-form-wrap">
          <div className="auth-mobile-brand">
            <span className="auth-wordmark">VistaraCertifications</span>
          </div>

          <span className="auth-eyebrow">ADMINISTRATOR ACCESS</span>
          <h2>Sign in to your workspace</h2>
          <p className="auth-subtitle">Enter your administrator credentials to continue.</p>

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}

          <form onSubmit={submit} className="auth-form">
            <label>
              Administrator email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={(event) => setForm({ ...form, email: event.target.value })}
                placeholder="admin@example.com"
                required
                autoComplete="username"
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={(event) => setForm({ ...form, password: event.target.value })}
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </label>

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Please wait..." : "Sign in"}
            </button>
          </form>

          <p className="auth-security">Restricted administrator access. Public registration is disabled.</p>
        </div>
      </section>
    </main>
  );
}
