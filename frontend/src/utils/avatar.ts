import { createAvatar } from '@dicebear/core';
import { funEmoji, avataaars, bottts, lorelei, pixelArt } from '@dicebear/collection';

/**
 * 사용 가능한 아바타 스타일
 */
export type AvatarStyle = 'funEmoji' | 'avataaars' | 'bottts' | 'lorelei' | 'pixelArt';

/**
 * 아바타 스타일별 설정
 */
const AVATAR_STYLES = {
  funEmoji: funEmoji,      // 이모지 조합 (귀여움, 가벼움)
  avataaars: avataaars,    // 픽사 스타일 (친근함)
  bottts: bottts,          // 로봇 (독특함)
  lorelei: lorelei,        // 만화 스타일 (세련됨)
  pixelArt: pixelArt,      // 픽셀 아트 (레트로)
};

/**
 * 사용자 ID 또는 닉네임 기반 고유 아바타 생성
 *
 * @param seed - 사용자 ID 또는 닉네임 (고유값)
 * @param style - 아바타 스타일 (기본: funEmoji)
 * @param size - 아바타 크기 (기본: 128)
 * @returns SVG 데이터 URI (data:image/svg+xml;base64,...)
 *
 * @example
 * ```tsx
 * const avatarUrl = generateAvatar(user.id);
 * <img src={avatarUrl} alt="avatar" />
 * ```
 */
export const generateAvatar = (
  seed: string | number,
  style: AvatarStyle = 'funEmoji',
  size: number = 128
): string => {
  const avatar = createAvatar(AVATAR_STYLES[style], {
    seed: `daypoo-${seed}`,
    size,
  });

  return avatar.toDataUri();
};

/**
 * React 컴포넌트에서 사용하기 쉬운 훅
 *
 * @example
 * ```tsx
 * function UserProfile({ userId }: { userId: number }) {
 *   const avatarUrl = useAvatar(userId);
 *   return <img src={avatarUrl} alt="avatar" className="w-12 h-12 rounded-full" />;
 * }
 * ```
 */
export const useAvatar = (
  seed: string | number,
  style: AvatarStyle = 'funEmoji',
  size: number = 128
): string => {
  return generateAvatar(seed, style, size);
};

/**
 * 랭킹 페이지용 아바타 (좀 더 화려한 스타일)
 */
export const generateRankingAvatar = (userId: string | number, rank: number): string => {
  // 1-3위는 avataaars (화려함), 나머지는 funEmoji (심플함)
  const style: AvatarStyle = rank <= 3 ? 'avataaars' : 'funEmoji';
  return generateAvatar(userId, style, 128);
};

/**
 * 프로필용 아바타 (큰 사이즈)
 */
export const generateProfileAvatar = (userId: string | number): string => {
  return generateAvatar(userId, 'avataaars', 256);
};

/**
 * 채팅/댓글용 아바타 (작은 사이즈)
 */
export const generateSmallAvatar = (userId: string | number): string => {
  return generateAvatar(userId, 'funEmoji', 48);
};
