import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';

export default function LandingPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-paper)' }}>
      <Navbar />

      {/* Hero */}
      <section className="max-w-[1200px] mx-auto px-12 pt-24 pb-18">
        <div className="grid gap-12 items-end" style={{ gridTemplateColumns: '1fr 0.65fr' }}>
          <div>
            <h1 className="font-display font-normal leading-[1.05] tracking-tight mb-10" style={{ color: 'var(--color-ink)' }}>
              <span className="block animate-hero-1" style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}>
                Don't study English.
              </span>
              <span className="block italic animate-hero-2" style={{ fontSize: 'clamp(48px, 8vw, 96px)' }}>
                Inhabit it.
              </span>
            </h1>
            <div className="flex items-center gap-8 animate-hero-4">
              <Link
                to="/topics"
                className="font-body text-[13px] uppercase tracking-[0.1em] px-8 py-3.5 transition-opacity duration-200 hover:opacity-85"
                style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
              >
                Explore Worlds
              </Link>
              <Link
                to="/auth/register"
                className="font-body text-[13px] underline underline-offset-4 transition-colors duration-200"
                style={{ color: 'var(--color-ink)' }}
              >
                Build Your Own
              </Link>
            </div>
          </div>
          <div className="self-end animate-hero-3">
            <p className="font-body text-[15px] leading-relaxed" style={{ color: 'var(--color-ash)', maxWidth: '340px' }}>
              Enter immersive worlds with AI conversation partners. Practice real scenarios — job interviews, negotiations, daily life — and get instant coaching on how you actually sound.
            </p>
          </div>
        </div>
      </section>

      {/* Features strip */}
      <section className="max-w-[1200px] mx-auto px-12 py-16 border-t" style={{ borderColor: 'var(--color-fog)' }}>
        <div className="grid grid-cols-3 gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
          {[
            { label: 'Multi-Character Worlds', desc: 'Converse with up to 3 AI characters per scenario. Each has a distinct persona, bias, and communication style.' },
            { label: 'Live Performance HUD', desc: 'Real-time scores across Tone, Content, and First Voice — updating as you speak.' },
            { label: 'Coaching Debrief', desc: 'Post-session report with highlight reel, vocabulary log, and GPT-4o coaching narrative.' },
          ].map((f, i) => (
            <div key={i} className="p-8 animate-fade-up" style={{ backgroundColor: 'var(--color-surface)', animationDelay: `${i * 80}ms` }}>
              <span className="meta block mb-4" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>0{i + 1}</span>
              <h3 className="font-display text-[22px] font-semibold mb-3" style={{ color: 'var(--color-ink)' }}>{f.label}</h3>
              <p className="font-body text-[13px] leading-relaxed" style={{ color: 'var(--color-ash)' }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-[1200px] mx-auto px-12 py-24 text-center">
        <h2 className="font-display text-[56px] italic mb-6" style={{ color: 'var(--color-ink)' }}>Ready to begin?</h2>
        <div className="flex items-center justify-center gap-6">
          <Link
            to="/auth/register"
            className="font-body text-[13px] uppercase tracking-[0.1em] px-10 py-4 transition-opacity hover:opacity-85"
            style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
          >
            Get Started Free
          </Link>
          <Link
            to="/auth/login"
            className="font-body text-[13px] underline underline-offset-4"
            style={{ color: 'var(--color-ash)' }}
          >
            Sign in
          </Link>
        </div>
      </section>
    </div>
  );
}
