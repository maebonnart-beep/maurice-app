"use client";

import { useEffect, useId, useRef, useState } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { Marker as LeafletMarker } from "leaflet";
import type { Business } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import { tel, webLabel, whatsappContactLink, displayName, displayCity, whatsappNumber } from "@/lib/format";
import { iconForKey, CONTACT_ICONS } from "@/lib/icons";
import "leaflet/dist/leaflet.css";

const GRAND_BAIE: [number, number] = [-20.0064, 57.5802];

// Glyphe du marqueur : icône Phosphor (trait) propre à la rubrique (thème) sinon
// à la catégorie. Rendu en SVG (chaîne) pour le divIcon Leaflet, mémoïsé par clé.
const glyphCache: Record<string, string> = {};
function markerGlyph(b: Business): string {
  const themeKey = b.themes?.[0] && iconForKey(b.themes[0]) ? b.themes[0] : b.category;
  const cached = glyphCache[themeKey];
  if (cached) return cached;
  const Icon = iconForKey(themeKey);
  const html = Icon
    ? renderToStaticMarkup(<Icon size={17} color="#fff" weight="bold" />)
    : `<span>${CATEGORY_MAP[b.category].emoji}</span>`;
  glyphCache[themeKey] = html;
  return html;
}

// Icônes mémoïsées par clé (glyphe+couleur+état) : évite de recréer un L.divIcon
// (et son HTML) pour chaque marqueur à chaque re-render (hover, sélection,
// changement de rubrique…), ce qui laguait fortement avec de nombreux marqueurs.
const iconCache: Record<string, L.DivIcon> = {};
function buildIcon(inner: string, color: string, selected: boolean, hovered: boolean) {
  const key = `${inner}|${color}|${selected ? 1 : 0}|${hovered ? 1 : 0}`;
  const cached = iconCache[key];
  if (cached) return cached;
  const size = selected ? 34 : hovered ? 31 : 27;
  const ring = hovered && !selected ? "0 0 0 3px #fff, 0 0 0 5px " + color : "0 1px 4px rgba(0,0,0,.35)";
  const icon = L.divIcon({
    html: `<div style="width:${size}px;height:${size}px;border-radius:50%;background:${color};display:flex;align-items:center;justify-content:center;font-size:${Math.round(
      size * 0.55
    )}px;line-height:1;border:2px solid #fff;box-shadow:${ring};">${inner}</div>`,
    className: "",
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
  iconCache[key] = icon;
  return icon;
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

// Icône « ma position » : pastille bleue distincte des marqueurs de fiches
// (couleur hors palette catégories) avec halo, façon Google Maps / mobile OS.
const userPosIcon = L.divIcon({
  html: `<div style="width:16px;height:16px;border-radius:50%;background:#1a73e8;border:3px solid #fff;box-shadow:0 0 0 2px rgba(26,115,232,.35),0 1px 4px rgba(0,0,0,.35);"></div>`,
  className: "",
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});

export default function Map({
  businesses,
  selectedId,
  onSelect,
  onBoundsChange,
  fitKey = "all",
  hoveredId = null,
  onHover,
  userPos,
  numbered = false,
}: {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onBoundsChange?: (b: MapBounds) => void;
  fitKey?: string;
  hoveredId?: string | null;
  onHover?: (id: string | null) => void;
  /** Position de l'utilisateur (« Autour de moi ») : affichée comme pastille bleue. */
  userPos?: { lat: number; lng: number } | null;
  /** Parcours (plan complet) : chaque marqueur affiche son rang dans `businesses` (1, 2, 3…) au lieu de l'icône. */
  numbered?: boolean;
}) {
  const markersRef = useRef<Record<string, LeafletMarker>>({});
  const mappable = businesses.filter((b) => b.lat !== undefined && b.lng !== undefined);

  // Montage différé au 1er effet client : évite l'erreur Leaflet « Map container
  // is being reused » causée par le double-montage de React StrictMode en dev
  // (react-leaflet crée la carte dans un ref callback pendant le rendu).
  const [ready, setReady] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- rendu différé voulu (cf. ci-dessus), pas dérivable
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
      {/* Parcours : pointillés reliant les étapes dans l'ordre (1 → 2 → 3…), sous les marqueurs. */}
      {numbered && mappable.length > 1 && (
        <Polyline
          positions={mappable.map((b) => [b.lat as number, b.lng as number] as [number, number])}
          pathOptions={{ color: "#0a6d67", weight: 3, opacity: 0.8, dashArray: "6 8", lineCap: "round" }}
        />
      )}
      {userPos && (
        <Marker position={[userPos.lat, userPos.lng]} icon={userPosIcon}>
          <Popup minWidth={100}>Vous êtes ici</Popup>
        </Marker>
      )}
      {mappable.map((b) => {
        const cat = CATEGORY_MAP[b.category];
        return (
          <Marker
            key={b.id}
            ref={(el) => {
              if (el) markersRef.current[b.id] = el;
            }}
            position={[b.lat as number, b.lng as number]}
            icon={buildIcon(
              numbered
                ? `<span style="color:#fff;font-weight:800;font-family:inherit">${businesses.indexOf(b) + 1}</span>`
                : markerGlyph(b),
              cat.color,
              b.id === selectedId,
              b.id === hoveredId,
            )}
            eventHandlers={{
              click: () => onSelect(b.id),
              mouseover: () => onHover?.(b.id),
              mouseout: () => onHover?.(null),
            }}
          >
            <Popup minWidth={210}>
              <div>
                <b className="block text-sm mb-0.5">{displayName(b.name)}</b>
                <span className="flex items-center gap-1 text-xs text-gray-600 mb-1.5">
                  {(() => {
                    const CIcon = iconForKey(b.category);
                    return CIcon ? <CIcon size={13} weight="bold" aria-hidden /> : cat.emoji;
                  })()}
                  {cat.label}
                </span>
                <div className="flex items-center gap-1 text-[12.5px] text-gray-700 mb-2">
                  <CONTACT_ICONS.MapPin size={13} weight="fill" className="shrink-0 opacity-70" aria-hidden />
                  {displayCity(b.address)}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {b.phone && (
                    <a
                      href={tel(b.phone)}
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#0e8b84] text-white"
                    >
                      <CONTACT_ICONS.Phone size={13} weight="fill" aria-hidden /> Appeler
                    </a>
                  )}
                  {b.website && (
                    <a
                      href={b.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                    >
                      <CONTACT_ICONS.Globe size={13} weight="bold" aria-hidden /> {webLabel(b.website)}
                    </a>
                  )}
                  {whatsappNumber(b) && (
                    <a
                      href={whatsappContactLink(whatsappNumber(b) as string)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                    >
                      <CONTACT_ICONS.WhatsappLogo size={13} weight="fill" aria-hidden /> WhatsApp
                    </a>
                  )}
                  {b.googleMapsUrl && (
                    <details className="w-full">
                      <summary className="inline-flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-semibold cursor-pointer list-none bg-[#eef4f3] text-[#0a6d67]">
                        <CONTACT_ICONS.NavigationArrow size={13} weight="fill" aria-hidden /> Itinéraire
                      </summary>
                      <div className="flex gap-1.5 mt-1.5">
                        {[
                          { label: "Google Maps", href: b.googleMapsUrl },
                          { label: "Waze", href: `https://waze.com/ul?ll=${b.lat},${b.lng}&navigate=yes` },
                        ].map((o) => (
                          <a
                            key={o.label}
                            href={o.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                          >
                            {o.label}
                          </a>
                        ))}
                      </div>
                    </details>
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
