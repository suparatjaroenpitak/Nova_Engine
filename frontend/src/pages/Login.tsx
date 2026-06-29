import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { authApi } from '@/api/auth';

function ParticleBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    const particles: { x: number; y: number; vx: number; vy: number; r: number; alpha: number }[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    for (let i = 0; i < 80; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.1,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(233, 69, 96, ${p.alpha})`;
        ctx.fill();
      });

      particles.forEach((a, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const b = particles[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = `rgba(233, 69, 96, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none" />;
}

export default function Login() {
  const { login: setAuth, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [shakeKey, setShakeKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isAuthenticated) navigate('/dashboard');
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        const { data } = await authApi.register({ email, password, displayName: name || email.split('@')[0] });
        setAuth(data.user, data.accessToken, data.refreshToken);
      } else {
        const { data } = await authApi.login({ email, password });
        setAuth(data.user, data.accessToken, data.refreshToken);
      }
      navigate('/dashboard');
    } catch (err: any) {
      const data = err?.response?.data;
      const msg = data?.error || data?.title || (typeof data === 'string' ? data : null) || err?.message || 'Authentication failed';
      setError(msg);
      setShakeKey((k) => k + 1);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-screen flex items-center justify-center bg-[#0a0a1a] overflow-hidden relative">
      <ParticleBackground />

      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-radial from-[#e94560]/10 to-transparent blur-3xl" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-gradient-radial from-[#0f3460]/15 to-transparent blur-3xl" />

      <div
        key={shakeKey}
        className="relative w-full max-w-md mx-4 animate-fade-up"
      >
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-[#e94560] to-[#d6304a] mb-4 shadow-lg shadow-[#e94560]/30 animate-float">
            <span className="text-2xl font-bold text-white">N</span>
          </div>
          <h1 className="text-3xl font-bold gradient-text">Nova Engine</h1>
          <p className="text-nova-muted mt-2 text-sm">Sign in to continue to your projects</p>
        </div>

        <div className="glass rounded-2xl p-8 animate-scale-in">
          <form onSubmit={handleSubmit} className="space-y-5">
            <h2 className="text-xl font-semibold text-nova-text mb-6">
              {isRegister ? 'Create Account' : 'Welcome Back'}
            </h2>

            {isRegister && (
              <div>
                <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full px-4 py-2.5 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-nova-muted mb-1.5 uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full px-4 py-2.5 bg-[#0a0a1a]/50 border border-[#2a2a4a] rounded-lg text-nova-text placeholder-[#5a5a7a] focus:border-nova-accent focus:ring-2 focus:ring-nova-accent/20 transition-all pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-nova-muted hover:text-nova-text text-sm"
                >
                  {showPassword ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2.5 text-red-400 text-sm animate-fade-in flex items-center gap-2">
                <span>⚠</span>
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isRegister ? 'Creating account...' : 'Signing in...'}
                </span>
              ) : isRegister ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-[#2a2a4a]">
            <p className="text-center text-sm text-nova-muted">
              {isRegister ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={() => { setIsRegister(!isRegister); setError(''); }}
                className="text-nova-accent hover:text-[#ff5a72] font-medium transition-colors"
              >
                {isRegister ? 'Sign In' : 'Create One'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center mt-6 text-xs text-nova-muted/60">
          By continuing, you agree to Nova Engine's Terms of Service
        </p>
      </div>
    </div>
  );
}
