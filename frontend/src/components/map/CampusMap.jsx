import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle } from 'lucide-react';
import L from 'leaflet';

// Stable campus center coordinates for LPU
const DEFAULT_LPU_CENTER = [31.2530, 75.7045];

/**
 * Validate GPS coordinates against physical boundaries and integrity rules.
 * Rejects null, undefined, empty strings, NaN, non-finite values,
 * coordinates outside physical limits (-90..90 lat, -180..180 lng),
 * and origin clamps (0, 0).
 */
function isValidCoordinate(latitude, longitude) {
  if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
    return false;
  }
  if (typeof latitude === 'string' && latitude.trim() === '') return false;
  if (typeof longitude === 'string' && longitude.trim() === '') return false;

  const lat = Number(latitude);
  const lng = Number(longitude);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  if (lat < -90 || lat > 90) return false;
  if (lng < -180 || lng > 180) return false;
  if (lat === 0 && lng === 0) return false;

  return true;
}

// Category color mappings for custom marker pins
const CATEGORY_COLORS = {
  academic: { bg: '#2563eb', border: '#1d4ed8', text: '#ffffff' }, // Blue
  sports: { bg: '#059669', border: '#047857', text: '#ffffff' },   // Green
  dining: { bg: '#d97706', border: '#b45309', text: '#ffffff' },   // Amber
  cafeteria: { bg: '#d97706', border: '#b45309', text: '#ffffff' },
  hostel: { bg: '#4f46e5', border: '#4338ca', text: '#ffffff' },   // Indigo
  administrative: { bg: '#475569', border: '#334155', text: '#ffffff' }, // Slate
  library: { bg: '#7c3aed', border: '#6d28d9', text: '#ffffff' },  // Purple
  laboratory: { bg: '#0891b2', border: '#0e7490', text: '#ffffff' }, // Cyan
  default: { bg: '#64748b', border: '#475569', text: '#ffffff' },
};

function getCategoryColor(categoryName = '') {
  const normalized = (categoryName || '').toLowerCase().trim();
  for (const key of Object.keys(CATEGORY_COLORS)) {
    if (normalized.includes(key)) {
      return CATEGORY_COLORS[key];
    }
  }
  return CATEGORY_COLORS.default;
}

function createPinIcon(facility, isMiniMap = false, isSelected = false) {
  const categoryName = facility.category?.name || facility.category_name;
  const color = getCategoryColor(categoryName);
  const size = isMiniMap ? 28 : (isSelected ? 38 : 32);
  const iconSize = [size, size + 8];
  const iconAnchor = [size / 2, size + 8];

  const svgPin = `
    <div style="position: relative; width: ${size}px; height: ${size + 8}px; display: flex; flex-direction: column; align-items: center; cursor: pointer; filter: drop-shadow(0 3px 5px rgba(0,0,0,0.3)); transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'}; transition: transform 0.2s;">
      <svg width="${size}" height="${size + 8}" viewBox="0 0 32 40" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M16 0C7.16344 0 0 7.16344 0 16C0 26 16 40 16 40C16 40 32 26 32 16C32 7.16344 24.8366 0 16 0Z" fill="${color.bg}" stroke="${isSelected ? '#facc15' : color.border}" stroke-width="${isSelected ? '2.5' : '1.5'}"/>
        <circle cx="16" cy="15" r="7" fill="white" />
        <circle cx="16" cy="15" r="4" fill="${color.bg}" />
      </svg>
    </div>
  `;

  return L.divIcon({
    className: 'custom-map-marker',
    html: svgPin,
    iconSize,
    iconAnchor,
    popupAnchor: [0, -(size + 4)],
  });
}

export default function CampusMap({
  facilities = [],
  selectedFacilityId = null,
  onMarkerSelect = null,
  height = '100%',
  initialCenter = DEFAULT_LPU_CENTER,
  initialZoom = 16,
  isMiniMap = false,
  tileUrl = import.meta.env.VITE_MAP_TILE_URL || 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
  attribution = import.meta.env.VITE_MAP_TILE_ATTRIBUTION || '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors',
}) {
  const [tileError, setTileError] = useState(false);
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersLayerRef = useRef(null);
  const markerMapRef = useRef(new Map());
  const navigate = useNavigate();

  // Stabilize scalar center values to prevent accidental remounts
  const centerLat = initialCenter?.[0] ?? DEFAULT_LPU_CENTER[0];
  const centerLng = initialCenter?.[1] ?? DEFAULT_LPU_CENTER[1];

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Bounds around LPU campus with modest buffer
    const campusBounds = [
      [31.235, 75.685], // South-West
      [31.270, 75.725], // North-East
    ];

    const map = L.map(mapContainerRef.current, {
      center: [centerLat, centerLng],
      zoom: initialZoom,
      minZoom: 14,
      maxZoom: 19,
      maxBounds: campusBounds,
      maxBoundsViscosity: 0.8,
      zoomControl: !isMiniMap,
      scrollWheelZoom: !isMiniMap,
      attributionControl: true,
    });

    // Configurable Tile Layer with OpenStreetMap default
    const tileLayer = L.tileLayer(tileUrl, {
      attribution,
      maxZoom: 19,
      crossOrigin: true,
    }).addTo(map);

    const handleTileError = () => {
      setTileError(true);
    };

    tileLayer.on('tileerror', handleTileError);

    // Marker Layer Group
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Ensure map tiles resize correctly once container dimensions settle
    const resizeTimer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    const markerMap = markerMapRef.current;

    return () => {
      clearTimeout(resizeTimer);
      tileLayer.off('tileerror', handleTileError);
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersLayerRef.current = null;
        markerMap.clear();
      }
    };
  }, [tileUrl, attribution, centerLat, centerLng, initialZoom, isMiniMap]);

  // Update Markers when facilities or selectedFacilityId change
  useEffect(() => {
    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;
    if (!map || !markersLayer) return;

    markersLayer.clearLayers();
    markerMapRef.current.clear();

    const validFacilities = facilities.filter((f) => isValidCoordinate(f.latitude, f.longitude));

    if (validFacilities.length === 0) return;

    const latLngBounds = [];

    validFacilities.forEach((facility) => {
      const lat = parseFloat(facility.latitude);
      const lon = parseFloat(facility.longitude);
      const isSelected = String(facility.id) === String(selectedFacilityId);

      const icon = createPinIcon(facility, isMiniMap, isSelected);
      const marker = L.marker([lat, lon], { icon });

      // Safe DOM construction for popup to prevent HTML injection
      const categoryName = facility.category?.name || facility.category_name || 'General';
      const categoryColor = getCategoryColor(categoryName);
      const popupDiv = document.createElement('div');
      popupDiv.className = 'p-3 font-sans max-w-[260px] text-slate-800';

      // 1. Header Row (Name + Status Badge)
      const headerRow = document.createElement('div');
      headerRow.className = 'flex items-start justify-between gap-2';

      const titleEl = document.createElement('div');
      titleEl.className = 'font-semibold text-sm text-slate-900 leading-snug';
      titleEl.textContent = facility.name || 'Unnamed Facility';
      headerRow.appendChild(titleEl);

      const statusBadge = document.createElement('span');
      statusBadge.className = facility.is_active
        ? 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-100 text-emerald-800 shrink-0'
        : 'inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-rose-100 text-rose-800 shrink-0';
      statusBadge.textContent = facility.is_active ? 'Active' : 'Inactive';
      headerRow.appendChild(statusBadge);
      popupDiv.appendChild(headerRow);

      // 2. Category Pill
      const catContainer = document.createElement('div');
      catContainer.className = 'mt-1';
      const catBadge = document.createElement('span');
      catBadge.className = 'inline-block text-[11px] font-medium px-2 py-0.5 rounded-full text-white';
      catBadge.style.backgroundColor = categoryColor.bg;
      catBadge.textContent = categoryName;
      catContainer.appendChild(catBadge);
      popupDiv.appendChild(catContainer);

      // 3. Building Info (safe textContent)
      if (facility.building) {
        const bldgEl = document.createElement('div');
        bldgEl.className = 'text-xs text-slate-500 mt-1 flex items-center gap-1';

        const bldgName = document.createElement('span');
        bldgName.className = 'font-medium text-slate-700';
        bldgName.textContent = facility.building;
        bldgEl.appendChild(bldgName);

        if (facility.floor) {
          const floorSpan = document.createElement('span');
          floorSpan.textContent = `• Floor ${facility.floor}`;
          bldgEl.appendChild(floorSpan);
        }
        popupDiv.appendChild(bldgEl);
      }

      // 4. Operating Hours (safe textContent)
      if (facility.operating_hours) {
        const hoursEl = document.createElement('div');
        hoursEl.className = 'text-[11px] text-slate-500 mt-1 truncate';
        hoursEl.textContent = `🕒 ${facility.operating_hours}`;
        popupDiv.appendChild(hoursEl);
      }

      // 5. Action Button with query string preservation in state
      if (!isMiniMap) {
        const actionRow = document.createElement('div');
        actionRow.className = 'mt-2.5 pt-2 border-t border-slate-100';

        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'view-facility-btn w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-md shadow-xs transition-colors flex items-center justify-center gap-1 cursor-pointer';

        const btnLabel = document.createElement('span');
        btnLabel.textContent = 'View Details';
        const btnArrow = document.createElement('span');
        btnArrow.textContent = ' →';

        btn.appendChild(btnLabel);
        btn.appendChild(btnArrow);

        btn.addEventListener('click', () => {
          if (onMarkerSelect) {
            onMarkerSelect(facility);
          }
          navigate(`/facilities/${facility.id}`, {
            state: {
              fromMap: true,
              mapSearch: window.location.search || '',
            },
          });
        });

        actionRow.appendChild(btn);
        popupDiv.appendChild(actionRow);
      }

      marker.bindPopup(popupDiv, {
        closeButton: true,
        className: 'rounded-xl shadow-lg',
      });

      marker.on('click', () => {
        if (onMarkerSelect) {
          onMarkerSelect(facility);
        }
      });

      markersLayer.addLayer(marker);
      markerMapRef.current.set(String(facility.id), marker);
      latLngBounds.push([lat, lon]);
    });

    // Auto-center or fit bounds
    if (selectedFacilityId && markerMapRef.current.has(String(selectedFacilityId))) {
      const selectedMarker = markerMapRef.current.get(String(selectedFacilityId));
      const targetLatLng = selectedMarker.getLatLng();
      map.setView(targetLatLng, Math.max(map.getZoom(), 17), { animate: true });
      selectedMarker.openPopup();
    } else if (isMiniMap && validFacilities.length === 1) {
      const f = validFacilities[0];
      map.setView([parseFloat(f.latitude), parseFloat(f.longitude)], 17);
    } else if (latLngBounds.length > 1 && !isMiniMap) {
      // Fit bounds to display all filtered markers smoothly
      map.fitBounds(latLngBounds, { padding: [50, 50], maxZoom: 17 });
    }
  }, [facilities, selectedFacilityId, isMiniMap, onMarkerSelect, navigate]);

  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-slate-200 shadow-sm" style={{ height }}>
      {tileError && (
        <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1.5 rounded-lg bg-amber-500/95 text-white text-xs font-medium shadow-md flex items-center gap-1.5 pointer-events-none">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          <span>Map tiles could not be loaded. Please check your network connection.</span>
        </div>
      )}
      <div ref={mapContainerRef} className="w-full h-full" />
    </div>
  );
}
