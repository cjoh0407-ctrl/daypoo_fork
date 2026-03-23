import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WaveDivider } from '../components/WaveDivider';
import { Crown, TrendingUp, TrendingDown, Minus, ShoppingBag, X, MapPin, Star, Trophy, Activity } from 'lucide-react';
import { useRankings } from '../hooks/useRankings';

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
  { key: 'total',  label: '전체 랭킹',    desc: '누적 인증 횟수 기준',          icon: <Trophy size={14} /> },
  { key: 'local',  label: '우리 동네 왕',  desc: '현재 위치 기반 지역 랭킹',     icon: <MapPin size={14} /> },
  { key: 'health', label: '건강왕',        desc: 'AI 쾌변 점수 기준',            icon: <Activity size={14} /> },
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
function ItemPopup({ user, onClose }: { user: RankUser; onClose: () => void }) {
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[200]"
        style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 10 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed z-[201]"
        style={{
          top: '50%', left: '50%',
          transform: 'translate(-50%, -50%)',
          width: 'min(360px, calc(100vw - 32px))',
          background: '#FFFFFF',
          borderRadius: '28px',
          border: '1px solid rgba(27,67,50,0.08)',
          overflow: 'hidden',
          boxShadow: '0 24px 80px rgba(27,67,50,0.15)',
        }}
      >
        {/* 상단 컬러 바 */}
        <div style={{ height: '3px', background: `linear-gradient(90deg, ${user.titleColor}, transparent)` }} />

        <div className="p-6">
          {/* 헤더 */}
          <div className="flex items-start justify-between mb-5">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-3xl"
                style={{ background: '#f8fcf9', border: `2px solid ${user.titleColor}` }}
              >
                {user.emoji}
              </div>
              <div>
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full block mb-1"
                  style={{ background: user.titleBg, color: user.titleColor }}
                >
                  {user.title}
                </span>
                <p className="font-black text-[#1A2B27] text-base leading-tight">{user.nick}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(0,0,0,0.4)' }}>
                  {user.score.toLocaleString()}{user.scoreLabel}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
              style={{ color: 'rgba(0,0,0,0.3)' }}
            >
              <X size={16} />
            </button>
          </div>

          {/* 착용 아이템 */}
          <p
            className="text-[10px] font-bold uppercase tracking-widest mb-3"
            style={{ color: 'rgba(0,0,0,0.3)' }}
          >
            착용 아이템
          </p>

          {user.items.length === 0 ? (
            <div
              className="py-6 rounded-2xl text-center"
              style={{ background: '#f8faf9' }}
            >
              <p className="text-sm" style={{ color: 'rgba(0,0,0,0.3)' }}>착용 중인 아이템이 없어요</p>
            </div>
          ) : (
            <div className="flex flex-col gap-2 mb-5">
              {user.items.map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center gap-3 p-3 rounded-2xl"
                  style={{ background: '#f8fcf9', border: '1px solid rgba(27,67,50,0.05)' }}
                >
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-[#1A2B27]">{item.name}</p>
                    <p className="text-xs" style={{ color: 'rgba(0,0,0,0.4)' }}>{item.type}</p>
                  </div>
                  <span
                    className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(232,168,56,0.12)', color: '#E8A838' }}
                  >
                    장착 중
                  </span>
                </motion.div>
              ))}
            </div>
          )}

          {/* 상점 버튼 */}
          <button
            className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{
              background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
              color: '#1B4332',
              boxShadow: '0 4px 20px rgba(232,168,56,0.3)',
            }}
          >
            <ShoppingBag size={16} />
            상점 가서 이 아이템 보기 →
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
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
          style={{ background: user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#B0B8B4' : '#CD7C4A', color: '#fff' }}>
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
  const rankColor = user.rank === 1 ? '#E8A838' : user.rank === 2 ? '#b0b8b4' : user.rank === 3 ? '#cd7c4a' : 'rgba(27,67,50,0.08)';
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
      <div className="flex-1 min-w-0">
        <span
          className="text-sm font-bold px-2.5 py-1 rounded-full inline-block mb-1.5"
          style={{ background: user.titleBg, color: user.titleColor }}
        >
          {user.title}
        </span>
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
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="sticky bottom-4 mx-4 rounded-2xl px-4 py-3 flex items-center gap-3"
      style={{
        background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
        border: '1.5px solid #E8A838',
        boxShadow: '0 8px 32px rgba(27,67,50,0.5)',
        zIndex: 50,
      }}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center text-xl flex-shrink-0"
        style={{ background: 'rgba(255,255,255,0.1)', border: '2px solid #E8A838' }}
      >
        {data.emoji}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-black text-white text-sm">나의 순위: {data.rank}위 ({data.nick})</p>
          <ChangeIcon change={data.change} />
        </div>
        <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>
          TOP {data.top}%까지 인증 {data.needed}번 더 필요해요!
        </p>
      </div>
      <button
        className="px-4 py-2 rounded-xl font-black text-xs flex-shrink-0 transition-all hover:scale-105 active:scale-95"
        style={{ background: '#E8A838', color: '#1B4332' }}
      >
        도전 →
      </button>
    </motion.div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function RankingPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const [tab, setTab] = useState<TabKey>('total');
  const [selectedUser, setSelectedUser] = useState<RankUser | null>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const inView = useInView(listRef, { once: true, margin: '-40px' });

  // 실시간 랭킹 데이터 가져오기
  const { data, loading, error } = useRankings(tab);

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
          titleColor: Number(r.rank) === 1 ? '#E8A838' : '#52b788',
          titleBg: Number(r.rank) === 1 ? 'rgba(232,168,56,0.12)' : 'rgba(82,183,136,0.1)',
          score: Number(r.score || 0),
          scoreLabel: tab === 'health' ? '점' : '인증',
          change: 0,
          items: [],
        }))
    : [];

  const myRankData = (isDataValid && (data as any).myRank) ? {
    rank: Number((data as any).myRank.rank || 0),
    nick: (data as any).myRank.nickname || '나',
    emoji: <Activity size={18} />,
    score: Number((data as any).myRank.score || 0),
    change: 0,
    top: 10,
    needed: 15
  } : null;

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

        <section className="relative z-10 pt-32 pb-64 px-6">
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
                  <span className="relative z-10 flex flex-col items-center gap-0.5">
                    <span>{t.icon} {t.label}</span>
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-8">
              {[
                { label: '활성 사용자', value: '1,000', unit: '+' },
                { 
                  label: '내 현재 순위', 
                  value: myRankData ? myRankData.rank.toString() : '-', 
                  unit: '위' 
                },
                { 
                  label: '상위권 도전', 
                  value: myRankData && myRankData.rank > 10 ? (myRankData.rank - 10).toString() : '0', 
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

        {/* 내 순위 고정 바 */}
        <div className="max-w-2xl mx-auto px-0 pb-16">
          {myRankData && <MyRankBar data={myRankData} />}
        </div>
      </div>

      {/* 아이템 팝업 */}
      {selectedUser && (
        <ItemPopup user={selectedUser} onClose={() => setSelectedUser(null)} />
      )}
      <Footer />
    </div>
  );
}
