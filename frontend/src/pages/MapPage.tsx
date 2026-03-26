import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
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
  const [visitCounts, setVisitCounts] = useState<Record<string, number>>({});
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  // visitCounts로부터 visitedIds Set 생성 (메모이제이션)
  const visitedIds = useMemo(() => {
    return new Set(Object.keys(visitCounts).filter((id) => visitCounts[id] > 0));
  }, [visitCounts]);

  // 데이터 훅
  const { toilets, toggleFavorite, markVisited, refetch } = useToilets({
    lat: 37.5172,
    lng: 127.0473,
    bounds,
    level: mapLevel,
    visitedIds,
    favoriteIds,
  });

  const handleAutoCheckIn = useCallback((remainedSeconds: number) => {
    const startTime = Date.now() - (60 - remainedSeconds) * 1000;
    setCheckInTime(startTime);
  }, []);

  const { position: pos } = useGeoTracking(toilets, handleAutoCheckIn);

  // ── 방문 횟수 데이터 가져오기 ──────────────────────────────
  useEffect(() => {
    const fetchVisitCounts = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setVisitCounts({});
        return;
      }
      try {
        const data = await api.get<Record<string, number>>('/records/my-visit-counts');
        setVisitCounts(data || {});
      } catch (e) {
        console.warn('방문 횟수 조회 실패:', e);
        setVisitCounts({});
      }
    };
    fetchVisitCounts();
  }, []);

  // ── 즐겨찾기 목록 가져오기 ──────────────────────────────
  useEffect(() => {
    const fetchFavorites = async () => {
      const token = localStorage.getItem('accessToken');
      if (!token) return; // 비로그인 상태면 기존 상태 유지 (sync useEffect 트리거 방지)
      try {
        const data = await api.get<number[]>('/favorites');
        setFavoriteIds(new Set((data || []).map((id) => String(id))));
      } catch (e) {
        console.warn('즐겨찾기 조회 실패:', e);
        // 실패 시 setFavoriteIds 호출 안 함: 빈 Set으로 덮어쓰면 sync useEffect가 전체 초기화함
      }
    };
    fetchFavorites();
  }, []);

  // ── 비즈니스 로직 ──────────────────────────────────────────

  const handleSelectToilet = useCallback(
    (toilet: ToiletData | null) => {
      if (toilet) {
        const fresh = toilets.find((t) => t.id === toilet.id) ?? toilet;
        setSelectedToilet(fresh);
        sessionStorage.setItem('lastSelectedToilet', JSON.stringify(fresh));
      } else {
        setSelectedToilet(null);
        sessionStorage.removeItem('lastSelectedToilet');
      }
    },
    [toilets],
  );

  const handleFavoriteToggle = useCallback(
    async (id: string) => {
      if (!localStorage.getItem('accessToken')) {
        openAuth('login');
        return;
      }

      // 1. 낙관적 업데이트: favoriteIds (SSOT) 즉시 변경 → sync useEffect가 마커 isFavorite 갱신
      const wasAdded = !favoriteIds.has(id);
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        wasAdded ? next.add(id) : next.delete(id);
        return next;
      });
      // 2. 팝업 즉시 반영 (selectedToilet은 sync useEffect 대상 아님)
      setSelectedToilet((prev) => {
        if (prev && prev.id === id) {
          const updated = { ...prev, isFavorite: wasAdded };
          sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
          return updated;
        }
        return prev;
      });

      try {
        const isAdded = await api.post<boolean>(`/favorites/${id}`);
        // 3. 서버 응답으로 재동기화 (낙관적 추측과 다를 경우만 보정)
        if (isAdded !== wasAdded) {
          setFavoriteIds((prev) => {
            const next = new Set(prev);
            isAdded ? next.add(id) : next.delete(id);
            return next;
          });
          setSelectedToilet((prev) => {
            if (prev && prev.id === id) {
              const updated = { ...prev, isFavorite: isAdded };
              sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
              return updated;
            }
            return prev;
          });
        }
      } catch (e) {
        // 4. 실패 시 롤백
        setFavoriteIds((prev) => {
          const next = new Set(prev);
          wasAdded ? next.delete(id) : next.add(id);
          return next;
        });
        setSelectedToilet((prev) => {
          if (prev && prev.id === id) {
            const updated = { ...prev, isFavorite: !wasAdded };
            sessionStorage.setItem('lastSelectedToilet', JSON.stringify(updated));
            return updated;
          }
          return prev;
        });
        console.error('즐겨찾기 처리 실패:', e);
        alert('즐겨찾기 처리에 실패했습니다.');
      }
    },
    [favoriteIds, openAuth],
  );

  const handleVisitRequest = useCallback(async () => {
    const isLogged = !!localStorage.getItem('accessToken');
    if (!isLogged) {
      if (selectedToilet)
        sessionStorage.setItem('lastSelectedToilet', JSON.stringify(selectedToilet));
      handleSelectToilet(null);
      openAuth('login');
      return;
    }

    if (!selectedToilet || !pos) return;

    try {
      const res: any = await api.post('/records/check-in', {
        toiletId: Number(selectedToilet.id),
        latitude: pos.lat,
        longitude: pos.lng,
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

  const handleVisitComplete = useCallback(
    async (recordData: any) => {
      if (!pos) return;
      try {
        const payload: any = {
          toiletId: Number(recordData.toiletId),
          conditionTags: recordData.conditionTags || [],
          dietTags: recordData.foodTags || [],
          latitude: pos.lat,
          longitude: pos.lng,
        };

        // Fast-Track 방식: bristolType, color가 null이 아닐 때만 포함
        if (recordData.bristolType !== null) {
          payload.bristolScale = recordData.bristolType;
        }
        if (recordData.color !== null) {
          payload.color = recordData.color;
        }

        // AI 촬영 인증: imageBase64가 있으면 포함
        if (recordData.imageBase64) {
          payload.imageBase64 = recordData.imageBase64;
        }

        await api.post('/records', payload);
        markVisited(String(recordData.toiletId));
        setVisitCounts((prev) => ({
          ...prev,
          [String(recordData.toiletId)]: (prev[String(recordData.toiletId)] || 0) + 1,
        }));
        setTargetForVisit(null);
        alert('방문 인증이 완료되었습니다! 💩✨');
      } catch (e: any) {
        const code = e.code || 'UNKNOWN';
        switch (code) {
          case 'STAY_TIME_NOT_MET':
            alert('⏳ 아직 1분이 지나지 않았습니다. 잠시 후 다시 시도해주세요!');
            break;
          case 'LOCATION_OUT_OF_RANGE':
          case 'OUT_OF_RANGE':
            alert('📍 화장실 근처(150m 이내)에서만 인증이 가능합니다.');
            break;
          default:
            alert(`인증 오류: ${e.message || '서버 오류'}`);
        }
      }
    },
    [markVisited, pos],
  );

  // visitCount 병합
  const toiletsWithVisitCount = toilets.map((t) => ({
    ...t,
    visitCount: visitCounts[t.id] || 0,
  }));

  const filteredToilets = toiletsWithVisitCount.filter((t) => {
    const matchesFilter =
      filter === 'all'
        ? true
        : filter === 'favorite'
          ? t.isFavorite
          : filter === 'visited'
            ? t.isVisited
            : true;
    const matchesSearch =
      searchQuery.trim() === '' ||
      t.name.includes(searchQuery) ||
      (t.roadAddress && t.roadAddress.includes(searchQuery));
    return matchesFilter && matchesSearch;
  });

  if (!pos) {
    return (
      <div
        className="relative h-screen flex flex-col overflow-hidden"
        style={{ background: '#F2F7F4' }}
      >
        <Navbar openAuth={openAuth} />
        <div className="flex-1 flex items-center justify-center text-center">
          <div className="text-4xl mb-4 animate-bounce">📍</div>
          <p className="text-[#7a9e8a] font-bold">위치를 찾고 있습니다...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative h-screen flex flex-col overflow-hidden"
      style={{ background: '#F2F7F4' }}
    >
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
              <div
                className="absolute pointer-events-auto"
                style={{ left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
              >
                <ToiletPopup
                  toilet={selectedToilet}
                  onClose={() => handleSelectToilet(null)}
                  onFavoriteToggle={handleFavoriteToggle}
                  onVisitRequest={handleVisitRequest}
                  userPosition={pos}
                  distanceInMeters={calculateDistance(
                    pos.lat,
                    pos.lng,
                    selectedToilet.lat,
                    selectedToilet.lng,
                  )}
                  openAuth={openAuth}
                  onReviewUpdate={refetch}
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
