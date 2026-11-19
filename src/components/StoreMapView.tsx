// Source: Google Maps Platform Code Assist
import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  Pin,
  InfoWindow,
  useMap,
} from '@vis.gl/react-google-maps';
import { Store, UserCity } from '../types';
import { StoreLogoBadge } from './SmartIcon';
import {
  Compass,
  MapPin,
  Clock,
  Phone,
  Navigation,
  Star,
  Truck,
  ExternalLink,
  Layers,
  Building2,
  ShieldCheck,
  Check,
  Copy,
  CornerUpRight,
  Globe,
  Radio,
  Search,
  LocateFixed,
  Car,
  Sparkles,
} from 'lucide-react';

export type MapProvider = 'google' | 'apple' | 'balady';

interface CityCoordinates {
  lat: number;
  lng: number;
  baladyAmana: string;
  baladySubMunicipality: string;
}

const CITY_COORDS: Record<string, CityCoordinates> = {
  riyadh: { lat: 24.7136, lng: 46.6753, baladyAmana: 'أمانة منطقة الرياض', baladySubMunicipality: 'بلدية الشمال الفرعية' },
  jeddah: { lat: 21.5433, lng: 39.1728, baladyAmana: 'أمانة محافظة جدة', baladySubMunicipality: 'بلدية أبحر الفرعية' },
  dammam: { lat: 26.4207, lng: 50.0888, baladyAmana: 'أمانة المنطقة الشرقية', baladySubMunicipality: 'بلدية شرق الدمام' },
  khobar: { lat: 26.2818, lng: 50.1989, baladyAmana: 'أمانة المنطقة الشرقية', baladySubMunicipality: 'بلدية الخبر' },
  makkah: { lat: 21.3891, lng: 39.8579, baladyAmana: 'أمانة العاصمة المقدسة', baladySubMunicipality: 'بلدية العزيزية الفرعية' },
  madinah: { lat: 24.5247, lng: 39.5692, baladyAmana: 'أمانة منطقة المدينة المنورة', baladySubMunicipality: 'بلدية قباء الفرعية' },
  buraidah: { lat: 26.3260, lng: 43.9750, baladyAmana: 'أمانة منطقة القصيم', baladySubMunicipality: 'بلدية شمال بريدة' },
  ahsa: { lat: 25.3835, lng: 49.5862, baladyAmana: 'أمانة الأحساء', baladySubMunicipality: 'بلدية الهفوف' },
  taif: { lat: 21.2854, lng: 40.4222, baladyAmana: 'أمانة محافظة الطائف', baladySubMunicipality: 'بلدية غرب الطائف الفرعية' },
  abha: { lat: 18.2164, lng: 42.5053, baladyAmana: 'أمانة منطقة عسير', baladySubMunicipality: 'بلدية وسط أبها' },
};

export interface BranchDetail {
  id: string;
  name: string;
  storeId: string;
  district: string;
  road: string;
  distanceKm: number;
  phone: string;
  openingHours: string;
  lat: number;
  lng: number;
  baladyLicenceNo: string;
}

// Controller to smoothly animate the map camera when target changes
function MapCameraController({
  target,
  zoom,
}: {
  target: { lat: number; lng: number };
  zoom: number;
}) {
  const map = useMap('hkeeem-saudi-store-map');

  useEffect(() => {
    if (!map) return;
    map.panTo(target);
    map.setZoom(zoom);
  }, [map, target.lat, target.lng, zoom]);

  return null;
}

// Real-time Traffic layer controller
function TrafficLayerToggle({ enabled }: { enabled: boolean }) {
  const map = useMap('hkeeem-saudi-store-map');
  const trafficLayerRef = useRef<google.maps.TrafficLayer | null>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    if (!trafficLayerRef.current) {
      trafficLayerRef.current = new google.maps.TrafficLayer();
    }

    if (enabled) {
      trafficLayerRef.current.setMap(map);
    } else {
      trafficLayerRef.current.setMap(null);
    }

    return () => {
      if (trafficLayerRef.current) {
        trafficLayerRef.current.setMap(null);
      }
    };
  }, [map, enabled]);

  return null;
}

interface StoreMapViewProps {
  stores: Store[];
  selectedCity: UserCity;
  onSelectCity: (city: UserCity) => void;
  cities: UserCity[];
}

export const StoreMapView: React.FC<StoreMapViewProps> = ({
  stores,
  selectedCity,
  onSelectCity,
  cities,
}) => {
  const mapStores = useMemo(
    () => stores.filter((s) => (s.market || 'saudi') === 'saudi'),
    [stores]
  );
  const [selectedStore, setSelectedStore] = useState<Store>(mapStores[0] || stores[0]);
  const [mapProvider, setMapProvider] = useState<MapProvider>('google');
  const [selectedBranchId, setSelectedBranchId] = useState<string>('br-1');
  const [infoWindowBranch, setInfoWindowBranch] = useState<BranchDetail | null>(null);
  const [showTraffic, setShowTraffic] = useState<boolean>(false);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);

  // Read Google Maps API key
  const GOOGLE_MAPS_API_KEY =
    (import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string) ||
    'AIzaSyAm8hj3kY3FTsvh1gmSeNhea2Cpg5Q0FL0';

  // City coordinates
  const cityInfo = CITY_COORDS[selectedCity.id] || CITY_COORDS.riyadh;

  // Realistic store branches in the selected city
  const allBranches: BranchDetail[] = useMemo(() => {
    const list: BranchDetail[] = [];

    // Distinct branch templates for realism
    const branchTemplates = [
      {
        idSuffix: '1',
        nameSuffix: 'طريق الملك فهد',
        district: 'حي الملقا / الصحافة',
        road: 'طريق الملك فهد الفرعي',
        dist: 2.8,
        latOff: 0.018,
        lngOff: -0.012,
        hours: '06:00 ص - 01:00 ص (يومياً)',
      },
      {
        idSuffix: '2',
        nameSuffix: 'طريق الملك عبد العزيز',
        district: 'حي الياسمين / الربيع',
        road: 'طريق الملك عبد العزيز',
        dist: 4.5,
        latOff: -0.014,
        lngOff: 0.015,
        hours: '24 ساعة (طوال أيام الأسبوع)',
      },
      {
        idSuffix: '3',
        nameSuffix: 'الدائري الشرقي',
        district: 'حي الروضة / الحمراء',
        road: 'الطريق الدائري الشرقي',
        dist: 6.2,
        latOff: 0.025,
        lngOff: 0.022,
        hours: '07:00 ص - 12:00 م',
      },
      {
        idSuffix: '4',
        nameSuffix: 'طريق التخصصي',
        district: 'حي المعذر / العليا',
        road: 'شارع التخصصي',
        dist: 3.6,
        latOff: -0.022,
        lngOff: -0.018,
        hours: '06:30 ص - 12:30 ص',
      },
    ];

    mapStores.forEach((st, sIndex) => {
      branchTemplates.forEach((bt, bIndex) => {
        const offsetMultiplier = 1 + (sIndex % 3) * 0.2;
        const lat = cityInfo.lat + bt.latOff * offsetMultiplier;
        const lng = cityInfo.lng + bt.lngOff * offsetMultiplier;

        list.push({
          id: `${st.id}-${bt.idSuffix}`,
          storeId: st.id,
          name: `فرع ${st.name} - ${bt.nameSuffix}`,
          district: bt.district,
          road: bt.road,
          distanceKm: parseFloat((bt.dist + (sIndex * 0.7)).toFixed(1)),
          phone: `92000${sIndex}${bIndex}8`,
          openingHours: bt.hours,
          lat,
          lng,
          baladyLicenceNo: `BLD-${Math.floor(200000 + (sIndex * 1000) + bIndex * 150)}-SA`,
        });
      });
    });

    return list;
  }, [cityInfo, mapStores]);

  // Branches belonging to the currently selected store
  const storeBranches = useMemo(() => {
    return allBranches.filter((b) => b.storeId === selectedStore.id);
  }, [allBranches, selectedStore.id]);

  // Filtered branches by search query
  const filteredBranches = useMemo(() => {
    if (!filterQuery.trim()) return storeBranches;
    const q = filterQuery.toLowerCase();
    return storeBranches.filter(
      (b) =>
        b.name.toLowerCase().includes(q) ||
        b.district.toLowerCase().includes(q) ||
        b.road.toLowerCase().includes(q)
    );
  }, [storeBranches, filterQuery]);

  // Currently active branch
  const activeBranch = useMemo(() => {
    return (
      storeBranches.find((b) => b.id === selectedBranchId) ||
      storeBranches[0] ||
      allBranches[0]
    );
  }, [storeBranches, selectedBranchId, allBranches]);

  // Open info window on active branch by default
  useEffect(() => {
    if (activeBranch) {
      setInfoWindowBranch(activeBranch);
    }
  }, [activeBranch]);

  const activeLat = activeBranch ? activeBranch.lat : cityInfo.lat;
  const activeLng = activeBranch ? activeBranch.lng : cityInfo.lng;
  const locationQuery = `${selectedStore.name} ${selectedCity.nameAr} ${activeBranch?.district || ''}`;

  // External URLs
  const googleMapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    locationQuery + ' السعودية'
  )}`;
  const appleMapsUrl = `https://maps.apple.com/?q=${encodeURIComponent(
    locationQuery
  )}&ll=${activeLat},${activeLng}&z=15`;
  const baladyGisUrl = `https://maps.balady.gov.sa/`;

  const handleCopyCoordinates = () => {
    if (!activeBranch) return;
    const text = `${activeBranch.name}\n${activeBranch.district} - ${selectedCity.nameAr}\nالإحداثيات: ${activeLat.toFixed(
      5
    )}, ${activeLng.toFixed(5)}\nرابط خرائط Google: ${googleMapsUrl}`;
    navigator.clipboard?.writeText(text);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  // Get user location
  const handleLocateUser = () => {
    if (!navigator.geolocation) {
      alert('خدمة تحديد الموقع الجغرافي غير مدعومة في متصفحك.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        setUserLocation({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        });
      },
      () => {
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16" dir="rtl">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-teal-900 via-emerald-950 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-teal-800/40 relative overflow-hidden">
        <div className="absolute -left-12 -bottom-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-teal-500/20 border border-teal-400/40 text-teal-200 text-xs font-black mb-3">
              <Compass className="w-3.5 h-3.5 text-amber-300 animate-spin-slow" />
              <span>الخريطة الموحدة لفروع المملكة العربية السعودية 🇸🇦</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              خرائط Google والفروع المباشرة
            </h1>
            <p className="text-xs sm:text-sm text-teal-100/90 max-w-2xl mt-2 leading-relaxed">
              استكشف فروع السوبرماركت ومتاجر التجزئة في{' '}
              <span className="font-bold text-amber-300">{selectedCity.nameAr}</span> مع
              خرائط Google Maps التفاعلية، وعلامات المواقع المتقدمة، وحالة الحركة المرورية.
            </p>
          </div>

          {/* City Selector */}
          <div className="flex items-center gap-2.5 bg-white/10 backdrop-blur-md p-2.5 rounded-2xl border border-white/20 shadow-inner">
            <MapPin className="w-4 h-4 text-rose-400 shrink-0" />
            <select
              value={selectedCity.id}
              onChange={(e) => {
                const found = cities.find((c) => c.id === e.target.value);
                if (found) {
                  onSelectCity(found);
                  setSelectedBranchId('');
                }
              }}
              className="bg-transparent text-white text-xs sm:text-sm font-black focus:outline-none cursor-pointer"
            >
              {cities.map((c) => (
                <option key={c.id} value={c.id} className="text-slate-900 font-bold">
                  📍 {c.nameAr} ({c.region})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Map Provider Selector Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-2 sm:p-3 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <Layers className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-800 dark:text-slate-200">
            مزود الخريطة:
          </span>
        </div>

        {/* 3 Map Providers Tabs */}
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto p-1 bg-slate-100/80 dark:bg-slate-800/80 rounded-xl">
          {/* 1. Google Maps Platform */}
          <button
            onClick={() => setMapProvider('google')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mapProvider === 'google'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            <span>خرائط Google التفاعلية (Google Maps)</span>
          </button>

          {/* 2. Apple Maps */}
          <button
            onClick={() => setMapProvider('apple')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mapProvider === 'apple'
                ? 'bg-slate-950 dark:bg-slate-800 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            <Navigation className="w-3.5 h-3.5 text-sky-400" />
            <span>خرائط أبل (Apple Maps)</span>
          </button>

          {/* 3. Balady Maps */}
          <button
            onClick={() => setMapProvider('balady')}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs font-black transition-all cursor-pointer ${
              mapProvider === 'balady'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'text-slate-700 dark:text-slate-300 hover:bg-white/80 dark:hover:bg-slate-700'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-amber-300" />
            <span>المستكشف البلدي (بلدي Balady)</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Store/Branch Selector + Right Map Display */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Stores & Branches */}
        <div className="lg:col-span-4 space-y-4">
          {/* Stores List */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center justify-between">
              <span>اختر المتجر للمعاينة:</span>
              <span className="text-[11px] text-slate-500 font-normal">
                {mapStores.length} متجر سعودي بفروع محلية
              </span>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {mapStores.map((store) => {
                const isSelected = selectedStore.id === store.id;

                return (
                  <div
                    key={store.id}
                    onClick={() => {
                      setSelectedStore(store);
                      const firstBranch = allBranches.find((b) => b.storeId === store.id);
                      if (firstBranch) {
                        setSelectedBranchId(firstBranch.id);
                      }
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-600 dark:border-emerald-500 ring-1 ring-emerald-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <StoreLogoBadge storeId={store.id} size="sm" />
                      <div>
                        <div className="font-extrabold text-xs sm:text-sm text-slate-900 dark:text-white">
                          {store.name}
                        </div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                          <Truck className="w-3 h-3 text-slate-400" />
                          <span>{store.deliveryTime}</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-left shrink-0">
                      <div className="text-xs font-black text-emerald-700 dark:text-emerald-400">
                        {store.deliveryFee === 0 ? 'مجاني' : `${store.deliveryFee} ر.س`}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {store.branchesCount} فرع
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Branches Selector in Selected City */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between text-xs font-black text-slate-800 dark:text-slate-200">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>فروع {selectedStore.name} في {selectedCity.nameAr}:</span>
              </span>
              <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-bold bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full">
                {filteredBranches.length} فروع
              </span>
            </div>

            {/* Quick Filter Search */}
            <div className="relative">
              <input
                type="text"
                placeholder="ابحث بالحي أو الشارع..."
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                className="w-full pl-3 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-emerald-600 dark:focus:outline-emerald-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5" />
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {filteredBranches.map((branch) => {
                const isActive = activeBranch?.id === branch.id;

                return (
                  <div
                    key={branch.id}
                    onClick={() => {
                      setSelectedBranchId(branch.id);
                      setInfoWindowBranch(branch);
                    }}
                    className={`p-3 rounded-xl border transition-all cursor-pointer ${
                      isActive
                        ? 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-600 dark:border-blue-500 ring-1 ring-blue-600 shadow-xs'
                        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-black text-xs text-slate-900 dark:text-white">
                        {branch.name}
                      </div>
                      <span className="text-[10px] font-extrabold text-blue-700 dark:text-blue-400 bg-blue-100/70 dark:bg-blue-900/40 px-2 py-0.5 rounded-full shrink-0">
                        {branch.distanceKm} كم
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" />
                      <span>{branch.district} - {branch.road}</span>
                    </div>

                    <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold mt-1.5 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{branch.openingHours}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Active Interactive Map Viewport */}
        <div className="lg:col-span-8">
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col">
            {/* Viewport Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <StoreLogoBadge storeId={selectedStore.id} size="md" />
                <div>
                  <div className="font-black text-sm sm:text-base text-white">
                    {activeBranch ? activeBranch.name : selectedStore.name}
                  </div>
                  <div className="text-[11px] text-slate-300">
                    {selectedCity.nameAr} • {activeBranch?.district} • {activeBranch?.road}
                  </div>
                </div>
              </div>

              {/* Provider Badge & Map Tools */}
              <div className="flex items-center gap-2">
                {mapProvider === 'google' && (
                  <>
                    <button
                      onClick={() => setShowTraffic((prev) => !prev)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        showTraffic
                          ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                          : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                      }`}
                      title="تبديل طبقة الحركة المرورية"
                    >
                      <Car className="w-3.5 h-3.5" />
                      <span>المرور {showTraffic ? 'مفعل 🟢' : 'معطل'}</span>
                    </button>

                    <button
                      onClick={handleLocateUser}
                      disabled={isLocating}
                      className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center gap-1.5 transition-all cursor-pointer"
                      title="تحديد موقعي الحالي"
                    >
                      <LocateFixed className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>موقعي</span>
                    </button>
                  </>
                )}

                <div className="px-2.5 py-1 rounded-lg bg-white/10 border border-white/20 text-[11px] font-bold text-amber-300 flex items-center gap-1.5">
                  <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                  <span>
                    {mapProvider === 'google' && 'Google Maps Platform'}
                    {mapProvider === 'apple' && 'خرائط أبل'}
                    {mapProvider === 'balady' && 'منصة بلدي الجغرافية'}
                  </span>
                </div>
              </div>
            </div>

            {/* Viewport Content by Provider */}
            <div className="relative h-[480px] sm:h-[540px] bg-slate-100 dark:bg-slate-950 overflow-hidden">
              {/* PROVIDER 1: REAL GOOGLE MAPS PLATFORM (React SDK) */}
              {mapProvider === 'google' && (
                <div className="w-full h-full relative" style={{ width: '100%', height: '100%' }}>
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language="ar" region="SA">
                    <Map
                      id="hkeeem-saudi-store-map"
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={{ lat: activeLat, lng: activeLng }}
                      defaultZoom={13}
                      gestureHandling="greedy"
                      disableDefaultUI={false}
                      fullscreenControl={true}
                      mapTypeControl={true}
                      zoomControl={true}
                      streetViewControl={true}
                      style={{ width: '100%', height: '100%' }}
                    >
                      {/* Dynamic Camera Controller */}
                      <MapCameraController
                        target={{ lat: activeLat, lng: activeLng }}
                        zoom={14}
                      />

                      {/* Traffic Layer */}
                      <TrafficLayerToggle enabled={showTraffic} />

                      {/* User Location Marker if available */}
                      {userLocation && (
                        <AdvancedMarker position={userLocation}>
                          <div className="p-2 rounded-full bg-blue-600 text-white shadow-xl ring-4 ring-white animate-pulse">
                            <Navigation className="w-4 h-4" />
                          </div>
                        </AdvancedMarker>
                      )}

                      {/* Store Branch Advanced Markers */}
                      {storeBranches.map((branch) => {
                        const isCurrentActive = branch.id === activeBranch?.id;

                        return (
                          <AdvancedMarker
                            key={branch.id}
                            position={{ lat: branch.lat, lng: branch.lng }}
                            title={branch.name}
                            onClick={() => {
                              setSelectedBranchId(branch.id);
                              setInfoWindowBranch(branch);
                            }}
                          >
                            <Pin
                              background={isCurrentActive ? '#059669' : '#2563eb'}
                              borderColor={isCurrentActive ? '#047857' : '#1d4ed8'}
                              glyphColor="#ffffff"
                              scale={isCurrentActive ? 1.25 : 1.0}
                            />
                          </AdvancedMarker>
                        );
                      })}

                      {/* InfoWindow for Active / Selected Branch */}
                      {infoWindowBranch && (
                        <InfoWindow
                          position={{
                            lat: infoWindowBranch.lat,
                            lng: infoWindowBranch.lng,
                          }}
                          onCloseClick={() => setInfoWindowBranch(null)}
                        >
                          <div className="p-2 max-w-xs text-slate-800" dir="rtl">
                            <div className="flex items-center gap-2 mb-1.5">
                              <StoreLogoBadge storeId={selectedStore.id} size="xs" />
                              <div>
                                <h4 className="font-extrabold text-xs text-slate-900">
                                  {infoWindowBranch.name}
                                </h4>
                                <span className="text-[10px] text-slate-500">
                                  {selectedCity.nameAr} • {infoWindowBranch.district}
                                </span>
                              </div>
                            </div>

                            <div className="text-[11px] text-slate-600 mb-2 space-y-1">
                              <div>📍 {infoWindowBranch.road}</div>
                              <div className="text-emerald-700 font-bold">
                                🕒 {infoWindowBranch.openingHours}
                              </div>
                              <div className="font-semibold">
                                🚗 المسافة التقديرية: {infoWindowBranch.distanceKm} كم
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200">
                              <a
                                href={googleMapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex-1 py-1.5 px-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] rounded-lg text-center shadow-xs flex items-center justify-center gap-1"
                              >
                                <CornerUpRight className="w-3 h-3 text-amber-300" />
                                <span>بدء المسار</span>
                              </a>
                              <a
                                href={`tel:${infoWindowBranch.phone}`}
                                className="py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-[11px] rounded-lg text-center"
                              >
                                <Phone className="w-3 h-3 inline" />
                              </a>
                            </div>
                          </div>
                        </InfoWindow>
                      )}
                    </Map>
                  </APIProvider>

                  {/* Floating Action Overlay on Top of Map */}
                  <div className="absolute top-3 right-3 z-10 flex gap-2">
                    <a
                      href={googleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-xl bg-white/95 text-slate-900 font-black text-xs shadow-md border border-slate-200 flex items-center gap-1.5 hover:bg-white transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                      <span>فتح في تطبيق Google Maps</span>
                    </a>
                  </div>
                </div>
              )}

              {/* PROVIDER 2: APPLE MAPS */}
              {mapProvider === 'apple' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-100 via-sky-50 to-slate-200 dark:from-slate-900 dark:to-slate-950 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
                  <div className="relative z-10 max-w-md w-full bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white flex items-center justify-center mx-auto shadow-md">
                      <Navigation className="w-7 h-7 text-sky-400" />
                    </div>

                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-sky-600 bg-sky-50 dark:bg-sky-950/60 px-2.5 py-1 rounded-full border border-sky-200 dark:border-sky-800">
                        Apple Maps Engine
                      </span>
                      <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white mt-2">
                        {activeBranch ? activeBranch.name : selectedStore.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        {selectedCity.nameAr} • {activeBranch?.district}
                      </p>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 flex items-center justify-around">
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">المسافة</div>
                        <div className="font-black text-slate-900 dark:text-white mt-0.5">
                          {activeBranch?.distanceKm} كم
                        </div>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">الزمن بالسيارة</div>
                        <div className="font-black text-emerald-700 dark:text-emerald-400 mt-0.5">
                          ~ {Math.round((activeBranch?.distanceKm || 3) * 2.2)} دقيقة
                        </div>
                      </div>
                      <div className="w-px h-6 bg-slate-200 dark:bg-slate-700" />
                      <div>
                        <div className="text-[10px] text-slate-400 font-bold">الحركة</div>
                        <div className="font-black text-emerald-600 mt-0.5">انسيابية 🟢</div>
                      </div>
                    </div>

                    <a
                      href={appleMapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-slate-950 hover:bg-slate-800 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Navigation className="w-4 h-4 text-sky-400" />
                      <span>فتح المسار في خرائط أبل</span>
                    </a>
                  </div>
                </div>
              )}

              {/* PROVIDER 3: BALADY MAPS */}
              {mapProvider === 'balady' && (
                <div className="w-full h-full bg-gradient-to-br from-emerald-950 via-teal-900 to-slate-950 text-white flex flex-col justify-between p-6 relative overflow-hidden">
                  <div className="relative z-10 max-w-xl w-full bg-slate-900/90 backdrop-blur-md p-6 rounded-3xl border border-emerald-500/30 shadow-2xl space-y-4 mx-auto my-auto">
                    <div className="flex items-center justify-between border-b border-emerald-500/20 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
                          <Building2 className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-xs font-black text-emerald-300">
                            منصة بلدي • وزارة البلديات والإسكان
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {cityInfo.baladyAmana} • {cityInfo.baladySubMunicipality}
                          </div>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-[10px] font-black">
                        الرقابة البلدية: ممتثل 🟢
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <div className="text-[10px] text-slate-400 font-bold">اسم المنشأة:</div>
                        <div className="font-extrabold text-white mt-0.5">{selectedStore.name}</div>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <div className="text-[10px] text-slate-400 font-bold">رخصة بلدي:</div>
                        <div className="font-mono text-emerald-300 font-bold mt-0.5">
                          {activeBranch?.baladyLicenceNo}
                        </div>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <div className="text-[10px] text-slate-400 font-bold">الحي:</div>
                        <div className="font-bold text-slate-200 mt-0.5">{activeBranch?.district}</div>
                      </div>
                      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700">
                        <div className="text-[10px] text-slate-400 font-bold">الإحداثيات المعتمدة:</div>
                        <div className="font-mono text-slate-300 mt-0.5">
                          {activeLat.toFixed(4)}° N, {activeLng.toFixed(4)}° E
                        </div>
                      </div>
                    </div>

                    <a
                      href={baladyGisUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs flex items-center justify-center gap-2 shadow-lg transition-all cursor-pointer"
                    >
                      <Building2 className="w-4 h-4 text-amber-300" />
                      <span>فتح المستكشف الجغرافي لمنصة بلدي</span>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Bottom Actions Bar */}
            <div className="p-4 sm:p-5 bg-slate-50 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-black text-sm text-slate-900 dark:text-white">
                    {activeBranch ? activeBranch.name : selectedStore.name}
                  </span>
                  <span className="text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 font-bold px-2 py-0.5 rounded-full">
                    مفتوح للزيارة والتسوق
                  </span>
                </div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {selectedCity.nameAr} • {activeBranch?.road} • {selectedStore.deliveryTime}
                </div>
              </div>

              {/* Quick Navigation Buttons */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={handleCopyCoordinates}
                  className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700 dark:text-emerald-400">تم نسخ الموقع</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>نسخ الموقع والإحداثيات</span>
                    </>
                  )}
                </button>

                {activeBranch && (
                  <a
                    href={`tel:${activeBranch.phone}`}
                    className="px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>اتصال بالفرع</span>
                  </a>
                )}

                <a
                  href={googleMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-black text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <CornerUpRight className="w-3.5 h-3.5 text-amber-300" />
                  <span>بدء الملاحة المباشرة في Google Maps</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
