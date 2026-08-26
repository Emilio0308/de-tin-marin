"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Loader2, MapPin, Search } from "lucide-react";
import { MapContainer, Marker, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { cn } from "@de-tin-marin/shared/cn";
import { isValidMapPin, resolveMapPin } from "./pickup-points.helpers";
import {
  searchMapLocations,
  type MapSearchResult,
} from "./pickup-point-map.helpers";

const markerIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl:
    "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

type MapPin = { lat: number; lng: number };

function MapViewSync({ center }: { center: MapPin }) {
  const map = useMap();
  const { lat, lng } = center;

  useEffect(() => {
    if (!isValidMapPin({ lat, lng })) return;

    const zoom = map.getZoom();
    if (!Number.isFinite(zoom)) return;

    map.flyTo([lat, lng], Math.max(zoom, 15), {
      duration: 0.45,
    });
  }, [lat, lng, map]);

  return null;
}

function MapResizeOnVisible({ visible }: { visible: boolean }) {
  const map = useMap();

  useEffect(() => {
    if (!visible) return;

    const frame = window.requestAnimationFrame(() => {
      map.invalidateSize();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [map, visible]);

  return null;
}

function MapClickHandler({ onChange }: { onChange: (pin: MapPin) => void }) {
  const map = useMap();

  useEffect(() => {
    function handleClick(event: L.LeafletMouseEvent) {
      onChange({ lat: event.latlng.lat, lng: event.latlng.lng });
    }

    map.on("click", handleClick);
    return () => {
      map.off("click", handleClick);
    };
  }, [map, onChange]);

  return null;
}

function DraggableMarker({
  position,
  onChange,
}: {
  position: MapPin;
  onChange: (pin: MapPin) => void;
}) {
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

export type PickupPointMapLabels = {
  hint: string;
  searchLabel: string;
  searchPlaceholder: string;
  searchNoResults: string;
};

export function PickupPointMap({
  mapPin,
  onChange,
  labels,
  visible = true,
}: {
  mapPin: MapPin;
  onChange: (pin: MapPin) => void;
  labels: PickupPointMapLabels;
  visible?: boolean;
}) {
  const resolvedPin = resolveMapPin(mapPin);
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

  function handleSelectResult(result: MapSearchResult) {
    onChange({ lat: result.lat, lng: result.lng });
    setQuery(result.label);
    setShowResults(false);
  }

  const showEmptyState =
    showResults &&
    !isSearching &&
    query.trim().length >= 3 &&
    results.length === 0;

  return (
    <div className="space-y-3">
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
            className="border-outline-variant/40 focus:border-secondary bg-surface-container-low font-body text-body-md text-on-surface w-full rounded-xl border-2 py-3 pl-11 pr-11 outline-none transition-colors"
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
                  onClick={() => handleSelectResult(result)}
                >
                  <MapPin
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

      <p className="font-body text-body-sm text-on-surface-variant">
        {labels.hint}
      </p>

      <div
        className={cn(
          "border-outline-variant/30 relative z-0 overflow-hidden rounded-2xl border",
          "h-[min(28rem,55vh)] min-h-72 w-full",
        )}
      >
        <MapContainer
          center={[resolvedPin.lat, resolvedPin.lng]}
          zoom={14}
          scrollWheelZoom
          className="h-full w-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapResizeOnVisible visible={visible} />
          <MapViewSync center={resolvedPin} />
          <MapClickHandler onChange={onChange} />
          <DraggableMarker position={resolvedPin} onChange={onChange} />
        </MapContainer>
      </div>
    </div>
  );
}
