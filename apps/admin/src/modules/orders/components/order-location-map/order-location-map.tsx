"use client";

import { MapContainer, Marker, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { OrderLocationMapProps } from "./order-location-map.types";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

export function OrderLocationMap({
  mapPin,
  fulfillmentMethod,
  labels,
}: OrderLocationMapProps) {
  if (fulfillmentMethod === "pickup" || !mapPin) {
    return (
      <div className="border-outline-variant/30 bg-surface-container-low rounded-2xl border p-6">
        <h3 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h3>
        <p className="font-body text-body-sm text-on-surface-variant mt-2">
          {labels.unavailable}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <h3 className="font-label text-label-bold text-on-surface">
        {labels.title}
      </h3>
      <p className="font-body text-body-sm text-on-surface-variant">
        {labels.hint}
      </p>
      <div className="border-outline-variant/30 h-72 overflow-hidden rounded-2xl border">
        <MapContainer
          center={[mapPin.lat, mapPin.lng]}
          zoom={15}
          scrollWheelZoom={false}
          dragging={false}
          doubleClickZoom={false}
          touchZoom={false}
          boxZoom={false}
          keyboard={false}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <Marker position={[mapPin.lat, mapPin.lng]} icon={markerIcon} />
        </MapContainer>
      </div>
    </div>
  );
}
