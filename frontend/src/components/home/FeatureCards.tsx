import { useRef } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

function MultiCharacterCard() {
  const agents = [
    { name: 'Emma \u00b7 Anchor', desc: 'Drives the main thread' },
    { name: 'Oliver \u00b7 Challenger', desc: 'Pushes back on your position' },
  ];

  return (
    <div className="feature-card">
      <div className="fc-visual">
        <div className="agent-roster">
          {agents.map((a) => (
            <div key={a.name} className="agent-roster-row">
              <div className="agent-roster-avatar" />
              <div className="agent-roster-info">
                <span className="agent-roster-name">{a.name}</span>
                <span className="agent-roster-desc">{a.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="fc-body">
        <span className="fc-number">01</span>
        <h3 className="fc-title">Multi-Character Worlds</h3>
        <p className="fc-desc">
          Up to 3 AI characters per scenario. Each has a distinct
          persona, bias, and communication style.
        </p>
      </div>
    </div>
  );
}

function LiveHUDCard() {
  const dims = [
    { label: 'Tone', fill: 0.8 },
    { label: 'Content', fill: 0.62 },
    { label: 'Voice', fill: 0.91 },
  ];

  return (
    <div className="feature-card">
      <div className="fc-visual">
        <div className="hud-preview">
          {dims.map((d) => (
            <div key={d.label} className="hud-row">
              <span className="hud-label">{d.label}</span>
              <div className="hud-track">
                <div className="hud-fill" style={{ width: `${d.fill * 100}%` }} />
              </div>
              <span className="hud-pct">{Math.round(d.fill * 100)}</span>
            </div>
          ))}
        </div>
      </div>
      <div className="fc-body">
        <span className="fc-number">02</span>
        <h3 className="fc-title">Live Performance HUD</h3>
        <p className="fc-desc">
          Real-time scores across Tone, Content, and First Voice —
          updating as you speak.
        </p>
      </div>
    </div>
  );
}

function CoachingDebriefCard() {
  return (
    <div className="feature-card">
      <div className="fc-visual">
        <div className="debrief-preview">
          <p className="debrief-quote">
            "Your tone was strong, but you hesitated before naming the number."
          </p>
          <div className="debrief-vocab">
            <span className="debrief-pill">merit cycle</span>
            <span className="debrief-pill">salary band</span>
            <span className="debrief-pill">comp review</span>
          </div>
        </div>
      </div>
      <div className="fc-body">
        <span className="fc-number">03</span>
        <h3 className="fc-title">Coaching Debrief</h3>
        <p className="fc-desc">
          Post-session report with highlight reel, vocabulary log,
          and GPT-4o coaching narrative.
        </p>
      </div>
    </div>
  );
}

export function FeatureCards() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);

  return (
    <section className="feature-section" ref={ref}>
      <div className="page-container">
        <span className="section-eyebrow">How it works</span>
        <div className="feature-grid">
          <MultiCharacterCard />
          <LiveHUDCard />
          <CoachingDebriefCard />
        </div>
      </div>
    </section>
  );
}
