import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet'
import L from 'leaflet'
import Header from '../components/Header'
import { storage } from '../services/storage'
import { getItems } from '../services/itemService'
import { COLLEGE } from '../lib/config'

// Custom teardrop pins (CSS-based, so no Leaflet marker image setup is needed).
const ICONS = {
  lost: L.divIcon({
    className: '',
    html: '<div class="map-pin lost"></div>',
    iconSize: [24, 32],
    iconAnchor: [12, 30],
    popupAnchor: [0, -26],
  }),
  found: L.divIcon({
    className: '',
    html: '<div class="map-pin found"></div>',
    iconSize: [24, 32],
    iconAnchor: [12, 30],
    popupAnchor: [0, -26],
  }),
}

export default function MapPage() {
  const navigate = useNavigate()
  const user = storage.getUser()
  const items = useMemo(
    () => getItems().filter((item) => item.lat && item.lng && item.status !== 'returned'),
    [],
  )

  return (
    <div className="min-h-full pb-4">
      <Header user={user} title="Campus map" back />

      <div className="px-4 pt-4">
        <div className="mb-2 flex items-center justify-between px-1">
          <div>
            <h1 className="text-sm font-extrabold text-ink">{COLLEGE.name}</h1>
            <p className="text-[10px] text-slate-400">Tap a pin to see the item.</p>
          </div>
          <div className="flex gap-1">
            <span className="pill bg-[#FDE7DF] text-lost">● {items.filter((i) => i.type === 'lost').length} lost</span>
            <span className="pill bg-[#DFF6EE] text-found">● {items.filter((i) => i.type === 'found').length} found</span>
          </div>
        </div>

        <div className="relative overflow-hidden rounded-2xl border border-white shadow-card">
          {/* legend */}
          <div className="absolute left-2.5 top-2.5 z-[400] flex gap-1.5 rounded-full bg-white/95 px-2.5 py-1.5 shadow-sm backdrop-blur">
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
              <i className="h-2 w-2 rounded-full bg-lost" /> Lost
            </span>
            <span className="flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide text-slate-500">
              <i className="h-2 w-2 rounded-full bg-found" /> Found
            </span>
          </div>

          <MapContainer
            center={[COLLEGE.lat, COLLEGE.lng]}
            zoom={COLLEGE.zoom}
            scrollWheelZoom={false}
            className="z-0 h-[calc(100dvh-225px)] min-h-[380px] w-full md:h-[560px]"
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            {items.map((item) => (
              <Marker key={item.id} position={[item.lat, item.lng]} icon={ICONS[item.type]}>
                <Popup>
                  <div className="min-w-[160px]">
                    <p
                      className="text-[8px] font-extrabold uppercase tracking-widest"
                      style={{ color: item.type === 'lost' ? '#E5572C' : '#0F9D74' }}
                    >
                      {item.type} · {item.category}
                    </p>
                    <p className="mt-0.5 text-xs font-bold text-ink">{item.title}</p>
                    <p className="mt-0.5 text-[10px] text-slate-500">{item.location}</p>
                    <button
                      onClick={() => navigate(`/item/${item.id}`)}
                      className="mt-2 w-full rounded-lg bg-navy py-1.5 text-[10px] font-bold text-white"
                    >
                      Open item
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>

        <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[9px] font-medium text-slate-400">
          📍 {COLLEGE.name} · map data © OpenStreetMap contributors
        </p>
      </div>
    </div>
  )
}
