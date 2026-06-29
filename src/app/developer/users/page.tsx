'use client';

import { useState, useEffect } from 'react';

interface Restaurant {
  id: number;
  name: string;
}

interface User {
  id: number;
  username: string;
  role: string;
  rawPassword?: string | null;
  restaurantId: number | null;
  restaurant?: Restaurant;
}

export default function DeveloperUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('ADMIN');
  const [restaurantId, setRestaurantId] = useState('');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});

  const togglePasswordVisibility = (id: number) => {
    setShowPassword(prev => ({ ...prev, [id]: !prev[id] }));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resUsers, resRest] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/restaurants')
      ]);
      if (resUsers.ok) setUsers(await resUsers.json());
      if (resRest.ok) setRestaurants(await resRest.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          username, 
          password, 
          role,
          restaurantId: restaurantId ? parseInt(restaurantId) : null
        }),
      });

      if (res.ok) {
        setUsername('');
        setPassword('');
        setRestaurantId('');
        fetchData();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al crear');
      }
    } catch (err) {
      setError('Error de conexión');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
    
    try {
      const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al eliminar');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  const handleLinkRestaurant = async (userId: number, restaurantId: string) => {
    if (!restaurantId) return;
    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ restaurantId })
      });
      if (res.ok) {
        alert('Local vinculado correctamente');
        fetchData();
      } else {
        const data = await res.json();
        alert(data.error || 'Error al vincular local');
      }
    } catch (err) {
      alert('Error de conexión');
    }
  };

  if (loading) return <div style={{ padding: '2rem' }}>Cargando...</div>;

  return (
    <div>
      <header style={{ marginBottom: '2rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '1rem' }}>
        <h2 style={{ fontSize: '2rem' }}>Gestión de Usuarios</h2>
      </header>

      <div className="card" style={{ marginBottom: '2rem' }}>
        <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>Crear Nuevo Usuario</h3>
        <form onSubmit={handleCreate} className="grid" style={{ gap: '1.5rem' }}>
          {error && <div style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: '4px' }}>{error}</div>}
          
          <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Usuario</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Contraseña</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px' }}
                required
              />
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Rol</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: 'white' }}
              >
                <option value="ADMIN">Admin de Local (Dueño)</option>
                <option value="STAFF">Personal (Sin Acceso a Ingresos)</option>
                <option value="SUPERADMIN">SuperAdmin</option>
              </select>
            </div>
            <div>
              <label className="text-bold" style={{ display: 'block', marginBottom: '0.5rem' }}>Asignar a Local</label>
              <select
                value={restaurantId}
                onChange={(e) => setRestaurantId(e.target.value)}
                disabled={role === 'SUPERADMIN'}
                style={{ width: '100%', padding: '0.75rem', border: '1px solid var(--color-border)', borderRadius: '4px', backgroundColor: role === 'SUPERADMIN' ? '#f5f5f5' : 'white' }}
              >
                <option value="">-- Ninguno (Sistema) --</option>
                {restaurants.map(r => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <button type="submit" className="btn-primary" style={{ width: 'max-content' }}>
            Crear Usuario
          </button>
        </form>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>ID</th>
              <th style={{ padding: '1rem' }}>Usuario</th>
              <th style={{ padding: '1rem' }}>Contraseña</th>
              <th style={{ padding: '1rem' }}>Rol</th>
              <th style={{ padding: '1rem' }}>Local Asignado</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {users.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                  No hay usuarios registrados.
                </td>
              </tr>
            ) : (
              users.map((u) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem' }}>{u.id}</td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>{u.username}</td>
                  <td style={{ padding: '1rem', fontFamily: 'monospace' }}>
                    {u.rawPassword ? (
                      <div className="flex items-center" style={{ gap: '0.5rem' }}>
                        <span>{showPassword[u.id] ? u.rawPassword : '••••••'}</span>
                        <button 
                          type="button" 
                          onClick={() => togglePasswordVisibility(u.id)}
                          style={{ fontSize: '0.75rem', color: 'var(--color-red-primary)', textDecoration: 'underline', padding: 0 }}
                        >
                          {showPassword[u.id] ? 'Ocultar' : 'Mostrar'}
                        </button>
                      </div>
                    ) : (
                      <span className="text-muted" style={{ fontStyle: 'italic', fontSize: '0.8rem' }}>Sin registrar</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <span style={{ 
                      padding: '0.25rem 0.5rem', 
                      borderRadius: '4px', 
                      fontSize: '0.8rem', 
                      fontWeight: 'bold',
                      backgroundColor: u.role === 'SUPERADMIN' ? '#e9d5ff' : (u.role === 'STAFF' ? '#f3f4f6' : '#dbeafe'),
                      color: u.role === 'SUPERADMIN' ? '#6b21a8' : (u.role === 'STAFF' ? '#4b5563' : '#1e40af')
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }} className="text-muted">
                    {u.restaurant ? <span style={{ fontWeight: 'bold', color: 'var(--color-text)' }}>{u.restaurant.name}</span> : 'Sin local'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'flex-end' }}>
                    <select
                      onChange={(e) => {
                        handleLinkRestaurant(u.id, e.target.value);
                        e.target.value = "";
                      }}
                      style={{ fontSize: '0.75rem', padding: '0.25rem', borderRadius: '4px', border: '1px solid var(--color-border)', backgroundColor: '#f9f9f9', width: '120px' }}
                    >
                      <option value="">+ Vincular Local</option>
                      {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                    </select>
                    
                    <button 
                      onClick={() => handleDelete(u.id)}
                      style={{ color: 'var(--color-red-primary)', fontSize: '0.85rem', textDecoration: 'underline' }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
