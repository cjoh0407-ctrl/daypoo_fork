// ── 공공데이터 API 화장실 타입 ─────────────────────────────────────
export interface ToiletData {
  id: string;
  name: string;             // 화장실명
  roadAddress: string;      // 소재지도로명주소
  jibunAddress?: string;    // 소재지지번주소
  lat: number;
  lng: number;
  openTime?: string;        // 개방시간 (평일)
  openTimeSat?: string;     // 개방시간 (토요일)
  openTimeHol?: string;     // 개방시간 (공휴일)
  isOpen24h: boolean;
  isMixedGender: boolean;   // 남여공용여부
  maleToilet?: number;      // 남성대변기수
  maleUrinal?: number;      // 남성소변기수
  femaleToilet?: number;    // 여성대변기수
  disabledToilet?: number;  // 장애인용변기수
  childToilet?: number;     // 어린이용변기수
  hasDiaperTable: boolean;  // 기저귀교환대
  hasEmergencyBell: boolean;// 비상벨
  hasCCTV: boolean;
  managerName?: string;     // 관리기관명
  phone?: string;
  isVisited: boolean;       // 방문인증 여부 (우리 서비스)
  isFavorite: boolean;      // 즐겨찾기
  rating?: number;          // 평균 별점
  reviewCount?: number;
}

// ── 리뷰 타입 ─────────────────────────────────────────────────────
export interface ToiletReview {
  id: string;
  toiletId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  rating: number;           // 1~5
  emojiTags: EmojiTag[];    // 이모지 평가
  bristolType?: number;     // 브리스톨 척도 1~7
  comment?: string;
  createdAt: string;
  helpfulCount: number;
}

export type EmojiTag = 'clean' | 'smell' | 'tissue' | 'crowded' | 'quiet';

export const EMOJI_TAG_MAP: Record<EmojiTag, { emoji: string; label: string }> = {
  clean:   { emoji: '😄', label: '쾌적해요' },
  smell:   { emoji: '🤢', label: '냄새나요' },
  tissue:  { emoji: '🧻', label: '휴지 있어요' },
  crowded: { emoji: '😰', label: '복잡해요' },
  quiet:   { emoji: '😌', label: '조용해요' },
};

// ── 방문인증 기록 타입 ─────────────────────────────────────────────
export interface VisitRecord {
  toiletId: string;
  bristolType: number;
  color: PoopColor;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
  createdAt: string;
}

export type PoopColor = 'dark-brown' | 'brown' | 'golden' | 'green' | 'black' | 'red';
export const POOP_COLORS: Record<PoopColor, { hex: string; label: string }> = {
  'dark-brown': { hex: '#4a2c0a', label: '진한 갈색' },
  'brown':      { hex: '#8B5E3C', label: '갈색' },
  'golden':     { hex: '#D4A017', label: '황금색' },
  'green':      { hex: '#5a8a3c', label: '녹색' },
  'black':      { hex: '#1a1a1a', label: '검은색' },
  'red':        { hex: '#c0392b', label: '붉은색' },
};

export type ConditionTag = '쾌적함' | '복통있음' | '가스차오름' | '급했음' | '잔변감' | '개운함' | '힘들었음';
export const CONDITION_TAGS: ConditionTag[] = ['쾌적함','개운함','급했음','복통있음','가스차오름','잔변감','힘들었음'];

export type FoodTag = '매운음식' | '술' | '고기위주' | '채소위주' | '과식' | '커피' | '유제품' | '밀가루';
export const FOOD_TAGS: FoodTag[] = ['매운음식','술','고기위주','채소위주','과식','커피','유제품','밀가루'];

// ── 브리스톨 척도 ─────────────────────────────────────────────────
export const BRISTOL_TYPES = [
  { type: 1, emoji: '🪨', label: '딱딱한 알맹이',   desc: '분리된 딱딱한 덩어리',       color: '#6b3a1f' },
  { type: 2, emoji: '🍫', label: '울퉁불퉁 소시지', desc: '소시지 모양, 울퉁불퉁',     color: '#7a4a2a' },
  { type: 3, emoji: '🌽', label: '갈라진 소시지',   desc: '표면에 균열 있는 소시지',   color: '#8B5E3C' },
  { type: 4, emoji: '🍌', label: '부드러운 바나나', desc: '부드럽고 매끈한 소시지',    color: '#a0714f' },
  { type: 5, emoji: '🫘', label: '폭신한 덩어리',   desc: '부드러운 덩어리, 경계 뚜렷', color: '#b8865a' },
  { type: 6, emoji: '🌊', label: '흐물흐물',        desc: '경계 불분명, 죽 형태',       color: '#c49a6c' },
  { type: 7, emoji: '💧', label: '물 같은 상태',    desc: '완전 액체, 덩어리 없음',     color: '#d4ae80' },
];

// ── Mock 데이터 (API 연동 전 사용) ───────────────────────────────
export const MOCK_TOILETS: ToiletData[] = [
  {
    id: 't1', name: '강남구청 공중화장실', roadAddress: '서울 강남구 학동로 426',
    lat: 37.5172, lng: 127.0473, openTime: '06:00~23:00', isOpen24h: false,
    isMixedGender: false, maleToilet: 4, maleUrinal: 6, femaleToilet: 6,
    disabledToilet: 2, childToilet: 1, hasDiaperTable: true,
    hasEmergencyBell: true, hasCCTV: true, managerName: '강남구청',
    phone: '02-3423-5555', isVisited: true, isFavorite: true, rating: 4.2, reviewCount: 38,
  },
  {
    id: 't2', name: '코엑스 광장 화장실', roadAddress: '서울 강남구 영동대로 513',
    lat: 37.5130, lng: 127.0590, openTime: '00:00~24:00', isOpen24h: true,
    isMixedGender: false, maleToilet: 6, maleUrinal: 8, femaleToilet: 10,
    disabledToilet: 2, hasDiaperTable: true, hasEmergencyBell: true,
    hasCCTV: true, managerName: '코엑스', isVisited: false, isFavorite: false, rating: 3.8, reviewCount: 124,
  },
  {
    id: 't3', name: '선릉역 공중화장실', roadAddress: '서울 강남구 테헤란로 152',
    lat: 37.5045, lng: 127.0490, openTime: '05:30~24:00', isOpen24h: false,
    isMixedGender: false, maleToilet: 3, maleUrinal: 4, femaleToilet: 5,
    disabledToilet: 1, hasDiaperTable: false, hasEmergencyBell: true,
    hasCCTV: true, isVisited: true, isFavorite: false, rating: 3.1, reviewCount: 57,
  },
  {
    id: 't4', name: '삼성역 1번출구 공중화장실', roadAddress: '서울 강남구 삼성동 159',
    lat: 37.5090, lng: 127.0630, isOpen24h: true, openTime: '00:00~24:00',
    isMixedGender: false, maleToilet: 2, maleUrinal: 3, femaleToilet: 4,
    disabledToilet: 1, hasDiaperTable: false, hasEmergencyBell: false,
    hasCCTV: false, isVisited: false, isFavorite: false, rating: 2.9, reviewCount: 21,
  },
  {
    id: 't5', name: '봉은사 공중화장실', roadAddress: '서울 강남구 봉은사로 531',
    lat: 37.5150, lng: 127.0580, openTime: '06:00~21:00', isOpen24h: false,
    isMixedGender: true, maleToilet: 2, femaleToilet: 2,
    disabledToilet: 1, hasDiaperTable: false, hasEmergencyBell: true,
    hasCCTV: false, managerName: '봉은사', isVisited: false, isFavorite: true, rating: 4.5, reviewCount: 12,
  },
];

export const MOCK_REVIEWS: ToiletReview[] = [
  { id:'r1', toiletId:'t1', userId:'u1', userName:'깔끔이', rating:5,
    emojiTags:['clean','tissue'], bristolType:4, comment:'정말 깨끗해요! 휴지도 잘 채워져 있고 관리가 잘 됩니다.', createdAt:'2026-03-15', helpfulCount:12 },
  { id:'r2', toiletId:'t1', userId:'u2', userName:'급똥맨', rating:4,
    emojiTags:['clean','quiet'], bristolType:3, comment:'접근성도 좋고 깔끔한 편입니다.', createdAt:'2026-03-10', helpfulCount:5 },
  { id:'r3', toiletId:'t1', userId:'u3', userName:'화장실평론가', rating:3,
    emojiTags:['smell'], bristolType:6, comment:'냄새가 조금 나긴 하지만 그나마 나은 편이에요.', createdAt:'2026-03-05', helpfulCount:3 },
  { id:'r4', toiletId:'t1', userId:'u4', userName:'익명', rating:5,
    emojiTags:['clean','tissue','quiet'], comment:'완벽합니다.', createdAt:'2026-02-28', helpfulCount:8 },
  { id:'r5', toiletId:'t1', userId:'u5', userName:'나그네', rating:4,
    emojiTags:['tissue'], bristolType:4, comment:'휴지가 항상 있어서 좋아요.', createdAt:'2026-02-20', helpfulCount:2 },
];
