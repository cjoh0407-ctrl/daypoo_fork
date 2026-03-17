import { motion, AnimatePresence } from 'framer-motion';
import { Navigation, X, Clock, Accessibility, AlertTriangle } from 'lucide-react';
import { useRef, useEffect } from 'react';

interface EmergencySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    kakao: any;
  }
}

// 급똥 우선순위: 24시간 개방 → 거리 순
const EMERGENCY_LIST = [
  {
    id: 1,
    rank: 1,
    name: '대치빌딩 1층 화장실',
    distance: '30m',
    time: '1분 미만',
    open24h: true,
    accessible: true,
    lat: 37.4985,
    lng: 127.0293,
    priority: '24시간',
  },
  {
    id: 2,
    rank: 2,
    name: 'GS25 혜민병원점',
    distance: '110m',
    time: '2분',
    open24h: true,
    accessible: false,
    lat: 37.4990,
    lng: 127.0305,
    priority: '24시간',
  },
  {
    id: 3,
    rank: 3,
    name: '중앙 공영 주차장',
    distance: '210m',
    time: '4분',
    open24h: false,
    accessible: true,
    lat: 37.4975,
    lng: 127.0315,
    priority: '운영 중',
  },
];

function MiniMap() {
  const miniMapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.kakao || !miniMapRef.current) return;

    window.kakao.maps.load(() => {
      navigator.geolocation.getCurrentPosition(
        (pos) => initMiniMap(pos.coords.latitude, pos.coords.longitude),
        () => initMiniMap(37.4985, 127.0293)
      );
    });

    function initMiniMap(lat: number, lng: number) {
      const center = new window.kakao.maps.LatLng(lat, lng);
      const map = new window.kakao.maps.Map(miniMapRef.current, {
        center,
        level: 3,
        draggable: false,
        scrollwheel: false,
        disableDoubleClick: true,
        disableDoubleClickZoom: true,
      });

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

      // 화장실 마커들
      EMERGENCY_LIST.forEach((t, i) => {
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
    }
  }, []);

  return (
    <div
      ref={miniMapRef}
      style={{
        width: '100%',
        height: '160px',
        borderRadius: '16px',
        overflow: 'hidden',
        border: '1px solid rgba(255,255,255,0.12)',
      }}
    />
  );
}

export function EmergencySheet({ isOpen, onClose }: EmergencySheetProps) {
  const openNav = (toilet: typeof EMERGENCY_LIST[0]) => {
    const kakaoUrl = `https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.lat},${toilet.lng}`;
    window.open(kakaoUrl, '_blank');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] rounded-t-[32px]"
            style={{ backgroundColor: '#1A2B27', maxHeight: '92vh', overflowY: 'auto' }}
          >
            <div className="max-w-lg mx-auto p-6 md:p-8 pb-10">
              {/* Handle bar */}
              <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

              {/* 헤더 */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 0.8, repeat: Infinity }}
                    className="w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(232,93,93,0.2)' }}
                  >
                    <AlertTriangle size={20} style={{ color: '#E85D5D' }} />
                  </motion.div>
                  <div>
                    <h2 className="text-xl font-black text-white leading-tight">
                      🚨 비상! 가장 가까운 화장실
                    </h2>
                    <p className="text-white/50 text-xs mt-0.5">24시간 개방 우선 · 현재 위치 기준</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={22} />
                </button>
              </div>

              {/* ── 미니맵 ── */}
              <div className="mb-5">
                <MiniMap />
              </div>

              {/* ── 화장실 리스트 ── */}
              <div className="space-y-3">
                {EMERGENCY_LIST.map((item, i) => {
                  const RANK_COLORS = ['#E85D5D', '#E8A838', '#2D6A4F'];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: 24 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.15 + i * 0.1 }}
                      className="p-4 rounded-2xl flex items-center justify-between gap-3"
                      style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}
                    >
                      {/* 순위 */}
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white shrink-0"
                        style={{ backgroundColor: RANK_COLORS[i] }}
                      >
                        {item.rank}
                      </div>

                      {/* 정보 */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white text-sm truncate">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-white/60 text-xs">{item.distance} · 도보 {item.time}</span>
                          {item.open24h && (
                            <span
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: 'rgba(45,106,79,0.3)', color: '#86EFAC' }}
                            >
                              <Clock size={9} /> 24H
                            </span>
                          )}
                          {item.accessible && (
                            <span
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                              style={{ backgroundColor: 'rgba(59,130,246,0.2)', color: '#93C5FD' }}
                            >
                              <Accessibility size={9} /> 장애인
                            </span>
                          )}
                        </div>
                      </div>

                      {/* 길찾기 버튼 */}
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => openNav(item)}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-bold shrink-0 transition-all"
                        style={{
                          backgroundColor: i === 0 ? '#E85D5D' : 'rgba(255,255,255,0.1)',
                          color: i === 0 ? 'white' : 'rgba(255,255,255,0.8)',
                          border: i === 0 ? 'none' : '1px solid rgba(255,255,255,0.15)',
                        }}
                      >
                        <Navigation size={13} />
                        길찾기
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>

              {/* 하단 안내 */}
              <p className="mt-5 text-center text-white/30 text-xs italic">
                * 공공데이터 기반 · 실시간 개방 정보 반영
              </p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
