import { motion, AnimatePresence } from 'framer-motion';
import { X, Navigation, Star, Clock, Users } from 'lucide-react';
import { ToiletData } from '../../types/toilet';

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


export function ToiletPopup({ toilet, onClose, onFavoriteToggle, onVisitRequest, userPosition, distanceInMeters }: ToiletPopupProps) {
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

  return (
    <>
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="absolute z-50 w-96"
          style={{
            bottom: '110%',
            left: '50%',
            transform: 'translateX(-50%)',
            background: '#fff',
            borderRadius: '20px',
            boxShadow: '0 8px 40px rgba(27,67,50,0.18), 0 2px 8px rgba(0,0,0,0.08)',
            border: '1px solid #d4e8db',
            maxHeight: '80vh',
            overflowY: 'auto',
          }}
        >
          {/* ── 헤더 ── */}
          <div className="flex items-start justify-between p-5" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex-1 pr-2">
              <div className="flex items-center gap-2 mb-2">
                {toilet.isVisited ? <span className="text-lg">💩</span> : <span className="text-lg grayscale opacity-50">💩</span>}
                {toilet.isOpen24h && <span className="text-xs font-bold px-2 py-1 rounded-full" style={{ background: '#e8f3ec', color: '#2D6A4F' }}>24H</span>}
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
              <button
                onClick={() => onFavoriteToggle(toilet.id)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110 active:scale-95"
                style={{
                  background: toilet.isFavorite ? '#fdf3de' : '#f4faf6',
                  border: toilet.isFavorite ? '2px solid #E8A838' : '2px solid #d4e8db'
                }}
              >
                <span className="text-2xl" style={{
                  color: toilet.isFavorite ? '#E8A838' : '#95a99e',
                  filter: toilet.isFavorite ? 'none' : 'grayscale(0.3)'
                }}>
                  {toilet.isFavorite ? '⭐' : '⭐'}
                </span>
              </button>
              <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: '#f4faf6', color: '#7a9e8a' }}><X size={18} /></button>
            </div>
          </div>

          {/* ── 정보 ── */}
          <div className="px-5 py-4 flex flex-col gap-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <div className="flex items-center gap-2 text-sm" style={{ color: isWithinRange ? '#2D6A4F' : '#E85D5D' }}>
              <span className="text-base">{isWithinRange ? '📍' : '🎯'}</span>
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
            <p className="text-sm font-bold mb-2" style={{ color: '#1a2b22' }}>최근 후기</p>
            <p className="text-sm" style={{ color: '#7a9e8a' }}>리뷰 기능을 준비 중입니다.</p>
          </div>

          {/* ── 길찾기 버튼 ── */}
          <div className="px-5 py-4 flex gap-3" style={{ borderBottom: '1px solid #eef5f0' }}>
            <button onClick={openKakaoMap} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#FEE500] text-[#1a1a1a] hover:scale-[1.02] transition-all"><Navigation size={16} /> 카카오</button>
            <button onClick={openNaverMap} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold bg-[#03C75A] text-white hover:scale-[1.02] transition-all"><Navigation size={16} /> 네이버</button>
          </div>

          {/* ── 방문 인증 ── */}
          <div className="p-5">
            {!isWithinRange && (
              <p className="text-sm text-center mb-3 px-4 py-3 rounded-xl leading-relaxed" style={{ background: '#FFF3E0', color: '#E8A838' }}>
                🎯 화장실 근처(150m 이내)로<br />이동하면 인증할 수 있어요!
              </p>
            )}
            <button
              onClick={onVisitRequest}
              disabled={!isWithinRange}
              className="w-full py-4 rounded-2xl font-black text-base transition-all disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed"
              style={{
                background: toilet.isVisited
                  ? 'linear-gradient(135deg, #2D6A4F 0%, #52b788 100%)'
                  : 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                color: '#fff',
                boxShadow: isWithinRange ? '0 4px 16px rgba(27,67,50,0.3)' : 'none',
                transform: isWithinRange ? 'scale(1)' : 'scale(0.98)',
              }}
            >
              {toilet.isVisited ? '💩 다시 방문 인증하기' : '💩 방문 인증하기'}
            </button>
          </div>
        </motion.div>
      </AnimatePresence>

    </>
  );
}
