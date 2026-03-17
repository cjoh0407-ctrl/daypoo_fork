import { useRef, useEffect } from 'react';

declare global {
  interface Window {
    kakao: any;
  }
}

export function MapSection() {
  const mapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!window.kakao) return;
    
    window.kakao.maps.load(() => {
      navigator.geolocation.getCurrentPosition(pos => {
        const center = new window.kakao.maps.LatLng(
          pos.coords.latitude,
          pos.coords.longitude
        );
        const options = {
          center,
          level: 4,
        };
        const map = new window.kakao.maps.Map(mapRef.current, options);

        // Optional: Re-add markers if desired by user later
      }, () => {
        // Fallback if geo fails
        const center = new window.kakao.maps.LatLng(37.498, 127.027);
        new window.kakao.maps.Map(mapRef.current, { center, level: 4 });
      });
    });
  }, []);

  return (
    <section className="px-6 md:px-12 py-20" style={{ background: '#F8FAF9' }}>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

        {/* 섹션 헤더 */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontSize: '12px', fontWeight: 700, color: '#2D6A4F', letterSpacing: '0.1em', marginBottom: '10px' }}>
            MAP
          </p>
          <h2 style={{ fontSize: '36px', fontWeight: 900, color: '#1A2B27', letterSpacing: '-0.02em' }}>
            내 주변 화장실 지도
          </h2>
          <p style={{ fontSize: '16px', color: '#5C6B68', marginTop: '8px' }}>
            전국 7만 개 공중화장실 실시간 데이터
          </p>
        </div>

        {/* 지도 */}
        <div
          ref={mapRef}
          className="h-[320px] md:h-[520px] w-full"
          style={{
            borderRadius: '20px',
            overflow: 'hidden',
            border: '1px solid #E2E8E6',
          }}
        />

      </div>
    </section>
  );
}
