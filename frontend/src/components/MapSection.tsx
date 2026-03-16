import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

declare global {
  interface Window {
    kakao: any;
  }
}

const NEARBY_RESTROOMS = [
  { id: 1, name: '중앙 공원 화장실', distance: '120m', rating: 4.5 },
  { id: 2, name: '스타빌딩 공용화장실', distance: '250m', rating: 4.2 },
  { id: 3, name: '강남역 5번출구 화장실', distance: '400m', rating: 3.8 },
];

export function MapSection() {
  const mapContainer = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.kakao || !mapContainer.current) return;

    const options = {
      center: new window.kakao.maps.LatLng(37.498, 127.027), // 강남역 근처
      level: 4,
    };

    const map = new window.kakao.maps.Map(mapContainer.current, options);

    // Mock markers
    const positions = [
      new window.kakao.maps.LatLng(37.498, 127.027),
      new window.kakao.maps.LatLng(37.499, 127.028),
      new window.kakao.maps.LatLng(37.497, 127.026),
    ];

    positions.forEach((pos) => {
      const markerImage = new window.kakao.maps.MarkerImage(
        'https://cdn-icons-png.flaticon.com/512/3063/3063822.png', // 똥 이모지 이미지
        new window.kakao.maps.Size(40, 40)
      );
      
      const marker = new window.kakao.maps.Marker({
        position: pos,
        image: markerImage,
      });
      marker.setMap(map);
    });
  }, []);

  return (
    <section className="relative w-full overflow-hidden" style={{ minHeight: '100vh' }}>
      {/* Map Container */}
      <div 
        ref={mapContainer} 
        className="w-full h-full absolute inset-0 md:h-screen h-[100vh]" // Mobile: 100vh for demo, User said 60vh mobil. Fixed below.
        style={{ height: 'inherit' }}
      />

      {/* Overlay Desktop Info */}
      <div className="absolute top-24 left-6 md:left-12 z-10 hidden md:block">
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          className="p-6 rounded-[24px] shadow-2xl backdrop-blur-md"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.9)', border: '1px solid var(--border-light)', minWidth: '320px' }}
        >
          <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--text-main)' }}>내 주변 화장실</h3>
          <div className="space-y-4">
            {NEARBY_RESTROOMS.map(item => (
              <div key={item.id} className="flex items-center justify-between p-3 rounded-xl hover:bg-black/5 cursor-pointer transition-colors">
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-main)' }}>{item.name}</p>
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>거리 {item.distance}</p>
                </div>
                <div className="text-sm font-bold" style={{ color: 'var(--amber)' }}>★ {item.rating}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Styled Gradient for shadow on top */}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/5 to-transparent h-32 w-full" />
    </section>
  );
}
