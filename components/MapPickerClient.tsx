'use client';

import { useEffect, useRef } from 'react';

interface MapPickerProps {
  initialPos?: [number, number];
  onLocationSelect?: (pos: { lat: number; lng: number }) => void;
  centers?: any[]; // Build xatosini tuzatuvchi asosiy qator
}

export default function MapPickerClient({ 
  initialPos = [41.2995, 69.2401], 
  onLocationSelect,
  centers = [] 
}: MapPickerProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;

    import('leaflet').then(L => {
      // Standart ikonkalarni sozlash
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
        iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
        shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      });

      const map = L.map(mapRef.current!).setView(initialPos, 13);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19,
      }).addTo(map);

      // Agar joylashuvni tanlash funksiyasi bo'lsa (registratsiya uchun)
      if (onLocationSelect) {
        const marker = L.marker(initialPos, { draggable: true }).addTo(map);
        marker.on('dragend', () => {
          const pos = marker.getLatLng();
          onLocationSelect({ lat: pos.lat, lng: pos.lng });
        });

        map.on('click', (e: any) => {
          const { lat, lng } = e.latlng;
          marker.setLatLng([lat, lng]);
          onLocationSelect({ lat, lng });
        });
        markerRef.current = marker;
      }

      // Markazlar uchun alohida guruh yaratish
      const markersGroup = L.layerGroup().addTo(map);
      markersGroupRef.current = markersGroup;
      mapInstance.current = map;
    });

    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
      }
    };
  }, []);

  // Markazlar o'zgarganda xaritadagi nuqtalarni yangilash
  useEffect(() => {
    if (mapInstance.current && markersGroupRef.current && centers.length > 0) {
      import('leaflet').then(L => {
        markersGroupRef.current.clearLayers(); // Eskilarini o'chirish

        centers.forEach(center => {
          if (center.lat && center.lng) {
            const m = L.marker([center.lat, center.lng])
              .bindPopup(`
                <div style="font-family: sans-serif; padding: 5px;">
                  <strong style="font-size: 14px; color: #2563eb;">${center.name}</strong><br/>
                  <span style="font-size: 12px; color: #64748b;">${center.address || ''}</span><br/>
                  <a href="/center/${center.id}" style="display: block; margin-top: 8px; color: white; background: #1e293b; padding: 4px 8px; border-radius: 4px; text-decoration: none; text-align: center; font-size: 11px;">Batafsil</a>
                </div>
              `)
              .addTo(markersGroupRef.current);
          }
        });
      });
    }
  }, [centers]);

  return (
    <>
      <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
      <div ref={mapRef} className="h-full w-full outline-none" />
    </>
  );
}
