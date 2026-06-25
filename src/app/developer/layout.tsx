import { getServerSession } from 'next-auth';
import { authOptions } from '../api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function DeveloperLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== 'SUPERADMIN') {
    redirect('/login');
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ backgroundColor: 'white', padding: '1rem', borderBottom: '1px solid var(--color-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 'bold', fontSize: '1.25rem' }}>👨‍💻 SuperAdmin SaaS</div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/developer" className="btn-outline">Locales</Link>
          <Link href="/developer/users" className="btn-outline">Usuarios</Link>
          <Link href="/admin" className="btn-outline" style={{ borderColor: 'var(--color-red-primary)', color: 'var(--color-red-primary)' }}>Ir a Admin</Link>
        </div>
      </nav>
      <main className="container" style={{ flex: 1, padding: '2rem 1rem' }}>
        {children}
      </main>
    </div>
  );
}
