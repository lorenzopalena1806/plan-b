'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Receipt {
  id: number;
  receiptNumber: string;
  amount: number;
  issuedAt: string;
  periodStart: string;
  periodEnd: string;
  description: string | null;
  restaurantId: number;
  restaurant: {
    name: string;
  };
}

export default function AdminBillingPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchReceipts();
  }, []);

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/admin/receipts');
      if (res.ok) {
        const data = await res.json();
        setReceipts(data);
      } else {
        setError('Error al cargar la información de facturación.');
      }
    } catch (err) {
      console.error(err);
      setError('Error de conexión.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) return <div className="container" style={{ padding: '2rem 0' }}>Cargando...</div>;

  return (
    <div className="container" style={{ padding: '2rem 0' }}>
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-receipt-modal, #printable-receipt-modal * {
            visibility: visible;
          }
          #printable-receipt-modal {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}} />

      <header className="flex justify-between items-center no-print" style={{ marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '1px solid var(--color-border)' }}>
        <div>
          <h1>Facturación y Recibos</h1>
          <p className="text-muted">Historial de pagos de tu suscripción</p>
        </div>
        <Link href="/admin" className="btn-outline">Volver</Link>
      </header>

      {error && (
        <div className="no-print" style={{ padding: '1rem', backgroundColor: '#f8d7da', color: '#721c24', borderRadius: 'var(--border-radius-sm)', marginBottom: '1.5rem' }}>
          {error}
        </div>
      )}

      {/* Receipts Table Card */}
      <div className="card no-print" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ backgroundColor: 'var(--color-border)' }}>
              <th style={{ padding: '1rem' }}>Número</th>
              <th style={{ padding: '1rem' }}>Fecha de Pago</th>
              <th style={{ padding: '1rem' }}>Período Suscripción</th>
              <th style={{ padding: '1rem' }}>Monto</th>
              <th style={{ padding: '1rem', textAlign: 'right' }}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {receipts.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '2rem', textAlign: 'center' }} className="text-muted">
                  No se registran recibos de pago para este local.
                </td>
              </tr>
            ) : (
              receipts.map((rec) => (
                <tr key={rec.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }} className="font-mono text-red">
                    {rec.receiptNumber}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {new Date(rec.issuedAt).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {new Date(rec.periodStart).toLocaleDateString('es-AR')} al {new Date(rec.periodEnd).toLocaleDateString('es-AR')}
                  </td>
                  <td style={{ padding: '1rem', fontWeight: 'bold' }}>
                    ${rec.amount.toLocaleString()}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    <button 
                      onClick={() => setSelectedReceipt(rec)}
                      className="btn-outline"
                      style={{ fontSize: '0.85rem', padding: '0.4rem 0.8rem' }}
                    >
                      📄 Ver Recibo
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Invoice Modal */}
      {selectedReceipt && (
        <div className="modal-overlay" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div 
            id="printable-receipt-modal"
            className="card" 
            style={{ 
              backgroundColor: 'white', 
              color: '#1a1a1a', 
              width: '100%', 
              maxWidth: '650px', 
              padding: '2.5rem', 
              boxShadow: 'var(--shadow-lg)', 
              borderRadius: 'var(--border-radius-lg)',
              border: '1px solid var(--color-border)',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}
          >
            {/* Header info */}
            <div className="flex justify-between items-start" style={{ borderBottom: '2px solid #1a1a1a', paddingBottom: '1.5rem', marginBottom: '1.5rem' }}>
              <div>
                <img src="/logo.png" alt="Polosandia" style={{ height: '75px', marginBottom: '0.75rem', objectFit: 'contain' }} />
                <p style={{ fontSize: '0.85rem', color: '#666' }}>Sistema de Gestión para Gastronomía</p>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>soportepolosandia@gmail.com</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span 
                  style={{ 
                    display: 'inline-block', 
                    padding: '0.35rem 0.75rem', 
                    backgroundColor: '#ffebeb', 
                    color: '#e63946', 
                    fontWeight: 'bold', 
                    borderRadius: '4px', 
                    fontSize: '0.9rem',
                    marginBottom: '0.5rem'
                  }}
                >
                  RECIBO DE PAGO
                </span>
                <p style={{ fontWeight: 'bold', fontFamily: 'monospace', fontSize: '1.1rem' }}>{selectedReceipt.receiptNumber}</p>
                <p style={{ fontSize: '0.85rem', color: '#666', marginTop: '0.25rem' }}>Fecha: {new Date(selectedReceipt.issuedAt).toLocaleDateString('es-AR')}</p>
              </div>
            </div>

            {/* Bill to Info */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem', fontSize: '0.9rem' }}>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>EMITIDO POR</h4>
                <p><strong>Polosandia Labs</strong></p>
                <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '0.15rem' }}>La Calera, Córdoba</p>
              </div>
              <div>
                <h4 style={{ textTransform: 'uppercase', fontSize: '0.75rem', color: '#888', marginBottom: '0.25rem', letterSpacing: '0.5px' }}>CLIENTE / COMERCIO</h4>
                <p><strong>{selectedReceipt.restaurant.name}</strong></p>
                <p style={{ color: '#555', fontSize: '0.85rem', marginTop: '0.15rem' }}>Local ID: #{selectedReceipt.restaurantId}</p>
              </div>
            </div>

            {/* Concept Table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '2.5rem', fontSize: '0.9rem' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid #ccc', color: '#555' }}>
                  <th style={{ padding: '0.5rem 0', textAlign: 'left' }}>Descripción / Concepto</th>
                  <th style={{ padding: '0.5rem 0', textAlign: 'right' }}>Monto</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #eee' }}>
                  <td style={{ padding: '1rem 0' }}>
                    <p style={{ fontWeight: 'bold' }}>Suscripción mensual de local comercial (Polosandia)</p>
                    <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem' }}>
                      Período de cobertura: {new Date(selectedReceipt.periodStart).toLocaleDateString('es-AR')} al {new Date(selectedReceipt.periodEnd).toLocaleDateString('es-AR')}
                    </p>
                    {selectedReceipt.description && (
                      <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.25rem', fontStyle: 'italic' }}>
                        Nota: {selectedReceipt.description}
                      </p>
                    )}
                  </td>
                  <td style={{ padding: '1rem 0', textAlign: 'right', fontWeight: 'bold', verticalAlign: 'top' }}>
                    ${selectedReceipt.amount.toLocaleString()}
                  </td>
                </tr>
              </tbody>
            </table>

            {/* Total Section */}
            <div className="flex justify-between items-center" style={{ borderTop: '2px solid #1a1a1a', paddingTop: '1.5rem', marginBottom: '2rem' }}>
              <span style={{ fontSize: '1.1rem', fontWeight: 'bold' }}>TOTAL ABONADO</span>
              <span style={{ fontSize: '1.75rem', fontWeight: '800', color: '#1a1a1a' }}>${selectedReceipt.amount.toLocaleString()}</span>
            </div>

            {/* Footer Signoff */}
            <div style={{ textAlign: 'center', fontSize: '0.8rem', color: '#888', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
              <p>Este es un comprobante de pago digital válido emitido por Polosandia.</p>
              <p style={{ marginTop: '0.25rem' }}>¡Gracias por confiar en nosotros para la administración de tu negocio!</p>
            </div>

            {/* Modal Controls */}
            <div className="flex justify-end no-print" style={{ gap: '1rem', marginTop: '2.5rem', borderTop: '1px solid var(--color-border)', paddingTop: '1.5rem' }}>
              <button 
                onClick={() => setSelectedReceipt(null)}
                className="btn-outline"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem' }}
              >
                Cerrar
              </button>
              <button 
                onClick={handlePrint}
                className="btn-primary"
                style={{ padding: '0.5rem 1.5rem', fontSize: '0.9rem', width: 'auto' }}
              >
                🖨️ Imprimir Recibo
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
