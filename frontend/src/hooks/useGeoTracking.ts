import { useState, useEffect, useRef } from 'react';
import { getDistance } from '../utils/geoUtils';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';

interface GeoPosition {
  lat: number;
  lng: number;
}

/**
 * 전역 위치 트래킹 및 자동 체크인(Fast Check-in) 훅
 */
export function useGeoTracking(
  toilets: ToiletData[], 
  onAutoCheckIn?: (remainedSeconds: number) => void,
  isEnabled: boolean = true
) {
  const [position, setPosition] = useState<GeoPosition | null>(null);
  const [granted, setGranted] = useState(false);
  const lastCheckInRef = useRef<Map<string, number>>(new Map());
  const toiletsRef = useRef(toilets);

  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    if (!isEnabled || !navigator.geolocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (p) => {
        const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
        setPosition(newPos);
        setGranted(true);
        
        const isLogged = !!localStorage.getItem('accessToken');
        if (!isLogged) return;

        toiletsRef.current.forEach((toilet) => {
          const dist = getDistance(newPos.lat, newPos.lng, toilet.lat, toilet.lng);
          
          if (dist <= 150) {
            const now = Date.now();
            const lastTime = lastCheckInRef.current.get(toilet.id) || 0;
            
            if (now - lastTime > 120000) {
              lastCheckInRef.current.set(toilet.id, now);
              console.log(`[Fast Check-in] ${toilet.name} 진입 감지 (${Math.round(dist)}m). 체크인 핑 전송.`);
              
              api.post('/api/v1/records/check-in', {
                toiletId: Number(toilet.id),
                latitude: newPos.lat,
                longitude: newPos.lng
              })
              .then((res: any) => {
                // 서버에서 준 남은 시간 정보를 콜백으로 전달
                if (onAutoCheckIn && res && typeof res.remainedSeconds === 'number') {
                  onAutoCheckIn(res.remainedSeconds);
                }
              })
              .catch(err => {
                console.warn('[Fast Check-in] 체크인 API 호출 실패:', err.message);
              });
            }
          }
        });
      },
      (err) => {
        console.error('[GeoTracking] 위치 추적 실패:', err);
        setGranted(false);
        if (!position) {
            setPosition({ lat: 37.5172, lng: 127.0473 }); // Fallback
        }
      },
      { 
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isEnabled, toilets]); // toilets 리스트가 갱신될 때마다 주변 확인

  return { position, granted };
}
