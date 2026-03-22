import { Link } from 'react-router-dom';
import { useRef } from 'react';
import { useRevealOnScroll } from '../../hooks/useRevealOnScroll';

export function FinalCTA() {
  const ref = useRef<HTMLElement>(null);
  useRevealOnScroll(ref);

  return (
    <section className="final-cta" ref={ref}>
      <div className="page-container">
        <div className="cta-block">
          <h2 className="cta-headline">
            <em>The classroom taught you the words. We'll teach you when to say them.</em>
          </h2>
          <p className="cta-body">
            First session free. No credit card. Pick a scenario and walk in.
          </p>
          <div className="cta-actions">
            <Link to="/auth/register" className="btn-primary">Start for Free</Link>
            <Link to="/auth/login" className="btn-secondary">Sign in</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
