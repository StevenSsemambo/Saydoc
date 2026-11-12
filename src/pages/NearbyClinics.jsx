import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useLang } from '../context/LangContext.jsx'
import facilitiesData from '../knowledge/facilities.json'
import {
  MapPin, Navigation, Search, ChevronLeft, ChevronRight,
  X, AlertTriangle, Clock, Phone, Info, Building2,
  RefreshCw, Locate, Shield,
} from 'lucide-react'

// ── Haversine distance (km) ───────────────────────────────────
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180)
    * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

// ── Distance display ──────────────────────────────────────────
function fmtDistance(km) {
  if (km < 1) return `${Math.round(km * 1000)}m`
  if (km < 10) return `${km.toFixed(1)} km`
  return `${Math.round(km)} km`
}

// ── Travel time estimate (Uganda-realistic) ───────────────────
function travelTime(km) {
  if (km < 0.5) return 'Under 10 min walk'
  if (km < 2)   return `~${Math.round(km / 5 * 60)} min walk`
  if (km < 15)  return `~${Math.round(km / 25 * 60)} min boda`
  return `~${Math.round(km / 60 * 60)} min drive`
}

// ── Type config ───────────────────────────────────────────────
const TYPE_CONFIG = {
  NRH:              { label: 'National Referral',  color: '#DC2626', bg: '#DC262618', badge: 'bg-red-900/40 text-red-300',    icon: '🏥' },
  RRH:              { label: 'Regional Referral',  color: '#7C3AED', bg: '#7C3AED18', badge: 'bg-purple-900/40 text-purple-300', icon: '🏥' },
  DH:               { label: 'District Hospital',  color: '#0284C7', bg: '#0284C718', badge: 'bg-blue-900/40 text-blue-300',  icon: '🏨' },
  HCIV:             { label: 'Health Centre IV',   color: '#00A86B', bg: '#00A86B18', badge: 'bg-emerald-900/40 text-emerald-300', icon: '🏪' },
  HCIII:            { label: 'Health Centre III',  color: '#0891B2', bg: '#0891B218', badge: 'bg-cyan-900/40 text-cyan-300',  icon: '🏩' },
  HCII:             { label: 'Health Centre II',   color: '#CA8A04', bg: '#CA8A0418', badge: 'bg-yellow-900/40 text-yellow-300', icon: '🏥' },
  'Private Hospital': { label: 'Private Hospital', color: '#EC4899', bg: '#EC489918', badge: 'bg-pink-900/40 text-pink-300', icon: '🏥' },
  'Specialized Clinic': { label: 'Specialist',    color: '#EA580C', bg: '#EA580C18', badge: 'bg-orange-900/40 text-orange-300', icon: '⚕️' },
}

function typeCfg(type) {
  return TYPE_CONFIG[type] || { label: type, color: '#8BA99A', bg: '#8BA99A18', badge: 'bg-white/10 text-mist', icon: '🏥' }
}

// ── Services by facility level (MoH standard) ─────────────────
const SERVICES = {
  NRH:    ['All specialties', 'Surgery', 'ICU', 'Cancer care', 'Organ transplant', 'Training hospital'],
  RRH:    ['General medicine', 'Surgery', 'Maternity', 'Paediatrics', 'Laboratory', 'X-ray', 'Blood bank', 'Psychiatry'],
  DH:     ['General medicine', 'Surgery', 'Maternity', 'Paediatrics', 'Laboratory', 'X-ray'],
  HCIV:   ['Outpatient', 'Inpatient', 'Maternity', 'Minor surgery', 'Laboratory', 'ART/HIV'],
  HCIII:  ['Outpatient', 'Inpatient', 'Maternity', 'Basic lab', 'Immunisation'],
  HCII:   ['Outpatient only', 'Basic medicines', 'Immunisation', 'Referral'],
  'Private Hospital': ['Varies — call ahead'],
  'Specialized Clinic': ['Specialized services — call ahead'],
}

// ── Directions opener ─────────────────────────────────────────
function openDirections(lat, lng, name) {
  const encoded = encodeURIComponent(name)
  // Try Google Maps first, falls back to browser default
  const url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encoded}`
  window.open(url, '_blank')
}

// ── Facility detail bottom sheet ──────────────────────────────
function FacilitySheet({ facility, distance, onClose }) {
  const cfg = typeCfg(facility.type)
  const services = SERVICES[facility.type] || SERVICES.HCII

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 50, background: 'rgba(0,0,0,0.75)' }}
      onClick={onClose}
    >
      <div
        className="absolute bottom-0 left-0 right-0 bg-charcoal rounded-t-3xl max-h-[85vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 bg-white/20 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 pt-2 pb-4 border-b border-white/5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg ${cfg.badge}`}>
                  {cfg.icon} {cfg.label}
                </span>
                {facility.ownership !== 'Government' && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-pink-900/30 text-pink-300">
                    Private/NGO
                  </span>
                )}
              </div>
              <h2 className="font-display font-bold text-lg text-cream leading-tight">{facility.name}</h2>
              <p className="text-mist text-sm mt-0.5">{facility.district} District · {facility.region}</p>
              {facility.subcounty && (
                <p className="text-mist/60 text-xs mt-0.5">{facility.subcounty}</p>
              )}
            </div>
            <button onClick={onClose} className="p-2 bg-midnight rounded-xl flex-shrink-0">
              <X size={18} className="text-mist" />
            </button>
          </div>

          {/* Distance + travel */}
          {distance !== null && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1.5 bg-midnight rounded-xl px-3 py-2">
                <Navigation size={13} className="text-emerald-500" />
                <span className="text-cream text-sm font-semibold">{fmtDistance(distance)}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-midnight rounded-xl px-3 py-2">
                <Clock size={13} className="text-mist" />
                <span className="text-mist text-xs">{travelTime(distance)}</span>
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Services */}
          <div>
            <p className="label-text mb-2">SERVICES AVAILABLE</p>
            <div className="flex flex-wrap gap-1.5">
              {services.map(s => (
                <span key={s} className="bg-midnight text-mist text-xs px-2.5 py-1 rounded-xl">{s}</span>
              ))}
            </div>
          </div>

          {/* Important note */}
          <div className="bg-amber-950/40 border border-amber-800/30 rounded-2xl p-3 flex items-start gap-2">
            <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
            <p className="text-amber-200/80 text-xs leading-relaxed">
              Call ahead to confirm opening hours, specialist availability, and medicine stock before travelling — especially for rural facilities.
            </p>
          </div>

          {facility.note && (
            <p className="text-emerald-400/80 text-xs italic">{facility.note}</p>
          )}

          {/* Coordinates */}
          <p className="text-mist/40 text-[10px] font-mono">
            {facility.lat.toFixed(4)}, {facility.lng.toFixed(4)}
          </p>
        </div>

        {/* Actions */}
        <div className="px-5 pb-8 pt-2 flex gap-3">
          <button
            onClick={() => openDirections(facility.lat, facility.lng, facility.name)}
            className="flex-1 bg-emerald-600 text-white font-semibold py-3 rounded-2xl flex items-center justify-center gap-2 text-sm active:scale-95 transition-all shadow-btn"
          >
            <Navigation size={16} /> Get Directions
          </button>
          <button
            onClick={onClose}
            className="w-12 h-12 bg-midnight border border-white/10 rounded-2xl flex items-center justify-center active:opacity-70"
          >
            <X size={18} className="text-mist" />
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Facility list card ────────────────────────────────────────
function FacilityCard({ facility, distance, onSelect }) {
  const cfg = typeCfg(facility.type)
  return (
    <button
      onClick={() => onSelect(facility)}
      className="w-full bg-charcoal rounded-2xl p-4 flex items-start gap-3 active:scale-98 transition-all text-left border border-white/5"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 text-lg"
        style={{ background: cfg.bg }}
      >
        {cfg.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-cream font-semibold text-sm leading-tight">{facility.name}</p>
        <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${cfg.badge}`}>
            {cfg.label}
          </span>
          {facility.ownership !== 'Government' && (
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-pink-900/30 text-pink-300">
              Private
            </span>
          )}
        </div>
        <p className="text-mist text-xs mt-1">{facility.district} · {facility.subcounty || facility.region}</p>
      </div>
      <div className="flex-shrink-0 text-right">
        {distance !== null ? (
          <>
            <p className="text-cream text-sm font-bold">{fmtDistance(distance)}</p>
            <p className="text-mist/60 text-[10px]">{travelTime(distance)}</p>
          </>
        ) : (
          <ChevronRight size={16} className="text-mist mt-2" />
        )}
      </div>
    </button>
  )
}

// ── Location status banner ────────────────────────────────────
function LocationBanner({ status, onRetry }) {
  if (status === 'granted') return null
  if (status === 'loading') return (
    <div className="bg-charcoal border border-white/10 rounded-2xl p-3 flex items-center gap-3">
      <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
      <p className="text-mist text-xs">Getting your location…</p>
    </div>
  )
  if (status === 'denied') return (
    <div className="bg-amber-950/40 border border-amber-800/30 rounded-2xl p-3 flex items-start gap-2">
      <AlertTriangle size={13} className="text-amber-400 flex-shrink-0 mt-0.5" />
      <div className="flex-1">
        <p className="text-amber-300 text-xs font-semibold mb-0.5">Location access denied</p>
        <p className="text-amber-200/70 text-xs">Enable location in your phone settings to find nearest clinics. Use the District tab to browse manually.</p>
      </div>
    </div>
  )
  if (status === 'error') return (
    <div className="bg-red-950/30 border border-red-800/30 rounded-2xl p-3 flex items-center gap-2">
      <AlertTriangle size={13} className="text-red-400 flex-shrink-0" />
      <p className="text-red-300/80 text-xs flex-1">Couldn't get location. Check GPS is on.</p>
      <button onClick={onRetry} className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
        <RefreshCw size={11} /> Retry
      </button>
    </div>
  )
  return null
}

// ── Districts grouped by region ───────────────────────────────
function getDistricts() {
  const map = {}
  facilitiesData.facilities.forEach(f => {
    if (!map[f.region]) map[f.region] = new Set()
    map[f.region].add(f.district)
  })
  const result = {}
  Object.entries(map).forEach(([region, districts]) => {
    result[region] = [...districts].sort()
  })
  return result
}

// ── TYPE FILTER pills ─────────────────────────────────────────
const TYPE_FILTERS = [
  { key: 'all',  label: 'All' },
  { key: 'NRH',  label: 'National' },
  { key: 'RRH',  label: 'Regional' },
  { key: 'DH',   label: 'Hospital' },
  { key: 'HCIV', label: 'HC IV' },
  { key: 'HCIII',label: 'HC III' },
  { key: 'Private Hospital', label: 'Private' },
]

// ── Main component ────────────────────────────────────────────
export default function NearbyClinics() {
  const nav = useNavigate()
  const { lang } = useLang()

  const [tab, setTab] = useState('nearby')       // nearby | district | search
  const [location, setLocation] = useState(null) // { lat, lng }
  const [locStatus, setLocStatus] = useState('idle') // idle|loading|granted|denied|error
  const [typeFilter, setTypeFilter] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState(null)
  const [selectedFacility, setSelectedFacility] = useState(null)
  const [selectedDistance, setSelectedDistance] = useState(null)

  const allFacilities = facilitiesData.facilities
  const districts = useMemo(() => getDistricts(), [])

  // ── Get location ──────────────────────────────────────────
  const getLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setLocStatus('denied')
      return
    }
    setLocStatus('loading')
    navigator.geolocation.getCurrentPosition(
      pos => {
        setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude })
        setLocStatus('granted')
      },
      err => {
        if (err.code === err.PERMISSION_DENIED) setLocStatus('denied')
        else setLocStatus('error')
      },
      { timeout: 12000, enableHighAccuracy: true, maximumAge: 60000 }
    )
  }, [])

  useEffect(() => {
    getLocation()
  }, [getLocation])

  // ── Sorted nearby list ─────────────────────────────────────
  const nearbyFacilities = useMemo(() => {
    if (!location) return []
    return allFacilities
      .map(f => ({
        ...f,
        distance: haversine(location.lat, location.lng, f.lat, f.lng),
      }))
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 40)
  }, [location, typeFilter, allFacilities])

  // ── District facilities ────────────────────────────────────
  const districtFacilities = useMemo(() => {
    if (!selectedDistrict) return []
    return allFacilities
      .filter(f => f.district === selectedDistrict)
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .map(f => ({
        ...f,
        distance: location ? haversine(location.lat, location.lng, f.lat, f.lng) : null,
      }))
      .sort((a, b) => {
        const order = { NRH: 0, RRH: 1, DH: 2, 'Private Hospital': 3, HCIV: 4, HCIII: 5, HCII: 6 }
        return (order[a.type] ?? 7) - (order[b.type] ?? 7)
      })
  }, [selectedDistrict, typeFilter, location, allFacilities])

  // ── Search results ─────────────────────────────────────────
  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (q.length < 2) return []
    return allFacilities
      .filter(f =>
        f.name.toLowerCase().includes(q) ||
        f.district.toLowerCase().includes(q) ||
        f.subcounty.toLowerCase().includes(q) ||
        f.type.toLowerCase().includes(q) ||
        f.region.toLowerCase().includes(q)
      )
      .filter(f => typeFilter === 'all' || f.type === typeFilter)
      .map(f => ({
        ...f,
        distance: location ? haversine(location.lat, location.lng, f.lat, f.lng) : null,
      }))
      .sort((a, b) => (a.distance ?? 999) - (b.distance ?? 999))
      .slice(0, 30)
  }, [searchQuery, typeFilter, location, allFacilities])

  const handleSelect = (facility, distance = null) => {
    setSelectedFacility(facility)
    setSelectedDistance(distance ?? (location
      ? haversine(location.lat, location.lng, facility.lat, facility.lng)
      : null))
  }

  return (
    <div className="h-full flex flex-col bg-midnight safe-top">
      {/* Header */}
      <div className="bg-charcoal border-b border-white/5 px-5 pt-8 pb-4 flex-shrink-0">
        <button onClick={() => nav(-1)} className="flex items-center gap-1 text-emerald-500 text-sm font-medium mb-3 active:opacity-70">
          <ChevronLeft size={16} /> Back
        </button>

        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <MapPin size={20} className="text-emerald-500" />
              <h1 className="font-display font-bold text-2xl text-cream">Nearby Clinics</h1>
            </div>
            <p className="text-mist text-sm">
              {locStatus === 'granted' && location
                ? `${allFacilities.length} Uganda MoH facilities · sorted by distance`
                : `${allFacilities.length} Uganda MoH facilities`}
            </p>
          </div>
          {locStatus !== 'loading' && (
            <button
              onClick={getLocation}
              className={`p-2.5 rounded-xl border transition-all active:scale-90 ${
                locStatus === 'granted'
                  ? 'bg-emerald-600/15 border-emerald-600/30 text-emerald-400'
                  : 'bg-midnight border-white/10 text-mist'
              }`}
            >
              <Locate size={16} />
            </button>
          )}
        </div>

        <LocationBanner status={locStatus} onRetry={getLocation} />

        {/* Tabs */}
        <div className="flex bg-midnight rounded-2xl p-1 gap-1 mt-3">
          {[
            { key: 'nearby', label: '📍 Nearest' },
            { key: 'district', label: '🗺️ District' },
            { key: 'search', label: '🔍 Search' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-semibold transition-all ${
                tab === t.key ? 'bg-emerald-600 text-white' : 'text-mist'
              }`}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Type filter */}
        <div className="flex gap-1.5 mt-3 overflow-x-auto pb-0.5 no-scrollbar">
          {TYPE_FILTERS.map(f => (
            <button key={f.key} onClick={() => setTypeFilter(f.key)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                typeFilter === f.key
                  ? 'bg-emerald-600 text-white'
                  : 'bg-midnight border border-white/10 text-mist'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4 pb-24 space-y-3">

        {/* ── NEARBY TAB ── */}
        {tab === 'nearby' && (
          <>
            {locStatus === 'idle' || locStatus === 'loading' ? (
              <div className="text-center py-12 space-y-3">
                <div className="w-16 h-16 bg-emerald-600/10 rounded-3xl flex items-center justify-center mx-auto">
                  <Locate size={28} className="text-emerald-600/50 animate-pulse" />
                </div>
                <p className="text-mist text-sm">Getting your location…</p>
              </div>
            ) : locStatus === 'denied' || locStatus === 'error' ? (
              <div className="text-center py-8 space-y-3">
                <p className="text-mist text-sm">Can't sort by distance without location.</p>
                <p className="text-mist/60 text-xs">Use the District tab to browse by area.</p>
                <button onClick={() => setTab('district')} className="btn-primary text-sm px-5">
                  Browse by District
                </button>
              </div>
            ) : (
              <>
                <div className="bg-emerald-950/40 border border-emerald-800/20 rounded-2xl p-3 flex items-start gap-2">
                  <Shield size={13} className="text-emerald-400 flex-shrink-0 mt-0.5" />
                  <p className="text-emerald-200/70 text-xs leading-relaxed">
                    Showing nearest {nearbyFacilities.length} facilities. Works fully offline — data from Uganda MoH 2024.
                  </p>
                </div>
                {nearbyFacilities.map(f => (
                  <FacilityCard
                    key={f.id}
                    facility={f}
                    distance={f.distance}
                    onSelect={fac => handleSelect(fac, fac.distance)}
                  />
                ))}
              </>
            )}
          </>
        )}

        {/* ── DISTRICT TAB ── */}
        {tab === 'district' && (
          <>
            {selectedDistrict ? (
              <>
                <button
                  onClick={() => setSelectedDistrict(null)}
                  className="flex items-center gap-1.5 text-emerald-500 text-sm font-medium active:opacity-70"
                >
                  <ChevronLeft size={16} /> All Districts
                </button>
                <div className="flex items-center gap-2 bg-charcoal rounded-2xl px-4 py-3">
                  <Building2 size={16} className="text-emerald-500" />
                  <div>
                    <p className="text-cream font-semibold text-sm">{selectedDistrict} District</p>
                    <p className="text-mist text-xs">{districtFacilities.length} facilities</p>
                  </div>
                </div>
                {districtFacilities.length === 0 ? (
                  <p className="text-mist text-sm text-center py-6">No facilities found for this filter.</p>
                ) : (
                  districtFacilities.map(f => (
                    <FacilityCard key={f.id} facility={f} distance={f.distance} onSelect={handleSelect} />
                  ))
                )}
              </>
            ) : (
              <>
                <p className="text-mist text-xs">Tap a district to see its facilities</p>
                {Object.entries(districts)
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([region, dists]) => (
                    <div key={region}>
                      <p className="label-text mb-2">{region.toUpperCase()} REGION</p>
                      <div className="grid grid-cols-2 gap-2 mb-4">
                        {dists.map(d => {
                          const count = allFacilities.filter(f => f.district === d).length
                          const distKm = location
                            ? (() => {
                                const facs = allFacilities.filter(f => f.district === d)
                                if (!facs.length) return null
                                return Math.min(...facs.map(f => haversine(location.lat, location.lng, f.lat, f.lng)))
                              })()
                            : null
                          return (
                            <button key={d}
                              onClick={() => setSelectedDistrict(d)}
                              className="bg-charcoal rounded-2xl p-3 text-left active:scale-95 transition-all border border-white/5"
                            >
                              <p className="text-cream text-sm font-semibold">{d}</p>
                              <p className="text-mist text-xs">{count} facilities</p>
                              {distKm !== null && (
                                <p className="text-emerald-500 text-[10px] font-semibold mt-0.5">{fmtDistance(distKm)} away</p>
                              )}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  ))}
              </>
            )}
          </>
        )}

        {/* ── SEARCH TAB ── */}
        {tab === 'search' && (
          <>
            <div className="relative">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-mist/50" />
              <input
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by name, district, sub-county…"
                className="w-full bg-charcoal border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-cream text-sm placeholder-mist/40 focus:outline-none focus:border-emerald-600"
                autoFocus
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-mist/50 active:opacity-70">
                  <X size={14} />
                </button>
              )}
            </div>

            {searchQuery.length < 2 ? (
              <div className="text-center py-8 space-y-2">
                <p className="text-mist text-sm">Type at least 2 characters to search</p>
                <p className="text-mist/50 text-xs">Search by facility name, district, or sub-county</p>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-mist text-sm">No facilities found for "{searchQuery}"</p>
              </div>
            ) : (
              <>
                <p className="text-mist text-xs">{searchResults.length} result{searchResults.length !== 1 ? 's' : ''}</p>
                {searchResults.map(f => (
                  <FacilityCard key={f.id} facility={f} distance={f.distance} onSelect={handleSelect} />
                ))}
              </>
            )}
          </>
        )}

        {/* Data attribution */}
        <div className="bg-charcoal/50 rounded-2xl p-3 flex items-start gap-2 mt-4">
          <Info size={13} className="text-mist/50 flex-shrink-0 mt-0.5" />
          <p className="text-mist/40 text-[10px] leading-relaxed">
            Data: Uganda Ministry of Health Facility Registry 2024. {allFacilities.length} facilities. Government facilities unless marked Private. Coordinates approximate for rural health centres. Always call ahead to confirm availability.
          </p>
        </div>
      </div>

      {/* Facility detail sheet */}
      {selectedFacility && (
        <FacilitySheet
          facility={selectedFacility}
          distance={selectedDistance}
          onClose={() => { setSelectedFacility(null); setSelectedDistance(null) }}
        />
      )}
    </div>
  )
}
