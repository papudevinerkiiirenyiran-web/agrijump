'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useEvents } from '@/lib/store';
import { CAMPUS_CENTER, CATEGORY_MAP } from '@/lib/types';

/** Custom emoji map pin (frisbee / coffee / guitar…) */
function pinIcon(emoji: string, color: string, active: boolean) {
  const size = active ? 54 : 42;
  const html = `
    <div class="aj-pin-wrap">
      ${active ? '<span class="aj-pin__ring"></span>' : ''}
      <div class="aj-pin ${active ? 'is-active' : ''}"
           style="--pin-color:${color}; width:${size}px; height:${size}px;">
        <span>${emoji}</span>
      </div>
    </div>`;
  return L.divIcon({
    html,
    className: 'aj-divicon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

/** My location */
function meIcon() {
  return L.divIcon({
    html: '<div class="aj-me"></div>',
    className: 'aj-divicon',
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });
}

/** Camera control: fly to the selection, recalculate when the container resizes */
function MapEffects() {
  const map = useMap();
  const { activeId, visible } = useEvents();
  const target = visible.find((e) => e.id === activeId);

  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 60);
    const onResize = () => map.invalidateSize();
    window.addEventListener('resize', onResize);
    return () => {
      clearTimeout(t);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  useEffect(() => {
    if (!target) return;
    map.flyTo([target.location.lat, target.location.lng], Math.max(map.getZoom(), 16), {
      duration: 0.9,
      easeLinearity: 0.25,
    });
  }, [map, target?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  return null;
}

export default function CampusMap() {
  const { visible, activeId, setActiveId } = useEvents();
  const mapRef = useRef<L.Map | null>(null);

  const markers = useMemo(
    () =>
      visible.map((e) => ({
        event: e,
        icon: pinIcon(e.emoji, CATEGORY_MAP[e.category].color, e.id === activeId),
      })),
    [visible, activeId]
  );

  const myIcon = useMemo(() => meIcon(), []);

  return (
    <div className="absolute inset-0">
      <MapContainer
        center={[CAMPUS_CENTER.lat, CAMPUS_CENTER.lng]}
        zoom={16}
        zoomControl={false}
        scrollWheelZoom
        className="h-full w-full"
        ref={(m) => {
          if (m) mapRef.current = m;
        }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          maxZoom={19}
        />
        <MapEffects />

        {/* My location (pinned near the campus centre for the demo) */}
        <Marker
          position={[CAMPUS_CENTER.lat + 0.0008, CAMPUS_CENTER.lng - 0.0006]}
          icon={myIcon}
          zIndexOffset={-100}
        />

        {markers.map(({ event, icon }) => (
          <Marker
            key={event.id}
            position={[event.location.lat, event.location.lng]}
            icon={icon}
            zIndexOffset={event.id === activeId ? 1000 : 0}
            eventHandlers={{
              click: () => {
                setActiveId(event.id);
                document
                  .getElementById(`card-${event.id}`)
                  ?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
              },
            }}
          />
        ))}
      </MapContainer>

      {/* Recenter button */}
      <button
        onClick={() =>
          mapRef.current?.flyTo([CAMPUS_CENTER.lat, CAMPUS_CENTER.lng], 16, { duration: 0.7 })
        }
        className="absolute right-3 top-[4.75rem] z-[500] grid h-11 w-11 place-items-center rounded-full bg-white/95 text-lg shadow-soft-lg backdrop-blur transition active:scale-95 dark:bg-ink-800/95"
        aria-label="Recenter map"
      >
        🧭
      </button>
    </div>
  );
}
