import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';
import { useRef, useEffect, useState, useMemo } from 'react';
import { useToilets } from '../hooks/useToilets';
import { EmergencySheetPreview } from './EmergencySheetPreview';

interface EmergencySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

// 거리 계산 유틸리티 (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const R = 6371e3; // 지구 반지름 (m)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
};

// 도보 시간 계산 (평균 4.5km/h -> 1px/s 약 75m/min)
const calculateWalkTime = (meters: number) => {
  const minutes = Math.ceil(meters / 75);
  return minutes < 1 ? '1분 미만' : `${minutes}분`;
};

function MiniMap({ userPos, toilets }: { userPos: { lat: number; lng: number } | null, toilets: any[] }) {
  const miniMapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  useEffect(() => {
    if (!window.kakao || !miniMapRef.current || !userPos) return;

    window.kakao.maps.load(() => {
      if (miniMapRef.current) miniMapRef.current.innerHTML = '';
      
      const center = new window.kakao.maps.LatLng(userPos.lat, userPos.lng);
      const map = new window.kakao.maps.Map(miniMapRef.current, {
        center,
        level: 3,
        draggable: false,
        scrollwheel: false,
      });
      mapInstance.current = map;

      // 현재 위치 (파란 원)
      new window.kakao.maps.CustomOverlay({
        position: center,
        content: `<div style="
          width:14px;height:14px;border-radius:50%;
          background:#3B82F6;border:2.5px solid white;
          box-shadow:0 0 0 4px rgba(59,130,246,0.25);
        "></div>`,
        zIndex: 10,
      }).setMap(map);

      // 화장실 마커들 (최대 3개)
      toilets.slice(0, 3).forEach((t, i) => {
        const RANK_COLORS = ['#E85D5D', '#E8A838', '#2D6A4F'];
        const pos = new window.kakao.maps.LatLng(t.lat, t.lng);
        new window.kakao.maps.CustomOverlay({
          position: pos,
          content: `<div style="
            background:${RANK_COLORS[i]};
            color:white;
            border-radius:50%;
            width:24px;height:24px;
            display:flex;align-items:center;justify-content:center;
            font-size:11px;font-weight:900;
            border:2px solid white;
            box-shadow:0 2px 8px rgba(0,0,0,0.3);
          ">${i + 1}</div>`,
          zIndex: 5,
        }).setMap(map);
      });

      // 마커들이 다 보이도록 범위 재설정
      if (toilets.length > 0) {
        const bounds = new window.kakao.maps.LatLngBounds();
        bounds.extend(center);
        toilets.slice(0, 3).forEach(t => bounds.extend(new window.kakao.maps.LatLng(t.lat, t.lng)));
        map.setBounds(bounds, 40); // 40px padding
      }
    });
  }, [userPos, toilets]);

  return (
    <div
      ref={miniMapRef}
      style={{
        width: '100%',
        height: '180px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    />
  );
}

export function EmergencySheet({ isOpen, onClose }: EmergencySheetProps) {
  const [userPos, setUserPos] = useState<{ lat: number; lng: number } | null>(null);

  // 현재 위치 가져오기
  useEffect(() => {
    if (isOpen) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserPos({ lat: 37.5666, lng: 126.9784 }) // 서울 시청 기본값
      );
    }
  }, [isOpen]);

  // 실시간 데이터 가져오기 (반경 1km)
  const { toilets, loading } = useToilets({
    lat: userPos?.lat || 37.5666,
    lng: userPos?.lng || 126.9784,
    radius: 1000,
  });

  // 급똥 우선순위에 따른 정렬 및 가공
  const processedToilets = useMemo(() => {
    if (!userPos || !toilets) return [];

    return toilets
      .map(t => ({
        ...t,
        distanceMeters: calculateDistance(userPos.lat, userPos.lng, t.lat, t.lng)
      }))
      .sort((a, b) => {
        // 1순위: 24시간 여부
        if (a.isOpen24h && !b.isOpen24h) return -1;
        if (!a.isOpen24h && b.isOpen24h) return 1;
        // 2순위: 가까운 거리
        return a.distanceMeters - b.distanceMeters;
      })
      .slice(0, 5) // 상위 5개만 노출
      .map((t, index) => ({
        ...t,
        rank: index + 1,
        distanceStr: t.distanceMeters >= 1000 
          ? `${(t.distanceMeters / 1000).toFixed(1)}km` 
          : `${t.distanceMeters}m`,
        timeStr: calculateWalkTime(t.distanceMeters)
      }));
  }, [userPos, toilets]);

  const openNav = (toilet: any) => {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.lat},${toilet.lng}`;
    window.open(kakaoUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/60 backdrop-blur-md"
          />

          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 250 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] rounded-t-[40px]"
            style={{ 
              backgroundColor: '#121F1C', 
              maxHeight: '92vh', 
              overflowY: 'auto',
              boxShadow: '0 -10px 40px rgba(0,0,0,0.5)',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}
          >
            <div className="max-w-lg mx-auto p-6 md:p-8 pb-12 text-white">
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between mb-10">
                <div className="flex items-center gap-4">
                  <motion.div
                    animate={{ scale: [1, 1.2, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ duration: 1.2, repeat: Infinity }}
                    className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg"
                    style={{ backgroundColor: 'rgba(232,93,93,0.3)', border: '1px solid rgba(232,93,93,0.4)' }}
                  >
                    <AlertTriangle size={24} style={{ color: '#FF6B6B' }} />
                  </motion.div>
                  <div>
                    <h2 className="text-2xl font-black text-white leading-tight tracking-tight">
                      지금 가장 가까운 곳
                    </h2>
                    <p className="text-white/40 text-xs mt-1 font-medium">실시간 개방 정보 분석 결과</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 flex items-center justify-center rounded-full text-white/30 hover:text-white hover:bg-white/10 transition-all font-black"
                >
                  <X size={24} />
                </button>
              </div>

              {/* ── 실시간 미니맵 ── */}
              <div className="mb-10 relative">
                <MiniMap userPos={userPos} toilets={processedToilets} />
                {loading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl backdrop-blur-[1px]">
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-2xl">🚨</motion.div>
                  </div>
                )}
              </div>

              {/* ── 최적 경로 추천 부문 (1안: Horizontal 카드 레이아웃) ── */}
              <EmergencySheetPreview 
                processedToilets={processedToilets as any} 
                openNav={openNav} 
              />

              <p className="mt-10 text-center text-white/20 text-[10px] tracking-tight font-medium">
                현재 위치 기반 실시간 데이터 분석 · 도보 이동 시간 기준 정렬
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
