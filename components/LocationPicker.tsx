'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useState } from 'react';
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { CAMPUS_CENTER, LEGNARO, clampToLegnaro } from '@/lib/types';

/** Pin used for the user's chosen spot */
function dropPinIcon() {
  return L.divIcon({
    html: '<div class="aj-pin-pick"></div>',
    className: 'aj-divicon',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
}

/** Fires on tap; keeps Leaflet aware of its real size inside the form */
function PickerEvents({ onPick }: { onPick: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const inv = () => map.invalidateSize();
    inv();
    const timers = [setTimeout(inv, 80), setTimeout(inv, 300), setTimeout(inv, 700)];
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(inv) : null;
    ro?.observe(map.getContainer());
    return () => {
      timers.forEach(clearTimeout);
      ro?.disconnect();
    };
  }, [map]);

  useMapEvents({
    click(e) {
      const p = clampToLegnaro(e.latlng.lat, e.latlng.lng);
      onPick(p.lat, p.lng);
    },
  });

  return null;
}

interface Props {
  lat: number;
  lng: number;
  onChange: (lat: number, lng: number) => void;
}

/**
 * Compact map for "where is this drop happening".
 * Tapping anywhere inside Legnaro moves the pin; taps outside are clamped
 * to the comune boundary so a drop can never land in the next town.
 */
export default function LocationPicker({ lat, lng, onChange }: Props) {
  const [ready, setReady] = useState(false);
  const icon = useMemo(() => dropPinIcon(), []);

  // Make sure the initial value is inside Legnaro
  useEffect(() => {
    const p = clampToLegnaro(lat, lng);
    if (p.lat !== lat || p.lng !== lng) onChange(p.lat, p.lng);
    setReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="relative">
      <div className="relative h-52 w-full overflow-hidden rounded-2xl border border-black/10 dark:border-white/10">
        <MapContainer
          center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
          zoom={14}
          minZoom={LEGNARO.minZoom}
          maxZoom={LEGNARO.maxZoom}
          maxBounds={[
            [LEGNARO.bounds.south - 0.01, LEGNARO.bounds.west - 0.01],
            [LEGNARO.bounds.north + 0.01, LEGNARO.bounds.east + 0.01],
          ]}
          zoomControl={false}
          scrollWheelZoom={false}
          className="h-full w-full"
          whenReady={() => setReady(true)}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap'
            maxZoom={19}
          />
          <PickerEvents onPick={onChange} />
          {ready && <Marker position={[lat, lng]} icon={icon} />}
        </MapContainer>

        {/* Hint overlay */}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex justify-center pb-2">
          <span className="rounded-full bg-black/60 px-3 py-1 text-[11px] font-bold text-white">
            Tap the map to move your pin
          </span>
        </div>
      </div>
    </div>
  );
}