import { useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LocateFixed } from 'lucide-react';
import { Navbar } from '../components/Navbar';
import { ToiletPopup } from '../components/map/ToiletPopup';
import { useToilets } from '../hooks/useToilets';
import { useGeoTracking } from '../hooks/useGeoTracking';
import { ToiletData } from '../types/toilet';
import { VisitModal } from '../components/map/VisitModal';
import { api } from '../services/apiClient';
import { MapView, MapViewHandle } from '../components/map/MapView';
import { ToiletSearchBar } from '../components/map/ToiletSearchBar';
import { calculateDistance } from '../utils/distance';

type FilterMode = 'all' | 'favorite' | 'visited';

export function MapPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const mapViewRef = useRef<MapViewHandle>(null);
  
  // 상태 관리
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [targetForVisit, setTargetForVisit] = useState<ToiletData | null>(null);
  const [filter, setFilter] = useState<FilterMode>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [bounds, setBounds] = useState<any>(null);
  const [mapLevel, setMapLevel] = useState(4);
  const [checkInTime, setCheckInTime] = useState<number | null>(null);

  // 데이터 훅
  const { toilets, toggleFavorite, markVisited } = useToilets({ 
    lat: 37.5172, 
    lng: 127.0473, 
    bounds,
    level: mapLevel
  });

  const handleAutoCheckIn = useCallback((remainedSeconds: number) => {
    const startTime = Date.now() - (60 - remainedSeconds) * 1000;
    setCheckInTime(startTime);
  }, []);

  const { position: pos } = useGeoTracking(toilets, handleAutoCheckIn);

  // ── 비즈니스 로직 ──────────────────────────────────────────

  const handleSelectToilet = useCallback((toilet: ToiletData | null) => {
    setSelectedToilet(toilet);
    if (toilet) sessionStorage.setItem('lastSelectedToilet', JSON.stringify(toilet));
    else sessionStorage.removeItem('lastSelectedToilet');
  }, []);

  const handleFavoriteToggle = useCallback((id: string) => {
    toggleFavorite(id);
    setSelectedToilet(prev => {
      const updated = prev && prev.id === id ? { ...prev, isFavorite: !prev.isFavorite } : prev;
      if (updated) sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
      return updated;
    });
  }, [toggleFavorite]);

  const handleVisitRequest = useCallback(async () => {
    const isLogged = !!localStorage.getItem('accessToken');
    if (!isLogged) {
      if (selectedToilet) sessionStorage.setItem('lastSelectedToilet', JSON.stringify(selectedToilet));
      handleSelectToilet(null);
      openAuth('login');
      return;
    }

    if (!selectedToilet || !pos) return;

    try {
      const res: any = await api.post('/records/check-in', {
        toiletId: Number(selectedToilet.id),
        latitude: pos.lat,
        longitude: pos.lng
      });
      
      if (res && typeof res.remainedSeconds === 'number') {
        setCheckInTime(Date.now() - (60 - res.remainedSeconds) * 1000);
      } else {
        setCheckInTime(Date.now());
      }
    } catch (e: any) {
      console.warn('체크인 호출 오류:', e.message);
      setCheckInTime(Date.now());
    }

    setTargetForVisit(selectedToilet);
    handleSelectToilet(null);
  }, [selectedToilet, openAuth, pos, handleSelectToilet]);

  const handleVisitComplete = useCallback(async (recordData: any) => {
    if (!pos) return;
    try {
      const payload: any = {
        toiletId: Number(recordData.toiletId),
        bristolScale: recordData.bristolType,
        color: recordData.color,
        conditionTags: recordData.conditionTags || [],
        dietTags: recordData.foodTags || [],
        latitude: pos.lat,
        longitude: pos.lng
      };

      // AI 촬영 인증: imageBase64가 있으면 포함
      if (recordData.imageBase64) {
        payload.imageBase64 = recordData.imageBase64;
      }

      await api.post('/records', payload);
      markVisited(String(recordData.toiletId));
      setTargetForVisit(null);
      alert('방문 인증이 완료되었습니다! 💩✨');
    } catch (e: any) {
      const code = e.code || 'UNKNOWN';
      switch (code) {
        case 'STAY_TIME_NOT_MET': alert('⏳ 아직 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요!'); break;
        case 'LOCATION_OUT_OF_RANGE':
        case 'OUT_OF_RANGE': alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.'); break;
        case 'COOLDOWN_ACTIVE':
        case 'DUPLICATE_RECORD': alert('⚠️ 같은 화장실은 3시간 이후에 다시 인증할 수 있습니다.'); break;
        default: alert(`인증 오류: ${e.message || '서버 오류'}`);
      }
    }
  }, [markVisited, pos]);

  const filteredToilets = toilets.filter((t) => {
    const matchesFilter = filter === 'all' ? true : filter === 'favorite' ? t.isFavorite : filter === 'visited' ? t.isVisited : true;
    const matchesSearch = searchQuery.trim() === '' || t.name.includes(searchQuery) || (t.roadAddress && t.roadAddress.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  if (!pos) {
    return (
      <div className="relative h-screen flex flex-col overflow-hidden" style={{ background: '#F2F7F4' }}>
        <Navbar openAuth={openAuth} />
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="text-4xl mb-4 animate-bounce">📍</div>
          <p className="text-[#7a9e8a] font-bold">위치를 찾고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-screen flex flex-col overflow-hidden" style={{ background: '#F2F7F4' }}>
      <Navbar openAuth={openAuth} />
      <div className="flex-1 relative">
        <MapView 
          ref={mapViewRef}
          toilets={filteredToilets}
          pos={pos}
          onSelectToilet={handleSelectToilet}
          onBoundsChange={setBounds}
          onLevelChange={setMapLevel}
        />

        <ToiletSearchBar 
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filter={filter}
          onFilterChange={setFilter}
        />

        <div className="absolute right-4 bottom-8 z-20">
          <button 
            onClick={() => mapViewRef.current?.panTo(pos.lat, pos.lng)} 
            className="w-12 h-12 rounded-full flex items-center justify-center bg-white shadow-lg active:scale-95 transition-transform"
          >
            <LocateFixed size={20} style={{ color: '#1B4332' }} />
          </button>
        </div>

        <AnimatePresence>
          {selectedToilet && pos && (
            <div className="absolute inset-0 z-[1001] pointer-events-none">
              <div className="absolute pointer-events-auto" style={{ left: '50%', top: '75%', transform: 'translate(-50%, -50%)' }}>
                <ToiletPopup
                  toilet={selectedToilet}
                  onClose={() => handleSelectToilet(null)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onVisitRequest={handleVisitRequest}
                  userPosition={pos}
                  distanceInMeters={calculateDistance(pos.lat, pos.lng, selectedToilet.lat, selectedToilet.lng)}
                />
              </div>
            </div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {targetForVisit && (
            <VisitModal 
              toilet={targetForVisit} 
              onClose={() => setTargetForVisit(null)} 
              onComplete={handleVisitComplete} 
              checkInTime={checkInTime} 
            />
          )}
        </AnimatePresence>
      </div>

      <style>{`
        @keyframes mypulse {
          0%   { box-shadow: 0 0 0 0 rgba(59,130,246,0.4); }
          70%  { box-shadow: 0 0 0 14px rgba(59,130,246,0); }
          100% { box-shadow: 0 0 0 0 rgba(59,130,246,0); }
        }
      `}</style>
    </div>
  );
}
