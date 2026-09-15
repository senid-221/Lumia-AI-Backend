'use client';

import Link from 'next/link';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function SignUpPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: '', email: '', password: '', businessName: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function change(key: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const r = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, email: form.email.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || 'Unable to create account');
      router.push('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create account');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-simple">
      <div className="auth-simple-card auth-signup-card">
        <Link href="/" className="logo auth-logo" aria-label="Lumia AI home">
          <span className="logo-mark">L</span>
          <span className="brand">Lumia<span className="gradient-text"> AI</span></span>
        </Link>

        <div className="auth-heading">
          <h1>Create your workspace</h1>
          <p>Start building with Lumia AI.</p>
        </div>

        {error && <div className="form-error" role="alert">{error}</div>}

        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="name">Your name</label>
            <input id="name" value={form.name} onChange={(e) => change('name', e.target.value)} placeholder="Your name" autoComplete="name" required />
          </div>
          <div className="field">
            <label htmlFor="email">Email</label>
            <input id="email" type="email" value={form.email} onChange={(e) => change('email', e.target.value)} placeholder="you@business.com" autoComplete="email" required />
          </div>
          <div className="field">
            <label htmlFor="password">Password</label>
            <input id="password" type="password" minLength={8} value={form.password} onChange={(e) => change('password', e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" required />
          </div>
          <div className="field">
            <label htmlFor="businessName">Business name</label>
            <input id="businessName" value={form.businessName} onChange={(e) => change('businessName', e.target.value)} placeholder="Your business" autoComplete="organization" required />
          </div>
          <button className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? 'Creating workspace…' : 'Create workspace'}
          </button>
        </form>

        <p className="auth-switch">Already have an account? <Link href="/signin">Sign in</Link></p>
      </div>
    </main>
  );
}
