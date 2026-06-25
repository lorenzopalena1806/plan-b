import Link from 'next/link';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 p-4">
      <div className="max-w-xl text-center space-y-6 bg-white p-10 rounded-2xl shadow-sm border border-gray-100">
        <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Sistema Multi-Restaurante</h1>
        <p className="text-lg text-slate-600">
          Bienvenido a la plataforma centralizada de pedidos. Si eres dueño de un local, puedes ingresar a tu panel de administración.
        </p>
        <div className="pt-4 flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/login" className="px-8 py-3 bg-slate-900 text-white rounded-lg font-medium hover:bg-slate-800 transition">
            Iniciar Sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
