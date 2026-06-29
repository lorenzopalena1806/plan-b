import Link from 'next/link';

export default function LandingPage() {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#fafafa', color: '#1a1a1a', fontFamily: 'var(--font-sans)', overflowX: 'hidden' }}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --glow-red: rgba(225, 29, 72, 0.15);
          --accent-red: #e11d48;
          --glass-bg: rgba(255, 255, 255, 0.85);
          --glass-border: rgba(0, 0, 0, 0.08);
          --shadow-soft: 0 10px 30px rgba(0, 0, 0, 0.05);
        }
        
        body {
          background-color: #fafafa;
          margin: 0;
        }

        /* Animations */
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        @keyframes float {
          0% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0px); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .fade-up-1 { animation: fadeUp 0.8s ease-out forwards; opacity: 0; }
        .fade-up-2 { animation: fadeUp 0.8s ease-out 0.2s forwards; opacity: 0; }
        .fade-up-3 { animation: fadeUp 0.8s ease-out 0.4s forwards; opacity: 0; }

        /* Navigation */
        .glass-nav {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          padding: 1rem 2rem;
          display: flex;
          justifyContent: space-between;
          alignItems: center;
          background: var(--glass-bg);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid var(--glass-border);
          z-index: 1000;
          transition: all 0.3s ease;
        }

        .nav-logo {
          font-size: 1.5rem;
          font-weight: 900;
          letter-spacing: -1px;
          color: #1a1a1a;
        }

        .nav-logo span {
          color: var(--accent-red);
        }

        /* Hero Section */
        .hero-section {
          position: relative;
          padding: 8rem 2rem 4rem;
          text-align: center;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: radial-gradient(circle at top center, #ffffff 0%, #fafafa 100%);
        }

        .hero-bg-blob-1 {
          position: absolute;
          top: 10%;
          left: 10%;
          width: 500px;
          height: 500px;
          background: radial-gradient(circle, var(--glow-red) 0%, transparent 70%);
          animation: blob 15s infinite alternate;
          filter: blur(60px);
          z-index: 0;
          pointer-events: none;
        }

        .hero-bg-blob-2 {
          position: absolute;
          bottom: 10%;
          right: 10%;
          width: 400px;
          height: 400px;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.1) 0%, transparent 70%);
          animation: blob 20s infinite alternate-reverse;
          filter: blur(60px);
          z-index: 0;
          pointer-events: none;
        }

        .hero-content {
          position: relative;
          z-index: 10;
          max-width: 900px;
        }

        .badge {
          display: inline-block;
          padding: 0.5rem 1rem;
          background: rgba(225, 29, 72, 0.05);
          color: var(--accent-red);
          border: 1px solid rgba(225, 29, 72, 0.2);
          border-radius: 30px;
          font-size: 0.875rem;
          font-weight: 700;
          margin-bottom: 2rem;
          text-transform: uppercase;
          letter-spacing: 1px;
        }

        .hero-title {
          font-size: clamp(3rem, 8vw, 5rem);
          font-weight: 900;
          line-height: 1.05;
          margin-bottom: 1.5rem;
          letter-spacing: -2px;
          color: #0a0a0a;
        }

        .hero-title span {
          background: linear-gradient(135deg, #e11d48 0%, #9f1239 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }

        .hero-subtitle {
          font-size: clamp(1.1rem, 2vw, 1.35rem);
          color: #555;
          max-width: 700px;
          margin: 0 auto 3rem auto;
          line-height: 1.6;
        }

        .btn-glow {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 1.25rem 3rem;
          background: var(--accent-red);
          color: white;
          font-size: 1.1rem;
          font-weight: 700;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.3s ease;
          box-shadow: 0 10px 30px -10px var(--accent-red);
        }
        
        .btn-glow:hover {
          transform: translateY(-3px);
          box-shadow: 0 20px 40px -10px var(--accent-red);
          background: #be123c;
        }

        .btn-secondary {
          display: inline-flex;
          align-items: center;
          padding: 1.25rem 3rem;
          background: #ffffff;
          color: #1a1a1a;
          font-size: 1.1rem;
          font-weight: 600;
          border-radius: 50px;
          text-decoration: none;
          transition: all 0.3s ease;
          border: 1px solid var(--glass-border);
          box-shadow: var(--shadow-soft);
        }

        .btn-secondary:hover {
          background: #f3f4f6;
          border-color: rgba(0, 0, 0, 0.15);
        }

        /* Features Section */
        .features-section {
          padding: 8rem 2rem;
          background: #ffffff;
          position: relative;
          border-top: 1px solid var(--glass-border);
        }

        .section-header {
          text-align: center;
          margin-bottom: 5rem;
        }

        .section-title {
          font-size: 3rem;
          font-weight: 800;
          margin-bottom: 1rem;
          letter-spacing: -1px;
          color: #0a0a0a;
        }

        .section-subtitle {
          color: #555;
          font-size: 1.1rem;
          max-width: 600px;
          margin: 0 auto;
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 2rem;
          max-width: 1200px;
          margin: 0 auto;
        }

        .feature-card {
          background: #ffffff;
          border: 1px solid var(--glass-border);
          padding: 2.5rem;
          border-radius: 24px;
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
          box-shadow: var(--shadow-soft);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0; height: 100%;
          background: linear-gradient(180deg, rgba(225, 29, 72, 0.05) 0%, transparent 100%);
          opacity: 0;
          transition: opacity 0.4s ease;
        }

        .feature-card:hover {
          transform: translateY(-10px);
          border-color: rgba(225, 29, 72, 0.2);
          box-shadow: 0 20px 40px rgba(0,0,0,0.08);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 60px;
          height: 60px;
          background: linear-gradient(135deg, #ffe4e6 0%, #fda4af 100%);
          color: var(--accent-red);
          border-radius: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          margin-bottom: 1.5rem;
          position: relative;
          z-index: 1;
        }

        .feature-card h3 {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1rem;
          position: relative;
          z-index: 1;
          color: #1a1a1a;
        }

        .feature-card p {
          color: #666;
          line-height: 1.6;
          position: relative;
          z-index: 1;
        }

        /* Footer */
        footer {
          border-top: 1px solid var(--glass-border);
          padding: 4rem 2rem;
          text-align: center;
          background: #fafafa;
        }

        @media (max-width: 768px) {
          .hero-section { padding-top: 8rem; }
          .btn-glow, .btn-secondary { width: 100%; justify-content: center; margin-bottom: 1rem; }
        }
      `}} />

      {/* Navigation */}
      <nav className="glass-nav">
        <div className="nav-logo" style={{ display: 'flex', alignItems: 'center' }}>
          <img src="/logo.png" alt="Polosandia" style={{ height: '40px', objectFit: 'contain' }} />
        </div>
        <div>
          <Link href="/login" className="btn-secondary" style={{ padding: '0.6rem 1.5rem', fontSize: '0.9rem', borderRadius: '8px' }}>
            Ingresar
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="hero-bg-blob-1"></div>
        <div className="hero-bg-blob-2"></div>
        
        <div className="hero-content">
          <img 
            src="/logo.png" 
            alt="Polosandia Logo" 
            className="fade-up-1"
            style={{ 
              width: '100%', 
              maxWidth: '500px', 
              height: 'auto', 
              margin: '0 auto 2rem auto', 
              display: 'block',
              mixBlendMode: 'multiply'
            }} 
          />
          <h1 className="hero-title fade-up-2">
            Tu restaurante en<br/>
            <span>piloto automático.</span>
          </h1>
          <p className="hero-subtitle fade-up-3">
            El sistema definitivo para gastronómicos. Carta digital interactiva, recepción de pedidos por WhatsApp, comandera inteligente y analíticas avanzadas. <strong>Cero comisiones por venta.</strong>
          </p>
          <div className="fade-up-3" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center' }}>
            <a href="https://wa.me/5493512388658" target="_blank" rel="noopener noreferrer" className="btn-glow">
              Contactate
            </a>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2 className="section-title">Diseñado para la rentabilidad</h2>
          <p className="section-subtitle">Todo lo que necesitás para modernizar tu negocio y dejar de depender de aplicaciones de delivery costosas.</p>
        </div>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📱</div>
            <h3>Menú Digital Premium</h3>
            <p>Una experiencia de compra fluida y hermosa para tus clientes desde el celular. Con modificadores, fotos y carrito inteligente.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Pedidos por WhatsApp</h3>
            <p>El cliente arma su pedido y llega directamente a tu WhatsApp estructurado, calculado y listo para ser enviado a cocina.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">👨‍🍳</div>
            <h3>Comandera en Vivo</h3>
            <p>Tus cocineros ven los pedidos en tiempo real en una pantalla. Sincronización instantánea y control de tiempos de preparación.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Caja y Analíticas</h3>
            <p>Control total de tu facturación. Ticket promedio, productos más vendidos, métodos de pago y mucho más en un panel central.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🎟️</div>
            <h3>Cupones de Descuento</h3>
            <p>Fidelizá a tus clientes creando códigos promocionales (ej: BLACKFRIDAY) con descuentos fijos o en porcentajes.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🚀</div>
            <h3>Cero Comisiones</h3>
            <p>A diferencia de PedidosYa o Rappi, la tienda es tuya. No pagás porcentajes por venta, maximizando tus márgenes de ganancia.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛵</div>
            <h3>App para Repartidores</h3>
            <p>Tus cadetes tienen su propio portal web. Ven los viajes asignados en tiempo real, registran entregas y llevan su propio contador diario.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🏢</div>
            <h3>Gestión Multilocal</h3>
            <p>¿Crecés y abrís nuevas sucursales? Administrá múltiples locales desde una única cuenta maestra, cada una con su menú e inventario independiente.</p>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer>
        <div className="nav-logo" style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center' }}>
          <img src="/logo.png" alt="Polosandia" style={{ height: '50px', objectFit: 'contain' }} />
        </div>
        <p style={{ color: '#666', fontSize: '0.9rem' }}>
          © {new Date().getFullYear()} Polosandia. El futuro de la gestión gastronómica.
        </p>
      </footer>
    </div>
  );
}
