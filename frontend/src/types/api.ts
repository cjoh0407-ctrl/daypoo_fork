import { SubscriptionResponse } from './subscription';

/**
 * API 공통 응답 구조
 */
export interface ApiResponse<T> {
  data: T;
  message?: string;
  code?: string;
  status?: number;
}

/**
 * 로그인/회원가입 응답
 */
export interface AuthResponse {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn: number;
}

/**
 * 사용자 정보 응답
 */
export interface UserResponse {
  id: number;
  email: string;
  nickname: string;
  role: string;
  level: number;
  exp: number;
  points: number;
  equippedTitleId?: number | null;
  equippedTitleName?: string | null;
  isPro?: boolean;
  subscription?: SubscriptionResponse | null;
  birthDate?: string | null;
  createdAt?: string;
  totalAuthCount?: number;
  totalVisitCount?: number;
  consecutiveDays?: number;
}

/**
 * 화장실 정보
 */
export interface ToiletData {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  roadAddress?: string;
  isFavorite?: boolean;
  isVisited?: boolean;
  isOpen24h?: boolean;
  rating?: number;
}

/**
 * 화장실 검색 결과
 */
export interface ToiletSearchResponse {
  toilets: ToiletData[];
  totalCount: number;
}

/**
 * 배변 기록 응답
 */
export interface PooRecordResponse {
  id: number;
  toiletId: number;
  bristolScale: number;
  color: string;
  conditionTags: string[];
  dietTags: string[];
  createdAt: string;
  pointsAwarded?: number;
}

/**
 * AI 분석 응답
 */
export interface AiAnalysisResponse {
  bristolScale: number;
  color: string;
}

/**
 * 체크인 상태 응답
 */
export interface CheckInResponse {
  remainedSeconds: number;
  status: string;
}

/**
 * 알림 정보
 */
export interface NotificationDto {
  id: number;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  icon?: string;
}
