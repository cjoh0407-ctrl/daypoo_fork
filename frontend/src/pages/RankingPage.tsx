import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WaveDivider } from '../components/WaveDivider';
import { Crown, TrendingUp, TrendingDown, Minus, ShoppingBag, X, MapPin, Star, Trophy, Activity } from 'lucide-react';
import { useRankings } from '../hooks/useRankings';

import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// ── 타입 ──────────────────────────────────────────────────────────────
type TabKey = 'total' | 'local' | 'health';

interface RankUser {
  rank: number;
  emoji: string;
  nick: string;
  title: string;
  titleColor: string;
  titleBg: string;
  score: number;
  scoreLabel: string;
  change: number;
  items: { icon: string; name: string; type: string }[];
}

// ── 애니메이션 보더 ───────────────────────────────────────────────────
function ConicGlow({ color, thickness = 1.5, borderRadius = '16px' }: { color: string; thickness?: number; borderRadius?: string }) {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ borderRadius }}>
      <motion.div
        style={{
          position: 'absolute',
          inset: '-200%',
          background: `conic-gradient(from 0deg, transparent 0%, ${color} 15%, transparent 30%, transparent 50%, ${color} 65%, transparent 80%, transparent 100%)`,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
    </div>
  );
}

// ── 데이터 ────────────────────────────────────────────────────────────
const TAB_CONFIG: { key: TabKey; label: string; desc: string; icon: React.ReactNode }[] = [
  { key: 'total',  label: '전체 랭킹',    desc: '누적 인증 횟수 기준',          icon: <Trophy size={16} /> },
  { key: 'local',  label: '우리 동네 왕',  desc: '현재 위치 기반 지역 랭킹',     icon: <MapPin size={16} /> },
  { key: 'health', label: '건강왕',        desc: 'AI 쾌변 점수 기준',            icon: <Activity size={16} /> },
];

// ── 순위 변화 아이콘 ──────────────────────────────────────────────────
function ChangeIcon({ change }: { change: number }) {
  if (change > 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#52b788' }}>
      <TrendingUp size={11} /> {change}
    </span>
  );
  if (change < 0) return (
    <span className="flex items-center gap-0.5 text-xs font-bold" style={{ color: '#E85D5D' }}>
      <TrendingDown size={11} /> {Math.abs(change)}
    </span>
  );
  return <Minus size={11} style={{ color: 'rgba(0,0,0,0.1)' }} />;
}

// ── 아이템 팝업 ───────────────────────────────────────────────────────
function ItemPopup({ user, onClose, openAuth }: { user: RankUser; onClose: () => void; openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  const goToShop = () => {
    if (!isAuthenticated) {
      openAuth('login');
      return;
    }
    // 마이페이지의 컬렉션->상점 탭으로 이동하기 위해 쿼리 스트링 전달
    navigate('/mypage?tab=collection&sub=shop');
  };

  return (
    <>
      {/* 백드롭 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300] bg-[#0A1A14]/60 backdrop-blur-md"
      />
      
      {/* 본문 모달 */}
      <div className="fixed inset-0 flex items-center justify-center z-[301] pointer-events-none p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 30 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 15 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="w-full max-w-[380px] bg-white rounded-[44px] overflow-hidden shadow-[0_32px_80px_rgba(0,0,0,0.25)] border border-white relative pointer-events-auto"
        >
          {/* 상단 화려한 색상 장식 */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-[#1B4332]/5 to-transparent pointer-events-none" />
          <div className="absolute top-8 right-10 w-24 h-24 bg-emerald-100/30 blur-3xl rounded-full" />
          
          <div className="p-8 pt-10 relative">
            {/* 닫기 버튼 */}
            <button
              onClick={onClose}
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center transition-all bg-gray-50 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
            >
              <X size={20} />
            </button>

            {/* 유저 프로필 섹션 */}
            <div className="flex flex-col items-center mb-8">
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 shadow-xl relative"
                style={{ background: '#fff', border: `3.5px solid ${user.titleColor}20` }}
              >
                <ConicGlow color={user.titleColor} thickness={4} borderRadius="50%" />
                <div className="absolute inset-[4px] rounded-full bg-white flex items-center justify-center z-10">
                  {user.emoji}
                </div>
                {user.rank <= 3 && (
                  <div className="absolute -top-6 -right-2 text-amber-500 transform rotate-12 drop-shadow-lg">
                    <Crown size={28} />
                  </div>
                )}
              </div>
              
              <div className="text-center">
                <motion.span
                  initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                  className="inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest mb-2"
                  style={{ background: user.titleBg, color: user.titleColor }}
                >
                  {user.title}
                </motion.span>
                <h3 className="text-2xl font-black text-[#1A2B27] leading-tight mb-1">{user.nick}</h3>
                <div className="flex items-center justify-center gap-1.5 text-emerald-600">
                  <span className="text-sm font-black whitespace-nowrap">{user.score.toLocaleString()}{user.scoreLabel}</span>
                  <div className="w-1 h-1 rounded-full bg-gray-200" />
                  <span className="text-[10px] text-gray-400 font-bold">전체 {user.rank}위</span>
                </div>
              </div>
            </div>

            {/* 아이템 리스트 */}
            <div className="bg-gray-50/50 rounded-[32px] p-6 border border-gray-100/50 mb-8">
              <div className="flex items-center justify-between mb-4 px-1">
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Star size={12} className="text-amber-400 fill-amber-400" /> 착용 중인 아이템
                </span>
                <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {user.items.length}개
                </span>
              </div>

              {user.items.length === 0 ? (
                <div className="py-8 flex flex-col items-center gap-2 opacity-40">
                  <ShoppingBag size={24} strokeWidth={1} />
                  <p className="text-sm font-medium">착용 중인 아이템이 없습니다</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3 max-h-[180px] overflow-y-auto pr-1 custom-scrollbar">
                  {user.items.map((item, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm"
                    >
                      <span className="text-3xl flex-shrink-0">{item.icon}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-[#1A2B27] truncate">{item.name}</p>
                        <p className="text-[10px] font-bold text-gray-400">{item.type}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 하단 유도 버튼 */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={goToShop}
              className="w-full py-5 rounded-[24px] font-black text-[#1A2B27] text-base flex items-center justify-center gap-3 shadow-2xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #FFD045 0%, #E8A838 100%)',
                boxShadow: '0 12px 32px rgba(232,168,56,0.3)',
              }}
            >
              <ShoppingBag size={20} />
              상점 가서 이 아이템 보기
            </motion.button>
            <p className="text-center text-[10px] text-gray-300 font-bold mt-4 tracking-tight">
              나만의 스타일로 랭킹 페이지를 꾸며보세요!
            </p>
          </div>
        </motion.div>
      </div>
    </>
  );
}

// ── 시상대 섹션 (Spotlight Glassmorphism) ──────────────────────────────
function Podium({ users, onSelect }: { users: RankUser[]; onSelect: (u: RankUser) => void }) {
  if (!users || users.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-white/30 backdrop-blur-md rounded-[32px] border border-white/40">
        <p className="text-sm font-bold text-gray-500">아직 랭킹 데이터가 존재하지 않습니다.</p>
      </div>
    );
  }

  const [top1, top2, top3] = users;

  const GlassCard = ({ user, scale = 1, delay = 0, isFirst = false }: { user: RankUser; scale?: number; delay?: number; isFirst?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 32, scale: scale * 0.9 }}
      animate={{ opacity: 1, y: 0, scale }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -8, scale: scale * 1.02 }}
      onClick={() => onSelect(user)}
      className="relative cursor-pointer group"
      style={{ width: isFirst ? '240px' : '200px', zIndex: isFirst ? 20 : 10 }}
    >
      {/* 카드 배경 (Glassmorphism) */}
      <div className="absolute inset-0 rounded-[32px] overflow-hidden" style={{ zIndex: -1 }}>
        <div className="absolute inset-0 backdrop-blur-xl transition-colors duration-500 group-hover:bg-white/40" 
          style={{ background: 'rgba(255,255,255,0.25)', border: '1.5px solid rgba(255,255,255,0.4)' }} />
        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
      </div>

      {/* 내부 콘텐츠 */}
      <div className="flex flex-col items-center p-6 pb-8">
        {/* 순위 배지 */}
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full font-black text-xs shadow-lg"
          style={{ 
            background: user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#B0B8B4' : '#CD7C4A', 
            color: '#fff',
            boxShadow: `0 4px 12px ${user.rank === 1 ? 'rgba(232,168,56,0.4)' : user.rank === 2 ? 'rgba(176,184,180,0.4)' : 'rgba(205,124,74,0.4)'}`
          }}>
          {user.rank}ST
        </div>

        {/* 아바타 영역 */}
        <div className="relative mb-5 mt-2">
          {isFirst && (
            <motion.div
              animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0.6, 0.3] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute inset-0 rounded-full bg-amber-400/20 blur-xl"
            />
          )}
          <div className="w-20 h-20 rounded-full flex items-center justify-center relative overflow-hidden text-4xl"
            style={{ background: '#fff', boxShadow: '0 8px 24px rgba(0,0,0,0.08)' }}>
            <ConicGlow color={user.titleColor} thickness={4} borderRadius="50%" />
            <div className="absolute inset-[3px] rounded-full bg-white flex items-center justify-center z-10">
              {user.emoji}
            </div>
          </div>
          {isFirst && <div className="absolute -top-5 -right-2 text-amber-500 drop-shadow-md"><Crown size={24} /></div>}
        </div>

        {/* 텍스트 */}
        <span className="text-[10px] font-black px-2.5 py-1 rounded-full mb-2 uppercase tracking-tight"
          style={{ background: user.titleBg, color: user.titleColor }}>
          {user.title}
        </span>
        <h3 className="font-black text-[#1A2B27] text-lg mb-1">{user.nick}</h3>
        <p className="font-black text-2xl flex items-baseline gap-0.5" style={{ color: '#52b788' }}>
          {user.score.toLocaleString()}<span className="text-[10px] uppercase font-bold text-gray-400">{user.scoreLabel}</span>
        </p>
      </div>

      {/* 바닥 그림자 */}
      <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-3/4 h-4 bg-black/5 blur-xl rounded-full" />
    </motion.div>
  );

  return (
    <div className="relative flex items-center justify-center gap-6 lg:gap-10 mt-4 py-12 px-4">
      {/* 1등 뒤 스포트라이트 배경 */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none" style={{ zIndex: 0 }}>
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute inset-0 rounded-full"
          style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)', filter: 'blur(60px)' }}
        />
      </div>

      {top2 && <GlassCard user={top2} scale={1.0} delay={0.15} />}
      {top1 && <GlassCard user={top1} scale={1.2} delay={0} isFirst />}
      {top3 && <GlassCard user={top3} scale={0.95} delay={0.3} />}
    </div>
  );
}

// ── 랭킹 리스트 아이템 ────────────────────────────────────────────────
function RankItem({
  user, index, onSelect,
}: { user: RankUser; index: number; onSelect: (u: RankUser) => void }) {
  const rankColor = user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#B0B8B4' : user.rank === 3 ? '#CD7C4A' : 'rgba(27,67,50,0.08)';
  const isTop3 = user.rank <= 3;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.04 }}
      onClick={() => onSelect(user)}
      whileHover={{ x: 4, scale: isTop3 ? 1.01 : 1 }}
      className="relative flex items-center gap-4 px-5 py-4.5 rounded-2xl cursor-pointer transition-all"
      style={{
        background: '#FFFFFF',
        border: isTop3 ? 'none' : '1.5px solid rgba(27,67,50,0.08)',
        marginBottom: '8px',
      }}
    >
      {isTop3 && (
        <>
          <ConicGlow color={rankColor} thickness={1.5} borderRadius="16px" />
          <div 
            className="absolute z-0 bg-white" 
            style={{ 
              inset: '1.5px', 
              borderRadius: '14.5px' 
            }} 
          />
        </>
      )}
      
      <div className="relative z-10 flex items-center gap-4 w-full">
        {/* 기존 내부 콘텐츠 유지 (순위, 아바타, 정보, 점수 등) */}
      {/* 순위 */}
      <span
        className="w-8 text-center font-black text-base flex-shrink-0"
        style={{ color: rankColor }}
      >
        {user.rank}
      </span>

      {/* 아바타 */}
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl flex-shrink-0"
        style={{
          background: '#f4f9f6',
          border: `2px solid ${user.titleColor}20`,
        }}
      >
        {user.emoji}
      </div>

      {/* 정보 */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div>
          <span
            className="text-[10px] font-bold px-2.5 py-0.5 rounded-full inline-block mb-1"
            style={{ background: user.titleBg, color: user.titleColor }}
          >
            {user.title}
          </span>
        </div>
        <p className="font-black text-[#1A2B27] text-lg leading-tight truncate">{user.nick}</p>
      </div>

        {/* 점수 + 변화 */}
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <span className="font-black text-xl" style={{ color: '#52b788', letterSpacing: '-0.03em' }}>
            {user.score.toLocaleString()}{user.scoreLabel}
          </span>
          <ChangeIcon change={user.change} />
        </div>
      </div>
    </motion.div>
  );
}

// ── 내 순위 고정 바 ───────────────────────────────────────────────────
function MyRankBar({ data }: { data: any }) {
  const navigate = useNavigate();
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto rounded-[32px] p-8 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden group border border-white/20 shadow-2xl hover:shadow-emerald-900/10 transition-all duration-700 mt-12 mb-12"
      style={{ 
        background: 'linear-gradient(135deg, #1B4332 0%, #081C15 100%)',
        backdropFilter: 'blur(20px)',
        zIndex: 10
      }}
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-[#E8A838]/5 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#E8A838]/10 transition-colors" />
      
      <div className="flex-1 flex items-center gap-10 z-10 w-full">
        <div className="text-center min-w-[100px]">
          <span className="block text-emerald-300/50 text-xs font-bold uppercase tracking-widest mb-2">나의 현재 순위</span>
          <div className="relative">
            <span className="text-6xl font-black text-[#E8A838] leading-none tracking-tighter">
              {data.rank === '-' ? '-' : data.rank}
            </span>
            {data.rank !== '-' && <span className="text-xl font-bold text-[#E8A838] ml-0.5">위</span>}
          </div>
        </div>
        
        <div className="h-14 w-px bg-white/10 hidden md:block" />

        <div className="flex-1">
          <div className="flex items-center gap-4 mb-2.5">
            <span className="text-2xl font-black text-white">{data.nick}</span>
            <div className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 text-[11px] font-bold border border-emerald-500/20">
              Lv.{data.lv}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#E8A838] shadow-[0_0_10px_rgba(232,168,56,0.5)]" />
              <span className="text-white/40 text-sm font-medium">활동 점수</span>
              <span className="text-white font-black text-2xl tracking-tight">{data.score.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>

      <button
        onClick={() => navigate('/map')}
        className="w-full md:w-auto px-12 py-4.5 rounded-2xl font-black text-lg flex-shrink-0 transition-all hover:scale-105 active:scale-95 shadow-[0_15px_35px_-10px_rgba(232,168,56,0.4)] bg-[#E8A838] text-[#1B4332] z-10 relative overflow-hidden group/btn"
      >
        <span className="relative z-10">지금 바로 도전하기 →</span>
        <div className="absolute inset-0 bg-white/20 translate-y-full group-hover/btn:translate-y-0 transition-transform duration-300" />
      </button>
    </motion.div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function RankingPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const { user } = useAuth();
  const [tab, setTab] = useState<TabKey>('total');
  const [selectedUser, setSelectedUser] = useState<RankUser | null>(null);
  const [regionName, setRegionName] = useState<string | undefined>(undefined);
  const listRef = useRef<HTMLDivElement>(null);
  const inView = useInView(listRef, { once: true, margin: '-40px' });

  // 현위치 기반 행정구역명 자동 감지 (Kakao Geocoder)
  useEffect(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { kakao } = window as any;
        if (!kakao?.maps?.services) return;
        const geocoder = new kakao.maps.services.Geocoder();
        geocoder.coord2RegionCode(pos.coords.longitude, pos.coords.latitude, (result: any[], status: string) => {
          if (status === kakao.maps.services.Status.OK && result.length > 0) {
            const region = result.find((r: any) => r.region_type === 'H') || result[0];
            setRegionName(region.region_1depth_name);
          }
        });
      },
      () => { /* 위치 권한 거부 시 기본값(서울) 사용 */ }
    );
  }, []);

  // 실시간 랭킹 데이터 가져오기
  const { data, loading, error } = useRankings(tab, regionName);

  // 백엔드 데이터를 프론트엔드 UI 포맷으로 변환
  const isDataValid = data && typeof data === 'object' && !Array.isArray(data);
  const users: RankUser[] = (isDataValid && Array.isArray((data as any).topRankers))
    ? ((data as any).topRankers as any[])
        .filter(r => r && typeof r === 'object')
        .map((r) => ({
          rank: Number(r.rank || 0),
          emoji: Number(r.rank) === 1 ? '💎' : Number(r.rank) === 2 ? '🦊' : '🐸',
          nick: r.nickname || '익명',
          title: r.titleName || '새내기 쾌변러',
          titleColor: Number(r.rank) === 1 ? '#E8A838' : Number(r.rank) === 2 ? '#B0B8B4' : Number(r.rank) === 3 ? '#CD7C4A' : '#52b788',
          titleBg: Number(r.rank) === 1 ? 'rgba(232,168,56,0.12)' : Number(r.rank) === 2 ? 'rgba(176,184,180,0.12)' : Number(r.rank) === 3 ? 'rgba(205,124,74,0.12)' : 'rgba(82,183,136,0.1)',
          score: Number(r.score || 0),
          scoreLabel: tab === 'health' ? '점' : '인증',
          change: 0,
          items: [],
        }))
    : [];

  const myRankData = useMemo(() => {
    if (!isDataValid) return null;
    const rawMyRank = (data as any).myRank;
    
    // 만약 백엔드에서 내 순위가 안 오더라도 (아직 랭킹에 안 들었더라도),
    // 현재 로그인된 유저가 있다면 기본 정보로 표시
    if (!rawMyRank) {
      if (!user) return null;
      return {
        rank: '-',
        score: 0,
        nick: user.nickname || '나',
        lv: user.level || 1,
        needed: 1,
        top: 100
      };
    }

    const myRank = Number(rawMyRank.rank || 0);
    const myScore = Number(rawMyRank.score || 0);
    const totalRankers = users.length;
    const topPercent = totalRankers > 0 ? Math.ceil((myRank / totalRankers) * 100) : 0;
    
    return {
      rank: myRank,
      nick: rawMyRank.nickname || '나',
      lv: rawMyRank.level || 1,
      score: myScore,
      top: topPercent,
      needed: 5, // 가상값
    };
  }, [isDataValid, data, user, users.length]);

  const currentTab = TAB_CONFIG.find(t => t.key === tab)!;

  const handleSelect = useCallback((user: RankUser) => {
    setSelectedUser(user);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: '#F8FAF9' }}>
      <Navbar openAuth={openAuth} />

      {/* ── 히어로 + 시상대 ─────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#F8FAF9' }}>
        {/* 배경 글로우 */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(232,168,56,0.12) 0%, transparent 70%)',
          }}
        />

        <section className="relative z-10 pt-32 pb-40 px-6">
          <div className="max-w-4xl mx-auto">
            {/* 헤더 */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="text-center mb-10"
            >
              <span
                className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-bold mb-6"
                style={{ background: 'rgba(232,168,56,0.1)', color: '#E8A838', border: '1px solid rgba(232,168,56,0.2)' }}
              >
                <Trophy size={14} /> 명예의 전당
              </span>
              <h1
                className="font-black leading-tight"
                style={{ fontSize: 'clamp(36px, 8vw, 64px)', color: '#1A2B27', letterSpacing: '-0.04em' }}
              >
                오늘의 쾌변
                <br />
                <span style={{
                  background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}>
                  챔피언
                </span>
              </h1>
            </motion.div>

            {/* 탭 */}
            <div
              className="flex rounded-2xl p-1 mb-12"
              style={{ background: 'rgba(0,0,0,0.04)', border: '1px solid rgba(0,0,0,0.05)' }}
            >
              {TAB_CONFIG.map((t) => (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  className="flex-1 py-3 rounded-xl text-sm font-bold transition-all relative"
                  style={{ color: tab === t.key ? '#fff' : 'rgba(0,0,0,0.4)' }}
                >
                  {tab === t.key && (
                    <motion.div
                      layoutId="tabBg"
                      className="absolute inset-0 rounded-xl"
                      style={{ background: '#E8A838', boxShadow: '0 4px 12px rgba(232,168,56,0.3)' }}
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    {t.icon}
                    <span className="leading-none">{t.label}</span>
                  </span>
                </button>
              ))}
            </div>

            {/* 탭 설명 */}
            <AnimatePresence mode="wait">
              <motion.p
                key={tab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.25 }}
                className="text-center text-sm mb-6"
                style={{ color: 'rgba(0,0,0,0.4)' }}
              >
                {currentTab.desc}
              </motion.p>
            </AnimatePresence>

            {/* 시상대 */}
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
              >
                <Podium users={users.slice(0, 3)} onSelect={handleSelect} />
              </motion.div>
            </AnimatePresence>

            {/* 통계 칩 */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-14">
              {[
                { label: '활성 사용자', value: '1,000', unit: '+' },
                { 
                  label: '내 현재 순위', 
                  value: myRankData ? myRankData.rank.toString() : '-', 
                  unit: '위' 
                },
                { 
                  label: '상위권 도전', 
                  value: (myRankData && typeof myRankData.rank === 'number' && myRankData.rank > 10) 
                    ? (myRankData.rank - 10).toString() 
                    : '0', 
                  unit: '계단' 
                },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 + i * 0.08 }}
                  className="rounded-3xl p-6 text-center"
                  style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 8px 24px rgba(27,67,50,0.04)' }}
                >
                  <p className="font-black text-4xl" style={{ color: '#E8A838', letterSpacing: '-0.04em' }}>
                    {s.value}<span className="text-base font-bold ml-0.5">{s.unit}</span>
                  </p>
                  <p className="text-sm mt-1.5 font-bold" style={{ color: 'rgba(0,0,0,0.4)' }}>{s.label}</p>
                </motion.div>
              ))}
            </div>

            {/* 내 순위 카드 (이동됨) */}
            <div className="mt-16 mb-12">
              {myRankData && <MyRankBar data={myRankData} />}
            </div>
          </div>
        </section>

        <WaveDivider fill="#eef5f0" />
      </div>

      {/* ── 랭킹 리스트 ─────────────────────────────────────── */}
      <div className="relative overflow-hidden" style={{ background: '#eef5f0' }}>
        <section className="pt-16 pb-12 px-6" ref={listRef}>
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <h2 className="font-black text-3xl text-[#1A2B27]" style={{ letterSpacing: '-0.03em' }}>
                TOP 10
              </h2>
              <span className="text-base" style={{ color: 'rgba(0,0,0,0.3)' }}>
                매일 자정 업데이트
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="min-h-[400px]"
              >
                {loading ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      className="text-emerald-600"
                    >
                      <Activity size={32} />
                    </motion.div>
                    <p className="text-sm font-bold text-gray-400">랭킹 데이터를 불러오는 중...</p>
                  </div>
                ) : error ? (
                  <div className="flex flex-col items-center justify-center py-20 gap-4">
                    <p className="text-sm font-bold text-red-400">데이터를 불러오지 못했습니다.</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="px-4 py-2 bg-gray-100 rounded-xl text-xs font-bold text-gray-500"
                    >
                      다시 시도
                    </button>
                  </div>
                ) : (
                  inView && users.map((user, i) => (
                    <RankItem
                      key={`${tab}-${user.rank}`}
                      user={user}
                      index={i}
                      onSelect={handleSelect}
                    />
                  ))
                )}
              </motion.div>
            </AnimatePresence>
          </div>
        </section>

      </div>

      {/* 아이템 팝업 */}
      {selectedUser && (
        <ItemPopup user={selectedUser} onClose={() => setSelectedUser(null)} openAuth={openAuth} />
      )}
      <Footer />
    </div>
  );
}
