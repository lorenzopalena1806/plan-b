'use client';

import { useState } from 'react';

export default function ShareButton() {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying text: ', err);
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`social-btn share-btn ${copied ? 'copied' : ''}`}
      title="Compartir Carta"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: copied ? 'var(--color-green-light)' : 'rgba(0,0,0,0.05)',
        color: copied ? 'var(--color-green)' : 'var(--color-text)',
        border: `1px solid ${copied ? 'var(--color-green)' : 'var(--color-border)'}`,
        padding: '0.5rem 1rem',
        borderRadius: '20px',
        cursor: 'pointer',
        fontSize: '0.85rem',
        fontWeight: '600',
        gap: '0.5rem',
        transition: 'all 0.2s ease',
        boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
      }}
    >
      {copied ? (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
          <span>¡Enlace Copiado!</span>
        </>
      ) : (
        <>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="18" cy="5" r="3"></circle>
            <circle cx="6" cy="12" r="3"></circle>
            <circle cx="18" cy="19" r="3"></circle>
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
          </svg>
          <span>Compartir Carta</span>
        </>
      )}
    </button>
  );
}
