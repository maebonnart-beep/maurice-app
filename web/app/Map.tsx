"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from "react-leaflet";
import type { CircleMarker as LeafletCircleMarker } from "leaflet";
import type { Business } from "@/lib/types";
import { CATEGORY_MAP } from "@/data/categories";
import "leaflet/dist/leaflet.css";

const GRAND_BAIE: [number, number] = [-20.0064, 57.5802];

function tel(phone: string) {
  return "tel:" + phone.replace(/[^\d+]/g, "");
}

function webLabel(url: string) {
  return url.replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/.*$/, "");
}

function MapController({
  businesses,
  selectedId,
  markersRef,
}: {
  businesses: Business[];
  selectedId: string | null;
  markersRef: React.RefObject<Record<string, LeafletCircleMarker>>;
}) {
  const map = useMap();

  useEffect(() => {
    if (businesses.length === 0) return;
    const bounds = businesses.map((b) => [b.lat, b.lng] as [number, number]);
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [businesses]);

  useEffect(() => {
    if (!selectedId) return;
    const business = businesses.find((b) => b.id === selectedId);
    const marker = markersRef.current[selectedId];
    if (!business || !marker) return;
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
}: {
  businesses: Business[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const markersRef = useRef<Record<string, LeafletCircleMarker>>({});

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
      <MapController businesses={businesses} selectedId={selectedId} markersRef={markersRef} />
      {businesses.map((b) => {
        const cat = CATEGORY_MAP[b.category];
        return (
          <CircleMarker
            key={b.id}
            ref={(el) => {
              if (el) markersRef.current[b.id] = el;
            }}
            center={[b.lat, b.lng]}
            radius={b.id === selectedId ? 10 : 8}
            pathOptions={{
              color: "#fff",
              weight: 2,
              fillColor: cat.color,
              fillOpacity: 0.92,
            }}
            eventHandlers={{ click: () => onSelect(b.id) }}
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
                  <a
                    href={b.googleMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-2 py-1.5 rounded-lg text-xs font-semibold no-underline bg-[#eef4f3] text-[#0a6d67]"
                  >
                    📍 Itinéraire
                  </a>
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
