"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin as MapPinIcon, Search } from "lucide-react";
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { MapPin } from "@de-tin-marin/validations/checkout";
import {
  searchMapLocations,
  type MapSearchResult,
} from "@de-tin-marin/shared/map-search";
import { defaultMapPin as defaultCenter } from "./delivery-map.constants";
import type { DeliveryMapProps } from "./delivery-map.types";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

function MapViewSync({ center }: { center: MapPin }) {
  const map = useMap();

  useEffect(() => {
    map.flyTo([center.lat, center.lng], Math.max(map.getZoom(), 15), {
      duration: 0.45,
    });
  }, [center.lat, center.lng, map]);

  return null;
}

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

function StaticMarker({ position }: { position: MapPin }) {
  return (
    <Marker
      draggable={false}
      position={[position.lat, position.lng]}
      icon={markerIcon}
    />
  );
}

function LocationSearch({
  labels,
  onSelect,
}: {
  labels: NonNullable<DeliveryMapProps["labels"]["search"]>;
  onSelect: (pin: MapPin) => void;
}) {
  const listboxId = useId();
  const searchRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<MapSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 3) {
      setResults([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    const controller = new AbortController();
    setIsSearching(true);
    setSearchError(null);

    const timeout = window.setTimeout(() => {
      void (async () => {
        try {
          const nextResults = await searchMapLocations(
            trimmed,
            controller.signal,
          );
          if (controller.signal.aborted) return;
          setResults(nextResults);
          setShowResults(true);
        } catch {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(labels.searchNoResults);
        } finally {
          if (!controller.signal.aborted) {
            setIsSearching(false);
          }
        }
      })();
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [labels.searchNoResults, query]);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!searchRef.current?.contains(event.target as Node)) {
        setShowResults(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const showEmptyState =
    showResults &&
    !isSearching &&
    query.trim().length >= 3 &&
    results.length === 0;

  return (
    <div ref={searchRef} className="relative z-30">
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        {labels.searchLabel}
      </label>
      <div className="relative">
        <Search
          className="text-on-surface-variant pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2"
          aria-hidden
        />
        <input
          id={`${listboxId}-input`}
          type="search"
          value={query}
          placeholder={labels.searchPlaceholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showResults && results.length > 0}
          aria-controls={`${listboxId}-listbox`}
          aria-autocomplete="list"
          className="border-outline-variant bg-surface-container-lowest font-body text-body-md text-on-surface focus-visible:ring-primary min-h-11 w-full rounded-2xl border py-3 pl-11 pr-11 outline-none focus-visible:ring-2"
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (results.length > 0) setShowResults(true);
          }}
        />
        {isSearching ? (
          <Loader2
            className="text-on-surface-variant absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin"
            aria-hidden
          />
        ) : null}
      </div>

      {showResults && results.length > 0 ? (
        <ul
          id={`${listboxId}-listbox`}
          role="listbox"
          className="border-outline-variant/30 bg-surface-container-lowest absolute z-50 mt-2 max-h-56 w-full overflow-y-auto rounded-2xl border shadow-lg"
        >
          {results.map((result) => (
            <li
              key={`${result.lat}-${result.lng}-${result.label}`}
              role="option"
              aria-selected="false"
            >
              <button
                type="button"
                className="font-body text-body-sm text-on-surface hover:bg-surface-container-low flex w-full items-start gap-3 px-4 py-3 text-left transition-colors"
                onClick={() => {
                  onSelect({ lat: result.lat, lng: result.lng });
                  setQuery(result.label);
                  setShowResults(false);
                }}
              >
                <MapPinIcon
                  className="text-primary mt-0.5 h-4 w-4 shrink-0"
                  aria-hidden
                />
                <span>{result.label}</span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {showEmptyState || searchError ? (
        <p className="font-body text-body-sm text-on-surface-variant mt-2 px-1">
          {searchError ?? labels.searchNoResults}
        </p>
      ) : null}
    </div>
  );
}

export function DeliveryMap({
  mapPin,
  onChange,
  readOnly = false,
  labels,
}: DeliveryMapProps) {
  const isInteractive = !readOnly && typeof onChange === "function";

  return (
    <div className="space-y-3">
      {labels.title ? (
        <h3 className="font-label text-label-bold text-on-surface">
          {labels.title}
        </h3>
      ) : null}

      {isInteractive && labels.search ? (
        <LocationSearch labels={labels.search} onSelect={onChange} />
      ) : null}

      <p className="font-body text-body-sm text-on-surface-variant">
        {labels.hint}
      </p>
      <div className="border-outline-variant relative z-0 h-72 overflow-hidden rounded-2xl border">
        <MapContainer
          center={[mapPin.lat, mapPin.lng]}
          zoom={13}
          scrollWheelZoom={!readOnly}
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {isInteractive ? <MapViewSync center={mapPin} /> : null}
          {isInteractive ? (
            <DraggableMarker position={mapPin} onChange={onChange} />
          ) : (
            <StaticMarker position={mapPin} />
          )}
        </MapContainer>
      </div>
    </div>
  );
}

export { defaultCenter as defaultMapPin };
