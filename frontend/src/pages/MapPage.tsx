import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Star, User, LocateFixed, X, SlidersHorizontal } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ToiletPopup } from '../components/map/ToiletPopup';
import { useToilets } from '../hooks/useToilets';
import { ToiletData } from '../types/toilet';

declare global {
  interface Window { kakao: any; }
}

// ── 현재 위치 훅 ──────────────────────────────────────────────────────
function useCurrentPosition() {
  const [pos, setPos] = useState({ lat: 37.5172, lng: 127.0473 }); // fallback: 강남구청
  const [granted, setGranted] = useState(false);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setGranted(true); },
      () => setGranted(false),
      { timeout: 6000 }
    );
  }, []);

  return { pos, granted };
}

// ── 카카오맵 마커 생성 헬퍼 ─────────────────────────────────────────
function createToiletMarker(kakao: any, map: any, toilet: ToiletData) {
  // 방문 인증 여부에 따라 컬러 / 회색 똥 마커
  const emoji = toilet.isVisited ? '💩' : '🚻';
  const markerBg = toilet.isVisited ? '#1B4332' : '#8a9a8a';

  const content = `
    <div style="
      position:relative;
      display:flex;flex-direction:column;align-items:center;
      cursor:pointer;
    ">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${markerBg};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
        box-shadow:0 3px 12px rgba(0,0,0,0.25);
        border:2.5px solid #fff;
        ${toilet.isOpen24h ? 'outline:2px solid #E8A838;outline-offset:2px;' : ''}
        transition:transform 0.2s;
      ">${emoji}</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${markerBg};
        margin-top:-1px;
      "></div>
    </div>`;

  const marker = new kakao.maps.CustomOverlay({
    position: new kakao.maps.LatLng(toilet.lat, toilet.lng),
    content,
    yAnchor: 1.15,
    zIndex: toilet.isVisited ? 5 : 3,
  });
  marker.setMap(map);
  return marker;
}

// ── MapPage ────────────────────────────────────────────────────────────
type FilterMode = 'all' | 'favorite' | 'visited';

export function MapPage() {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());

  const { pos } = useCurrentPosition();
  const { toilets, toggleFavorite, markVisited } = useToilets({ lat: pos.lat, lng: pos.lng });

  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  // 필터 적용된 화장실 목록
  const filteredToilets = toilets.filter((t) => {
    const matchesFilter =
      filter === 'all' ? true :
      filter === 'favorite' ? t.isFavorite :
      filter === 'visited' ? t.isVisited : true;

    const matchesSearch = searchQuery.trim() === '' ||
      t.name.includes(searchQuery) ||
      t.roadAddress.includes(searchQuery);

    return matchesFilter && matchesSearch;
  });

  // ── 카카오맵 초기화 ────────────────────────────────────────────────
  useEffect(() => {
    if (!window.kakao || !mapContainerRef.current) return;

    window.kakao.maps.load(() => {
      const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
      const map = new window.kakao.maps.Map(mapContainerRef.current, {
        center,
        level: 4,
      });
      mapRef.current = map;

      // 현재 위치 마커 (귀여운 캐릭터)
      const myOverlay = new window.kakao.maps.CustomOverlay({
        position: center,
        content: `
          <div style="display:flex;flex-direction:column;align-items:center;">
            <div style="
              width:40px;height:40px;border-radius:50%;
              background:linear-gradient(135deg,#3B82F6,#60a5fa);
              display:flex;align-items:center;justify-content:center;
              font-size:22px;
              box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 14px rgba(59,130,246,0.4);
              border:2.5px solid #fff;
              animation:mypulse 2s infinite;
            ">🧑</div>
          </div>
          <style>
            @keyframes mypulse {
              0%,100%{box-shadow:0 0 0 4px rgba(59,130,246,0.25),0 4px 14px rgba(59,130,246,0.4)}
              50%{box-shadow:0 0 0 8px rgba(59,130,246,0.12),0 4px 14px rgba(59,130,246,0.3)}
            }
          </style>`,
        zIndex: 10,
      });
      myOverlay.setMap(map);

      setMapLoaded(true);
    });
  }, [pos.lat, pos.lng]);

  // ── 마커 렌더링 (필터 변경 시 재렌더) ────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // 기존 마커 제거
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current.clear();

    filteredToilets.forEach((toilet) => {
      const marker = createToiletMarker(window.kakao, mapRef.current, toilet);

      // 클릭 이벤트
      window.kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedToilet(toilet);
      });

      markersRef.current.set(toilet.id, marker);
    });
  }, [filteredToilets, mapLoaded]);

  // ── 현재 위치로 이동 ──────────────────────────────────────────────
  const moveToMyLocation = useCallback(() => {
    if (!mapRef.current) return;
    mapRef.current.panTo(new window.kakao.maps.LatLng(pos.lat, pos.lng));
  }, [pos]);

  // ── 검색 결과 → 지도 이동 ────────────────────────────────────────
  const handleSearch = useCallback(() => {
    if (!searchQuery.trim() || !mapRef.current) return;
    const found = filteredToilets[0];
    if (found) {
      mapRef.current.panTo(new window.kakao.maps.LatLng(found.lat, found.lng));
      setSelectedToilet(found);
    }
  }, [searchQuery, filteredToilets]);

  return (
    <div className="relative h-screen flex flex-col overflow-hidden" style={{ background: '#F2F7F4' }}>
      <Navbar />

      {/* ── 지도 컨테이너 ── */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="w-full h-full" style={{ borderRadius: '0' }} />

        {/* 상단 그라데이션 오버레이 (밝기 감소 및 부드러운 경계 처리) */}
        <div 
          className="absolute top-0 left-0 right-0 h-60 pointer-events-none z-10"
          style={{
            background: 'linear-gradient(to bottom, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0.1) 60%, transparent 100%)',
            backdropFilter: 'blur(1px)',
          }}
        />

        {/* 로딩 오버레이 */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center" style={{ background: '#eef5f0' }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'linear' }}
              style={{ fontSize: '40px' }}
            >
              💩
            </motion.div>
          </div>
        )}

        {/* ── 상단 검색 + 필터 바 ── */}
        <div
          className="absolute top-32 left-1/2 -translate-x-1/2 z-20 w-full px-4"
          style={{ maxWidth: '600px' }}
        >
          {/* 검색창 */}
          <div
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl"
            style={{
              background: '#fff',
              boxShadow: '0 4px 24px rgba(27,67,50,0.15)',
              border: searchFocused ? '1.5px solid #1B4332' : '1.5px solid transparent',
              transition: 'border 0.2s',
            }}
          >
            <Search size={16} style={{ color: '#7a9e8a', flexShrink: 0 }} />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="화장실 이름 또는 주소 검색"
              className="flex-1 outline-none text-sm"
              style={{ background: 'transparent', color: '#1a2b22' }}
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} style={{ color: '#7a9e8a', flexShrink: 0 }}>
                <X size={14} />
              </button>
            )}
          </div>

          {/* 필터 칩 */}
          <div className="flex gap-2 mt-2 justify-center">
            {([
              { key: 'all',      label: '전체',    icon: <SlidersHorizontal size={12} /> },
              { key: 'favorite', label: '즐겨찾기', icon: <Star size={12} /> },
              { key: 'visited',  label: '내 기록',  icon: <User size={12} /> },
            ] as const).map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-bold transition-all hover:scale-105"
                style={{
                  background: filter === f.key ? '#1B4332' : 'rgba(255,255,255,0.9)',
                  color: filter === f.key ? '#fff' : '#2D6A4F',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  backdropFilter: 'blur(4px)',
                }}
              >
                {f.icon} {f.label}
                {f.key === 'favorite' && (
                  <span className="ml-0.5 opacity-70">{toilets.filter(t=>t.isFavorite).length}</span>
                )}
                {f.key === 'visited' && (
                  <span className="ml-0.5 opacity-70">{toilets.filter(t=>t.isVisited).length}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* ── 우측 플로팅 버튼 ── */}
        <div className="absolute right-4 bottom-8 z-20 flex flex-col gap-2">
          {/* 현재 위치 버튼 */}
          <motion.button
            whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.92 }}
            onClick={moveToMyLocation}
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{
              background: '#fff',
              boxShadow: '0 4px 16px rgba(27,67,50,0.2)',
              border: '1px solid #d4e8db',
            }}
          >
            <LocateFixed size={20} style={{ color: '#1B4332' }} />
          </motion.button>
        </div>

        {/* ── 범례 ── */}
        <div
          className="absolute left-4 bottom-8 z-20 px-3 py-2 rounded-2xl flex flex-col gap-1"
          style={{ background: 'rgba(255,255,255,0.92)', boxShadow: '0 2px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(6px)' }}
        >
          <div className="flex items-center gap-2 text-xs" style={{ color: '#1a2b22' }}>
            <span>💩</span> <span className="font-semibold">방문 인증 완료</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#7a9e8a' }}>
            <span style={{ filter: 'grayscale(1)', opacity: 0.6 }}>🚻</span> <span>미방문</span>
          </div>
          <div className="flex items-center gap-2 text-xs" style={{ color: '#b5810f' }}>
            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#E8A838', display: 'inline-block', outline: '2px solid #E8A838', outlineOffset: '2px' }} />
            <span>24시간 개방</span>
          </div>
        </div>

        {/* ── 선택된 화장실 팝업 ── */}
        <AnimatePresence>
          {selectedToilet && (
            <div className="absolute inset-0 z-30 pointer-events-none">
              <div
                className="absolute pointer-events-auto"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <ToiletPopup
                  toilet={selectedToilet}
                  onClose={() => setSelectedToilet(null)}
                  onFavoriteToggle={(id) => {
                    toggleFavorite(id);
                    setSelectedToilet((prev) =>
                      prev?.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev
                    );
                  }}
                  onVisitComplete={(id) => {
                    markVisited(id);
                    setSelectedToilet((prev) =>
                      prev?.id === id ? { ...prev, isVisited: true } : prev
                    );
                  }}
                />
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
