import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Maximize2, Navigation, Clock, Accessibility } from 'lucide-react';

declare global {
  interface Window {
    kakao: any;
  }
}

// 공공 화장실 샘플 데이터 (공공데이터 API 연동 전 mock)
// 실제 연동 시: https://www.data.go.kr 공중화장실 API 사용
const MOCK_TOILETS = [
  {
    id: 1,
    name: '서울광장 공중화장실',
    lat: 37.5666,
    lng: 126.9784,
    open24h: true,
    accessible: true,
    distance: '45m',
  },
  {
    id: 2,
    name: '청계광장 화장실',
    lat: 37.5700,
    lng: 126.9790,
    open24h: false,
    accessible: true,
    distance: '120m',
  },
  {
    id: 3,
    name: '명동 공중화장실',
    lat: 37.5636,
    lng: 126.9823,
    open24h: true,
    accessible: false,
    distance: '210m',
  },
  {
    id: 4,
    name: '남산공원 화장실',
    lat: 37.5512,
    lng: 126.9882,
    open24h: false,
    accessible: true,
    distance: '350m',
  },
];

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [selectedToilet, setSelectedToilet] = useState<typeof MOCK_TOILETS[0] | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!window.kakao || !mapRef.current) return;

    window.kakao.maps.load(() => {
      const tryInit = () => {
        navigator.geolocation.getCurrentPosition(
          (pos) => initMap(pos.coords.latitude, pos.coords.longitude),
          () => initMap(37.5666, 126.9784) // fallback: 서울 시청
        );
      };

      const initMap = (lat: number, lng: number) => {
        const center = new window.kakao.maps.LatLng(lat, lng);
        const map = new window.kakao.maps.Map(mapRef.current, {
          center,
          level: 4,
        });

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

        // 화장실 마커들
        MOCK_TOILETS.forEach((toilet) => {
          const pos = new window.kakao.maps.LatLng(toilet.lat, toilet.lng);

          // 24시간 여부에 따라 색상 다르게
          const color = toilet.open24h ? '#2D6A4F' : '#E8A838';
          const emoji = toilet.open24h ? '🚻' : '🚾';

          const markerContent = `
            <div style="
              display:flex;flex-direction:column;align-items:center;
              cursor:pointer;
            ">
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
              ">${emoji} ${toilet.open24h ? '24H' : '운영 중'}</div>
              <div style="
                width:0;height:0;
                border-left:7px solid transparent;
                border-right:7px solid transparent;
                border-top:9px solid ${color};
                margin-top:-1px;
              "></div>
            </div>`;

          const overlay = new window.kakao.maps.CustomOverlay({
            position: pos,
            content: markerContent,
            yAnchor: 1.2,
            zIndex: 5,
          });
          overlay.setMap(map);

          // 클릭 이벤트 (마커 클릭 시 사이드 패널 업데이트)
          window.kakao.maps.event.addListener(overlay, 'click', () => {
            setSelectedToilet(toilet);
          });
        });

        setMapLoaded(true);
      };

      tryInit();
    });
  }, []);

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
            <p
              className="text-xs font-bold uppercase tracking-widest mb-2"
              style={{ color: 'var(--green-mid)' }}
            >
              MAP
            </p>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
            >
              내 주변 화장실 지도
            </h2>
            <p className="mt-2 text-base" style={{ color: 'var(--text-sec)' }}>
              전국 7만 개 공중화장실 실시간 데이터 · 24시간 개방 우선 표시
            </p>
          </div>

          {/* 전체 지도 이동 버튼 */}
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => navigate('/map')}
            className="flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all shrink-0"
            style={{
              backgroundColor: 'var(--green-deep)',
              color: 'white',
              boxShadow: '0 4px 16px rgba(27,67,50,0.25)',
            }}
          >
            <Maximize2 size={16} />
            전체 지도 보기
          </motion.button>
        </motion.div>

        {/* 범례 */}
        <div className="flex flex-wrap gap-4 mb-5">
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#2D6A4F' }} />
            24시간 개방
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#E8A838' }} />
            현재 운영 중
          </div>
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--text-sec)' }}>
            <span className="w-3 h-3 rounded-full inline-block" style={{ backgroundColor: '#3B82F6' }} />
            내 위치
          </div>
        </div>

        {/* 지도 + 사이드 패널 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* 지도 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-2 relative"
            style={{
              borderRadius: '20px',
              overflow: 'hidden',
              border: '1px solid #E2E8E6',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
            }}
          >
            <div
              ref={mapRef}
              className="h-[360px] md:h-[480px] w-full"
            />

            {/* 로딩 오버레이 */}
            {!mapLoaded && (
              <div
                className="absolute inset-0 flex items-center justify-center"
                style={{ backgroundColor: '#eef5f0' }}
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
                  className="text-3xl"
                >
                  🗺️
                </motion.div>
              </div>
            )}

            {/* 전체보기 오버레이 버튼 (지도 우하단) */}
            <button
              onClick={() => navigate('/map')}
              className="absolute bottom-4 right-4 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: 'white',
                color: 'var(--green-deep)',
                boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
                border: '1px solid rgba(27,67,50,0.1)',
              }}
            >
              <Maximize2 size={14} />
              전체 지도
            </button>
          </motion.div>

          {/* 사이드 패널 — 선택된 화장실 or 목록 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex flex-col gap-3"
          >
            {/* 안내 텍스트 */}
            <p className="text-xs font-semibold px-1" style={{ color: 'var(--text-sec)' }}>
              📍 마커를 클릭하면 상세 정보가 보여요
            </p>

            {selectedToilet ? (
              /* 선택된 화장실 상세 */
              <motion.div
                key={selectedToilet.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-5 rounded-2xl"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '2px solid var(--green-deep)',
                  boxShadow: '0 4px 20px rgba(27,67,50,0.12)',
                }}
              >
                <h4 className="font-black text-lg mb-2" style={{ color: 'var(--text-main)' }}>
                  {selectedToilet.name}
                </h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedToilet.open24h && (
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'rgba(45,106,79,0.1)', color: 'var(--green-mid)' }}
                    >
                      <Clock size={11} /> 24시간
                    </span>
                  )}
                  {selectedToilet.accessible && (
                    <span
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold"
                      style={{ backgroundColor: 'rgba(59,130,246,0.1)', color: '#3B82F6' }}
                    >
                      <Accessibility size={11} /> 장애인 가능
                    </span>
                  )}
                </div>
                <p className="text-2xl font-black mb-4" style={{ color: 'var(--green-deep)' }}>
                  {selectedToilet.distance}
                </p>
                <button
                  className="w-full py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
                  style={{
                    backgroundColor: 'var(--green-deep)',
                    color: 'white',
                  }}
                  onClick={() => {
                    const url = `https://map.kakao.com/link/to/${selectedToilet.name},${selectedToilet.lat},${selectedToilet.lng}`;
                    window.open(url, '_blank');
                  }}
                >
                  <Navigation size={16} />
                  카카오맵 길찾기
                </button>
              </motion.div>
            ) : null}

            {/* 주변 화장실 목록 */}
            {MOCK_TOILETS.slice(0, selectedToilet ? 2 : 4).map((toilet, i) => (
              <motion.div
                key={toilet.id}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => setSelectedToilet(toilet)}
                className="p-4 rounded-2xl cursor-pointer transition-all hover:scale-[1.02]"
                style={{
                  backgroundColor: selectedToilet?.id === toilet.id ? 'rgba(27,67,50,0.05)' : 'var(--surface)',
                  border: selectedToilet?.id === toilet.id
                    ? '1.5px solid var(--green-deep)'
                    : '1px solid var(--border-light)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-sm" style={{ color: 'var(--text-main)' }}>
                      {toilet.open24h ? '🟢' : '🟡'} {toilet.name}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-sec)' }}>
                      {toilet.distance} · {toilet.open24h ? '24시간' : '운영 중'}
                    </p>
                  </div>
                  <Navigation size={14} style={{ color: 'var(--text-sec)' }} />
                </div>
              </motion.div>
            ))}

            {/* 더보기 → 전체 지도 */}
            <button
              onClick={() => navigate('/map')}
              className="py-3 rounded-2xl text-sm font-bold transition-all hover:scale-[1.02]"
              style={{
                border: '1.5px dashed rgba(45,106,79,0.3)',
                color: 'var(--green-mid)',
                backgroundColor: 'transparent',
              }}
            >
              + 더 많은 화장실 보기
            </button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
