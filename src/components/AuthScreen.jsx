import { useState } from "react";
import { api } from "../services/api";
import "./AuthScreen.css";

export default function AuthScreen({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    organization: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const update = (event) => {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  const submit = async (event) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    setNotice("");

    try {
      if (mode === "register") {
        await api.register(form);
        setMode("login");
        setForm((previous) => ({ ...previous, password: "" }));
        setNotice("Your account has been created. Please log in.");
      } else {
        const result = await api.login({
          email: form.email,
          password: form.password,
        });
        if (!result.token) throw new Error("The server did not return a login token.");
        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-screen">
      <section className="auth-brand-panel">
        <div className="auth-brand">
          <span className="auth-brand-mark">C</span>
          <span>CertifyPro</span>
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
            <span className="auth-brand-mark">C</span>
            <strong>CertifyPro</strong>
          </div>

          <span className="auth-eyebrow">{mode === "login" ? "WELCOME BACK" : "GET STARTED"}</span>
          <h2>{mode === "login" ? "Sign in to your workspace" : "Create your account"}</h2>
          <p className="auth-subtitle">
            {mode === "login"
              ? "Enter your details to continue."
              : "Set up your workspace to start creating certificates."}
          </p>

          {error && <div className="auth-message auth-error" role="alert">{error}</div>}
          {notice && <div className="auth-message auth-success" role="status">{notice}</div>}

          <form onSubmit={submit} className="auth-form">
            {mode === "register" && (
              <>
                <label>
                  Full name
                  <input name="name" value={form.name} onChange={update} placeholder="Your full name" required maxLength={100} autoComplete="name" />
                </label>
                <label>
                  Organization <span className="auth-optional">(optional)</span>
                  <input name="organization" value={form.organization} onChange={update} placeholder="Your organization" autoComplete="organization" />
                </label>
              </>
            )}

            <label>
              Email address
              <input name="email" type="email" value={form.email} onChange={update} placeholder="you@example.com" required autoComplete="email" />
            </label>

            <label>
              Password
              <input name="password" type="password" value={form.password} onChange={update} placeholder="At least 8 characters" required minLength={8} maxLength={128} autoComplete={mode === "login" ? "current-password" : "new-password"} />
            </label>

            <button className="auth-submit" type="submit" disabled={busy}>
              {busy ? "Please wait..." : mode === "login" ? "Sign in" : "Create account"}
            </button>
          </form>

          <div className="auth-switch">
            {mode === "login" ? (
              <>Don't have an account? <button type="button" onClick={() => { setMode("register"); setError(""); setNotice(""); }}>Create account</button></>
            ) : (
              <>Already have an account? <button type="button" onClick={() => { setMode("login"); setError(""); setNotice(""); }}>Sign in</button></>
            )}
          </div>

          <p className="auth-security">Secure access to your certificate workspace.</p>
        </div>
      </section>
    </main>
  );
}
