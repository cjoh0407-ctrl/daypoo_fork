import { useEffect, useRef, useCallback, useImperativeHandle, forwardRef } from 'react';
import { ToiletData } from '../../types/toilet';

declare global {
  interface Window {
    setSelectedToiletGlobal?: (toilet: ToiletData) => void;
  }
}

interface MapViewProps {
  toilets: ToiletData[];
  pos: { lat: number; lng: number };
  onSelectToilet: (toilet: ToiletData) => void;
  onBoundsChange: (bounds: { swLat: number; swLng: number; neLat: number; neLng: number; timestamp: number }) => void;
  onLevelChange: (level: number) => void;
}

export interface MapViewHandle {
  panTo: (lat: number, lng: number) => void;
}

// ── 카카오맵 마커 생성 헬퍼 ─────────────────────────────────────────
function createToiletMarker(kakao: any, toilet: ToiletData, onSelect: (t: ToiletData) => void) {
  const emoji = toilet.isVisited ? '💩' : '🚻';
  const markerBg = toilet.isVisited ? '#1B4332' : '#8a9a8a';

  // 글로벌 함수 등록 (마커 클릭 이벤트용)
  window.setSelectedToiletGlobal = onSelect;

  const content = `
    <div onclick="window.setSelectedToiletGlobal(${JSON.stringify(toilet).replace(/"/g, '&quot;')})" style="
      position:relative;
      display:flex;flex-direction:column;align-items:center;
      cursor:pointer;
      will-change:transform;
      transform:translateZ(0);
      contain:strict;
      width:36px; height:44px;
    ">
      <div style="
        width:36px;height:36px;border-radius:50%;
        background:${markerBg};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;
        box-shadow:0 3px 12px rgba(0,0,0,0.25);
        border:2.5px solid #fff;
        ${toilet.isOpen24h ? 'outline:2px solid #E8A838;outline-offset:2px;' : ''}
      ">${emoji}</div>
      <div style="
        width:0;height:0;
        border-left:6px solid transparent;
        border-right:6px solid transparent;
        border-top:8px solid ${markerBg};
        margin-top:-1px;
      "></div>
    </div>`;

  const marker = new kakao.maps.Marker({
    position: new kakao.maps.LatLng(toilet.lat, toilet.lng),
    zIndex: toilet.isVisited ? 5 : 3,
    image: new kakao.maps.MarkerImage(
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      new kakao.maps.Size(1, 1)
    )
  });

  const overlay = new kakao.maps.CustomOverlay({
    content,
    position: marker.getPosition(),
    yAnchor: 1.15,
    zIndex: toilet.isVisited ? 5 : 3,
    clickable: true
  });

  return { marker, overlay };
}

export const MapView = forwardRef<MapViewHandle, MapViewProps>(
  ({ toilets, pos, onSelectToilet, onBoundsChange, onLevelChange }, ref) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const clustererRef = useRef<any>(null);
    const markersRef = useRef<Map<string, { marker: any; overlay: any }>>(new Map());
    const myOverlayRef = useRef<any>(null);

    useImperativeHandle(ref, () => ({
      panTo: (lat: number, lng: number) => {
        if (mapRef.current) {
          mapRef.current.panTo(new window.kakao.maps.LatLng(lat, lng));
        }
      }
    }));

    const updateBounds = useCallback(() => {
      if (!mapRef.current) return;
      const b = mapRef.current.getBounds();
      const sw = b.getSouthWest();
      const ne = b.getNorthEast();
      const level = mapRef.current.getLevel();
      
      onLevelChange(level);
      onBoundsChange({ 
        swLat: sw.getLat(), swLng: sw.getLng(), 
        neLat: ne.getLat(), neLng: ne.getLng(),
        timestamp: Date.now()
      });
    }, [onBoundsChange, onLevelChange]);

    const updateMarkersVisibility = useCallback(() => {
      if (!mapRef.current) return;
      const level = mapRef.current.getLevel();
      markersRef.current.forEach((item) => {
        if (level >= 5) item.overlay.setMap(null);
        else item.overlay.setMap(mapRef.current);
      });
    }, []);

    useEffect(() => {
      if (!window.kakao || !mapContainerRef.current || mapRef.current) return;

      window.kakao.maps.load(() => {
        const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
        const map = new window.kakao.maps.Map(mapContainerRef.current, { center, level: 4 });
        mapRef.current = map;

        const clusterer = new window.kakao.maps.MarkerClusterer({
          map,
          averageCenter: true,
          minLevel: 5,
          gridSize: 70,
          styles: [{
            width: '60px', height: '60px',
            background: 'rgba(27, 67, 50, 0.9)',
            borderRadius: '50%', color: '#fff',
            textAlign: 'center', fontWeight: 'bold', lineHeight: '60px',
            border: '3px solid rgba(255,255,255,0.8)', 
            boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
            fontSize: '16px'
          }]
        });
        clustererRef.current = clusterer;

        window.kakao.maps.event.addListener(map, 'idle', updateBounds);
        window.kakao.maps.event.addListener(map, 'zoom_changed', updateMarkersVisibility);

        updateBounds();

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
            </div>`,
          zIndex: 10,
        });
        myOverlay.setMap(map);
        myOverlayRef.current = myOverlay;
      });

      return () => {
        delete window.setSelectedToiletGlobal;
      };
    }, []);

    useEffect(() => {
      if (!mapRef.current || !pos || !myOverlayRef.current) return;
      const center = new window.kakao.maps.LatLng(pos.lat, pos.lng);
      myOverlayRef.current.setPosition(center);
    }, [pos]);

    useEffect(() => {
      if (!mapRef.current || !clustererRef.current) return;

      const level = mapRef.current.getLevel();
      const maxRenderCount = level >= 7 ? 500 : 1000;
      const toiletsToRender = toilets.slice(0, maxRenderCount);
      const currentToiletsIds = new Set(toiletsToRender.map(t => t.id));

      const toRemove: any[] = [];
      const toUpdate: ToiletData[] = [];

      markersRef.current.forEach((item, id) => {
        if (!currentToiletsIds.has(id)) {
          item.overlay.setMap(null);
          toRemove.push(item.marker);
          markersRef.current.delete(id);
        } else {
          // 기존 마커의 isVisited 상태가 변경되었는지 확인
          const updatedToilet = toiletsToRender.find(t => t.id === id);
          if (updatedToilet && updatedToilet.isVisited) {
            // 방문 완료된 화장실은 마커를 재생성
            item.overlay.setMap(null);
            toRemove.push(item.marker);
            markersRef.current.delete(id);
            toUpdate.push(updatedToilet);
          }
        }
      });
      if (toRemove.length > 0) clustererRef.current.removeMarkers(toRemove);

      const newMarkers: any[] = [];
      // 새 마커와 업데이트된 마커 생성
      [...toiletsToRender.filter(t => !markersRef.current.has(t.id)), ...toUpdate].forEach((toilet) => {
        const { marker, overlay } = createToiletMarker(window.kakao, toilet, onSelectToilet);
        if (level < 5) overlay.setMap(mapRef.current);
        markersRef.current.set(toilet.id, { marker, overlay });
        newMarkers.push(marker);
      });

      if (newMarkers.length > 0) {
        clustererRef.current.addMarkers(newMarkers);
      }
      clustererRef.current.redraw();
    }, [toilets, onSelectToilet]);

    return (
      <div ref={mapContainerRef} className="w-full h-full" style={{ borderRadius: '0', willChange: 'transform', transform: 'translateZ(0)', backfaceVisibility: 'hidden' }} />
    );
  }
);
