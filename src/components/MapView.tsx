import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import L from 'leaflet'
import type { Company } from '../types/company'
import { CompanyStatus, STATUS_COLORS, STATUS_LABELS } from '../types/company'

interface MapViewProps {
    companies: Company[]
    filteredStatuses: CompanyStatus[]
    onMapClick: (lat: number, lng: number) => void
    selectedCoords: { lat: number; lng: number } | null
    focusCompany: Company | null
    currentUserId: string | null
    onEdit: (company: Company) => void
}

function createColoredIcon(color: string): L.DivIcon {
    return L.divIcon({
        className: 'custom-marker',
        html: `
      <div style="
        width: 28px;
        height: 28px;
        border-radius: 50% 50% 50% 0;
        background: ${color};
        transform: rotate(-45deg);
        border: 3px solid rgba(255,255,255,0.9);
        box-shadow: 0 4px 12px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.1);
        position: relative;
      ">
        <div style="
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: rgba(255,255,255,0.9);
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        "></div>
      </div>
    `,
        iconSize: [28, 28],
        iconAnchor: [14, 28],
        popupAnchor: [0, -28],
    })
}

const clickIcon = L.divIcon({
    className: 'click-marker',
    html: `
    <div style="
      width: 20px;
      height: 20px;
      border-radius: 50%;
      background: rgba(99, 102, 241, 0.6);
      border: 3px solid #6366f1;
      box-shadow: 0 0 20px rgba(99, 102, 241, 0.5);
      animation: pulse 1.5s ease-in-out infinite;
    "></div>
    <style>
      @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.3); }
      }
    </style>
  `,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
})

function MapClickHandler({ onClick }: { onClick: (lat: number, lng: number) => void }) {
    useMapEvents({
        click(e) {
            onClick(e.latlng.lat, e.latlng.lng)
        },
    })
    return null
}

function MapResizer() {
    const map = useMap()
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 200)
        return () => clearTimeout(timer)
    }, [map])
    return null
}

function MapFocusHandler({ company }: { company: Company | null }) {
    const map = useMap()
    useEffect(() => {
        if (company) {
            map.flyTo([company.latitude, company.longitude], 12, {
                duration: 1.5,
                easeLinearity: 0.25
            })
        }
    }, [company, map])
    return null
}

function getAverageRating(company: Company): string {
    const avg = (company.ratingSalary + company.ratingStability + company.ratingCulture) / 3
    return avg.toFixed(1)
}

function renderStars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

import { useTheme } from '../context/ThemeContext'

export default function MapView({ companies, filteredStatuses, onMapClick, selectedCoords, focusCompany, currentUserId, onEdit }: MapViewProps) {
    const { theme } = useTheme()
    const filtered = companies.filter((c) => filteredStatuses.includes(c.status as CompanyStatus))

    const tileUrl = theme === 'dark'
        ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        : "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"

    return (
        <MapContainer
            center={[-6.2, 106.816]}
            zoom={6}
            className="w-full h-full"
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url={tileUrl}
            />
            <MapClickHandler onClick={onMapClick} />
            <MapResizer />
            <MapFocusHandler company={focusCompany} />

            {selectedCoords && (
                <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={clickIcon} />
            )}

            {filtered.map((company) => (
                <Marker
                    key={`${company.id}-${company.status}`}
                    position={[company.latitude, company.longitude]}
                    icon={createColoredIcon(STATUS_COLORS[company.status as CompanyStatus])}
                >
                    <Popup>
                        <div className="min-w-[200px] p-1">
                            <h3 className="text-base font-bold mb-2 pb-2 border-b border-border/30 text-text">
                                {company.name}
                            </h3>
                            <div className="flex flex-col gap-1.5 text-sm">
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Status</span>
                                    <span style={{
                                        background: STATUS_COLORS[company.status as CompanyStatus] + '22',
                                        color: STATUS_COLORS[company.status as CompanyStatus],
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        fontSize: '11px',
                                        border: `1px solid ${STATUS_COLORS[company.status as CompanyStatus]}44`
                                    }}>
                                        {STATUS_LABELS[company.status as CompanyStatus]}
                                    </span>
                                </div>
                                {company.user && (
                                    <div className="flex justify-between items-center opacity-80 py-0.5">
                                        <span className="text-text-muted text-[11px]">Pinned by</span>
                                        <span className="text-primary font-bold text-[11px] truncate max-w-[120px] text-right">
                                            {company.user.name}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Sub-Sector</span>
                                    <span className="text-text font-medium opacity-90">{company.subSector}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-text-muted">Rating</span>
                                    <span className="text-warning letter-spacing-[2px]">
                                        {renderStars(parseFloat(getAverageRating(company)))}
                                        <span className="text-text-muted ml-1.5 opacity-80 letter-spacing-0">
                                            {getAverageRating(company)}
                                        </span>
                                    </span>
                                </div>
                                {company.notes && (
                                    <div className="mt-1 p-2 bg-surface-lighter/50 rounded-lg text-xs text-text-muted leading-relaxed border border-border/20">
                                        📝 {company.notes}
                                    </div>
                                )}
                                {company.userId === currentUserId && (
                                    <div className="mt-3 pt-2 border-t border-border/20 flex flex-col gap-2">
                                        <button
                                            onClick={() => onEdit(company)}
                                            className="w-full py-1.5 px-3 bg-primary text-white text-[11px] font-bold rounded-lg hover:bg-primary-dark transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                                        >
                                            ✏️ Edit This Tracker
                                        </button>
                                        <p className="text-[10px] text-text-muted text-center opacity-60">
                                            or manually edit in sidebar
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    )
}
