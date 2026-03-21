import { useRef } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

export function SocialProof() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);

  return (
    <section className="social-proof" ref={ref}>
      <div className="page-container">
        <div className="sp-grid">
          <div className="sp-quote-col">
            <blockquote className="sp-quote">
              "I froze on every video call.
              After 8 sessions, I stopped freezing."
            </blockquote>
            <cite className="sp-attribution">
              &mdash; Minh T., Software Engineer &middot; Ho Chi Minh City
            </cite>
            <div className="sp-dots">
              <span className="sp-dot active" />
              <span className="sp-dot" />
              <span className="sp-dot" />
            </div>
          </div>

          <div className="sp-stats-col">
            <div className="sp-stat">
              <span className="sp-stat-number">87%</span>
              <p className="sp-stat-desc">
                report improved confidence<br />after 5 sessions
              </p>
            </div>
            <div className="sp-divider" />
            <div className="sp-stat">
              <span className="sp-stat-number">12+</span>
              <p className="sp-stat-desc">
                scenario worlds across<br />workplace, travel, and social
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
