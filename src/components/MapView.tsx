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

function getAverageRating(company: Company): string {
    const avg = (company.ratingSalary + company.ratingStability + company.ratingCulture) / 3
    return avg.toFixed(1)
}

function renderStars(rating: number): string {
    return '★'.repeat(Math.round(rating)) + '☆'.repeat(5 - Math.round(rating))
}

export default function MapView({ companies, filteredStatuses, onMapClick, selectedCoords }: MapViewProps) {
    const filtered = companies.filter((c) => filteredStatuses.includes(c.status as CompanyStatus))

    return (
        <MapContainer
            center={[-6.2, 106.816]}
            zoom={6}
            className="w-full h-full"
            zoomControl={true}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            />
            <MapClickHandler onClick={onMapClick} />
            <MapResizer />

            {selectedCoords && (
                <Marker position={[selectedCoords.lat, selectedCoords.lng]} icon={clickIcon} />
            )}

            {filtered.map((company) => (
                <Marker
                    key={company.id}
                    position={[company.latitude, company.longitude]}
                    icon={createColoredIcon(STATUS_COLORS[company.status as CompanyStatus])}
                >
                    <Popup>
                        <div style={{ minWidth: '200px', padding: '4px' }}>
                            <h3 style={{
                                fontSize: '16px',
                                fontWeight: 700,
                                marginBottom: '8px',
                                color: '#f8fafc',
                                borderBottom: '1px solid #334155',
                                paddingBottom: '8px'
                            }}>
                                {company.name}
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '13px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8' }}>Status</span>
                                    <span style={{
                                        background: STATUS_COLORS[company.status as CompanyStatus] + '22',
                                        color: STATUS_COLORS[company.status as CompanyStatus],
                                        padding: '2px 10px',
                                        borderRadius: '12px',
                                        fontWeight: 600,
                                        fontSize: '12px',
                                        border: `1px solid ${STATUS_COLORS[company.status as CompanyStatus]}44`
                                    }}>
                                        {STATUS_LABELS[company.status as CompanyStatus]}
                                    </span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                    <span style={{ color: '#94a3b8' }}>Sub-Sector</span>
                                    <span style={{ color: '#e2e8f0', fontWeight: 500 }}>{company.subSector}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <span style={{ color: '#94a3b8' }}>Rating</span>
                                    <span style={{ color: '#fbbf24', letterSpacing: '2px' }}>
                                        {renderStars(parseFloat(getAverageRating(company)))}
                                        <span style={{ color: '#e2e8f0', marginLeft: '6px', letterSpacing: '0' }}>
                                            {getAverageRating(company)}
                                        </span>
                                    </span>
                                </div>
                                {company.notes && (
                                    <div style={{
                                        marginTop: '4px',
                                        padding: '8px',
                                        background: '#0f172a',
                                        borderRadius: '8px',
                                        fontSize: '12px',
                                        color: '#cbd5e1',
                                        lineHeight: '1.5'
                                    }}>
                                        📝 {company.notes}
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
