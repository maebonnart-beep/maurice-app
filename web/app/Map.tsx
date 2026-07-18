"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { Business } from "@/lib/types";
import { CATEGORY_MAP, SUBCATEGORIES } from "@/data/categories";
import "leaflet/dist/leaflet.css";

const GRAND_BAIE: [number, number] = [-20.0064, 57.5802];

function tel(phone: string) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

function webLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function whatsappLink(phone: string) {
  return "https://wa.me/" + phone.replace(/[^\d]/g, "");
}

// Les numéros mobiles mauriciens (+230 5xxx xxxx) sont presque toujours
// joignables sur WhatsApp, contrairement aux lignes fixes.
const MU_MOBILE_RE = /\+230\s?5\d{3}\s?\d{4}/;

function whatsappNumber(b: Business): string | undefined {
  if (b.whatsapp) return b.whatsapp;
  if (b.phone && MU_MOBILE_RE.test(b.phone)) return b.phone;
  return undefined;
}

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
    const mappable = businesses.filter((b) => b.lat !== undefined && b.lng !== undefined);
    if (mappable.length === 0) return;
    const bounds = mappable.map((b) => [b.lat as number, b.lng as number] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fitKey]);

  useEffect(() => {
    if (!selectedId) return;
    const business = businesses.find((b) => b.id === selectedId);
    const marker = markersRef.current[selectedId];
    if (!business || !marker || business.lat === undefined || business.lng === undefined) return;
    map.flyTo([business.lat, business.lng], 16, { duration: 0.6 });
    marker.openPopup();
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

  return (
    <MapContainer
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
                <b className="block text-sm mb-0.5">{b.name}</b>
                <span className="block text-xs text-gray-600 mb-1.5">
                  {cat.emoji} {cat.label}
                </span>
                <div className="text-[12.5px] text-gray-700 mb-2">{b.address}</div>
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
