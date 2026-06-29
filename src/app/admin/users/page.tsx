'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface User {
  id: number;
  username: string;
  role: string;
  rawPassword?: string | null;
  restaurant?: { name: string } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('STAFF');
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/admin/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        if (res.status === 403) {
          setError('Acceso Denegado: No tienes permisos para ver esta sección.');
        } else {
          setError('Error al cargar usuarios.');
        }
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;
    
    setIsSubmitting(true);
    setError('');

    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          role
        })
      });

      if (res.ok) {
        setUsername('');
        setPassword('');
        setRole('STAFF');
        fetchUsers();
      } else {
        const result = await res.json();
        setError(result.error || 'Error al crear el usuario.');
      }
    } catch (err) {
      console.error(err);
      setError('Error al conectar con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar esta cuenta de usuario? Perderá el acceso de forma inmediata.')) return;

    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(users.filter(u => u.id !== id));
      } else {
        const result = await res.json();
        alert(result.error || 'Error al eliminar usuario.');
      }
    } catch (err) {
      console.error(err);
      alert('Error de conexión.');
    }
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando gestión de personal...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0', maxWidth: '800px' }}>
      <header className="flex justify-between items-center" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Gestión de Personal</h1>
          <p className="text-muted">Crea y administra las cuentas de acceso de tus empleados</p>
        </div>
        <Link href="/admin" className="btn-outline">Volver al Panel</Link>
      </header>

      {error && (
        <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem', fontWeight: '500' }}>
          ⚠️ {error}
        </div>
      )}

      <div className="grid" style={{ gridTemplateColumns: '1fr 1.2fr', gap: '2rem', alignItems: 'start' }}>
        
        {/* Create Form */}
        <form onSubmit={handleCreate} className="card flex flex-col" style={{ gap: '1.25rem', padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', margin: 0, fontWeight: '700' }}>Nuevo Usuario</h2>
          
          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Nombre de Usuario</label>
            <input 
              type="text" 
              placeholder="ej: cocinero.pepe"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            />
          </div>

          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Contraseña</label>
            <input 
              type="password" 
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)' }}
            />
          </div>

          <div>
            <label className="text-bold" style={{ display: 'block', marginBottom: '0.4rem', fontSize: '0.875rem' }}>Rol / Acceso</label>
            <select 
              value={role}
              onChange={e => setRole(e.target.value)}
              style={{ width: '100%', padding: '0.6rem', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', height: '40px', backgroundColor: 'white' }}
            >
              <option value="STAFF">Personal (Sin ingresos/ventas)</option>
              <option value="ADMIN">Administrador (Acceso completo)</option>
            </select>
          </div>

          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ marginTop: '0.5rem' }}>
            {isSubmitting ? 'Creando...' : 'Crear Usuario'}
          </button>
        </form>

        {/* Users List */}
        <div className="card" style={{ padding: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1.25rem', fontWeight: '700' }}>Usuarios Activos ({users.length})</h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {users.map(u => (
              <div key={u.id} className="flex justify-between items-center" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                  <div className="flex items-center" style={{ gap: '0.75rem' }}>
                    <span className="text-bold" style={{ fontSize: '1rem' }}>{u.username}</span>
                    <span style={{ 
                      padding: '0.2rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.75rem', 
                      fontWeight: 'bold',
                      backgroundColor: u.role === 'ADMIN' ? '#dbeafe' : '#f3f4f6',
                      color: u.role === 'ADMIN' ? '#1e40af' : '#4b5563'
                    }}>
                      {u.role === 'ADMIN' ? 'Admin / Dueño' : 'Personal'}
                    </span>
                  </div>
                  {u.restaurant && (
                    <span className="text-muted" style={{ display: 'inline-block', marginTop: '0.25rem', fontSize: '0.8rem', padding: '0.1rem 0.4rem', background: '#e0e0e0', borderRadius: '4px' }}>
                      📍 {u.restaurant.name}
                    </span>
                  )}
                  {u.role === 'STAFF' && u.rawPassword && (
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', marginTop: '0.25rem', fontFamily: 'monospace' }}>
                      Clave: {showPassword[u.id] ? u.rawPassword : '••••••'}{' '}
                      <button
                        type="button"
                        onClick={() => togglePasswordVisibility(u.id)}
                        style={{ fontSize: '0.75rem', color: 'var(--color-red-primary)', textDecoration: 'underline', padding: 0, border: 'none', background: 'none', cursor: 'pointer' }}
                      >
                        {showPassword[u.id] ? 'Ocultar' : 'Mostrar'}
                      </button>
                    </div>
                  )}
                </div>
                
                <button
                  onClick={() => handleDelete(u.id)}
                  className="text-red text-bold"
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.875rem' }}
                >
                  Eliminar
                </button>
              </div>
            ))}
            {users.length === 0 && <p className="text-muted text-center" style={{ padding: '1.5rem 0' }}>No hay usuarios de personal creados.</p>}
          </div>
        </div>

      </div>
    </div>
  );
}
