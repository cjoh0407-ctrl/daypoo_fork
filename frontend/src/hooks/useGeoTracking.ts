import { useState, useEffect, useRef } from 'react';
import { getDistance } from '../utils/geoUtils';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';

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
  const { refreshUser } = useAuth();

  useEffect(() => {
    toiletsRef.current = toilets;
  }, [toilets]);

  useEffect(() => {
    if (!isEnabled || !navigator.geolocation) return;

    let watchId: number | null = null;
    let permissionStatus: PermissionStatus | null = null;

    const startWatching = () => {
      if (watchId !== null) return; // Already watching

      watchId = navigator.geolocation.watchPosition(
        (p) => {
          const newPos = { lat: p.coords.latitude, lng: p.coords.longitude };
          setPosition(newPos);
          setGranted(true);
          
          const isLogged = !!(localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken'));
          if (!isLogged) return;

          toiletsRef.current.forEach((toilet) => {
            const dist = getDistance(newPos.lat, newPos.lng, toilet.lat, toilet.lng);
            if (dist <= 150) {
              const now = Date.now();
              const lastTime = lastCheckInRef.current.get(toilet.id) || 0;
              if (now - lastTime > 120000) {
                lastCheckInRef.current.set(toilet.id, now);
                console.log(`[Fast Check-in] ${toilet.name} 진입 감지 (${Math.round(dist)}m). 체크인 핑 전송.`);
                
                api.post('/records/check-in', {
                  toiletId: Number(toilet.id),
                  latitude: newPos.lat,
                  longitude: newPos.lng
                })
                .then(async (res: any) => {
                  await refreshUser();
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
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    };

    const initTracking = async () => {
      if ('permissions' in navigator) {
        try {
          permissionStatus = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
          
          // Start immediately if already granted or denied (fallback logic)
          if (permissionStatus.state === 'granted') {
            startWatching();
          }

          // Real-time listener for the custom banner interaction
          permissionStatus.onchange = () => {
            console.log('[GeoTracking] Permission state changed:', permissionStatus?.state);
            if (permissionStatus?.state === 'granted') {
              startWatching();
            } else if (permissionStatus?.state === 'denied') {
              if (watchId !== null) {
                navigator.geolocation.clearWatch(watchId);
                watchId = null;
              }
              setGranted(false);
            }
          };
        } catch (e) {
          console.warn('Geolocation permission query unsupported, falling back to immediate request');
          startWatching();
        }
      } else {
        // Fallback for Safari/Legacy
        startWatching();
      }
    };

    initTracking();

    return () => {
      if (watchId !== null) navigator.geolocation.clearWatch(watchId);
      if (permissionStatus) permissionStatus.onchange = null;
    };
  }, [isEnabled, toilets, refreshUser]); 

  return { position, granted };
}
