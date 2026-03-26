import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Star, Clock, Users, MessageCircle, Loader2, MapPin, Target, Sparkles, CheckCircle2, Smile, Wind, ScrollText, VolumeX, Check } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import { ToiletData, EMOJI_TAG_MAP } from '../../types/toilet';
import { getReviewSummary, ToiletReviewSummaryResponse } from '../../services/reviewService';
import { ReviewModal } from './ReviewModal';
import { ReviewListModal } from './ReviewListModal';

interface GeoPosition {
  lat: number;
  lng: number;
}

interface ToiletPopupProps {
  toilet: ToiletData;
  onClose: () => void;
  onFavoriteToggle: (id: string) => void;
  onVisitRequest: () => void;
  userPosition: GeoPosition;
  distanceInMeters: number;
  openAuth: (mode: 'login' | 'signup') => void;
  onReviewUpdate: () => void;
}

// 별점 렌더
function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          size={16}
          fill={i <= Math.round(rating) ? '#E8A838' : 'none'}
          stroke={i <= Math.round(rating) ? '#E8A838' : '#d4e8db'}
        />
      ))}
      <span className="ml-1.5 text-sm font-bold" style={{ color: '#1B4332' }}>
        {rating.toFixed(1)}
      </span>
    </div>
  );
}


// ── 태그 아이콘 매핑 ──
const TAG_ICON_MAP: Record<string, React.ReactNode> = {
  clean: <Smile size={12} />,
  smell: <Wind size={12} />,
  tissue: <ScrollText size={12} />,
  crowded: <Users size={12} />,
  quiet: <VolumeX size={12} />,
};

export function ToiletPopup({ 
  toilet, 
  onClose, 
  onFavoriteToggle, 
  onVisitRequest, 
  userPosition, 
  distanceInMeters,
  openAuth,
  onReviewUpdate
}: ToiletPopupProps) {
  const [reviewSummary, setReviewSummary] = useState<ToiletReviewSummaryResponse | null>(null);
  const [loadingReviews, setLoadingReviews] = useState(true);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showReviewListModal, setShowReviewListModal] = useState(false);

  const fetchReviews = async () => {
    try {
      setLoadingReviews(true);
      const summary = await getReviewSummary(Number(toilet.id));
      setReviewSummary(summary);
    } catch (error) {
      console.error('리뷰 요약 조회 실패:', error);
    } finally {
      setLoadingReviews(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [toilet.id]);

  const handleReviewSuccess = () => {
    fetchReviews(); // 내부 요약 정보 새로고침
    onReviewUpdate(); // 부모(MapPage) 데이터 새로고침
  };

  const handleOpenReviewModal = () => {
    const isLogged = !!localStorage.getItem('accessToken');
    if (!isLogged) {
      openAuth('login');
      return;
    }
    
    // 방문 인증 여부 체크
    if (!toilet.isVisited) {
      alert('방문 인증 후에만 리뷰를 남길 수 있습니다! \n 💩 인증 범위를 확인해주세요.');
      return;
    }
    
    setShowReviewModal(true);
  };

  const openKakaoMap = () => {
    window.open(`https://map.kakao.com/link/to/${encodeURIComponent(toilet.name)},${toilet.lat},${toilet.lng}`, '_blank');
  };
  const openNaverMap = () => {
    window.open(`https://map.naver.com/v5/directions/-/-/-/transit?lng=${toilet.lng}&lat=${toilet.lat}&title=${encodeURIComponent(toilet.name)}`, '_blank');
  };

  const isWithinRange = distanceInMeters <= 150;
  const distanceText = distanceInMeters < 1000
    ? `${Math.round(distanceInMeters)}m`
    : `${(distanceInMeters / 1000).toFixed(1)}km`;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative z-50 w-96"
          style={{
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 12px 60px rgba(27,67,50,0.25), 0 4px 12px rgba(0,0,0,0.1)',
            border: '1px solid #d4e8db',
            maxHeight: '85vh',
            overflowY: 'auto',
          }}
        >
          {/* ── 헤더 ── */}
          <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-2">
                {toilet.isVisited ? (
                  <CheckCircle2 size={18} style={{ color: '#2D6A4F' }} />
                ) : (
                  <CheckCircle2 size={18} className="opacity-30" style={{ color: '#7a9e8a' }} />
                )}
                {toilet.isOpen24h && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#e8f3ec', color: '#2D6A4F' }}>24H</span>}
                {toilet.visitCount && toilet.visitCount > 0 && (
                  <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2 py-1 rounded-full text-xs font-bold">
                    <MapPin size={12} />
                    <span>{toilet.visitCount}회 방문</span>
                  </div>
                )}
              </div>
              <h3 className="font-black text-lg leading-tight" style={{ color: '#1a2b22' }}>{toilet.name}</h3>
              <p className="text-sm mt-1 leading-relaxed" style={{ color: '#7a9e8a' }}>{toilet.roadAddress}</p>
              {toilet.rating && (
                <div className="mt-2 flex items-center gap-2">
                  <StarRating rating={toilet.rating} />
                  <span className="text-sm" style={{ color: '#7a9e8a' }}>({toilet.reviewCount}개)</span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <motion.button
                onClick={() => onFavoriteToggle(toilet.id)}
                whileHover={{ scale: 1.15, rotate: toilet.isFavorite ? -5 : 5, boxShadow: '0 4px 12px rgba(232, 168, 56, 0.25)' }}
                whileTap={{ scale: 0.85 }}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors"
                style={{
                  background: toilet.isFavorite ? '#fdf3de' : '#f4faf6',
                  border: toilet.isFavorite ? '2px solid #E8A838' : '2px solid #d4e8db',
                  color: toilet.isFavorite ? '#E8A838' : '#95a99e',
                }}
              >
                <Star 
                  size={22} 
                  fill={toilet.isFavorite ? '#E8A838' : 'none'} 
                  stroke={toilet.isFavorite ? '#E8A838' : 'currentColor'}
                  style={{ transform: 'translateY(-0.5px)' }}
                />
              </motion.button>
              <motion.button 
                onClick={onClose} 
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.9 }}
                className="w-11 h-11 rounded-full flex items-center justify-center transition-colors" 
                style={{ background: '#f4faf6', color: '#7a9e8a' }}
              >
                <X size={20} />
              </motion.button>
            </div>
          </div>

          {/* ── 정보 ── */}
          <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: isWithinRange ? '#2D6A4F' : '#E85D5D' }}>
              {isWithinRange ? <MapPin size={16} /> : <Target size={16} />}
              <span className="font-bold">
                현위치에서 {distanceText} {isWithinRange ? '✓' : '(인증 범위: 150m 이내)'}
              </span>
            </div>
            {toilet.openTime && (
              <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7a6a' }}>
                <Clock size={16} style={{ color: '#2D6A4F' }} />
                <span>평일 {toilet.openTime}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm" style={{ color: '#5a7a6a' }}>
              <Users size={16} style={{ color: '#2D6A4F' }} />
              <span>{toilet.isMixedGender ? '남녀공용' : '남녀 구분'}</span>
            </div>
          </div>

          {/* ── 최근 후기 ── */}
          <div className="px-5 py-4" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm font-bold" style={{ color: '#1a2b22' }}>최근 후기</p>
              {reviewSummary && reviewSummary.reviewCount > 0 && (
                <motion.button
                  onClick={() => setShowReviewListModal(true)}
                  whileHover={{ scale: 1.05, backgroundColor: '#dcfce7' }}
                  whileTap={{ scale: 0.95 }}
                  className="text-xs font-bold px-3.5 py-1.5 rounded-full"
                  style={{ background: '#e8f3ec', color: '#2D6A4F' }}
                >
                  전체 {reviewSummary.reviewCount}개 보기
                </motion.button>
              )}
            </div>

            {loadingReviews ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="animate-spin" size={20} style={{ color: '#7a9e8a' }} />
              </div>
            ) : reviewSummary && reviewSummary.reviewCount > 0 ? (
              <>
                {/* AI 요약 */}
                {reviewSummary.aiSummary && (
                  <div className="mb-3 p-3 rounded-xl" style={{ background: '#f4faf6' }}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <Sparkles size={14} style={{ color: '#2D6A4F' }} />
                      <span className="text-xs font-bold" style={{ color: '#2D6A4F' }}>AI 요약</span>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: '#5a7a6a' }}>
                      {reviewSummary.aiSummary}
                    </p>
                  </div>
                )}

                {/* 최근 리뷰 3개 */}
                <div className="space-y-3">
                  {reviewSummary.recentReviews.slice(0, 3).map((review) => (
                    <div key={review.id} className="pb-3 border-b last:border-0" style={{ borderColor: '#eef5f0' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold" style={{ color: '#1a2b22' }}>{review.userName}</span>
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((i) => (
                              <Star
                                key={i}
                                size={12}
                                fill={i <= review.rating ? '#E8A838' : 'none'}
                                stroke={i <= review.rating ? '#E8A838' : '#d4e8db'}
                              />
                            ))}
                          </div>
                        </div>
                        <span className="text-xs" style={{ color: '#95a99e' }}>{formatTimeAgo(review.createdAt)}</span>
                      </div>

                      {review.emojiTags && review.emojiTags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {review.emojiTags.map((tag) => {
                            const emojiData = EMOJI_TAG_MAP[tag as keyof typeof EMOJI_TAG_MAP];
                            const icon = TAG_ICON_MAP[tag];
                            return emojiData ? (
                              <span key={tag} className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full" style={{ background: '#f4faf6', color: '#5a7a6a' }}>
                                {icon} {emojiData.label}
                              </span>
                            ) : null;
                          })}
                        </div>
                      )}

                      <p className="text-sm leading-relaxed" style={{ color: '#5a7a6a' }}>{review.comment}</p>
                    </div>
                  ))}
                </div>

                {/* 리뷰 작성 버튼 */}
                <WaveButtonComponent
                  onClick={handleOpenReviewModal}
                  variant="ghost"
                  size="sm"
                  className="w-full mt-3 shadow-sm border border-emerald-100"
                  icon={<MessageCircle size={16} />}
                >
                  후기 남기기
                </WaveButtonComponent>
              </>
            ) : (
              <div className="py-8 text-center flex flex-col items-center justify-center">
                <p className="text-sm mb-4" style={{ color: '#7a9e8a' }}>아직 후기가 없어요</p>
                <WaveButtonComponent
                  onClick={handleOpenReviewModal}
                  variant="primary"
                  size="md"
                  className="mx-auto shadow-md"
                  icon={<Sparkles size={16} />}
                >
                  첫 후기 남기기
                </WaveButtonComponent>
              </div>
            )}
          </div>

          {/* ── 길찾기 버튼 ── */}
          <div className="px-5 py-4 flex gap-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <motion.button 
              onClick={openKakaoMap} 
              whileHover={{ scale: 1.05, rotate: -1 }} 
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-[#FEE500] text-[#1a1a1a] shadow-sm"
            >
              <Navigation size={16} /> 카카오
            </motion.button>
            <motion.button 
              onClick={openNaverMap} 
              whileHover={{ scale: 1.05, rotate: 1 }} 
              whileTap={{ scale: 0.95 }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-xl text-sm font-bold bg-[#03C75A] text-white shadow-sm"
            >
              <Navigation size={16} /> 네이버
            </motion.button>
          </div>

          {/* ── 방문 인증 ── */}
          <div className="p-5">
            {!isWithinRange && (
              <p className="text-sm text-center mb-3 px-4 py-3 rounded-xl leading-relaxed flex items-center justify-center gap-2" style={{ background: '#FFF3E0', color: '#E8A838' }}>
                <Target size={18} />
                <span>화장실 근처(150m 이내)로<br />이동하면 인증할 수 있어요!</span>
              </p>
            )}
            <WaveButtonComponent
              onClick={onVisitRequest}
              disabled={!isWithinRange}
              variant="primary"
              size="lg"
              className="w-full shadow-lg"
              icon={<CheckCircle2 size={18} />}
            >
              {toilet.isVisited ? '다시 방문 인증하기' : '방문 인증하기'}
            </WaveButtonComponent>
          </div>
        </motion.div>
      </AnimatePresence>

      {showReviewModal && createPortal(
        <ReviewModal
          toilet={toilet}
          onClose={() => setShowReviewModal(false)}
          onSuccess={handleReviewSuccess}
        />,
        document.body
      )}

      {showReviewListModal && createPortal(
        <ReviewListModal
          toilet={toilet}
          onClose={() => setShowReviewListModal(false)}
        />,
        document.body
      )}
    </>
  );
}
