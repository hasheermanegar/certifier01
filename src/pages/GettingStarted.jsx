import { useState, useEffect } from "react";
import { CheckCircle2, Circle, ArrowRight, Sparkles, Award, Users, Mail, Plug, Palette } from "lucide-react";

const initialTasks = [
  { id: "design", title: "Create your first certificate design", description: "Design a professional certificate using the certificate designer.", icon: Palette, section: "Certificates", action: "Design Templates" },
  { id: "recipient", title: "Add your first recipient", description: "Add a recipient to your workspace.", icon: Users, section: "Recipients", action: "Recipients" },
  { id: "credential", title: "Issue your first credential", description: "Create and issue a digital certificate.", icon: Award, section: "Certificates", action: "All Credentials" },
  { id: "email", title: "Create an email template", description: "Prepare a reusable email for certificate delivery.", icon: Mail, section: "Communication", action: "Email Templates" },
  { id: "integration", title: "Explore integrations", description: "Configure the tools and services your workspace needs.", icon: Plug, section: "Developer tools", action: "Integrations" }
];

export default function GettingStarted({ setPage }) {
  const [completed, setCompleted] = useState(() => {
    try { return JSON.parse(localStorage.getItem("cp-onboarding")) || []; }
    catch { return []; }
  });

  useEffect(() => {
    localStorage.setItem("cp-onboarding", JSON.stringify(completed));
  }, [completed]);

  const toggle = id => {
    setCompleted(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const progress = Math.round((completed.length / initialTasks.length) * 100);

  return (
    <div className="page-content getting-started-page">
      <div className="getting-hero">
        <div className="getting-hero-content">
          <div className="getting-badge"><Sparkles size={15}/> WORKSPACE ONBOARDING</div>
          <h1>Welcome to VistaraCertification!</h1>
          <p>Let's get your digital credential workspace ready. Follow these steps to get started.</p>
        </div>
        <div className="getting-hero-icon"><Award size={65}/></div>
      </div>

      <div className="getting-progress-card">
        <div className="getting-progress-top">
          <div>
            <h2>Your setup progress</h2>
            <p>{completed.length} of {initialTasks.length} steps completed</p>
          </div>
          <strong>{progress}%</strong>
        </div>
        <div className="getting-progress-track">
          <div className="getting-progress-fill" style={{width: `${progress}%`}}/>
        </div>
        {progress === 100 && <p className="getting-complete-message">🎉 Congratulations! Your workspace setup checklist is complete.</p>}
      </div>

      <div className="getting-section-heading">
        <div><h2>Getting started checklist</h2><p>Complete each step at your own pace.</p></div>
      </div>

      <div className="getting-task-list">
        {initialTasks.map((task, index) => {
          const Icon = task.icon;
          const done = completed.includes(task.id);
          return (
            <div className={`getting-task-card ${done ? "task-completed" : ""}`} key={task.id}>
              <button className="getting-check" onClick={() => toggle(task.id)} aria-label={done ? "Mark incomplete" : "Mark complete"}>
                {done ? <CheckCircle2 size={23}/> : <Circle size={23}/>}
              </button>
              <div className="getting-task-icon"><Icon size={21}/></div>
              <div className="getting-task-info">
                <small>STEP {index + 1} · {task.section.toUpperCase()}</small>
                <h3>{task.title}</h3>
                <p>{task.description}</p>
              </div>
              <button className="getting-task-action" onClick={() => setPage?.(task.action)}>
                {done ? "Open" : "Get started"} <ArrowRight size={15}/>
              </button>
            </div>
          );
        })}
      </div>

      <div className="getting-help-card">
        <div><Sparkles size={22}/></div>
        <section><h3>Need help getting started?</h3><p>Explore the Help Center for guidance on managing your digital certificates.</p></section>
        <button className="btn-secondary" onClick={() => setPage?.("Help Center")}>Visit Help Center</button>
      </div>
    </div>
  );
}
