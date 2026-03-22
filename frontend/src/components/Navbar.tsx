import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav
      className="h-[52px] flex items-center justify-between px-12 sticky top-0 z-[100]"
      style={{
        background: 'rgba(13, 11, 20, 0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <Link
        to="/"
        className="flex flex-col leading-tight"
        style={{ textDecoration: 'none' }}
      >
        <span
          className="font-display text-[17px] font-light tracking-[0.02em]"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Worldwise
        </span>
        <span
          className="font-body text-[9px] tracking-[0.04em]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Speak English. For real this time.
        </span>
      </Link>
      <div className="flex items-center gap-8">
        {user ? (
          <>
            <Link
              to="/topics"
              className="font-ui text-[9px] tracking-[0.14em] uppercase transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)', textDecoration: 'none' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              Worlds
            </Link>
            <span
              className="font-ui text-[9px] tracking-[0.14em] uppercase"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {user.profile.display_name}
            </span>
            <button
              onClick={handleLogout}
              className="font-body text-[13px] underline underline-offset-[3px] bg-transparent border-none cursor-pointer transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth/login"
              className="font-body text-[13px] underline underline-offset-[3px] transition-colors duration-200"
              style={{ color: 'var(--color-text-secondary)' }}
              onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-text-primary)')}
              onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="btn-primary"
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
