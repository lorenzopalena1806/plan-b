import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <div className="card" style={{ maxWidth: '600px', textAlign: 'center', padding: '3rem 2rem' }}>
        <h1 className="text-red" style={{ fontSize: '2.5rem', marginBottom: '1rem', lineHeight: '1.2' }}>Sistema Multi-Restaurante</h1>
        <p className="text-muted" style={{ fontSize: '1.1rem', marginBottom: '2rem', lineHeight: '1.6' }}>
          Bienvenido a la plataforma centralizada de pedidos. Si eres dueño de un local, puedes ingresar a tu panel de administración.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <Link href="/login" className="btn btn-primary" style={{ padding: '0.75rem 2rem', fontSize: '1.1rem' }}>
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
