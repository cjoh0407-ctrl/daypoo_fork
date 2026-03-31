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
  const avatar = createAvatar(AVATAR_STYLES[style] as any, {
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

/**
 * 상점 아이템용 아바타 (아이템 타입별 다른 스타일)
 *
 * @param itemId - 아이템 ID
 * @param itemType - 아이템 타입 ('AVATAR' | 'EFFECT' | 기타)
 * @returns SVG 데이터 URI
 */
export const generateItemAvatar = (
  itemId: string | number,
  itemType: string = 'AVATAR'
): string => {
  // 아이템 타입별로 다른 스타일 적용
  const style: AvatarStyle = itemType === 'AVATAR' ? 'avataaars' :
                              itemType === 'EFFECT' ? 'pixelArt' :
                              'bottts';
  return generateAvatar(itemId, style, 200);
};

/**
 * imageUrl 값을 파싱하여 실제 표시할 이미지 또는 특수 아바타 이미지를 반환
 * - 'dicebear:{style}:{seed}' 형태면 해당 명세대로 아바타 생성 (seed 그대로 사용)
 * - 일반 URL 또는 이모지면 원본 반환
 * - 없으면 fallbackId 기반으로 자동 생성
 */
export const parseDicebearUrl = (
  imageUrl: string | null | undefined,
  fallbackId: string | number,
  fallbackType: string = 'AVATAR',
  size: number = 200
): string => {
  if (imageUrl && imageUrl.startsWith('dicebear:')) {
    const parts = imageUrl.split(':');
    if (parts.length >= 3) {
      const styleStr = parts[1] as AvatarStyle;
      const seed = parts.slice(2).join(':');
      const validStyle = AVATAR_STYLES[styleStr] ? styleStr : 'funEmoji';
      // 자체 커스텀 시드이므로 daypoo- 접두사 없이 그대로 생성
      const avatar = createAvatar(AVATAR_STYLES[validStyle] as any, {
        seed: seed,
        size,
      });
      return avatar.toDataUri();
    }
  }
  
  if (imageUrl && imageUrl.trim() !== '') {
    return imageUrl; // URL or Emoji
  }

  return generateItemAvatar(fallbackId, fallbackType);
};
