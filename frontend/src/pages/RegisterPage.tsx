import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../stores/authStore';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'learner' | 'creator'>('learner');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authApi.register({ email, password, display_name: displayName, role });
      const { user, access_token } = res.data;
      setAuth(user, access_token);
      navigate('/topics');
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setError(axiosErr.response?.data?.detail || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6" style={{ backgroundColor: 'var(--color-paper)' }}>
      <div className="w-full max-w-[400px]">
        <div className="text-center mb-10">
          <Link to="/" className="font-display italic text-2xl" style={{ color: 'var(--color-ink)' }}>Lotus</Link>
          <p className="meta mt-3" style={{ fontSize: '11px' }}>Create your account</p>
        </div>

        <div className="border p-8" style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-surface)' }}>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Display Name</label>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                className="w-full px-3 py-2.5 border font-body text-[14px] outline-none"
                style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                placeholder="Your name"
                required
              />
            </div>
            <div>
              <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-3 py-2.5 border font-body text-[14px] outline-none"
                style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
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
                className="w-full px-3 py-2.5 border font-body text-[14px] outline-none"
                style={{ borderColor: 'var(--color-fog)', backgroundColor: 'var(--color-paper)', color: 'var(--color-ink)' }}
                placeholder="At least 6 characters"
                required
              />
            </div>
            <div>
              <label className="meta block mb-2" style={{ fontSize: '10px', letterSpacing: '0.12em' }}>I am a</label>
              <div className="flex gap-px" style={{ backgroundColor: 'var(--color-fog)' }}>
                {(['learner', 'creator'] as const).map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setRole(r)}
                    className="flex-1 py-2.5 font-body text-[13px] capitalize transition-all"
                    style={{
                      backgroundColor: role === r ? 'var(--color-ink)' : 'var(--color-surface)',
                      color: role === r ? 'white' : 'var(--color-ash)',
                    }}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            {error && <p className="font-body text-[13px]" style={{ color: '#c44' }}>{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 font-body text-[13px] uppercase tracking-[0.1em] transition-opacity disabled:opacity-40"
              style={{ backgroundColor: 'var(--color-ink)', color: 'white' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center mt-6 font-body text-[13px]" style={{ color: 'var(--color-ash)' }}>
          Already have an account?{' '}
          <Link to="/auth/login" className="underline underline-offset-4" style={{ color: 'var(--color-ink)' }}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
