'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Station } from '@/types/train';
import { CONFIG } from '@/lib/config';
import { Navigation, Maximize2, Compass, Plus, Minus, AlertCircle, Mountain } from 'lucide-react';
import { clsx } from 'clsx';

interface MapViewProps {
  coordinates?: [number, number]; // [lon, lat]
  heading?: number;
  speedKmH?: number;
  delayMinutes?: number;
  polyline?: [number, number][];
  stations?: Station[];
  trainName?: string;
  trainNumber?: string;
  currentStationCode?: string;
  isTopographyAvailable?: boolean;
}

// Fallback raster style in case MapTiler key or network fails
const FALLBACK_OSM_STYLE: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    'osm-tiles': {
      type: 'raster',
      tiles: [
        'https://a.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png',
        'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
      ],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'osm-tiles-layer',
      type: 'raster',
      source: 'osm-tiles',
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

export default function MapView({
  coordinates = [77.2195, 28.6429],
  heading = 0,
  speedKmH = 0,
  delayMinutes = 0,
  polyline = [],
  stations = [],
  trainName = 'Train Tracker',
  trainNumber = '',
  currentStationCode = '',
  isTopographyAvailable = true,
}: MapViewProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const trainMarkerRef = useRef<maplibregl.Marker | null>(null);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);

  const [cameraFollow, setCameraFollow] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  const hasValidCoordinates =
    Array.isArray(coordinates) &&
    coordinates.length === 2 &&
    coordinates[0] !== 0 &&
    coordinates[1] !== 0 &&
    !isNaN(coordinates[0]) &&
    !isNaN(coordinates[1]);

  const initialCenter: [number, number] = hasValidCoordinates
    ? coordinates
    : [78.9629, 20.5937]; // India center

  // 1. INITIALIZE MAP ONCE ON MOUNT
  useEffect(() => {
    if (!mapContainerRef.current) return;

    console.log('[MapView] Map initialization started...');

    const rawKey = process.env.NEXT_PUBLIC_MAPTILER_API_KEY || CONFIG.MAPTILER_API_KEY;
    const mapTilerApiKey = rawKey && !rawKey.includes('get_your_own') ? rawKey : null;

    const styleUrl = mapTilerApiKey
      ? `https://api.maptiler.com/maps/streets-v2/style.json?key=${mapTilerApiKey}`
      : FALLBACK_OSM_STYLE;

    console.log('[MapView] Using MapTiler Style URL:', typeof styleUrl === 'string' ? 'MapTiler Vector Streets' : 'Raster OSM Fallback');

    let map: maplibregl.Map;

    try {
      map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: styleUrl,
        center: initialCenter,
        zoom: hasValidCoordinates ? 8 : 5,
        pitch: 30,
        bearing: 0,
        attributionControl: false,
      });

      mapRef.current = map;

      // Handle Map Resize when container layout updates
      const resizeObserver = new ResizeObserver(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      });

      if (mapContainerRef.current) {
        resizeObserver.observe(mapContainerRef.current);
      }

      map.on('load', () => {
        console.log('[MapView] Map loaded successfully.');
        setIsMapLoaded(true);
        setMapError(null);
        map.resize();
      });

      map.on('error', (e) => {
        console.warn('[MapView] MapLibre error event, attempting raster fallback:', e);
        if (mapRef.current && styleUrl !== FALLBACK_OSM_STYLE) {
          try {
            mapRef.current.setStyle(FALLBACK_OSM_STYLE);
          } catch (err) {
            setMapError('Failed to load base map style tiles.');
          }
        }
      });

      // Force canvas resize after initial tick
      setTimeout(() => {
        if (mapRef.current) {
          mapRef.current.resize();
        }
      }, 200);

      return () => {
        resizeObserver.disconnect();
        stationMarkersRef.current.forEach((m) => m.remove());
        stationMarkersRef.current = [];
        if (trainMarkerRef.current) trainMarkerRef.current.remove();
        if (mapRef.current) mapRef.current.remove();
        mapRef.current = null;
      };
    } catch (err) {
      console.error('[MapView] Failed to initialize MapLibre GL:', err);
      setMapError('Unable to initialize map viewport.');
    }
  }, []); // Run ONCE on mount

  // 2. UPDATE ROUTE LAYERS (COMPLETED VS REMAINING)
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    // Filter ONLY stopping stations for route markers
    const stoppingStations = (stations || []).filter(
      (s) => s.isStoppingStation !== false && s.isHalt !== false
    );

    // Find current station index
    const currentIdx = stoppingStations.findIndex((s) => s.code === currentStationCode || s.passed);
    const splitPoint = currentIdx !== -1 ? currentIdx : Math.floor(stoppingStations.length / 2);

    // Build polyline geometries
    const fullPolyline = polyline.length > 0 ? polyline : stoppingStations.map((s) => [s.lon, s.lat] as [number, number]);
    const splitIndex = Math.min(
      fullPolyline.length,
      Math.max(1, Math.floor((splitPoint / Math.max(1, stoppingStations.length)) * fullPolyline.length))
    );

    const completedPolyline = fullPolyline.slice(0, splitIndex + 1);
    const remainingPolyline = fullPolyline.slice(Math.max(0, splitIndex));

    // Full Route Source
    const fullGeoJson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: fullPolyline },
    };

    const completedGeoJson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: completedPolyline.length > 1 ? completedPolyline : fullPolyline },
    };

    const remainingGeoJson: GeoJSON.Feature = {
      type: 'Feature',
      properties: {},
      geometry: { type: 'LineString', coordinates: remainingPolyline.length > 1 ? remainingPolyline : fullPolyline },
    };

    // Add or Update Sources & Layers
    if (map.getSource('route-full')) {
      (map.getSource('route-full') as maplibregl.GeoJSONSource).setData(fullGeoJson);
    } else {
      map.addSource('route-full', { type: 'geojson', data: fullGeoJson });
      map.addLayer({
        id: 'route-glow',
        type: 'line',
        source: 'route-full',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#3B82F6', 'line-width': 8, 'line-opacity': 0.2 },
      });
    }

    if (map.getSource('route-completed')) {
      (map.getSource('route-completed') as maplibregl.GeoJSONSource).setData(completedGeoJson);
    } else {
      map.addSource('route-completed', { type: 'geojson', data: completedGeoJson });
      map.addLayer({
        id: 'route-completed-line',
        type: 'line',
        source: 'route-completed',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#10B981', 'line-width': 4 },
      });
    }

    if (map.getSource('route-remaining')) {
      (map.getSource('route-remaining') as maplibregl.GeoJSONSource).setData(remainingGeoJson);
    } else {
      map.addSource('route-remaining', { type: 'geojson', data: remainingGeoJson });
      map.addLayer({
        id: 'route-remaining-line',
        type: 'line',
        source: 'route-remaining',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: { 'line-color': '#2563EB', 'line-width': 4, 'line-dasharray': [2, 1] },
      });
    }

    // 3. UPDATE PROMINENT STATION MARKERS (STOPPING STATIONS ONLY)
    stationMarkersRef.current.forEach((m) => m.remove());
    stationMarkersRef.current = [];

    stoppingStations.forEach((station, idx) => {
      const isCurrent = station.code === currentStationCode;
      const isNext = !isCurrent && idx === (currentIdx !== -1 ? currentIdx + 1 : 1);
      const isPassed = station.passed || idx < currentIdx;

      const el = document.createElement('div');

      if (isCurrent) {
        // 🟢 LIVE CURRENT STATION MARKER
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <div class="absolute h-8 w-8 rounded-full bg-blue-500/30 animate-ping"></div>
          <div class="flex items-center gap-1.5 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-black text-white shadow-xl ring-2 ring-white">
            <span class="h-2 w-2 rounded-full bg-green-400 animate-pulse"></span>
            🟢 LIVE ${station.code}
          </div>
        `;
      } else if (isNext) {
        // NEXT STOP MARKER
        el.className = 'relative flex items-center justify-center cursor-pointer';
        el.innerHTML = `
          <div class="flex items-center gap-1 rounded-full bg-indigo-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-md ring-2 ring-white">
            NEXT: ${station.code}
          </div>
        `;
      } else {
        // NORMAL HALT MARKER
        el.className = isPassed
          ? 'h-3.5 w-3.5 rounded-full bg-green-500 border-2 border-white shadow-md ring-1 ring-green-300 cursor-pointer'
          : 'h-3.5 w-3.5 rounded-full bg-white border-2 border-blue-600 shadow-md ring-1 ring-blue-300 cursor-pointer';
      }

      const popupHtml = `
        <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 6px; line-height: 1.4; max-width: 200px;">
          <div style="display: flex; items-center; justify-content: space-between;">
            <strong style="color: #111827; font-size: 13px;">${station.name} (${station.code})</strong>
          </div>
          <div style="margin-top: 4px; color: ${isCurrent ? '#2563eb' : isNext ? '#4f46e5' : '#059669'}; font-weight: 700;">
            ${isCurrent ? '🟢 LIVE CURRENT STATION' : isNext ? '→ NEXT SCHEDULED STOP' : 'SCHEDULED HALT'}
          </div>
          <div style="margin-top: 4px; color: #4b5563;">
            Arr: <strong>${station.arrivalTime || '--:--'}</strong> | Dep: <strong>${station.departureTime || '--:--'}</strong><br/>
            Distance: <strong>${station.distanceKm} km</strong> | PF: <strong>${station.platform || 'N/A'}</strong>
          </div>
          ${station.delayMinutes !== undefined ? `<div style="margin-top: 4px; font-weight: 600; color: ${station.delayMinutes === 0 ? '#16a34a' : '#d97706'};">${station.delayMinutes === 0 ? 'On Time' : `+${station.delayMinutes} min Delay`}</div>` : ''}
        </div>
      `;

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([station.lon, station.lat])
        .setPopup(new maplibregl.Popup({ offset: 12 }).setHTML(popupHtml))
        .addTo(map);

      stationMarkersRef.current.push(marker);
    });
  }, [polyline, stations, currentStationCode, isMapLoaded]);

  // 4. UPDATE LIVE TRAIN MARKER POSITION & CAMERA
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !isMapLoaded) return;

    if (hasValidCoordinates) {
      if (!trainMarkerRef.current) {
        const trainEl = document.createElement('div');
        trainEl.className =
          'flex items-center justify-center h-10 w-10 rounded-full bg-blue-600 border-2 border-white shadow-2xl text-white transform transition-transform duration-700 ring-4 ring-blue-500/30 cursor-pointer';
        trainEl.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <rect width="16" height="16" x="4" y="3" rx="3"></rect>
            <path d="M4 11h16"></path>
            <path d="M12 3v8"></path>
            <path d="m8 19-2 3"></path>
            <path d="m18 22-2-3"></path>
            <circle cx="8" cy="15" r="1"></circle>
            <circle cx="16" cy="15" r="1"></circle>
          </svg>
        `;

        const trainPopup = new maplibregl.Popup({ offset: 14 }).setHTML(`
          <div style="font-family: system-ui, sans-serif; font-size: 12px; padding: 6px; line-height: 1.4;">
            <strong style="font-size: 13px; color: #1d4ed8;">🚆 ${trainName}</strong><br/>
            Speed: <strong>${speedKmH} km/h</strong><br/>
            Status: <strong>${delayMinutes === 0 ? 'On Time' : `${delayMinutes} mins Delay`}</strong>
          </div>
        `);

        trainMarkerRef.current = new maplibregl.Marker({ element: trainEl })
          .setLngLat(coordinates)
          .setPopup(trainPopup)
          .addTo(map);
      } else {
        trainMarkerRef.current.setLngLat(coordinates);
      }

      if (cameraFollow) {
        map.easeTo({ center: coordinates, zoom: 8, duration: 1000 });
      }
    } else {
      if (trainMarkerRef.current) {
        trainMarkerRef.current.remove();
        trainMarkerRef.current = null;
      }
    }
  }, [coordinates, cameraFollow, isMapLoaded, hasValidCoordinates, speedKmH, delayMinutes, trainName]);

  // Controls Handlers
  const handleZoomIn = () => {
    if (mapRef.current) mapRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (mapRef.current) mapRef.current.zoomOut();
  };

  const handleRecenter = () => {
    if (mapRef.current && hasValidCoordinates) {
      mapRef.current.flyTo({ center: coordinates, zoom: 9, pitch: 30 });
      setCameraFollow(true);
    }
  };

  const handleFitRoute = () => {
    if (!mapRef.current) return;
    const stoppingStations = (stations || []).filter((s) => s.isStoppingStation !== false && s.isHalt !== false);
    const points = polyline.length > 0 ? polyline : stoppingStations.map((s) => [s.lon, s.lat] as [number, number]);

    if (points.length === 0) return;

    const bounds = points.reduce(
      (b, pt) => b.extend(pt as [number, number]),
      new maplibregl.LngLatBounds(points[0], points[0])
    );

    mapRef.current.fitBounds(bounds, { padding: 50, duration: 1000 });
    setCameraFollow(false);
  };

  return (
    <div className="relative h-[480px] min-h-[360px] w-full overflow-hidden rounded-3xl border border-gray-100 bg-slate-100 shadow-xl shadow-gray-200/50">
      <div ref={mapContainerRef} className="h-full w-full absolute inset-0" />

      {/* Error Fallback Banner */}
      {mapError && (
        <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between rounded-2xl bg-amber-500/90 px-4 py-2.5 text-xs font-bold text-white shadow-lg backdrop-blur-md">
          <span className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {mapError} Showing fallback base map.
          </span>
          <button onClick={() => setMapError(null)} className="underline text-[11px]">
            Dismiss
          </button>
        </div>
      )}

      {/* Floating Map Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col gap-1.5 rounded-2xl border border-white/40 bg-white/85 p-2 shadow-lg backdrop-blur-md">
        <button
          onClick={handleRecenter}
          className={clsx(
            'flex h-9 w-9 items-center justify-center rounded-xl transition-colors',
            cameraFollow ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-700 hover:bg-gray-100'
          )}
          title="Recenter on Train"
        >
          <Navigation className="h-4 w-4" />
        </button>

        <button
          onClick={handleFitRoute}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          title="Fit Complete Route Bounds"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <button
          onClick={handleZoomIn}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-bold text-lg"
          title="Zoom In"
        >
          <Plus className="h-4 w-4" />
        </button>

        <button
          onClick={handleZoomOut}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors font-bold text-lg"
          title="Zoom Out"
        >
          <Minus className="h-4 w-4" />
        </button>

        <button
          onClick={() => {
            if (mapRef.current) mapRef.current.resetNorthPitch();
          }}
          className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-700 hover:bg-gray-100 transition-colors"
          title="Reset Compass"
        >
          <Compass className="h-4 w-4" />
        </button>
      </div>

      {/* Top Left Badges: Live GPS & Topography Status */}
      <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 pointer-events-none">
        {/* Live Train Coordinates Availability Banner */}
        {!hasValidCoordinates && (
          <div className="flex items-center gap-2 rounded-2xl border border-amber-200 bg-amber-50/90 px-3.5 py-2 text-xs font-bold text-amber-800 shadow-md backdrop-blur-md">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>Live train location currently unavailable</span>
          </div>
        )}

        {/* Topography Status Banner */}
        <div className="inline-flex items-center gap-2 rounded-2xl border border-white/40 bg-white/85 px-3 py-1.5 text-[11px] font-bold text-gray-700 shadow-md backdrop-blur-md">
          <Mountain className="h-3.5 w-3.5 text-emerald-600" />
          <span>{isTopographyAvailable ? 'Topography Profile Active' : 'Topography Data Unavailable'}</span>
        </div>
      </div>

      {/* Bottom Live Info Badge */}
      <div className="absolute bottom-4 left-4 z-10 flex items-center gap-3 rounded-2xl border border-white/40 bg-white/85 px-4 py-2.5 shadow-lg backdrop-blur-md pointer-events-none">
        <div className="h-3 w-3 rounded-full bg-blue-600 animate-ping shrink-0" />
        <div className="text-xs font-bold text-gray-900">
          Route Map: <span className="text-blue-600">{trainName}</span>
          {trainNumber && <span className="text-gray-400 font-normal"> (#{trainNumber})</span>}
        </div>
      </div>
    </div>
  );
}
