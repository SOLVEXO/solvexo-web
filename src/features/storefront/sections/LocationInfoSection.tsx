import { MapPin, Phone, Mail, Clock } from 'lucide-react';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';
import 'leaflet/dist/leaflet.css';
import { useStorefront, type StorefrontLinkSettings } from '../StorefrontContext';

// Vite serves these as hashed asset URLs rather than the relative paths
// leaflet's default icon config expects — same fix as `LocationPickerMap`.
const markerIconInstance = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

interface LocationInfoSettings {
  heading?:   string;
  address:    string;
  hours?:     string;
  phone?:     string;
  email?:     string;
  latitude?:  number;
  longitude?: number;
  ctaText?:   string;
  ctaLink?:   StorefrontLinkSettings;
}

// A restaurant's address/hours/reservation CTA, or any store's physical
// location/service area — a static (non-interactive, no click-to-pin) map
// reusing the exact leaflet setup `LocationPickerMap` already established,
// so this is the second consumer of that same marker-icon fix rather than a
// second way of getting it wrong.
export function LocationInfoSection({ settings }: { settings: LocationInfoSettings }) {
  const { cfg, resolveLink } = useStorefront();
  const hasPin = settings.latitude != null && settings.longitude != null;
  const cta = settings.ctaLink ? resolveLink(settings.ctaLink) : null;

  return (
    <div className="px-4 sm:px-6 lg:px-10" style={{ paddingTop: 32 * cfg.sectionSpacingScale, paddingBottom: 32 * cfg.sectionSpacingScale }}>
      <div className="mx-auto grid sm:grid-cols-2 gap-6 items-start" style={{ maxWidth: Math.round(1000 * cfg.containerWidthScale) }}>
        <div>
          {settings.heading && (
            <h2 className="font-bold mb-4" style={{ color: cfg.textColor, fontSize: Math.round(20 * cfg.typeScaleFactor) }}>
              {settings.heading}
            </h2>
          )}
          <div className="flex flex-col gap-3">
            <div className="flex items-start gap-2.5">
              <MapPin size={16} className="shrink-0 mt-0.5" style={{ color: cfg.primaryColor }} />
              <p className="text-[13.5px] leading-relaxed" style={{ color: cfg.textColor }}>{settings.address}</p>
            </div>
            {settings.hours && (
              <div className="flex items-start gap-2.5">
                <Clock size={16} className="shrink-0 mt-0.5" style={{ color: cfg.primaryColor }} />
                <p className="text-[13.5px] leading-relaxed whitespace-pre-line" style={{ color: cfg.textColor }}>{settings.hours}</p>
              </div>
            )}
            {settings.phone && (
              <div className="flex items-center gap-2.5">
                <Phone size={16} className="shrink-0" style={{ color: cfg.primaryColor }} />
                <p className="text-[13.5px]" style={{ color: cfg.textColor }}>{settings.phone}</p>
              </div>
            )}
            {settings.email && (
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="shrink-0" style={{ color: cfg.primaryColor }} />
                <p className="text-[13.5px]" style={{ color: cfg.textColor }}>{settings.email}</p>
              </div>
            )}
          </div>
          {settings.ctaText && cta && (
            cta.href
              ? <a href={cta.href} target="_blank" rel="noopener noreferrer" className="inline-block mt-5 px-4 py-2.5 text-[13px] font-bold text-white no-underline" style={{ background: cfg.primaryColor, borderRadius: cfg.buttonRadiusPx }}>{settings.ctaText}</a>
              : <a href={cta.to} className="inline-block mt-5 px-4 py-2.5 text-[13px] font-bold text-white no-underline" style={{ background: cfg.primaryColor, borderRadius: cfg.buttonRadiusPx }}>{settings.ctaText}</a>
          )}
        </div>

        {hasPin && (
          <div className="overflow-hidden" style={{ borderRadius: cfg.imageRadiusPx, height: 260 }}>
            <MapContainer
              center={[settings.latitude!, settings.longitude!]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
              // Read-only presentation — no click/drag handlers, unlike the
              // seller-facing `LocationPickerMap`.
              dragging={false}
              scrollWheelZoom={false}
              doubleClickZoom={false}
              touchZoom={false}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={[settings.latitude!, settings.longitude!]} icon={markerIconInstance} />
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
}
