import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'PLAN B - Delivery & Takeaway',
  description: 'Pedí tu comida favorita en PLAN B. Delivery y Takeaway rápido y fácil.',
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
