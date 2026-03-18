'use client';

import { useEffect, useRef } from 'react';

interface MapPickerProps {
  initialPos?:      [number, number];
  onLocationSelect: (pos: { lat: number; lng: number }) => void;
}

export default function MapPickerClient({ initialPos = [41.2995, 69.2401], onLocationSelect }: MapPickerProps) {
  const mapRef       = useRef<HTMLDivElement>(null);
  const mapInstance  = useRef<unknown>(null);
  const markerRef    = useRef<unknown>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      // Fix default icon paths
      delete (L.Icon.Default.prototype as Record<string, unknown>)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView(initialPos, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker(initialPos, { draggable: true }).addTo(map);
      marker.on('dragend', () => {
        const pos = marker.getLatLng();
        onLocationSelect({ lat: pos.lat, lng: pos.lng });
      });

      map.on('click', (e: unknown) => {
        const { lat, lng } = (e as { latlng: { lat: number; lng: number } }).latlng;
        marker.setLatLng([lat, lng]);
        onLocationSelect({ lat, lng });
      });

      mapInstance.current = map;
      markerRef.current   = marker;
    });

    return () => {
      if (mapInstance.current) {
        (mapInstance.current as { remove: () => void }).remove();
        mapInstance.current = null;
      }
    };
  }, []);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="h-[400px] rounded-2xl overflow-hidden border border-slate-200" />
    </>
  );
}
