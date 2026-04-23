'use client';

import { useState } from 'react';

export default function LoginPage() {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(false);

    const res = await fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });

    if (res.ok) {
      window.location.href = '/';
    } else {
      setError(true);
      setLoading(false);
    }
  }

  return (
    <div className="h-screen bg-black flex items-center justify-center" style={{ fontFamily: 'Arial, sans-serif' }}>
      <div className="flex flex-col items-center gap-8">
        <h1 className="text-4xl font-bold tracking-widest text-blue-500 uppercase">🎤 Karaoke</h1>
        <form onSubmit={submit} className="flex flex-col gap-4 w-72">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className="bg-zinc-800 text-white px-5 py-3 rounded-xl border border-zinc-700 text-lg placeholder-zinc-500 focus:outline-none"
          />
          {error && <p className="text-red-400 text-sm text-center">Incorrect password</p>}
          <button
            type="submit"
            disabled={loading || !password}
            className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-lg transition-colors"
          >
            {loading ? '...' : 'Enter'}
          </button>
        </form>
      </div>
    </div>
  );
}
