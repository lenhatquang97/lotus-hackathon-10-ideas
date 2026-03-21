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
      <rect x="0" y="0" width="440" height="120" fill="#F0EFED" />
      <rect x="270" y="8" width="148" height="82" fill="#E4E3E0" stroke="#D8D8D8" strokeWidth="0.5" />
      <line x1="344" y1="8" x2="344" y2="90" stroke="#D8D8D8" strokeWidth="0.5" />
      <line x1="270" y1="49" x2="418" y2="49" stroke="#D8D8D8" strokeWidth="0.5" />
      <rect x="266" y="88" width="156" height="5" fill="#D0CFCC" />
      <rect x="0" y="86" width="440" height="34" fill="#E8E7E3" />
      <line x1="0" y1="86" x2="440" y2="86" stroke="#D8D8D8" strokeWidth="0.5" />
      <rect x="100" y="68" width="240" height="24" fill="#C8C8C8" />
      <rect x="100" y="68" width="240" height="5" fill="#D8D8D8" />
      <rect x="100" y="86" width="240" height="7" fill="#B8B8B8" />
      <rect x="105" y="93" width="7" height="20" fill="#B0B0B0" />
      <rect x="328" y="93" width="7" height="20" fill="#B0B0B0" />
      <rect x="190" y="58" width="36" height="24" fill="#F7F6F4" stroke="#D8D8D8" strokeWidth="0.5" />
      <line x1="196" y1="64" x2="220" y2="64" stroke="#E0E0E0" strokeWidth="0.5" />
      <line x1="196" y1="69" x2="220" y2="69" stroke="#E0E0E0" strokeWidth="0.5" />
      <line x1="196" y1="74" x2="214" y2="74" stroke="#E0E0E0" strokeWidth="0.5" />
      <circle cx="278" cy="54" r="14" fill="#B0B0B0" />
      <rect x="264" y="68" width="28" height="22" rx="2" fill="#B0B0B0" />
      <circle cx="278" cy="54" r="19" fill="none" stroke="#9A9A9A" strokeWidth="0.75" strokeDasharray="2 2" />
      <circle cx="162" cy="58" r="12" fill="#9A9A9A" />
      <rect x="150" y="70" width="24" height="20" rx="2" fill="#9A9A9A" />
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
                Don't study<br />
                English.<br />
                <em>Inhabit it.</em>
              </h1>
              <p className="hero-body">
                Practice real scenarios with AI characters who push back.
                Get live coaching on tone, vocabulary, and confidence.
              </p>
            </div>
            <div className="hero-ctas">
              <Link to="/topics" className="btn-primary">Explore Worlds</Link>
              <Link to="/studio" className="btn-secondary">Build Your Own</Link>
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
