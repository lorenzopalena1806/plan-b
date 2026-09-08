'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

type DriverLocation = {
  id: number;
  name: string;
  phone: string;
  latitude: number;
  longitude: number;
  locationUpdatedAt: string;
};

function timeAgo(dateStr: string) {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (diff < 60) return 'hace ' + diff + 's';
  if (diff < 3600) return 'hace ' + Math.floor(diff / 60) + 'min';
  return 'hace ' + Math.floor(diff / 3600) + 'h';
}

export default function DriversMapPage() {
  const [drivers, setDrivers] = useState<DriverLocation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const leafletRef = useRef<any>(null);

  const fetchLocations = async () => {
    try {
      const res = await fetch('/api/admin/drivers/locations');
      if (res.ok) {
        const data = await res.json();
        setDrivers(data);
        setLastUpdate(new Date());
        setIsLoading(false);
      }
    } catch (e) { console.error(e); }
  };

  // Initialize Leaflet map
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Dynamically import Leaflet to avoid SSR issues
    import('leaflet').then(L => {
      if (mapRef.current) return; // already initialized

      // Fix default marker icons
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map('driver-map').setView([-31.42, -64.18], 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap'
      }).addTo(map);

      mapRef.current = map;
      leafletRef.current = L;
    });

    fetchLocations();
    const interval = setInterval(fetchLocations, 15000);
    return () => clearInterval(interval);
  }, []);

  // Update markers when drivers change
  useEffect(() => {
    const L = leafletRef.current;
    const map = mapRef.current;
    if (!L || !map) return;

    // Clear old markers
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    if (drivers.length === 0) return;

    const bounds: [number, number][] = [];

    drivers.forEach(driver => {
      const secondsAgo = Math.floor((Date.now() - new Date(driver.locationUpdatedAt).getTime()) / 1000);
      const isRecent = secondsAgo < 60;

      const icon = L.divIcon({
        className: '',
        html: `<div style="
          background: ${isRecent ? '#16a34a' : '#d97706'};
          color: white;
          padding: 6px 10px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
          border: 2px solid white;
        ">
          ${driver.name}
        </div>`,
        iconAnchor: [0, 0]
      });

      const marker = L.marker([driver.latitude, driver.longitude], { icon })
        .addTo(map)
        .bindPopup(`
          <strong>${driver.name}</strong><br>
          Tel: ${driver.phone}<br>
          Actualizado: ${timeAgo(driver.locationUpdatedAt)}<br>
          <a href="https://maps.google.com/?q=${driver.latitude},${driver.longitude}" target="_blank" style="color:#2563eb">Ver en Google Maps</a>
        `);

      markersRef.current.push(marker);
      bounds.push([driver.latitude, driver.longitude]);
    });

    if (bounds.length > 0) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    }
  }, [drivers]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Leaflet CSS */}
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />

      {/* Header */}
      <div style={{ padding: '0.75rem 1rem', background: '#fff', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.1rem', fontWeight: '700', margin: 0 }}>Mapa de Repartidores</h1>
          <p style={{ fontSize: '0.8rem', color: '#6b7280', margin: 0 }}>
            {isLoading ? 'Cargando...' : drivers.length === 0 ? 'Ningun repartidor activo' : drivers.length + ' repartidor(es) en ruta'}
            {lastUpdate && <span style={{ marginLeft: '0.5rem' }}>— actualizado {timeAgo(lastUpdate.toISOString())}</span>}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button onClick={fetchLocations} style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontSize: '0.85rem' }}>
            Refrescar
          </button>
          <Link href="/admin/drivers" style={{ padding: '0.4rem 0.75rem', border: '1px solid #e5e7eb', borderRadius: '6px', background: '#fff', textDecoration: 'none', color: '#111', fontSize: '0.85rem' }}>
            Volver
          </Link>
        </div>
      </div>

      {/* Driver pills */}
      {drivers.length > 0 && (
        <div style={{ padding: '0.5rem 1rem', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {drivers.map(d => {
            const secs = Math.floor((Date.now() - new Date(d.locationUpdatedAt).getTime()) / 1000);
            return (
              <div key={d.id} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.75rem', background: '#fff', border: '1px solid #e5e7eb', borderRadius: '20px', fontSize: '0.8rem' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: secs < 60 ? '#16a34a' : '#d97706', display: 'inline-block' }}></span>
                <strong>{d.name}</strong>
                <span style={{ color: '#6b7280' }}>{timeAgo(d.locationUpdatedAt)}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Map */}
      <div id="driver-map" style={{ flex: 1, background: '#e8f4fd' }}>
        {isLoading && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem' }}>🗺️</div>
            <p>Cargando mapa...</p>
          </div>
        )}
        {!isLoading && drivers.length === 0 && (
          <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem', color: '#6b7280' }}>
            <div style={{ fontSize: '3rem' }}>📍</div>
            <p style={{ fontWeight: '700' }}>Ningun repartidor compartiendo ubicacion</p>
            <p style={{ fontSize: '0.875rem', textAlign: 'center' }}>
              Los repartidores deben activar el tracking desde su portal en el celular.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}