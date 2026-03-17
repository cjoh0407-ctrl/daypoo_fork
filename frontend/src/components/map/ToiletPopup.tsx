import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Star, Clock, Users, Baby, Bell, Shield, ChevronRight, Heart } from 'lucide-react';
import { ToiletData, ToiletReview, EMOJI_TAG_MAP, EmojiTag, MOCK_REVIEWS } from '../../types/toilet';
import { ReviewFullModal } from './ReviewFullModal';
import { VisitModal } from './VisitModal';

interface ToiletPopupProps {
  toilet: ToiletData;
  onClose: () => void;
  onFavoriteToggle: (id: string) => void;
  onVisitComplete: (id: string) => void;
}

// 별점 렌더
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={13}
          fill={i <= Math.round(rating) ? '#E8A838' : 'none'}
          stroke={i <= Math.round(rating) ? '#E8A838' : '#d4e8db'}
        />
      ))}
      <span className="ml-1 text-xs font-bold" style={{ color: '#1B4332' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}

// 이모지 태그 집계
function EmojiSummary({ reviews }: { reviews: ToiletReview[] }) {
  const counts: Partial<Record<EmojiTag, number>> = {};
  reviews.forEach((r) => r.emojiTags.forEach((tag) => { counts[tag] = (counts[tag] ?? 0) + 1; }));
  const sorted = (Object.entries(counts) as [EmojiTag, number][]).sort((a, b) => b[1] - a[1]);
  if (!sorted.length) return null;

  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {sorted.map(([tag, count]) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold"
          style={{ background: '#f4faf6', color: '#2D6A4F', border: '1px solid #d4e8db' }}
        >
          {EMOJI_TAG_MAP[tag].emoji} {EMOJI_TAG_MAP[tag].label}
          <span className="font-bold opacity-60">{count}</span>
        </span>
      ))}
    </div>
  );
}

export function ToiletPopup({ toilet, onClose, onFavoriteToggle, onVisitComplete }: ToiletPopupProps) {
  const [showReviews, setShowReviews] = useState(false);
  const [showVisit, setShowVisit] = useState(false);
  const [activeEmojiTag, setActiveEmojiTag] = useState<EmojiTag | null>(null);

  const reviews = MOCK_REVIEWS.filter((r) => r.toiletId === toilet.id);
  const previewReviews = reviews.slice(0, 3);

  const openKakaoMap = () => {
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.lat},${toilet.lng}`, '_blank');
  };
  const openNaverMap = () => {
    window.open(`https://map.naver.com/v5/directions/-/-/-/transit?lng=${toilet.lng}&lat=${toilet.lat}&title=${encodeURIComponent(toilet.name)}`, '_blank');
  };

  const handleEmojiTag = (tag: EmojiTag) => {
    setActiveEmojiTag(activeEmojiTag === tag ? null : tag);
    // TODO: 실제로는 서버에 POST
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute z-50 w-80"
          style={{
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 8px 40px rgba(27,67,50,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #d4e8db',
            overflow: 'hidden',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {/* ── 헤더 ── */}
          <div
            className="flex items-start justify-between p-4"
            style={{ borderBottom: '1px solid #eef5f0' }}
          >
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-1.5 mb-0.5">
                {toilet.isVisited ? (
                  <span className="text-base">💩</span>
                ) : (
                  <span className="text-base grayscale opacity-50">💩</span>
                )}
                {toilet.isOpen24h && (
                  <span
                    className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                    style={{ background: '#e8f3ec', color: '#2D6A4F' }}
                  >
                    24H
                  </span>
                )}
              </div>
              <h3 className="font-black text-sm leading-tight" style={{ color: '#1a2b22' }}>
                {toilet.name}
              </h3>
              <p className="text-xs mt-0.5 leading-relaxed" style={{ color: '#7a9e8a' }}>
                {toilet.roadAddress}
              </p>
              {toilet.rating && (
                <div className="mt-1.5 flex items-center gap-2">
                  <StarRating rating={toilet.rating} />
                  <span className="text-xs" style={{ color: '#7a9e8a' }}>
                    ({toilet.reviewCount}개)
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                onClick={() => onFavoriteToggle(toilet.id)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                style={{ background: toilet.isFavorite ? '#fdf3de' : '#f4faf6' }}
              >
                <Heart
                  size={16}
                  fill={toilet.isFavorite ? '#E8A838' : 'none'}
                  stroke={toilet.isFavorite ? '#E8A838' : '#7a9e8a'}
                />
              </button>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full flex items-center justify-center"
                style={{ background: '#f4faf6', color: '#7a9e8a' }}
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* ── 정보 ── */}
          <div className="px-4 py-3 flex flex-col gap-2" style={{ borderBottom: '1px solid #eef5f0' }}>
            {toilet.openTime && (
              <div className="flex items-center gap-2 text-xs" style={{ color: '#5a7a6a' }}>
                <Clock size={13} style={{ color: '#2D6A4F', flexShrink: 0 }} />
                <span>
                  평일 {toilet.openTime}
                  {toilet.openTimeSat && ` · 토 ${toilet.openTimeSat}`}
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-xs" style={{ color: '#5a7a6a' }}>
              <Users size={13} style={{ color: '#2D6A4F', flexShrink: 0 }} />
              <span>
                {toilet.isMixedGender ? '남녀공용' : '남녀 구분'}
                {toilet.maleToilet !== undefined && ` · 남 대변기 ${toilet.maleToilet}칸`}
                {toilet.femaleToilet !== undefined && ` / 여 ${toilet.femaleToilet}칸`}
                {toilet.disabledToilet ? ` · 장애인 ${toilet.disabledToilet}` : ''}
              </span>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {toilet.hasDiaperTable && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#e8f3ec', color: '#2D6A4F' }}>
                  <Baby size={10} /> 기저귀교환대
                </span>
              )}
              {toilet.hasEmergencyBell && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#fdf3de', color: '#b5810f' }}>
                  <Bell size={10} /> 비상벨
                </span>
              )}
              {toilet.hasCCTV && (
                <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold"
                  style={{ background: '#f0eeff', color: '#5a3eb0' }}>
                  <Shield size={10} /> CCTV
                </span>
              )}
            </div>
          </div>

          {/* ── 이모지 평가 ── */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#1a2b22' }}>간편 평가</p>
            <div className="flex gap-2 flex-wrap">
              {(Object.keys(EMOJI_TAG_MAP) as EmojiTag[]).map((tag) => (
                <button
                  key={tag}
                  onClick={() => handleEmojiTag(tag)}
                  className="flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all hover:scale-105"
                  style={{
                    background: activeEmojiTag === tag ? '#1B4332' : '#f4faf6',
                    color: activeEmojiTag === tag ? '#fff' : '#2D6A4F',
                    border: `1.5px solid ${activeEmojiTag === tag ? '#1B4332' : '#d4e8db'}`,
                  }}
                >
                  <span style={{ fontSize: '18px' }}>{EMOJI_TAG_MAP[tag].emoji}</span>
                  <span>{EMOJI_TAG_MAP[tag].label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* ── 후기 미리보기 ── */}
          <div className="px-4 py-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-bold" style={{ color: '#1a2b22' }}>최근 후기</p>
              {reviews.length > 3 && (
                <button
                  onClick={() => setShowReviews(true)}
                  className="flex items-center gap-0.5 text-xs font-semibold"
                  style={{ color: '#2D6A4F' }}
                >
                  전체보기 <ChevronRight size={12} />
                </button>
              )}
            </div>
            {reviews.length === 0 ? (
              <p className="text-xs" style={{ color: '#7a9e8a' }}>아직 후기가 없어요. 첫 후기를 남겨보세요!</p>
            ) : (
              <>
                <EmojiSummary reviews={reviews} />
                <div className="flex flex-col gap-2 mt-3">
                  {previewReviews.map((r) => (
                    <div key={r.id} className="p-2.5 rounded-xl" style={{ background: '#f4faf6' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="text-sm">👤</span>
                        <span className="text-xs font-bold" style={{ color: '#1a2b22' }}>{r.userName}</span>
                        <StarRating rating={r.rating} />
                        <span className="text-[10px] ml-auto" style={{ color: '#7a9e8a' }}>{r.createdAt}</span>
                      </div>
                      {r.comment && (
                        <p className="text-xs leading-relaxed" style={{ color: '#5a7a6a' }}>
                          {r.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* ── 길찾기 버튼 ── */}
          <div className="px-4 py-3 flex gap-2" style={{ borderBottom: '1px solid #eef5f0' }}>
            <button
              onClick={openKakaoMap}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
              style={{ background: '#FEE500', color: '#1a1a1a' }}
            >
              <Navigation size={13} /> 카카오맵
            </button>
            <button
              onClick={openNaverMap}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-bold transition-all hover:scale-[1.02]"
              style={{ background: '#03C75A', color: '#fff' }}
            >
              <Navigation size={13} /> 네이버지도
            </button>
          </div>

          {/* ── 방문 인증 버튼 ── */}
          <div className="p-4">
            <button
              onClick={() => setShowVisit(true)}
              className="w-full py-3 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
              style={{
                background: toilet.isVisited
                  ? 'linear-gradient(135deg, #2D6A4F 0%, #52b788 100%)'
                  : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                color: '#fff',
                boxShadow: '0 4px 16px rgba(27,67,50,0.3)',
              }}
            >
              {toilet.isVisited ? '💩 다시 방문 인증하기' : '💩 방문 인증하기'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* 후기 전체보기 모달 */}
      {showReviews && (
        <ReviewFullModal
          toilet={toilet}
          reviews={reviews}
          onClose={() => setShowReviews(false)}
        />
      )}

      {/* 방문 인증 모달 */}
      {showVisit && (
        <VisitModal
          toilet={toilet}
          onClose={() => setShowVisit(false)}
          onComplete={() => { onVisitComplete(toilet.id); setShowVisit(false); }}
        />
      )}
    </>
  );
}
