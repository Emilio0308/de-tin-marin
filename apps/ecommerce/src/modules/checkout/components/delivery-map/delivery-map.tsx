"use client";

import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import { defaultMapPin as defaultCenter } from "./delivery-map.constants";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function DraggableMarker({
  position,
  onChange,
}: {
  position: MapPin;
  onChange: (pin: MapPin) => void;
}) {
  useMapEvents({
    click(event) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return (
    <Marker
      draggable
      position={[position.lat, position.lng]}
      icon={markerIcon}
      eventHandlers={{
        dragend(event) {
          const marker = event.target as L.Marker;
          const latlng = marker.getLatLng();
          onChange({ lat: latlng.lat, lng: latlng.lng });
        },
      }}
    />
  );
}

import type { DeliveryMapProps } from "./delivery-map.types";

export function DeliveryMap({ mapPin, onChange, labels }: DeliveryMapProps) {
  return (
    <div className="space-y-2">
      <h3 className="font-label text-label-bold text-on-surface">
        {labels.title}
      </h3>
      <p className="font-body text-body-sm text-on-surface-variant">
        {labels.hint}
      </p>
      <div className="border-outline-variant h-72 overflow-hidden rounded-2xl border">
        <MapContainer
          center={[mapPin.lat, mapPin.lng]}
          zoom={13}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <DraggableMarker position={mapPin} onChange={onChange} />
        </MapContainer>
      </div>
    </div>
  );
}

export { defaultCenter as defaultMapPin };
