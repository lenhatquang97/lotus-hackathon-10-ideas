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
            <em>Ready to begin?</em>
          </h2>
          <p className="cta-body">
            Your first session is free. No credit card required.
          </p>
          <div className="cta-actions">
            <Link to="/auth/register" className="btn-primary">Get Started Free</Link>
            <Link to="/auth/login" className="btn-secondary">Sign in</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
