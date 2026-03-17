import { useState, useEffect, useCallback } from 'react';
import { ToiletData, MOCK_TOILETS } from '../types/toilet';

// ── 공공데이터 API 응답 → 내부 타입 변환 ─────────────────────────────
// 행정안전부 전국공중화장실표준데이터 API
// https://www.data.go.kr/data/15012892/standard.do
// serviceKey는 .env에서 VITE_TOILET_API_KEY로 관리

interface RawToiletItem {
  wtnnmNm: string;          // 화장실명
  rdnmadr: string;          // 소재지도로명주소
  lnmadr?: string;          // 소재지지번주소
  latitude: string;         // 위도
  longitude: string;        // 경도
  opntime?: string;         // 평일운영시작시각
  clstime?: string;         // 평일운영종료시각
  satOpntime?: string;
  satClstime?: string;
  holOpntime?: string;
  holClstime?: string;
  wntyIsYn?: string;        // 남여공용여부 (Y/N)
  mlChmnCnt?: string;       // 남성대변기수
  mlUrinalCnt?: string;     // 남성소변기수
  fmlChmnCnt?: string;      // 여성대변기수
  dspsChmnCnt?: string;     // 장애인용변기수
  chldChmnCnt?: string;     // 어린이용변기수
  nprgnDprtrFcltyIsYn?: string; // 기저귀교환대
  emgncyBellIsYn?: string;  // 비상벨
  cctvisYn?: string;        // CCTV
  institutionNm?: string;   // 관리기관명
  phoneNumber?: string;     // 전화번호
}

function parseOpenTime(open?: string, close?: string): string | undefined {
  if (!open || !close) return undefined;
  return `${open}~${close}`;
}

function isOpen24h(openTime?: string): boolean {
  if (!openTime) return false;
  return openTime.includes('00:00~24:00') || openTime.includes('00:00~23:59');
}

function rawToToilet(raw: RawToiletItem, index: number): ToiletData | null {
  const lat = parseFloat(raw.latitude);
  const lng = parseFloat(raw.longitude);
  if (isNaN(lat) || isNaN(lng)) return null;

  const openTime = parseOpenTime(raw.opntime, raw.clstime);

  return {
    id: `api_${index}_${raw.rdnmadr?.slice(0, 10)}`,
    name: raw.wtnnmNm || '이름없음',
    roadAddress: raw.rdnmadr || '',
    jibunAddress: raw.lnmadr,
    lat, lng,
    openTime,
    openTimeSat: parseOpenTime(raw.satOpntime, raw.satClstime),
    openTimeHol: parseOpenTime(raw.holOpntime, raw.holClstime),
    isOpen24h: isOpen24h(openTime),
    isMixedGender: raw.wntyIsYn === 'Y',
    maleToilet: raw.mlChmnCnt ? parseInt(raw.mlChmnCnt) : undefined,
    maleUrinal: raw.mlUrinalCnt ? parseInt(raw.mlUrinalCnt) : undefined,
    femaleToilet: raw.fmlChmnCnt ? parseInt(raw.fmlChmnCnt) : undefined,
    disabledToilet: raw.dspsChmnCnt ? parseInt(raw.dspsChmnCnt) : undefined,
    childToilet: raw.chldChmnCnt ? parseInt(raw.chldChmnCnt) : undefined,
    hasDiaperTable: raw.nprgnDprtrFcltyIsYn === 'Y',
    hasEmergencyBell: raw.emgncyBellIsYn === 'Y',
    hasCCTV: raw.cctvisYn === 'Y',
    managerName: raw.institutionNm,
    phone: raw.phoneNumber,
    isVisited: false,
    isFavorite: false,
  };
}

// ── 훅 ────────────────────────────────────────────────────────────────
interface UseToiletsOptions {
  lat: number;
  lng: number;
  radius?: number; // 미터 단위
}

export function useToilets({ lat, lng, radius = 1000 }: UseToiletsOptions) {
  const [toilets, setToilets] = useState<ToiletData[]>(MOCK_TOILETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchToilets = useCallback(async () => {
    const apiKey = import.meta.env.VITE_TOILET_API_KEY;

    // API Key 없으면 Mock 데이터 사용
    if (!apiKey) {
      console.warn('[useToilets] VITE_TOILET_API_KEY 없음 → Mock 데이터 사용');
      setToilets(MOCK_TOILETS);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // 행정안전부 공중화장실 API 호출
      // 위경도 기반 반경 검색 (pageNo, numOfRows 조정 가능)
      const url = new URL('https://api.odcloud.kr/api/15012892/v1/uddi:6b4c6b30-0b56-4dc8-aa0d-b4f7c9a0b1c2');
      url.searchParams.set('serviceKey', apiKey);
      url.searchParams.set('page', '1');
      url.searchParams.set('perPage', '100');
      // 위경도 필터는 파라미터로 지원 안 되므로, 전체 fetch 후 프론트에서 필터링
      url.searchParams.set('returnType', 'JSON');

      const res = await fetch(url.toString());
      if (!res.ok) throw new Error(`API 오류: ${res.status}`);

      const json = await res.json();
      const items: RawToiletItem[] = json.data ?? json.items ?? [];

      const parsed = items
        .map((item, i) => rawToToilet(item, i))
        .filter((t): t is ToiletData => t !== null)
        .filter((t) => {
          // 현재 위치 기반 반경 필터링
          const R = 6371000;
          const dLat = ((t.lat - lat) * Math.PI) / 180;
          const dLng = ((t.lng - lng) * Math.PI) / 180;
          const a = Math.sin(dLat / 2) ** 2 +
            Math.cos((lat * Math.PI) / 180) * Math.cos((t.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
          const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
          return dist <= radius;
        });

      setToilets(parsed.length > 0 ? parsed : MOCK_TOILETS);
    } catch (e) {
      console.error('[useToilets] fetch 실패:', e);
      setError('화장실 데이터를 불러오지 못했습니다.');
      setToilets(MOCK_TOILETS); // fallback
    } finally {
      setLoading(false);
    }
  }, [lat, lng, radius]);

  useEffect(() => {
    fetchToilets();
  }, [fetchToilets]);

  // 즐겨찾기 토글
  const toggleFavorite = useCallback((id: string) => {
    setToilets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isFavorite: !t.isFavorite } : t))
    );
  }, []);

  // 방문인증 완료
  const markVisited = useCallback((id: string) => {
    setToilets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, isVisited: true } : t))
    );
  }, []);

  return { toilets, loading, error, toggleFavorite, markVisited, refetch: fetchToilets };
}
