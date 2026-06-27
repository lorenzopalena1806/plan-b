'use client';

import { signIn } from 'next-auth/react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const res = await signIn('credentials', {
      redirect: false,
      username,
      password,
    });

    if (res?.error) {
      setError('Credenciales inválidas');
    } else {
      router.push('/admin');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--color-bg)' }}>
      <div className="card flex-col" style={{ width: '100%', maxWidth: '400px', display: 'flex', gap: '1.5rem', padding: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '1rem' }}>
          <img src="/logo.png" alt="Polosandia" style={{ height: '140px', objectFit: 'contain' }} />
        </div>
        <h2 style={{ textAlign: 'center', fontSize: '1.25rem', marginTop: '-0.5rem' }}>Acceso Administrativo</h2>
        
        {error && <div style={{ color: 'var(--color-red-primary)', background: 'var(--color-red-light)', padding: '0.75rem', borderRadius: 'var(--border-radius-sm)', textAlign: 'center' }}>{error}</div>}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Usuario</label>
            <input 
              type="text" 
              value={username}
              onChange={e => setUsername(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              required
            />
          </div>
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
            <input 
              type="password" 
              value={password}
              onChange={e => setPassword(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
              required
            />
          </div>
          <button type="submit" className="btn-primary" style={{ marginTop: '1rem' }}>Ingresar</button>
        </form>
      </div>
    </div>
  );
}
