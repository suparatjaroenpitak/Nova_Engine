import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const fn = isRegister ? authApi.register : authApi.login;
      const { data } = await fn(
        isRegister ? { email, password, displayName: email.split('@')[0] } : { email, password }
      );
      login(data.user, data.accessToken, data.refreshToken);
      navigate('/');
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred');
    }
  };

  return (
    <div className="h-screen flex items-center justify-center bg-nova-bg">
      <div className="w-full max-w-md p-8 bg-nova-surface rounded-lg shadow-2xl border border-nova-border">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Nova Engine</h1>
          <p className="text-nova-muted">Sign in to your account</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded text-red-300 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-nova-muted mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-nova-bg border border-nova-border rounded text-nova-text focus:border-nova-accent"
              required
            />
          </div>
          <div>
            <label className="block text-sm text-nova-muted mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-nova-bg border border-nova-border rounded text-nova-text focus:border-nova-accent"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full py-2 bg-nova-accent hover:bg-red-600 text-white rounded font-medium transition-colors"
          >
            {isRegister ? 'Create Account' : 'Sign In'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-nova-muted hover:text-nova-text text-sm"
          >
            {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Register"}
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-nova-border">
          <div className="text-xs text-nova-muted text-center mb-3">Or continue with</div>
          <div className="flex gap-2">
            <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors">
              Google
            </button>
            <button className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded text-sm transition-colors">
              GitHub
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
