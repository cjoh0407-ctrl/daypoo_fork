import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Star, SlidersHorizontal, Sparkles } from 'lucide-react';
import { ToiletData, ToiletReview, EMOJI_TAG_MAP, EmojiTag } from '../../types/toilet';

interface ReviewFullModalProps {
  toilet: ToiletData;
  reviews: ToiletReview[];
  onClose: () => void;
}

type SortKey = 'latest' | 'oldest' | 'highest' | 'lowest' | 'helpful';

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'latest',   label: '최신순' },
  { key: 'oldest',   label: '오래된순' },
  { key: 'highest',  label: '별점 높은순' },
  { key: 'lowest',   label: '별점 낮은순' },
  { key: 'helpful',  label: '도움순' },
];

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((i) => (
        <Star key={i} size={12}
          fill={i <= rating ? '#E8A838' : 'none'}
          stroke={i <= rating ? '#E8A838' : '#d4e8db'} />
      ))}
    </div>
  );
}

// 별점 분포 바
function RatingBar({ reviews }: { reviews: ToiletReview[] }) {
  const counts = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => Math.round(r.rating) === star).length,
  }));
  const max = Math.max(...counts.map((c) => c.count), 1);
  return (
    <div className="flex flex-col gap-1">
      {counts.map(({ star, count }) => (
        <div key={star} className="flex items-center gap-2 text-xs">
          <span style={{ color: '#7a9e8a', minWidth: '20px' }}>{star}★</span>
          <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: '#eef5f0' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(count / max) * 100}%`, background: '#E8A838', transition: 'width 0.6s ease' }}
            />
          </div>
          <span style={{ color: '#7a9e8a', minWidth: '16px', textAlign: 'right' }}>{count}</span>
        </div>
      ))}
    </div>
  );
}

// AI 요약 (Mock)
function AISummary({ toilet, reviews }: { toilet: ToiletData; reviews: ToiletReview[] }) {
  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1)
    : '-';

  return (
    <div
      className="rounded-2xl p-4"
      style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <Sparkles size={14} style={{ color: '#E8A838' }} />
        <span className="text-xs font-bold text-white">AI 후기 요약</span>
      </div>
      <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
        {reviews.length === 0
          ? '아직 충분한 후기가 없어요. 첫 후기를 남겨주세요!'
          : `이 화장실은 평균 ${avg}점으로 평가됩니다. ` +
            (parseFloat(avg) >= 4
              ? '전반적으로 쾌적하다는 평가가 많고, 청결도와 휴지 관리가 잘 되어있다는 후기가 많습니다.'
              : parseFloat(avg) >= 3
              ? '보통 수준의 화장실입니다. 간혹 냄새 관련 후기도 있으니 참고하세요.'
              : '청결도 개선이 필요하다는 후기가 많습니다. 급할 때만 이용하는 것을 추천해요.')}
      </p>
    </div>
  );
}

export function ReviewFullModal({ toilet, reviews, onClose }: ReviewFullModalProps) {
  const [sort, setSort] = useState<SortKey>('latest');
  const [showSort, setShowSort] = useState(false);

  const avg = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length)
    : 0;

  const sorted = useMemo(() => {
    return [...reviews].sort((a, b) => {
      if (sort === 'latest')  return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      if (sort === 'oldest')  return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      if (sort === 'highest') return b.rating - a.rating;
      if (sort === 'lowest')  return a.rating - b.rating;
      if (sort === 'helpful') return b.helpfulCount - a.helpfulCount;
      return 0;
    });
  }, [reviews, sort]);

  return (
    <AnimatePresence>
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      />

      {/* 모달 */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 10 }}
        transition={{ type: 'spring', stiffness: 280, damping: 26 }}
        className="fixed z-[201] inset-4 md:inset-8 rounded-[28px] overflow-hidden flex flex-col md:flex-row"
        style={{ background: '#fff', boxShadow: '0 24px 80px rgba(0,0,0,0.2)', maxHeight: 'calc(100vh - 64px)' }}
      >
        {/* ── 좌측: 요약 정보 ── */}
        <div
          className="md:w-72 flex-shrink-0 p-6 flex flex-col gap-4 overflow-y-auto"
          style={{ borderRight: '1px solid #eef5f0', background: '#f9fdf9' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base leading-tight" style={{ color: '#1a2b22' }}>
              {toilet.name}
            </h2>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 md:hidden"
              style={{ background: '#eef5f0', color: '#7a9e8a' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* 평균 별점 */}
          <div className="flex flex-col items-center py-4 rounded-2xl" style={{ background: '#fff', border: '1px solid #d4e8db' }}>
            <span className="font-black text-5xl" style={{ color: '#1B4332', letterSpacing: '-0.04em' }}>
              {avg.toFixed(1)}
            </span>
            <div className="flex gap-0.5 mt-1">
              {[1,2,3,4,5].map((i) => (
                <Star key={i} size={16}
                  fill={i <= Math.round(avg) ? '#E8A838' : 'none'}
                  stroke={i <= Math.round(avg) ? '#E8A838' : '#d4e8db'} />
              ))}
            </div>
            <p className="text-xs mt-1" style={{ color: '#7a9e8a' }}>{reviews.length}개 후기</p>
          </div>

          <RatingBar reviews={reviews} />
          <AISummary toilet={toilet} reviews={reviews} />

          <button
            onClick={onClose}
            className="hidden md:flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold mt-auto"
            style={{ border: '1.5px solid #d4e8db', color: '#2D6A4F' }}
          >
            <X size={14} /> 닫기
          </button>
        </div>

        {/* ── 우측: 후기 목록 ── */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* 상단 필터 바 */}
          <div
            className="flex items-center justify-between px-6 py-4 flex-shrink-0"
            style={{ borderBottom: '1px solid #eef5f0' }}
          >
            <span className="font-bold text-sm" style={{ color: '#1a2b22' }}>
              후기 {reviews.length}개
            </span>
            <div className="relative">
              <button
                onClick={() => setShowSort(!showSort)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold"
                style={{ background: '#f4faf6', color: '#2D6A4F', border: '1px solid #d4e8db' }}
              >
                <SlidersHorizontal size={12} />
                {SORT_OPTIONS.find((o) => o.key === sort)?.label}
              </button>
              {showSort && (
                <div
                  className="absolute right-0 top-full mt-1 rounded-xl overflow-hidden z-10"
                  style={{ background: '#fff', border: '1px solid #d4e8db', boxShadow: '0 8px 24px rgba(0,0,0,0.1)', minWidth: '120px' }}
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setSort(opt.key); setShowSort(false); }}
                      className="w-full text-left px-3 py-2 text-xs font-medium transition-colors hover:bg-gray-50"
                      style={{ color: sort === opt.key ? '#1B4332' : '#5a7a6a', fontWeight: sort === opt.key ? 700 : 400 }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 후기 리스트 (스크롤) */}
          <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
            {sorted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <span className="text-4xl mb-3">💩</span>
                <p className="font-bold" style={{ color: '#1a2b22' }}>아직 후기가 없어요</p>
                <p className="text-sm mt-1" style={{ color: '#7a9e8a' }}>첫 방문 인증 후 후기를 남겨보세요!</p>
              </div>
            ) : (
              sorted.map((review) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-2xl"
                  style={{ border: '1px solid #eef5f0', background: '#fafcfb' }}
                >
                  {/* 작성자 정보 */}
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                      style={{ background: '#e8f3ec', color: '#1B4332' }}
                    >
                      {review.userName[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold" style={{ color: '#1a2b22' }}>{review.userName}</p>
                      <div className="flex items-center gap-2">
                        <StarRow rating={review.rating} />
                        <span className="text-[10px]" style={{ color: '#7a9e8a' }}>{review.createdAt}</span>
                      </div>
                    </div>
                  </div>

                  {/* 이모지 태그 */}
                  {review.emojiTags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2">
                      {review.emojiTags.map((tag) => (
                        <span
                          key={tag}
                          className="text-xs px-2 py-0.5 rounded-full font-semibold"
                          style={{ background: '#e8f3ec', color: '#2D6A4F' }}
                        >
                          {EMOJI_TAG_MAP[tag].emoji} {EMOJI_TAG_MAP[tag].label}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 코멘트 */}
                  {review.comment && (
                    <p className="text-sm leading-relaxed" style={{ color: '#3a5a4a' }}>
                      {review.comment}
                    </p>
                  )}

                  {/* 브리스톨 타입 */}
                  {review.bristolType && (
                    <div
                      className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={{ background: '#fdf3de', color: '#b5810f' }}
                    >
                      브리스톨 {review.bristolType}형
                    </div>
                  )}
                </motion.div>
              ))
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
