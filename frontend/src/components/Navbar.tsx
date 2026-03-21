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
      className="h-14 border-b flex items-center justify-between px-12"
      style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)' }}
    >
      <Link
        to="/"
        className="font-display italic text-xl"
        style={{ color: 'var(--color-ink)' }}
      >
        Lotus
      </Link>
      <div className="flex items-center gap-6">
        {user ? (
          <>
            <Link
              to="/topics"
              className="meta hover:text-ink transition-colors"
              style={{ fontSize: '11px' }}
            >
              Worlds
            </Link>
            <span className="meta" style={{ fontSize: '11px' }}>
              {user.profile.display_name}
            </span>
            <button
              onClick={handleLogout}
              className="font-body text-[13px] underline underline-offset-4"
              style={{ color: 'var(--color-ash)' }}
            >
              Sign out
            </button>
          </>
        ) : (
          <>
            <Link
              to="/auth/login"
              className="font-body text-[13px] underline underline-offset-4"
              style={{ color: 'var(--color-ink)' }}
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="font-body text-[13px] px-5 py-2 border transition-all duration-200 hover:bg-ink hover:text-white"
              style={{ borderColor: 'var(--color-ink)', color: 'var(--color-ink)' }}
            >
              Get Started
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
