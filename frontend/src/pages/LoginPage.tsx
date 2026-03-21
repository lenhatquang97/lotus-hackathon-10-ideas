import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.login({ email, password });
      const { user, access_token } = res.data;
      setAuth(user, access_token);
      navigate('/topics');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--color-bg)' }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link to="/" className="font-display italic text-2xl" style={{ color: 'var(--color-text-primary)' }}>Lotus</Link>
          <p className="meta mt-3" style={{ fontSize: '11px' }}>Sign in to your account</p>
        </div>

        <div className="border p-8" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border font-body text-[14px] outline-none transition-colors"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full px-3 py-2.5 border font-body text-[14px] outline-none transition-colors"
                style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                placeholder="••••••••"
                required
              />
            </div>
            {error && <p className="font-body text-[13px]" style={{ color: '#c44' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-accent)', color: '#0D0B14' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-body text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
          Don't have an account?{' '}
          <Link to="/auth/register" className="underline underline-offset-4" style={{ color: 'var(--color-accent)' }}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}
