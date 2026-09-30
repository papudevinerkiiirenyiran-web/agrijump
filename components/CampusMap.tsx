'use client';

import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { useEffect, useMemo, useRef } from 'react';
import { MapContainer, Marker, TileLayer, useMap } from 'react-leaflet';
import { useEvents } from '@/lib/store';
import { CAMPUS_CENTER, CATEGORY_MAP, LEGNARO } from '@/lib/types';

/** Comune boundary — a Leaflet [[sw],[ne]] pair, with a little breathing room */
const TOWN_BOUNDS: L.LatLngBoundsExpression = [
  [LEGNARO.bounds.south, LEGNARO.bounds.west],
  [LEGNARO.bounds.north, LEGNARO.bounds.east],
];

/** Re-centre: frame every live drop, or the whole comune when there are none */
function recenter(map: L.Map, points: { lat: number; lng: number }[]) {
  if (!points.length) {
    map.flyTo([LEGNARO.center.lat, LEGNARO.center.lng], LEGNARO.townZoom, { duration: 0.7 });
    return;
  }
  if (points.length === 1) {
    map.flyTo([points[0].lat, points[0].lng], LEGNARO.closeZoom, { duration: 0.7 });
    return;
  }
  map.flyToBounds(L.latLngBounds(points.map((p) => [p.lat, p.lng])), {
    padding: [64, 64],
    maxZoom: LEGNARO.closeZoom,
    duration: 0.7,
  });
}

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

/**
 * Camera control: keeps Leaflet aware of the container's real size.
 *
 * Leaflet only knows the pixel size at mount time. With dynamic imports and
 * the bottom-sheet flex layout, the container grows after mount — without a
 * fresh `invalidateSize()` the map renders tiles for a tiny viewport (which
 * is why the home page looked empty on iPhone).
 */
function MapEffects() {
  const map = useMap();
  const { activeId, visible } = useEvents();
  const target = visible.find((e) => e.id === activeId);
  const prevActive = useRef<string | null | undefined>(undefined);
  const framed = useRef(false);

  // Frame the whole comune (or every drop) the first time we get data.
  // Without this the town-wide view would sit on an arbitrary tile.
  useEffect(() => {
    if (framed.current) return;
    if (!visible.length) return;
    framed.current = true;
    if (visible.length === 1) {
      map.setView([visible[0].location.lat, visible[0].location.lng], LEGNARO.closeZoom);
    } else {
      map.fitBounds(L.latLngBounds(visible.map((e) => [e.location.lat, e.location.lng])), {
        padding: [64, 64],
        maxZoom: LEGNARO.closeZoom,
      });
    }
  }, [map, visible]);

  useEffect(() => {
    const inv = () => map.invalidateSize();
    inv();
    // Belt-and-braces: re-check after a few frames + on every resize
    const timers = [
      setTimeout(inv, 50),
      setTimeout(inv, 200),
      setTimeout(inv, 600),
    ];
    window.addEventListener('resize', inv);
    window.addEventListener('orientationchange', inv);
    window.visualViewport?.addEventListener('resize', inv);

    // Long-running: resize of the container itself
    const container = map.getContainer();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(inv) : null;
    ro?.observe(container);
    if (container.parentElement) ro?.observe(container.parentElement);

    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener('resize', inv);
      window.removeEventListener('orientationchange', inv);
      window.visualViewport?.removeEventListener('resize', inv);
      ro?.disconnect();
    };
  }, [map]);

  // Follow the user's pick. Skip the very first (auto) selection so it
  // doesn't fight the framing pass above.
  useEffect(() => {
    if (!target) return;
    if (prevActive.current === undefined) {
      prevActive.current = target.id;
      return;
    }
    if (prevActive.current === target.id) return;
    prevActive.current = target.id;
    map.flyTo([target.location.lat, target.location.lng], Math.max(map.getZoom(), LEGNARO.closeZoom), {
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
        center={[LEGNARO.center.lat, LEGNARO.center.lng]}
        zoom={LEGNARO.townZoom}
        minZoom={LEGNARO.minZoom}
        maxZoom={LEGNARO.maxZoom}
        maxBounds={TOWN_BOUNDS}
        maxBoundsViscosity={0.75}
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

      {/* Recenter button — frames every live drop, or the whole comune */}
      <button
        onClick={() => {
          const m = mapRef.current;
          if (m) recenter(m, visible.map((e) => ({ lat: e.location.lat, lng: e.location.lng })));
        }}
        className="absolute right-3 top-safe-lg z-[500] grid h-11 w-11 place-items-center rounded-full bg-white/95 text-lg shadow-soft-lg backdrop-blur transition active:scale-95 dark:bg-ink-800/95"
        aria-label="Recenter map"
      >
        🧭
      </button>
    </div>
  );
}