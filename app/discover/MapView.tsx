"use client";

import { useEffect, useRef } from "react";
import "leaflet/dist/leaflet.css";

export type MapPoint = { id: string; name: string; lat: number; lng: number };

export default function MapView({
  points,
  onSelect,
}: {
  points: MapPoint[];
  onSelect: (id: string) => void;
}) {
  const elRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const layerRef = useRef<any>(null);
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !elRef.current || mapRef.current) return;
      const map = L.map(elRef.current, {
        zoomControl: false,
        // Attributie blijft staan (OSM/CARTO vereisen bronvermelding), maar wordt
        // via CSS donker/subtiel gemaakt zodat 'ie niet opvalt op de donkere kaart.
        attributionControl: true,
      }).setView([52.3676, 4.9041], 13);
      // Keyless: gewone OpenStreetMap-tegels + een donker CSS-filter (zie
      // .dinely-darktiles in globals.css). Geen API-sleutel nodig, altijd donker.
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        className: "dinely-darktiles",
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      }).addTo(map);
      // "Leaflet"-prefix weg (niet verplicht); OSM/CARTO-bronvermelding blijft.
      map.attributionControl.setPrefix(false);
      mapRef.current = map;
      layerRef.current = L.layerGroup().addTo(map);
      draw(L);
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    (async () => {
      if (!mapRef.current) return;
      const L = (await import("leaflet")).default;
      draw(L);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function draw(L: any) {
    if (!layerRef.current) return;
    layerRef.current.clearLayers();
    const icon = L.divIcon({
      className: "",
      html: '<div style="width:16px;height:16px;border-radius:50%;background:#B9C0C9;border:2px solid #1A1D21;box-shadow:0 0 0 3px rgba(200,208,218,.30)"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8],
    });
    const pts: [number, number][] = [];
    for (const p of points) {
      const m = L.marker([p.lat, p.lng], { icon }).addTo(layerRef.current);
      // Klik op de marker toont een klein klikbaar naampje -> naar het restaurant.
      const el = document.createElement("button");
      el.textContent = p.name;
      el.className = "dinely-pop";
      el.addEventListener("click", (e) => {
        e.preventDefault();
        onSelectRef.current(p.id);
      });
      m.bindPopup(el, {
        closeButton: false,
        className: "dinely-popwrap",
        offset: [0, -8],
      });
      pts.push([p.lat, p.lng]);
    }
    if (pts.length > 1) {
      mapRef.current.fitBounds(pts, { padding: [40, 40], maxZoom: 14 });
    }
  }

  return <div ref={elRef} style={{ position: "absolute", inset: 0 }} />;
}
