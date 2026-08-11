"use client";

import { useEffect, useId, useRef, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { Business } from "@/lib/types";
import { CATEGORY_MAP, SUBCATEGORIES } from "@/data/categories";
import { tel, webLabel, whatsappLink, displayName, displayCity, whatsappNumber } from "@/lib/format";
import "leaflet/dist/leaflet.css";

const GRAND_BAIE: [number, number] = [-20.0064, 57.5802];

// Picto propre à la rubrique (thème) plutôt qu'un simple point de couleur.
function markerEmoji(b: Business): string {
  const subcats = SUBCATEGORIES[b.category as keyof typeof SUBCATEGORIES];
  if (subcats && b.themes && b.themes.length > 0) {
    const match = subcats.find((s) => s.key === b.themes![0]);
    if (match) return match.emoji;
  }
  return CATEGORY_MAP[b.category].emoji;
}

function buildIcon(emoji: string, color: string, selected: boolean, hovered: boolean) {
  const size = selected ? 34 : hovered ? 31 : 27;
  const ring = hovered && !selected ? "0 0 0 3px #fff, 0 0 0 5px " + color : "0 1px 4px rgba(0,0,0,.35)";
  return L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(
      size * 0.55
    )}px;line-height:1;border:2px solid #fff;box-shadow:${ring};">${emoji}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

export type MapBounds = { north: number; south: number; east: number; west: number };

// Vrai seulement si la carte est réellement affichée et dimensionnée. Sinon
// fitBounds/flyTo projettent sur une taille nulle → LatLng NaN → crash Leaflet.
function hasSize(map: L.Map): boolean {
  const s = map.getSize();
  return s.x > 0 && s.y > 0;
}

function BoundsReporter({
  onBoundsChange,
}: {
  onBoundsChange?: (b: MapBounds) => void;
}) {
  const map = useMapEvents({
    moveend: () => emit(),
    zoomend: () => emit(),
  });
  function emit() {
    if (!onBoundsChange) return;
    const b = map.getBounds();
    onBoundsChange({
      north: b.getNorth(),
      south: b.getSouth(),
      east: b.getEast(),
      west: b.getWest(),
    });
  }
  useEffect(() => {
    emit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

function MapController({
  businesses,
  selectedId,
  markersRef,
  fitKey,
}: {
  businesses: Business[];
  selectedId: string | null;
  markersRef: React.RefObject<Record<string, LeafletMarker>>;
  fitKey: string;
}) {
  const map = useMap();

  // Ne recadre la carte que sur un changement de catégorie (fitKey), pas à
  // chaque changement de filtre/recherche — sinon un zoom manuel de
  // l'utilisateur est annulé dès qu'il coche une sous-rubrique.
  useEffect(() => {
    const mappable = businesses.filter(
      (b) => Number.isFinite(b.lat) && Number.isFinite(b.lng)
    );
    if (mappable.length === 0 || !hasSize(map)) return;
    const bounds = mappable.map((b) => [b.lat as number, b.lng as number] as [number, number]);
    try {
      map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    } catch {
      /* recadrage impossible (carte non affichée) — on ignore */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  useEffect(() => {
    if (!selectedId) return;
    const business = businesses.find((b) => b.id === selectedId);
    const marker = markersRef.current[selectedId];
    if (!business || !marker || !Number.isFinite(business.lat) || !Number.isFinite(business.lng))
      return;
    // Carte masquée (vue liste mobile, onglet inactif…) : sa taille est nulle et
    // flyTo/unproject renverrait un LatLng NaN qui ferait planter la page.
    if (!hasSize(map)) return;
    try {
      map.flyTo([business.lat as number, business.lng as number], 16, { duration: 0.6 });
      marker.openPopup();
    } catch {
      /* animation impossible — on ignore plutôt que de casser l'app */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  return null;
}

export default function Map({
  businesses,
  selectedId,
  onSelect,
  onBoundsChange,
  fitKey = "all",
  hoveredId = null,
  onHover,
}: {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange?: (b: MapBounds) => void;
  fitKey?: string;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
}) {
  const markersRef = useRef<Record<string, LeafletMarker>>({});
  const mappable = businesses.filter((b) => b.lat !== undefined && b.lng !== undefined);

  // Montage différé au 1er effet client : évite l'erreur Leaflet « Map container
  // is being reused » causée par le double-montage de React StrictMode en dev
  // (react-leaflet crée la carte dans un ref callback pendant le rendu).
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  // Clé stable propre à cette instance : garantit un conteneur DOM neuf si la
  // carte est un jour réellement démontée/remontée.
  const mapKey = useId();

  if (!ready) {
    return <div style={{ height: "100%", width: "100%" }} className="bg-surface-2" />;
  }

  return (
    <MapContainer
      key={mapKey}
      center={GRAND_BAIE}
      zoom={13}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
      />
      <MapController businesses={mappable} selectedId={selectedId} markersRef={markersRef} fitKey={fitKey} />
      <BoundsReporter onBoundsChange={onBoundsChange} />
      {mappable.map((b) => {
        const cat = CATEGORY_MAP[b.category];
        return (
          <Marker
            key={b.id}
            ref={(el) => {
              if (el) markersRef.current[b.id] = el;
            }}
            position={[b.lat as number, b.lng as number]}
            icon={buildIcon(markerEmoji(b), cat.color, b.id === selectedId, b.id === hoveredId)}
            eventHandlers={{
              click: () => onSelect(b.id),
              mouseover: () => onHover?.(b.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Popup minWidth={210}>
              <div>
                <b className="block text-sm mb-0.5">{displayName(b.name)}</b>
                <span className="block text-xs text-gray-600 mb-1.5">
                  {cat.emoji} {cat.label}
                </span>
                <div className="text-[12.5px] text-gray-700 mb-2">📍 {displayCity(b.address)}</div>
                <div className="flex flex-wrap gap-1.5">
                  {b.phone && (
                    <a
                      href={tel(b.phone)}
                      className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#0e8b84] text-white"
                    >
                      📞 Appeler
                    </a>
                  )}
                  {b.website && (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                    >
                      🌐 {webLabel(b.website)}
                    </a>
                  )}
                  {whatsappNumber(b) && (
                    <a
                      href={whatsappLink(whatsappNumber(b) as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                    >
                      💬 WhatsApp
                    </a>
                  )}
                  {b.googleMapsUrl && (
                    <a
                      href={b.googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                    >
                      📍 Itinéraire
                    </a>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
