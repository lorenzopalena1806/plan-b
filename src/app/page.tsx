import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa', fontFamily: 'var(--font-sans)' }}>
      {/* Estilos específicos para la landing */}
      <style dangerouslySetInnerHTML={{__html: `
        .hero-section {
          background: linear-gradient(135deg, #fff 0%, #ffebec 100%);
          padding: 6rem 2rem;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          color: #1a1a1a;
          line-height: 1.1;
          margin-bottom: 1.5rem;
          max-width: 800px;
          margin-inline: auto;
          letter-spacing: -1.5px;
        }
        .hero-title span {
          color: var(--color-red-primary);
        }
        .hero-subtitle {
          font-size: 1.25rem;
          color: #555;
          max-width: 600px;
          margin: 0 auto 3rem auto;
          line-height: 1.6;
        }
        .feature-card {
          background: white;
          padding: 2.5rem;
          border-radius: var(--border-radius-lg);
          box-shadow: var(--shadow-sm);
          transition: all 0.3s ease;
          border: 1px solid var(--color-border);
        }
        .feature-card:hover {
          transform: translateY(-5px);
          box-shadow: var(--shadow-lg);
          border-color: var(--color-red-primary);
        }
        .feature-icon {
          font-size: 2.5rem;
          margin-bottom: 1.5rem;
          display: inline-block;
          background: var(--color-red-light);
          padding: 1rem;
          border-radius: 20px;
        }
        .pricing-card {
          background: white;
          border: 2px solid var(--color-red-primary);
          border-radius: 24px;
          padding: 3rem;
          max-width: 450px;
          margin: 0 auto;
          text-align: center;
          box-shadow: 0 20px 40px rgba(230, 57, 70, 0.15);
        }
        .cta-section {
          background-color: #1a1a1a;
          color: white;
          padding: 5rem 2rem;
          text-align: center;
        }
        @media (max-width: 768px) {
          .hero-title { font-size: 2.5rem; }
          .features-grid { grid-template-columns: 1fr !important; }
        }
      `}} />

      {/* Navbar */}
      <nav style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', borderBottom: '1px solid var(--color-border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <img src="/logo.png" alt="Polosandia" style={{ height: '35px', objectFit: 'contain' }} />
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link href="/login" className="btn-outline" style={{ fontWeight: 'bold' }}>
            Ingresar al Sistema
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <h1 className="hero-title">Tu restaurante en piloto automático. <span>Cero comisiones.</span></h1>
        <p className="hero-subtitle">
          El sistema Todo-en-Uno diseñado para gastronómicos. Carta digital, carrito de WhatsApp, comandera inteligente y gestión total.
        </p>
        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
          <a href="#contacto" className="btn-primary" style={{ padding: '1rem 2.5rem', fontSize: '1.1rem', width: 'auto', borderRadius: '30px' }}>
            Quiero mi Demo
          </a>
        </div>
      </header>

      {/* Features Section */}
      <section style={{ padding: '6rem 2rem', maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem', letterSpacing: '-1px' }}>Todo lo que necesitas para crecer</h2>
          <p style={{ color: '#666', fontSize: '1.1rem' }}>Olvídate de pagar 30% a las apps de delivery.</p>
        </div>
        
        <div className="features-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '2rem' }}>
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Menú QR & WhatsApp</h3>
            <p style={{ color: '#666' }}>Tus clientes navegan tu catálogo online y el pedido te llega perfectamente detallado a tu WhatsApp, listo para cobrar.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🍳</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Comandera Inteligente</h3>
            <p style={{ color: '#666' }}>Una pantalla en tiempo real para tu cocina. Los pedidos nuevos suenan y se organizan solos. Adiós a los papeles perdidos.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Marketing Activo</h3>
            <p style={{ color: '#666' }}>Crea cupones de descuento, configura horarios de doble turno y ofrece promociones para fidelizar a tus mejores clientes.</p>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section style={{ padding: '4rem 2rem', backgroundColor: 'white', borderTop: '1px solid var(--color-border)' }}>
        <div className="pricing-card">
          <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: 'var(--color-red-primary)' }}>Suscripción Mensual</h3>
          <p style={{ color: '#666', marginBottom: '2rem' }}>Vende ilimitado por un costo fijo</p>
          <div style={{ fontSize: '3.5rem', fontWeight: '800', marginBottom: '2rem', letterSpacing: '-2px' }}>
            $25.000<span style={{ fontSize: '1.25rem', color: '#888', fontWeight: 'normal', letterSpacing: '0' }}>/mes</span>
          </div>
          <ul style={{ textAlign: 'left', marginBottom: '2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', color: '#444' }}>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ <span>Catálogo ilimitado de productos</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ <span>Pedidos directos por WhatsApp</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ <span>Acceso a la Comandera de Cocina</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ <span>Panel de métricas y cierre de caja</span></li>
            <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>✅ <span>Soporte técnico directo</span></li>
          </ul>
          <a href="#contacto" className="btn-primary" style={{ padding: '1rem', fontSize: '1.1rem', borderRadius: '30px' }}>
            Contratar Sistema
          </a>
        </div>
      </section>

      {/* CTA / Footer */}
      <footer className="cta-section" id="contacto">
        <h2 style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>¿Listo para modernizar tu local?</h2>
        <p style={{ fontSize: '1.1rem', color: '#aaa', marginBottom: '2.5rem', maxWidth: '600px', marginInline: 'auto' }}>
          Contactanos hoy mismo y te armamos una demostración gratuita con el menú real de tu restaurante.
        </p>
        <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
          <a href="https://wa.me/5491100000000?text=Hola,%20quiero%20información%20sobre%20el%20sistema%20Polosandia" target="_blank" rel="noreferrer" className="btn-primary" style={{ width: 'auto', backgroundColor: '#25D366', padding: '1rem 2rem', borderRadius: '30px' }}>
            Contactar por WhatsApp
          </a>
        </div>
        <div style={{ marginTop: '5rem', paddingTop: '2rem', borderTop: '1px solid #333', color: '#666', fontSize: '0.9rem' }}>
          &copy; {new Date().getFullYear()} Polosandia. Todos los derechos reservados.
        </div>
      </footer>
    </div>
  );
}
