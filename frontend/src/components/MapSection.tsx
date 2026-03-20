import { useRef, useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Navigation, Clock, Accessibility } from 'lucide-react';
import { useToilets } from '../hooks/useToilets';
import { ToiletData } from '../types/toilet';

declare global {
  interface Window {
    kakao: any;
  }
}

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const navigate = useNavigate();
  
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // 현재 중심 좌표 및 지도 반경/영역 상태 관리
  const [mapCenter, setMapCenter] = useState({ lat: 37.5666, lng: 126.9784 });
  const [mapBounds, setMapBounds] = useState<any>(null);

  // 실시간 지도 연동 훅 사용
  const { toilets, loading } = useToilets({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
    radius: 1000,
    bounds: mapBounds
  });

  // 기존 마커 모두 지우기 함수
  const clearMarkers = useCallback(() => {
    markersRef.current.forEach(overlay => overlay.setMap(null));
    markersRef.current = [];
  }, []);

  // 지도 초기화
  useEffect(() => {
    if (!window.kakao || !mapRef.current || mapInstance.current) return;

    window.kakao.maps.load(() => {
      // 이전에 인스턴스가 있었으면 중복 생성 방지 
      if (!mapRef.current || mapInstance.current) return;
      
      // 겹침 현상 방지: 컨테이너 비우기
      mapRef.current.innerHTML = '';
      
      const initMap = (lat: number, lng: number) => {
        // 이미 인스턴스가 생겼는지 한 번 더 체크 (경쟁 방지)
        if (mapInstance.current) return;

        const center = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        });
        mapInstance.current = map;

        // 현재 위치 마커 (파란색 원)
        const currentOverlay = new window.kakao.maps.CustomOverlay({
          position: center,
          content: `
            <div style="
              width:16px;height:16px;
              border-radius:50%;
              background:#3B82F6;
              border:3px solid white;
              box-shadow:0 2px 8px rgba(59,130,246,0.6);
            "></div>`,
          zIndex: 10,
        });
        currentOverlay.setMap(map);

        // 지도가 멈췄을 때 현재 영역(Bounds) 업데이트 -> useToilets가 새 데이터 fetch
        window.kakao.maps.event.addListener(map, 'idle', () => {
          const bounds = map.getBounds();
          const sw = bounds.getSouthWest();
          const ne = bounds.getNorthEast();
          
          setMapBounds({
            swLat: sw.getLat(),
            swLng: sw.getLng(),
            neLat: ne.getLat(),
            neLng: ne.getLng(),
          });
          
          const centerPos = map.getCenter();
          setMapCenter({ lat: centerPos.getLat(), lng: centerPos.getLng() });
        });

        setMapLoaded(true);
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
        () => initMap(37.5666, 126.9784)
      );
    });

    return () => {
      // 컴포넌트 언마운트 시 인스턴스 참조 초기화
      mapInstance.current = null;
    };
  }, []);

  // 화장실 데이터(toilets)가 변경될 때마다 마커 업데이트
  useEffect(() => {
    if (!mapInstance.current || !toilets) return;

    clearMarkers();

    toilets.forEach((toilet) => {
      const pos = new window.kakao.maps.LatLng(toilet.lat, toilet.lng);
      const color = toilet.isOpen24h ? '#2D6A4F' : '#E8A838';
      const emoji = toilet.isOpen24h ? '🚻' : '🚾';

      const overlay = new window.kakao.maps.CustomOverlay({
        position: pos,
        content: `
          <div style="display:flex;flex-direction:column;align-items:center;cursor:pointer;" id="marker-${toilet.id}">
            <div style="
              background:${color};
              color:white;
              border-radius:12px;
              padding:6px 10px;
              font-size:13px;
              font-weight:700;
              box-shadow:0 4px 12px rgba(0,0,0,0.2);
              white-space:nowrap;
              border:2px solid white;
            ">${emoji} ${toilet.isOpen24h ? '24H' : '운영 중'}</div>
            <div style="border-left:7px solid transparent;border-right:7px solid transparent;border-top:9px solid ${color};margin-top:-1px;"></div>
          </div>`,
        yAnchor: 1.2,
        zIndex: 5,
      });

      overlay.setMap(mapInstance.current);
      markersRef.current.push(overlay);

      // 커스텀 오버레이 클릭 이벤트를 DOM 수동 연결 (선택된 화장실 상태 업데이트용)
      setTimeout(() => {
        const el = document.getElementById(`marker-${toilet.id}`);
        if (el) {
          el.onclick = () => setSelectedToilet(toilet);
        }
      }, 100);
    });
  }, [toilets, clearMarkers]);

  return (
    <section className="px-6 md:px-12 pt-32 pb-48" style={{ background: '#F8FAF9' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* 섹션 헤더 */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8"
        >
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: 'var(--green-mid)' }}>MAP</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}>내 주변 화장실 지도</h2>
            <p className="mt-2 text-base" style={{ color: 'var(--text-sec)' }}>실시간 백엔드 데이터 연동 · 24시간 개방 화장실 자동 탐색</p>
          </div>

          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shrink-0"
            style={{ backgroundColor: 'var(--green-deep)', color: 'white', boxShadow: '0 4px 16px rgba(27,67,50,0.25)' }}
          >
            <Maximize2 size={16} /> 전체 지도 보기
          </motion.button>
        </motion.div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#2D6A4F' }} /> 24시간 개방
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#E8A838' }} /> 현재 운영 중
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#3B82F6' }} /> 내 위치
          </div>
        </div>

        {/* 지도 + 사이드 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ duration: 0.6 }}
            className="lg:col-span-2 relative"
            style={{ borderRadius: '20px', overflow: 'hidden', border: '1px solid #E2E8E6', boxShadow: '0 8px 32px rgba(0,0,0,0.08)' }}
          >
            <div ref={mapRef} className="h-[360px] md:h-[480px] w-full" />
            
            {/* 데이터 로딩 표시 */}
            {(loading || !mapLoaded) && (
              <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(238, 245, 240, 0.6)', backdropFilter: 'blur(2px)' }}>
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} className="text-3xl">🧩</motion.div>
              </div>
            )}
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            whileInView={{ opacity: 1, x: 0 }} 
            viewport={{ once: true }} 
            transition={{ duration: 0.6, delay: 0.15 }} 
            className="flex flex-col gap-3 lg:h-[480px] overflow-hidden"
          >
            <p className="text-xs font-semibold px-1" style={{ color: 'var(--text-sec)' }}>
              {toilets.length > 0 ? `📍 주변에 ${toilets.length}개의 화장실을 찾았습니다` : '📍 주변 화장실을 불러오고 있어요...'}
            </p>

            {selectedToilet ? (
              <motion.div key={selectedToilet.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl" style={{ backgroundColor: 'var(--surface)', border: '2px solid var(--green-deep)', boxShadow: '0 4px 20px rgba(27,67,50,0.12)' }}>
                <h4 className="font-black text-lg mb-2" style={{ color: 'var(--text-main)' }}>{selectedToilet.name}</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedToilet.isOpen24h && (
                    <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: 'rgba(45,106,79,0.1)', color: 'var(--green-mid)' }}>
                      <Clock size={11} /> 24시간
                    </span>
                  )}
                  {/* roadAddress 사용 (selectedToilet.roadAddress) */}
                  {selectedToilet.roadAddress && (
                    <span className="text-[10px] text-gray-400 font-medium">{selectedToilet.roadAddress}</span>
                  )}
                </div>
                <button
                  className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{ backgroundColor: 'var(--green-deep)', color: 'white' }}
                  onClick={() => {
                    const url = `https://map.kakao.com/link/to/${selectedToilet.name},${selectedToilet.lat},${selectedToilet.lng}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Navigation size={16} /> 카카오맵 길찾기
                </button>
              </motion.div>
            ) : null}

            {/* 불러온 화장실 목록 — 지도 높이에 맞춰 자동 조절 */}
            <div className="flex flex-col gap-2 overflow-y-auto pr-1 flex-1 custom-scrollbar">
              {toilets.length === 0 && !loading && (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-40">
                  <p className="text-sm">주변에 화장실이 없습니다</p>
                </div>
              )}
              {toilets.slice(0, 20).map((toilet, i) => (
                <motion.div
                  key={toilet.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  onClick={() => {
                    setSelectedToilet(toilet);
                    if (mapInstance.current) {
                      mapInstance.current.setCenter(new window.kakao.maps.LatLng(toilet.lat, toilet.lng));
                    }
                  }}
                  className="p-4 rounded-2xl cursor-pointer transition-all hover:bg-white/60 shrink-0"
                  style={{
                    backgroundColor: selectedToilet?.id === toilet.id ? 'rgba(27,67,50,0.05)' : 'var(--surface)',
                    border: selectedToilet?.id === toilet.id ? '1px solid var(--green-deep)' : '1px solid var(--border-light)',
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>{toilet.isOpen24h ? '🟢' : '🟡'} {toilet.name}</p>
                      <p className="text-xs mt-0.5 text-gray-500 truncate max-w-[180px]">{toilet.roadAddress || (toilet.isOpen24h ? '24시간 개방' : '운영 확인 필요')}</p>
                    </div>
                    <Navigation size={14} style={{ color: 'var(--text-sec)' }} />
                  </div>
                </motion.div>
              ))}
            </div>

            <button onClick={() => navigate('/map')} className="py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]" style={{ border: '1.5px dashed rgba(45,106,79,0.3)', color: 'var(--green-mid)', backgroundColor: 'transparent' }}>
              + 전체 목록 보기
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
