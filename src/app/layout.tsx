import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'POLOSANDIA - Sistema Administrativo',
  description: 'Sistema centralizado de pedidos para restaurantes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <main className="container" style={{ minHeight: '100vh', paddingBottom: '5rem' }}>
          {children}
        </main>
      </body>
    </html>
  );
}
