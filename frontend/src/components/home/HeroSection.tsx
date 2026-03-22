import { Link } from 'react-router-dom';

function OfficeSceneMini() {
  return (
    <svg
      width="100%"
      height="120"
      viewBox="0 0 440 120"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      <rect x="0" y="0" width="440" height="120" fill="#1A1628" />
      <rect x="270" y="8" width="148" height="82" fill="#201C30" stroke="#3A3448" strokeWidth="0.5" />
      <line x1="344" y1="8" x2="344" y2="90" stroke="#3A3448" strokeWidth="0.5" />
      <line x1="270" y1="49" x2="418" y2="49" stroke="#3A3448" strokeWidth="0.5" />
      <rect x="266" y="88" width="156" height="5" fill="#3A3448" />
      <rect x="0" y="86" width="440" height="34" fill="#201C30" />
      <line x1="0" y1="86" x2="440" y2="86" stroke="#3A3448" strokeWidth="0.5" />
      <rect x="100" y="68" width="240" height="24" fill="#403858" />
      <rect x="100" y="68" width="240" height="5" fill="#3A3448" />
      <rect x="100" y="86" width="240" height="7" fill="#504868" />
      <rect x="105" y="93" width="7" height="20" fill="#504A60" />
      <rect x="328" y="93" width="7" height="20" fill="#504A60" />
      <rect x="190" y="58" width="36" height="24" fill="#1A1628" stroke="#3A3448" strokeWidth="0.5" />
      <line x1="196" y1="64" x2="220" y2="64" stroke="#2A2438" strokeWidth="0.5" />
      <line x1="196" y1="69" x2="220" y2="69" stroke="#2A2438" strokeWidth="0.5" />
      <line x1="196" y1="74" x2="214" y2="74" stroke="#2A2438" strokeWidth="0.5" />
      <circle cx="278" cy="54" r="14" fill="#504A60" />
      <rect x="264" y="68" width="28" height="22" rx="2" fill="#504A60" />
      <circle cx="278" cy="54" r="19" fill="none" stroke="#605A70" strokeWidth="0.75" strokeDasharray="2 2" />
      <circle cx="162" cy="58" r="12" fill="#605A70" />
      <rect x="150" y="70" width="24" height="20" rx="2" fill="#605A70" />
    </svg>
  );
}

function HeroWorldCard() {
  return (
    <div className="hero-world-card">
      <div className="hwc-stripe" />
      <div className="hwc-scene">
        <OfficeSceneMini />
        <div className="hwc-scene-label">
          <span>Salary Negotiation</span>
          <span>Intermediate</span>
        </div>
      </div>
      <div className="hwc-transcript">
        <div className="hwc-line agent">
          <span className="hwc-speaker">Emma Caldwell &middot; Anchor</span>
          <p className="hwc-text">
            Thanks for making time. Let's talk about your compensation.
          </p>
        </div>
        <div className="hwc-line user">
          <span className="hwc-speaker">You</span>
          <p className="hwc-text">
            I was thinking around fifteen percent.
          </p>
        </div>
        <div className="hwc-your-turn">
          <span className="hwc-your-turn-label">Your turn</span>
          <span className="hwc-cursor" aria-hidden="true" />
        </div>
      </div>
    </div>
  );
}

export function HeroSection() {
  return (
    <section className="hero-section">
      <div className="page-container">
        <div className="hero-grid">
          <div className="hero-left">
            <div className="headline-block">
              <h1 className="hero-headline">
                You studied English for 12 years.<br />
                <em>You still freeze.</em>
              </h1>
              <p className="hero-body">
                Vietnam's schools taught you grammar. Vocabulary. Test technique.
                Nobody taught you how to think in English under pressure.
                Worldwise puts you in the room where that actually gets fixed.
              </p>
            </div>
            <div className="hero-ctas">
              <Link to="/topics" className="btn-primary">Enter a World</Link>
              <Link to="/topics" className="btn-secondary">Try a scenario free</Link>
            </div>
          </div>
          <div className="hero-right">
            <HeroWorldCard />
          </div>
        </div>
      </div>
    </section>
  );
}
