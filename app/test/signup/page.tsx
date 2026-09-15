'use client';

import { FormEvent, useState } from 'react';

export default function SignupTestPage() {
  const [status, setStatus] = useState<string>('');
  const [result, setResult] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setStatus('Sending...');
    setResult(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      name: String(form.get('name') || ''),
      email: String(form.get('email') || ''),
      password: String(form.get('password') || ''),
      businessName: String(form.get('businessName') || ''),
    };

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      setStatus(`${response.status} ${response.statusText}`);
      setResult(data);
    } catch (error) {
      setStatus('Network error');
      setResult({ error: error instanceof Error ? error.message : 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 640, margin: '40px auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <h1>🌐 Lumia AI — Sign Up Test</h1>
      <p>Use this temporary page to test the production signup API from the browser.</p>

      <form onSubmit={submit} style={{ display: 'grid', gap: 14 }}>
        <label>
          Full name
          <input name="name" required minLength={2} defaultValue="Test Owner" style={{ width: '100%', padding: 10, marginTop: 5 }} />
        </label>
        <label>
          Email
          <input name="email" type="email" required defaultValue={`test-${Date.now()}@lumia.rw`} style={{ width: '100%', padding: 10, marginTop: 5 }} />
        </label>
        <label>
          Password
          <input name="password" type="password" required minLength={8} defaultValue="TestPass123!" style={{ width: '100%', padding: 10, marginTop: 5 }} />
        </label>
        <label>
          Business name
          <input name="businessName" required minLength={2} defaultValue="Test Shop Rwanda" style={{ width: '100%', padding: 10, marginTop: 5 }} />
        </label>

        <button type="submit" disabled={loading} style={{ padding: 12, cursor: loading ? 'wait' : 'pointer' }}>
          {loading ? 'Creating account...' : 'Create account'}
        </button>
      </form>

      {status && (
        <section style={{ marginTop: 24 }}>
          <h2>Status: {status}</h2>
          <pre style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: 16, borderRadius: 8 }}>
            {JSON.stringify(result, null, 2)}
          </pre>
        </section>
      )}
    </main>
  );
}
