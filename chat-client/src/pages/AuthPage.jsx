import { useState } from 'react';
import { useAuth } from '../AuthContext';

export default function AuthPage() {
  const { login, register } = useAuth();
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ username: '', email: '', identifier: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const isLogin = mode === 'login';

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (isLogin) await login(form.identifier, form.password);
      else await register(form.username, form.email, form.password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <main className="auth">
      <aside className="auth-side">
        <h1 className="wordmark">ChatApp</h1>
        <div className="demo" aria-hidden="true">
          <p className="bubble them">Did you get the tickets?</p>
          <p className="bubble me">Booked. Seats are together.</p>
          <p className="bubble them">Perfect, see you Friday.</p>
        </div>
      </aside>

      <section className="auth-main">
        <form onSubmit={submit} className="auth-form">
          <h2>{isLogin ? 'Sign in' : 'Create your account'}</h2>

          {isLogin ? (
            <label>
              Username or email
              <input
                value={form.identifier}
                onChange={set('identifier')}
                autoComplete="username"
                required
              />
            </label>
          ) : (
            <>
              <label>
                Username
                <input
                  value={form.username}
                  onChange={set('username')}
                  minLength={3}
                  maxLength={20}
                  autoComplete="username"
                  required
                />
              </label>
              <label>
                Email
                <input
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  autoComplete="email"
                  required
                />
              </label>
            </>
          )}

          <label>
            Password
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              minLength={isLogin ? undefined : 6}
              autoComplete={isLogin ? 'current-password' : 'new-password'}
              required
            />
          </label>

          {error && (
            <p className="error" role="alert">
              {error}
            </p>
          )}

          <button className="btn" disabled={busy}>
            {busy ? 'Please wait…' : isLogin ? 'Sign in' : 'Create account'}
          </button>

          <p className="switch">
            {isLogin ? 'New here?' : 'Already have an account?'}{' '}
            <button
              type="button"
              className="link"
              onClick={() => {
                setError('');
                setMode(isLogin ? 'register' : 'login');
              }}
            >
              {isLogin ? 'Create an account' : 'Sign in'}
            </button>
          </p>
        </form>
      </section>
    </main>
  );
}
