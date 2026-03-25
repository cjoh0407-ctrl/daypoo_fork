import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import {
  ShoppingBag, Package, Star, TrendingUp, MapPin,
  Settings, ChevronRight, Lock, Check, X,
  Sparkles, Trophy, Calendar, BarChart3, LogOut, Trash2,
  Crown, Brain, ArrowRight, Activity, CheckCircle2, Cloud, Waves, Droplets, AlertCircle
} from 'lucide-react';
import { loadTossPayments } from '@tosspayments/payment-sdk';
import { api } from '../services/apiClient';
import { useAuth } from '../context/AuthContext';
import { MyPageSkeleton } from '../components/LoadingSkeleton';

// ── 타입 ──────────────────────────────────────────────────────────────
type TabKey = 'home' | 'collection' | 'report' | 'settings';

interface UserProfile {
  email: string;
  nickname: string;
  points?: number;
  birthDate?: string;
  createdAt?: string;
  role?: string;
}

interface AvatarItem {
  id: string; emoji: string; name: string;
  type: '헤드' | '이펙트' | '마커';
  owned: boolean; price?: number;
}

// ── FALLBACK 데이터 ───────────────────────────────────────────────────────
const FALLBACK_AVATAR_ITEMS: AvatarItem[] = [
  // 헤드 (Head)
  { id:'i1', emoji:'👑', name:'황금 왕관',   type:'헤드',   owned:true },
  { id:'i2', emoji:'🎩', name:'마법사 모자', type:'헤드',   owned:true },
  { id:'i7', emoji:'🎀', name:'핑크 리본',   type:'헤드',   owned:false, price:300 },
  { id:'i8', emoji:'🧢', name:'힙합 스냅백', type:'헤드',   owned:false, price:450 },
  { id:'i9', emoji:'🎓', name:'졸업모자',     type:'헤드',   owned:false, price:600 },
  { id:'i10', emoji:'🪖', name:'전투 헬멧',   type:'헤드',   owned:false, price:1200 },
  
  // 이펙트 (Effect)
  { id:'i3', emoji:'✨', name:'황금 오라',   type:'이펙트', owned:true },
  { id:'i4', emoji:'🌟', name:'별빛 오라',   type:'이펙트', owned:false, price:500 },
  { id:'i5', emoji:'🦋', name:'나비 날개',   type:'이펙트', owned:false, price:800 },
  { id:'i11', emoji:'🔥', name:'불꽃 오라',   type:'이펙트', owned:false, price:1500 },
  { id:'i12', emoji:'❄️', name:'눈꽃 장식',   type:'이펙트', owned:false, price:900 },
  { id:'i13', emoji:'⚡', name:'전기 이펙트', type:'이펙트', owned:false, price:1800 },

  // 마커 (Marker)
  { id:'i6', emoji:'💎', name:'다이아 마커', type:'마커',   owned:false, price:1200 },
  { id:'i14', emoji:'🌈', name:'무지개 마커', type:'마커',   owned:false, price:2500 },
  { id:'i15', emoji:'🖤', name:'다크 마커',   type:'마커',   owned:false, price:1000 },
  { id:'i16', emoji:'🌹', name:'장미 마커',   type:'마커',   owned:false, price:700 },
  { id:'i17', emoji:'🪐', name:'행성 마커',   type:'마커',   owned:false, price:3000 },
];

const FALLBACK_TITLES = [
  { id:'t1', label:'전설의 쾌변가', earned:true,  selected:true  },
  { id:'t2', label:'화장실 정복자', earned:true,  selected:false },
  { id:'t3', label:'쾌변 마스터',   earned:true,  selected:false },
  { id:'t4', label:'섬유질왕',      earned:true,  selected:false },
  { id:'t5', label:'7일 연속왕',    earned:false, selected:false },
  { id:'t6', label:'100회 달성',    earned:false, selected:false },
];

const BRISTOL_DATA = [
  { day:'월', type:2, emoji: <Activity size={16} />, color:'#E8A838' },
  { day:'화', type:3, emoji: <Activity size={16} />, color:'#52b788' },
  { day:'수', type:4, emoji: <CheckCircle2 size={16} />, color:'#52b788' },
  { day:'목', type:4, emoji: <CheckCircle2 size={16} />, color:'#52b788' },
  { day:'금', type:5, emoji: <Cloud size={16} />, color:'#E8A838' },
  { day:'토', type:6, emoji: <Waves size={16} />, color:'#E85D5D' },
  { day:'일', type:4, emoji: <CheckCircle2 size={16} />, color:'#52b788' },
];

// ── 카운트업 ──────────────────────────────────────────────────────────
function CountUp({ target, suffix = '' }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const duration = 1500;
    const startTime = performance.now();
    const update = (now: number) => {
      const p = Math.min((now - startTime) / duration, 1);
      const eased = p === 1 ? 1 : 1 - Math.pow(2, -10 * p);
      setCount(Math.floor(eased * target));
      if (p < 1) requestAnimationFrame(update);
    };
    requestAnimationFrame(update);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

const fadeUp = (delay = 0) => ({
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, delay, ease: [0.16, 1, 0.3, 1] as const } },
});
const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };

// ══════════════════════════════════════════════════════════════════════
// ① KNOCKOUT WOBBLE TEXT
//    background-clip:text 마스킹 + 글자별 spring wobble
// ══════════════════════════════════════════════════════════════════════
interface KnockoutWobbleProps {
  text: string;
  gradient?: string;
  fontSize?: string;
  fontWeight?: number;
  wobbleDuration?: number;
  className?: string;
  style?: React.CSSProperties;
}

function KnockoutWobble({
  text,
  gradient = 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 45%, #E8A838 100%)',
  fontSize = 'clamp(22px, 5vw, 36px)',
  fontWeight = 900,
  wobbleDuration = 480,
  className,
  style,
}: KnockoutWobbleProps) {
  const [wobbling, setWobbling] = useState<Set<number>>(new Set());

  const trigger = (i: number) => {
    setWobbling((p) => new Set(p).add(i));
    setTimeout(() => {
      setWobbling((p) => { const n = new Set(p); n.delete(i); return n; });
    }, wobbleDuration);
  };

  return (
    <span
      className={className}
      style={{
        display: 'inline-flex', flexWrap: 'wrap',
        fontWeight, fontSize, letterSpacing: '-0.04em', lineHeight: 1.05,
        ...style,
      }}
    >
      {text.split('').map((char, i) =>
        char === ' ' ? (
          <span key={i} style={{ width: '0.28em' }} />
        ) : (
          <motion.span
            key={i}
            onHoverStart={() => trigger(i)}
            animate={
              wobbling.has(i)
                ? { rotate: [0, -14, 14, -8, 8, -3, 3, 0], y: [0, -7, 3, -3, 2, 0], scale: [1, 1.2, 0.95, 1.08, 0.98, 1] }
                : { rotate: 0, y: 0, scale: 1 }
            }
            transition={{ duration: wobbleDuration / 1000, ease: 'easeOut' }}
            style={{
              display: 'inline-block',
              cursor: 'default',
              background: gradient,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            {char}
          </motion.span>
        )
      )}
    </span>
  );
}

// ══════════════════════════════════════════════════════════════════════
// ② ARC GALLERY 3D
//    Canvas rAF 루프, 수학적 arc bend, 드래그 + 스냅
// ══════════════════════════════════════════════════════════════════════
// ② DEPTH DECK CAROUSEL (Coverflow 3D)
//    DepthDeck Framer 컴포넌트 포팅 — framer-motion rotateY + z + scale
//    중앙 카드 정면, 양쪽 카드 Y축 회전 + 뒤로 밀림, 클릭 시 앞으로
// ══════════════════════════════════════════════════════════════════════
interface DeckCard {
  id: string;
  emoji: string;
  label: string;
  sublabel?: string;
  accent?: string;
  selected?: boolean;
  locked?: boolean;
}

interface DepthDeckProps {
  cards: DeckCard[];
  onSelect?: (id: string) => void;
  cardWidth?: number;
  cardHeight?: number;
}

function DepthDeckCarousel({
  cards,
  onSelect,
  cardWidth = 160,
  cardHeight = 200,
}: DepthDeckProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [dragging, setDragging] = useState(false);

  const n = cards.length;

  const goTo = (idx: number) => {
    const clamped = ((idx % n) + n) % n;
    setActiveIndex(clamped);
    onSelect?.(cards[clamped].id);
  };

  const getCardStyle = (i: number) => {
    // 중앙 기준 상대 거리 (-n/2 ~ n/2)
    let diff = i - activeIndex;
    if (diff > n / 2) diff -= n;
    if (diff < -n / 2) diff += n;

    const absDiff = Math.abs(diff);
    const sign = Math.sign(diff);

    // 보이는 카드 범위 제한
    if (absDiff > 2) return null;

    const SPREAD = cardWidth * 0.72;   // 카드 간 가로 간격
    const ROTATION = 42;               // 양쪽 카드 Y축 회전각
    const DEPTH = 180;                 // translateZ 깊이감

    const x = diff * SPREAD;
    const rotateY = -sign * Math.min(absDiff, 1) * ROTATION;
    const z = -absDiff * DEPTH;
    const scale = absDiff === 0 ? 1 : absDiff === 1 ? 0.82 : 0.68;
    const opacity = absDiff === 0 ? 1 : absDiff === 1 ? 0.75 : 0.45;
    const zIndex = 10 - absDiff;

    return { x, rotateY, z, scale, opacity, zIndex, isCenter: absDiff === 0 };
  };

  // 드래그 처리
  const handleDragEnd = (_e: any, info: { offset: { x: number } }) => {
    setDragging(false);
    if (info.offset.x < -50) goTo(activeIndex + 1);
    else if (info.offset.x > 50) goTo(activeIndex - 1);
  };

  return (
    <div className="flex flex-col items-center gap-5 select-none">
      {/* 카드 스테이지 */}
      <div
        style={{
          width: '100%',
          height: cardHeight + 32,
          position: 'relative',
          perspective: '900px',
          perspectiveOrigin: '50% 50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {cards.map((card, i) => {
          const s = getCardStyle(i);
          if (!s) return null;

          return (
            <motion.div
              key={card.id}
              onClick={() => !dragging && goTo(i)}
              animate={{
                x: s.x,
                rotateY: s.rotateY,
                z: s.z,
                scale: s.scale,
                opacity: s.opacity,
              }}
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
                mass: 0.9,
              }}
              whileHover={s.isCenter ? { scale: 1.04, y: -6 } : { scale: s.scale * 1.04, y: -3 }}
              drag={s.isCenter ? 'x' : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragStart={() => { setDragging(true); }}
              onDragEnd={handleDragEnd}
              style={{
                position: 'absolute',
                width: cardWidth,
                height: cardHeight,
                zIndex: s.zIndex,
                cursor: s.isCenter ? 'grab' : 'pointer',
                transformStyle: 'preserve-3d',
              }}
            >
              {/* 카드 본체 */}
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  borderRadius: '24px',
                  background: card.selected ? '#fffbef' : '#ffffff',
                  border: card.selected
                    ? '2px solid rgba(232,168,56,0.6)'
                    : s.isCenter
                    ? '1.5px solid rgba(26,43,39,0.12)'
                    : '1px solid rgba(26,43,39,0.07)',
                  boxShadow: s.isCenter
                    ? '0 20px 48px rgba(26,43,39,0.12), 0 4px 16px rgba(26,43,39,0.06)'
                    : '0 8px 24px rgba(26,43,39,0.06)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '20px 16px',
                  position: 'relative',
                  overflow: 'hidden',
                  transition: 'background .2s, border .2s',
                }}
              >
                {/* 중앙 카드 배경 글로우 */}
                {s.isCenter && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: card.selected
                      ? 'radial-gradient(circle at 50% 30%, rgba(232,168,56,0.08) 0%, transparent 70%)'
                      : 'radial-gradient(circle at 50% 30%, rgba(27,67,50,0.05) 0%, transparent 70%)',
                    borderRadius: '24px',
                    pointerEvents: 'none',
                  }} />
                )}

                {/* 잠금 오버레이 */}
                {card.locked && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(248,250,249,0.65)',
                    backdropFilter: 'blur(2px)',
                    borderRadius: '24px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    zIndex: 2,
                  }}>
                    <Lock size={20} style={{ color: 'rgba(26,43,39,0.25)' }} />
                  </div>
                )}

                {/* 선택 뱃지 */}
                {card.selected && (
                  <div style={{
                    position: 'absolute', top: '10px', right: '10px',
                    width: '22px', height: '22px', borderRadius: '50%',
                    background: '#E8A838',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '11px', zIndex: 3,
                  }}>
                    <Star size={11} fill="#fff" color="#fff" />
                  </div>
                )}

                {/* 이모지 */}
                <span style={{
                  fontSize: s.isCenter ? '44px' : '36px',
                  lineHeight: 1,
                  transition: 'font-size .3s',
                  filter: card.locked ? 'grayscale(1) opacity(0.4)' : 'none',
                }}>
                  {card.emoji}
                </span>

                {/* 라벨 */}
                <div style={{ textAlign: 'center', zIndex: 1 }}>
                  <p style={{
                    fontSize: s.isCenter ? '14px' : '12px',
                    fontWeight: 800,
                    color: '#1A2B27',
                    letterSpacing: '-0.02em',
                    lineHeight: 1.2,
                    transition: 'font-size .3s',
                  }}>
                    {card.label}
                  </p>
                  {card.sublabel && (
                    <p style={{
                      fontSize: s.isCenter ? '12px' : '10px',
                      fontWeight: 600,
                      color: card.accent || '#52b788',
                      marginTop: '4px',
                      opacity: 0.9,
                    }}>
                      {card.sublabel}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* 네비게이션 화살표 + 도트 */}
      <div className="flex items-center gap-4">
        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => goTo(activeIndex - 1)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#fff', border: '1px solid rgba(26,43,39,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,43,39,0.06)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,43,39,0.5)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </motion.button>

        {/* 페이지네이션 도트 */}
        <div className="flex items-center gap-1.5">
          {cards.map((_, i) => (
            <motion.button
              key={i}
              onClick={() => goTo(i)}
              animate={{
                width: i === activeIndex ? '20px' : '6px',
                background: i === activeIndex ? '#1B4332' : 'rgba(26,43,39,0.15)',
              }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              style={{ height: '6px', borderRadius: '3px', cursor: 'pointer', border: 'none', padding: 0 }}
            />
          ))}
        </div>

        <motion.button
          whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
          onClick={() => goTo(activeIndex + 1)}
          style={{
            width: '36px', height: '36px', borderRadius: '50%',
            background: '#fff', border: '1px solid rgba(26,43,39,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', boxShadow: '0 2px 8px rgba(26,43,39,0.06)',
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(26,43,39,0.5)" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </motion.button>
      </div>
    </div>
  );
}

// ── 히어로 배너 ───────────────────────────────────────────────────────
function HeroBanner({
  equippedItem, onAvatarClick, user,
}: { equippedItem: AvatarItem | null; onAvatarClick: () => void; user: UserProfile | null }) {
  return (
    <div className="relative overflow-hidden" style={{ background: 'transparent' }}>
      <div className="absolute inset-0 pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1], opacity: [0.1, 0.2, 0.1] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute"
          style={{
            top: '-10%', left: '20%', width: '400px', height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(82,183,136,0.15) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative z-10 max-w-3xl mx-auto px-6 pt-40 pb-12">
        <div className="flex items-end justify-between gap-6">
          <motion.div variants={stagger} initial="hidden" animate="show" className="flex items-end gap-6">
            {/* 아바타 */}
            <motion.div variants={fadeUp(0)} className="relative flex-shrink-0">
              <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                onClick={onAvatarClick} className="relative group">
                <div className="relative z-10 flex items-center justify-center rounded-[36px] transition-all duration-300 group-hover:shadow-2xl"
                  style={{
                    width: '110px', height: '110px', background: '#ffffff',
                    border: '2px solid rgba(26,43,39,0.08)', fontSize: '56px',
                    boxShadow: '0 16px 48px rgba(27,67,50,0.12)',
                  }}>
                  {equippedItem?.emoji ?? '💩'}
                </div>
                <div className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center rounded-xl font-black text-xs shadow-lg"
                  style={{
                    width: '36px', height: '36px',
                    background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
                    color: '#1B4332', border: '4px solid #ffffff',
                  }}>
                  12
                </div>
                <div className="absolute inset-0 -z-10 blur-3xl opacity-40 group-hover:opacity-60 transition-opacity"
                  style={{ background: 'radial-gradient(circle, #E8A838 0%, transparent 70%)' }} />
              </motion.button>
            </motion.div>

            {/* 텍스트 영역 */}
            <div className="pb-1">
              <motion.div variants={fadeUp(0.05)}>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full mb-2"
                  style={{ background: 'rgba(232,168,56,0.12)', color: '#E8A838', border: '1px solid rgba(232,168,56,0.2)' }}>
                  <Trophy size={9} /> 전설의 쾌변가
                </span>
              </motion.div>

              {/* ★ Knockout Wobble 닉네임 */}
              <motion.div variants={fadeUp(0.1)} className="mb-1">
                <KnockoutWobble
                  text={user?.nickname || '회원님'}
                  gradient="#1B4332"
                  fontSize="clamp(22px, 5vw, 36px)"
                  fontWeight={900}
                  wobbleDuration={500}
                />
              </motion.div>

              <motion.div variants={fadeUp(0.15)} className="flex items-center gap-3 mt-3">
                <div className="relative overflow-hidden rounded-full"
                  style={{ width: '160px', height: '6px', background: 'rgba(26,43,39,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: '68%' }}
                    transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: '#E8A838' }} />
                </div>
                <span className="text-xs font-bold" style={{ color: 'rgba(26,43,39,0.4)' }}>
                  Lv.12 · 68%
                </span>
              </motion.div>
            </div>
          </motion.div>

          <motion.div variants={stagger} initial="hidden" animate="show"
            className="hidden sm:flex flex-col gap-2 pb-1">
            {[
              { label: '총 인증', value: (user as any)?.totalAuthCount || 0, suffix: '회', color: '#E8A838' },
              { label: '방문 화장실', value: (user as any)?.totalVisitCount || 0, suffix: '곳', color: '#52b788' },
              { label: '연속 기록', value: (user as any)?.consecutiveDays || 0, suffix: '일', color: '#52b788' },
            ].map((s, i) => (
              <motion.div key={s.label} variants={fadeUp(i * 0.06)} className="flex items-center gap-2">
                <span className="text-xs" style={{ color: 'rgba(26,43,39,0.35)' }}>{s.label}</span>
                <span className="font-black text-sm" style={{ color: s.color, letterSpacing: '-0.03em' }}>
                  <CountUp target={s.value} suffix={s.suffix} />
                </span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>

      <div style={{ position: 'absolute', bottom: '-2px', left: 0, width: '100%', lineHeight: 0 }}>
        <svg viewBox="0 0 1440 40" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none"
          style={{ display: 'block', width: '100%' }}>
          <path d="M0,20 C240,40 480,0 720,20 C960,40 1200,0 1440,20 L1440,40 L0,40 Z" fill="#f8faf9" />
        </svg>
      </div>
    </div>
  );
}

// ── 탭 바 ─────────────────────────────────────────────────────────────
const TABS: { key: TabKey; label: string; icon: React.ReactNode }[] = [
  { key: 'home',       label: '홈',     icon: <Sparkles size={22} /> },
  { key: 'collection', label: '컬렉션', icon: <Trophy size={22} /> },
  { key: 'report',     label: '리포트', icon: <BarChart3 size={22} /> },
  { key: 'settings',   label: '설정',   icon: <Settings size={22} /> },
];

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="flex gap-4 px-10 py-5 mx-auto"
      style={{
        maxWidth: '900px', background: 'transparent',
        borderBottom: '1px solid rgba(26,43,39,0.05)',
      }}>
      {TABS.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="relative flex-1 flex items-center justify-center gap-3 py-4 rounded-[24px] text-base font-black transition-all"
          style={{ color: active === t.key ? '#E8A838' : 'rgba(26,43,39,0.35)' }}>
          {active === t.key && (
            <motion.div layoutId="tabHighlight" className="absolute inset-0 rounded-[22px]"
              style={{ background: 'rgba(232,168,56,0.1)', border: '1px solid rgba(232,168,56,0.2)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
          )}
          <span className="relative z-10 flex items-center gap-2.5">{t.icon}{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────────────────
function HomeTab({ equipped, setEquipped, user, avatarItems, initialShopTab = 'inventory' }: {
  equipped: AvatarItem | null;
  setEquipped: (i: AvatarItem) => void;
  user: UserProfile | null;
  avatarItems: AvatarItem[];
  initialShopTab?: 'inventory' | 'shop';
}) {
  const [shopTab, setShopTab] = useState<'inventory' | 'shop'>(initialShopTab);
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  // AI 건강 지표 데이터
  const [healthReport, setHealthReport] = useState<any>(null);
  const [loadingHealth, setLoadingHealth] = useState(false);

  // 홈 탭 로드 시 DAILY 리포트 가져오기
  useEffect(() => {
    const fetchDailyReport = async () => {
      setLoadingHealth(true);
      try {
        const res = await api.get('/reports/DAILY');
        setHealthReport(res);
      } catch (err) {
        console.warn('일간 건강 리포트 조회 실패:', err);
      } finally {
        setLoadingHealth(false);
      }
    };
    fetchDailyReport();
  }, []);

  const items = shopTab === 'inventory'
    ? avatarItems.filter((i) => i.owned)
    : avatarItems.filter((i) => !i.owned);

  // DepthDeck 카드 데이터 변환
  const deckCards: DeckCard[] = items.map((item) => ({
    id: item.id,
    emoji: item.emoji,
    label: item.name,
    sublabel: item.owned
      ? (equipped?.id === item.id || preview?.id === item.id ? '착용 중' : item.type)
      : `${item.price?.toLocaleString()}P`,
    accent: item.owned ? '#2D6A4F' : '#E8A838',
    selected: preview?.id === item.id || (!preview && equipped?.id === item.id),
  }));

  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // 토스 페이먼츠 결제창 호출
  const handleTossPayment = async () => {
    try {
      const tossPayments = await loadTossPayments(import.meta.env.VITE_TOSS_CLIENT_KEY);
      await tossPayments.requestPayment('카드', {
        amount: 5000,
        orderId: `POOPMAP_${Math.random().toString(36).substring(2, 11)}`,
        orderName: '포인트 5,000P 충전',
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/mypage',
      });
    } catch (err: any) {
      console.error('결제 요청 실패:', err);
      // 토스 페이먼츠의 다양한 취소 에러 코드 및 메시지 대응 (PAY_PROCESS_CANCELED, USER_CANCEL 등)
      const isCancellation = 
        err?.code?.includes('CANCELED') || 
        err?.errorCode?.includes('CANCELED') ||
        err?.message?.includes('취소') || 
        err?.message?.toLowerCase().includes('cancel') ||
        String(err).includes('CANCELED');

      if (isCancellation) {
        if (confirm('결제를 취소하시겠습니까?')) {
          setShowPaymentModal(false);
        }
        return;
      }
      alert('결제창을 띄우는 중 오류가 발생했습니다.');
      setShowPaymentModal(false);
    }
  };

  const handleSave = () => {
    if (!preview) return;
    if (preview.owned) {
      setEquipped(preview);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPreview(null);
    } else {
      setShowPaymentModal(true);
    }
  };

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8">

      {/* ★ 아바타 커스터마이징 섹션 (개편 및 사이즈 업) */}
      <motion.div variants={fadeUp(0)} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-10 pt-10 pb-8">
          <div>
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest mb-1.5">Avatar Customizing</p>
            <div className="flex items-center gap-4">
              <span className="text-3xl font-black text-[#1A2B27] tracking-tight">
                {shopTab === 'inventory' ? '보유 아이템' : '프리미엄 상점'}
              </span>
              {shopTab === 'shop' && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-base font-black shadow-inner"
                  style={{ background: 'rgba(232,168,56,0.1)', color: '#E8A838', border: '1.5px solid rgba(232,168,56,0.15)' }}
                >
                  <Sparkles size={16} /> {(user?.points ?? 0).toLocaleString()}P
                </motion.span>
              )}
            </div>
          </div>
          <div className="flex rounded-[24px] p-2 bg-gray-50 border border-gray-100 shadow-sm">
            {(['inventory', 'shop'] as const).map((t) => (
              <button key={t} onClick={() => { setShopTab(t); setPreview(null); }}
                className="relative px-8 py-3.5 rounded-[18px] text-base font-black transition-all"
                style={{ color: shopTab === t ? '#ffffff' : 'rgba(26,43,39,0.4)' }}>
                {shopTab === t && (
                  <motion.div layoutId="shopTab" className="absolute inset-0 rounded-[18px]"
                    style={{ background: '#1B4332' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 32 }} />
                )}
                <span className="relative z-10 flex items-center gap-2.5">
                  {t === 'inventory' ? <><Package size={20} /> 인벤토리</> : <><ShoppingBag size={20} /> 상점</>}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 pb-4">
          <AnimatePresence mode="wait">
            <motion.div key={shopTab}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.25 }}>
              {deckCards.length > 0 ? (
                <DepthDeckCarousel
                  cards={deckCards}
                  onSelect={(id) => {
                    const item = items.find((i) => i.id === id);
                    if (item) setPreview(item);
                  }}
                  cardWidth={180}
                  cardHeight={240}
                />
              ) : (
                <div className="flex items-center justify-center h-52 text-lg font-bold text-gray-300">아이템이 없어요</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <p className="text-center text-sm font-semibold text-gray-300 py-4 italic tracking-wide">
          클릭하거나 드래그해서 아바타를 꾸며보세요
        </p>

        {/* 하단 구매/저장 바 (X 버튼 제거 및 가동성 개선) */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 15 }}
              className="flex gap-4 px-10 pb-10 pt-4">
              <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-3 py-5 rounded-[24px] font-black text-xl shadow-2xl transition-shadow"
                style={{
                  background: preview.owned
                    ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                    : 'linear-gradient(135deg, #E8A838 0%, #FFB627 100%)',
                  color: preview.owned ? '#ffffff' : '#1A2B27',
                  boxShadow: preview.owned 
                    ? '0 20px 40px rgba(27,67,50,0.25)' 
                    : '0 20px 40px rgba(232,168,56,0.25)',
                }}>
                {saved
                  ? <><Check size={24} /> 저장 완료!</>
                  : preview.owned
                  ? <><Check size={24} /> 장착 완료 (저장)</>
                  : <><ShoppingBag size={24} /> {preview.price?.toLocaleString()}P 충전 후 구매하기</>}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 데일리 AI 분석 섹션 (API 연동) */}
      <motion.div variants={fadeUp(0.12)} className="bg-white rounded-[40px] p-10 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500 shadow-inner">
              <Brain size={28} />
            </div>
            <div>
              <h3 className="text-2xl font-black text-[#1A2B27] tracking-tight">오늘의 건강 지표</h3>
              <p className="text-xs font-black text-gray-400 uppercase tracking-widest mt-1">AI Analyst Doctor Poo</p>
            </div>
          </div>
          <div className="bg-emerald-50 px-5 py-2.5 rounded-2xl border border-emerald-100">
            {loadingHealth ? (
              <p className="text-2xl font-black text-emerald-400 animate-pulse">...</p>
            ) : (
              <p className="text-4xl font-black text-emerald-600 leading-none">
                {healthReport?.healthScore || 0}
                <span className="text-lg ml-1 font-bold">점</span>
              </p>
            )}
          </div>
        </div>

        {healthReport?.insights && healthReport.insights.length >= 3 ? (
          <div className="grid grid-cols-3 gap-5 mb-10">
            {healthReport.insights.slice(0, 3).map((insight: string, i: number) => {
              const icons = [<TrendingUp size={22} />, <Check size={22} />, <Activity size={22} />];
              const colors = ['#52b788', '#E8A838', '#2D6A4F'];
              return (
                <div key={i} className="flex flex-col items-center py-6 rounded-[32px] bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:border-emerald-100 hover:shadow-2xl group">
                  <div className="mb-3 transform group-hover:scale-110 transition-transform" style={{ color: colors[i] }}>{icons[i]}</div>
                  <span className="text-sm font-black text-[#1A2B27] text-center px-2">{insight}</span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-5 mb-10">
            {[
              { label: '활동성', value: '분석 중', icon: <TrendingUp size={22} />, color: '#52b788' },
              { label: '식단 균형', value: '분석 중', icon: <Check size={22} />, color: '#E8A838' },
              { label: '장 컨디션', value: '분석 중', icon: <Activity size={22} />, color: '#2D6A4F' },
            ].map((s, i) => (
              <div key={i} className="flex flex-col items-center py-6 rounded-[32px] bg-gray-50 border border-gray-100 transition-all hover:bg-white hover:border-emerald-100 hover:shadow-2xl group">
                <div className="mb-3 transform group-hover:scale-110 transition-transform" style={{ color: s.color }}>{s.icon}</div>
                <span className="text-lg font-black text-[#1A2B27]">{s.value}</span>
                <span className="text-xs font-black text-gray-300 mt-1.5 uppercase tracking-wide">{s.label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="relative p-8 rounded-[36px] overflow-hidden bg-emerald-50/50 border border-emerald-100 shadow-inner">
          <Sparkles size={24} className="absolute top-7 right-8 text-emerald-300 opacity-60" />
          <p className="text-[13px] font-black text-emerald-600 mb-3 flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm" /> 심층 AI 분석 가이드
          </p>
          {loadingHealth ? (
            <p className="text-lg font-bold text-gray-400 animate-pulse">AI 분석 중...</p>
          ) : (
            <p className="text-xl font-bold leading-relaxed text-[#1A2B27]/80 tracking-tight">
              "{healthReport?.summary || "화장실 기록을 남기고 AI 분석을 받아보세요! 💩"}"
              {healthReport?.solution && (
                <><br/><span className="text-emerald-600">💡 {healthReport.solution}</span></>
              )}
            </p>
          )}
        </div>
      </motion.div>

      {/* 포인트 충전 모달 (사이즈 업) */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-8">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 30 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-[48px] overflow-hidden shadow-3xl p-12 text-center border border-white"
            >
              <button 
                onClick={() => setShowPaymentModal(false)}
                className="absolute top-10 right-10 w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-gray-100 transition-colors"
                aria-label="닫기"
              >
                <X size={24} />
              </button>
              <div className="w-24 h-24 bg-amber-100 rounded-[36px] flex items-center justify-center mx-auto mb-8 transform rotate-3 shadow-lg">
                <ShoppingBag size={42} className="text-amber-500" />
              </div>
              <h3 className="text-3xl font-black text-[#1B4332] mb-4 tracking-tight">포인트가 부족해요!</h3>
              <p className="text-gray-500 font-bold text-lg leading-relaxed mb-10">
                아이템을 구매하기 위한 포인트가 부족합니다.<br />
                토스페이로 포인트를 충전하시겠습니까?
              </p>
              <div className="flex flex-col gap-4">
                <button
                  onClick={handleTossPayment}
                  className="w-full py-5 bg-[#1B4332] text-white font-black text-xl rounded-2xl shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  결제창 열기
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 text-gray-400 font-black text-lg hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  돌아가기
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


// ── 컬렉션 탭 ─────────────────────────────────────────────────────────
function CollectionTab({ titles, setTitles }: { titles: any[]; setTitles: React.Dispatch<React.SetStateAction<any[]>> }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [saving, setSaving] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<any | null>(null);

  const selectedTitle = titles.find(t => t.selected);

  const handleEquipTitle = async () => {
    if (!selectedPreview || !selectedPreview.earned) return;

    setSaving(true);
    try {
      await api.post(`/shop/titles/${selectedPreview.id}/equip`);
      setTitles((prev) => prev.map((t) => ({ ...t, selected: t.id === selectedPreview.id })));
      setSelectedPreview(null);
      alert('✅ 칭호가 장착되었습니다!');
    } catch (err: any) {
      console.error('칭호 장착 실패:', err);
      alert('칭호 장착에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleUnequipTitle = async () => {
    if (!selectedTitle) return;

    if (!confirm('현재 칭호를 해제하시겠습니까?')) return;

    setSaving(true);
    try {
      // 칭호 해제는 백엔드 수정 필요 (현재는 임시로 로컬만 변경)
      setTitles((prev) => prev.map((t) => ({ ...t, selected: false })));
      alert('✅ 칭호가 해제되었습니다!\n\n(백엔드 API 추가 시 서버에 저장됩니다)');
    } catch (err: any) {
      console.error('칭호 해제 실패:', err);
      alert('칭호 해제에 실패했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const earnedCount = titles.filter(t => t.earned).length;

  // DepthDeck 카드 변환
  const titleCards: DeckCard[] = titles.map((t) => ({
    id: t.id,
    emoji: t.earned ? (t.selected ? '★' : '✓') : '🔒',
    label: t.label,
    sublabel: t.selected ? '닉네임에 장착 중' : t.earned ? '획득 완료' : '아직 잠금',
    accent: t.selected ? '#E8A838' : t.earned ? '#2D6A4F' : 'rgba(26,43,39,0.3)',
    selected: t.selected,
    locked: !t.earned,
  }));

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8">

      {/* 컬렉션 현황 대시보드 (사이즈 업) */}
      <motion.div variants={fadeUp(0)} className="rounded-[40px] p-12 bg-white border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-12 opacity-5">
          <Trophy size={180} />
        </div>
        <div className="relative z-10">
          <p className="text-xs font-black text-amber-500 uppercase tracking-[0.25em] mb-2.5">Collection Progress</p>
          <h2 className="text-3xl font-black text-[#1A2B27] mb-6 tracking-tighter">나의 명예로운 자취</h2>
          
          <div className="grid grid-cols-2 gap-5 mb-6">
            <div className="p-6 rounded-[28px] bg-gray-50 border border-gray-100 shadow-inner">
              <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">보유한 칭호</p>
              <p className="text-3xl font-black text-[#1B4332]">{earnedCount} <span className="text-lg text-gray-300">/ {titles.length}</span></p>
            </div>
            <div className="p-6 rounded-[28px] bg-gray-50 border border-gray-100 shadow-inner">
              <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">수집 랭크</p>
              <p className="text-3xl font-black text-[#E8A838]">TOP 4%</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-sm font-black text-gray-400 px-2">
              <span>컬렉션 달성률</span>
              <span>{Math.round((earnedCount/titles.length)*100)}%</span>
            </div>
            <div className="h-4 bg-gray-100 rounded-full overflow-hidden shadow-inner p-1">
              <motion.div 
                initial={{ width: 0 }} 
                animate={{ width: `${(earnedCount/titles.length)*100}%` }} 
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-400 rounded-full shadow-lg" 
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* ★ DepthDeck 칭호 도감 (사이즈 업) */}
      <motion.div variants={fadeUp(0.12)} className="rounded-[40px] overflow-hidden bg-white border border-gray-100 shadow-sm">
        <div className="px-10 pt-10 pb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Achieved Titles</p>
            <div className="flex items-center gap-2 px-4 py-1.5 bg-emerald-50 rounded-full text-xs font-black text-emerald-600 border border-emerald-100 shadow-sm">
              <Check size={14} /> 수집 정보
            </div>
          </div>
          <p className="text-2xl font-black text-[#1A2B27] tracking-tighter">
            칭호 컬렉션 도감
          </p>
        </div>

        <div className="px-6 pb-6">
          <DepthDeckCarousel
            cards={titleCards}
            onSelect={(id) => {
              const t = titles.find((x) => x.id === id);
              if (t?.earned) setSelectedPreview(t);
            }}
            cardWidth={180}
            cardHeight={240}
          />
        </div>

        {/* 칭호 장착/해제 버튼 */}
        <div className="px-10 py-6 bg-gray-50/50 border-t border-gray-100">
          {selectedPreview ? (
            <div className="space-y-4">
              <div className="text-center">
                <p className="text-sm font-black text-gray-400 mb-2">선택한 칭호</p>
                <p className="text-xl font-black text-[#1B4332]">{selectedPreview.label}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setSelectedPreview(null)}
                  className="py-3 px-4 bg-white border-2 border-gray-200 text-gray-600 font-bold rounded-2xl hover:bg-gray-50 transition-all"
                >
                  취소
                </button>
                <button
                  onClick={handleEquipTitle}
                  disabled={saving}
                  className="py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-black rounded-2xl shadow-lg hover:shadow-xl disabled:opacity-50 transition-all"
                >
                  {saving ? '저장 중...' : '장착하기 ✨'}
                </button>
              </div>
            </div>
          ) : selectedTitle ? (
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-2.5 mb-2">
                <Star size={18} className="text-amber-500" fill="#E8A838" />
                <p className="text-sm font-bold text-gray-600">
                  현재 장착: <span className="text-[#1B4332] font-black">{selectedTitle.label}</span>
                </p>
              </div>
              <button
                onClick={handleUnequipTitle}
                disabled={saving}
                className="w-full py-3 px-4 bg-white border-2 border-red-200 text-red-600 font-bold rounded-2xl hover:bg-red-50 disabled:opacity-50 transition-all"
              >
                {saving ? '처리 중...' : '칭호 해제'}
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2.5">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <p className="text-sm font-bold text-gray-400 italic">
                획득한 칭호를 선택하여 당신의 닉네임을 빛내보세요
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 리포트 탭 ─────────────────────────────────────────────────────────
function ReportTab({ records = [] }: { records?: any[] }) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [reportOpen, setReportOpen] = useState(false);
  
  // 권한 확인 (PRO 또는 PREMIUM 멤버십 확인)
  const isPro = user?.isPro || false;

  const displayData = records.length > 0 
    ? records.slice(-7).map((r, i) => ({
        day: ['월','화','수','목','금','토','일'][new Date(r.createdAt).getDay()],
        type: r.bristolType,
        emoji: [<TrendingUp size={20} />, <Activity size={20} />, <CheckCircle2 size={20} />, <CheckCircle2 size={20} />, <Cloud size={20} />, <Waves size={20} />, <Droplets size={20} />][r.bristolType - 1] || <Activity size={20} />,
        color: r.bristolType >= 3 && r.bristolType <= 5 ? '#52b788' : '#E8A838'
      }))
    : [
        { day: '월', type: 3, emoji: <Activity size={20} />, color: '#52b788' },
        { day: '화', type: 4, emoji: <CheckCircle2 size={20} />, color: '#52b788' },
        { day: '수', type: 4, emoji: <CheckCircle2 size={20} />, color: '#52b788' },
        { day: '목', type: 2, emoji: <Activity size={20} />, color: '#E8A838' },
        { day: '금', type: 4, emoji: <CheckCircle2 size={20} />, color: '#52b788' },
        { day: '토', type: 5, emoji: <Cloud size={20} />, color: '#52b788' },
        { day: '일', type: 4, emoji: <CheckCircle2 size={20} />, color: '#52b788' },
      ];

  const [activeSubTab, setActiveSubTab] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [reportData, setReportData] = useState<any>(null);
  const [isFetchLoading, setIsFetchLoading] = useState(false);

  const fetchReport = useCallback(async (type: string) => {
    setIsFetchLoading(true);
    try {
      const res = await api.get(`/reports/${type.toUpperCase()}`);
      setReportData(res);
    } catch (err: any) {
      console.error('리포트 조회 실패:', err);
      if (err.message?.includes('포인트')) {
        alert('포인트가 부족하여 리포트를 생성할 수 없습니다. 포인트를 충전해주세요!');
        setActiveSubTab('daily');
      }
    } finally {
      setIsFetchLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport(activeSubTab);
  }, [activeSubTab, fetchReport]);

  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8">

      {/* 서브 탭 내비게이션 (AI 가이드 연동) */}
      <div className="flex p-2 bg-gray-100 rounded-[24px] w-fit mx-auto mb-4 border border-gray-200 shadow-inner">
        {[
          { key: 'daily', label: '오늘 가이드', free: true },
          { key: 'weekly', label: '7일 리포트', free: false },
          { key: 'monthly', label: '30일 트렌드', free: false },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key as any)}
            className={`px-8 py-3.5 rounded-[18px] text-sm font-black transition-all flex items-center gap-2.5 ${
              activeSubTab === t.key 
              ? 'bg-white text-[#1B4332] shadow-md border border-gray-100' 
              : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50/50'
            }`}
          >
            {t.label}
            {!t.free && <Crown size={14} className={activeSubTab === t.key ? 'text-amber-500' : 'text-gray-300'} />}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {activeSubTab === 'daily' ? (
          <motion.div
            key="daily"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* 정밀 분석 유도 카드 */}
            {!isPro && (
              <motion.div 
                whileHover={{ scale: 1.01 }}
                onClick={() => navigate('/premium')}
                className="rounded-[32px] p-6 cursor-pointer overflow-hidden relative"
                style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-400/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-amber-400 flex items-center justify-center shadow-lg shadow-amber-900/30">
                      <BarChart3 className="text-emerald-950" size={24} />
                    </div>
                    <div>
                      <p className="text-white font-black text-base">7일 정밀 분석 리포트 해제</p>
                      <p className="text-emerald-200/60 text-xs font-bold">PRO 멤버십으로 모든 통계를 한눈에 확인하세요</p>
                    </div>
                  </div>
                  <ChevronRight className="text-emerald-300" size={20} />
                </div>
              </motion.div>
            )}

            <div className="rounded-[40px] p-12 bg-white border border-gray-100 shadow-sm">
              <div className="flex items-center gap-5 mb-10">
                <div className="w-16 h-16 rounded-[24px] bg-emerald-50 flex items-center justify-center text-emerald-600 shadow-inner">
                  <Activity size={32} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A2B27] tracking-tight">오늘의 쾌변 가이드</h3>
                  <p className="text-sm font-black text-gray-400 uppercase tracking-[0.15em] mt-1">Free Analyst • Live Update</p>
                </div>
              </div>

              {isFetchLoading ? (
                <div className="flex items-center justify-center py-20">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold">AI 분석 중...</p>
                  </div>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 gap-5 mb-8">
                    <div className="p-8 rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">현재 장 상태</p>
                      <p className="text-2xl font-black text-[#1B4332] flex items-center gap-2.5">
                        {reportData?.healthScore > 80 ? '아주 좋음' : reportData?.healthScore > 60 ? '좋음' : '보통'}
                        <Sparkles size={22} className="text-amber-400" />
                      </p>
                    </div>
                    <div className="p-8 rounded-[36px] bg-gray-50 border border-gray-100 shadow-inner">
                      <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2.5">건강 점수</p>
                      <p className="text-3xl font-black text-amber-500">{reportData?.healthScore || 0}</p>
                    </div>
                  </div>

                  <div className="p-10 rounded-[40px] bg-emerald-950 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                      <Sparkles size={80} />
                    </div>
                    <p className="text-[13px] font-black text-emerald-300 mb-3 uppercase tracking-[0.2em] flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> AI Doctor Poo Insight
                    </p>
                    <p className="text-xl font-bold leading-relaxed relative z-10 tracking-tight">
                      "{reportData?.summary || "기록을 분석하고 있습니다. 화장실 기록을 남겨주세요!"}"
                    </p>
                    {reportData?.solution && (
                      <p className="mt-4 text-emerald-200 text-lg italic">💡 {reportData.solution}</p>
                    )}
                  </div>
                </>
              )}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="pro-sections"
            initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }}
            className="relative"
          >
            {/* 정밀 분석 UI (비PRO 회원의 경우 블러 처리) */}
            <div className={`space-y-6 transition-all duration-500 ${!isPro ? 'blur-[12px] pointer-events-none' : ''}`}>
              {isFetchLoading ? (
                <div className="rounded-[40px] p-12 bg-white border border-gray-100 shadow-sm flex items-center justify-center py-32">
                  <div className="text-center">
                    <div className="w-20 h-20 border-4 border-amber-200 border-t-amber-600 rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-gray-400 font-bold text-lg">AI 정밀 분석 중...</p>
                  </div>
                </div>
              ) : (
              <div className="rounded-[40px] p-12 bg-white border border-gray-100 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                  <h3 className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">
                    {activeSubTab === 'weekly' ? '7일 정밀 분석 리포트' : '30일 건강 트렌드 리포트'}
                  </h3>
                  <div className="px-4 py-1.5 rounded-full bg-amber-50 border border-amber-100 flex items-center gap-2 shadow-sm">
                    <Crown size={14} className="text-amber-500" />
                    <span className="text-xs font-black text-amber-600">PRO MEMBERSHIP</span>
                  </div>
                </div>

                <div className="flex justify-center mb-12">
                  <div className="relative">
                    <svg width="200" height="200" viewBox="0 0 200 200">
                      <circle cx="100" cy="100" r="90" fill="none" stroke="#f3f4f6" strokeWidth="16" />
                      <motion.circle cx="100" cy="100" r="90" fill="none" 
                         stroke="#E8A838" strokeWidth="16" strokeLinecap="round"
                         strokeDasharray={`${2 * Math.PI * 90}`}
                         initial={{ strokeDashoffset: 2 * Math.PI * 90 }}
                         animate={{ strokeDashoffset: 2 * Math.PI * 90 * (1 - 0.85) }}
                         transition={{ duration: 1.8, ease: [0.16, 1, 0.3, 1] }}
                         transform="rotate(-90 100 100)" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-5xl font-black text-[#1A2B27] tracking-tighter">{reportData?.healthScore || 0}</span>
                      <span className="text-[12px] font-black text-gray-400 mt-0.5 uppercase tracking-widest">Health Score</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4 mb-10">
                  {[
                    { label: '최고 상태', val: '바나나', emoji: <CheckCircle2 size={24} className="text-emerald-500" /> },
                    { label: '주의 요망', val: '매운맛', emoji: <AlertCircle size={24} className="text-red-500" /> },
                    { label: '평균 척도', val: 'Step 4', emoji: <Activity size={24} className="text-blue-500" /> },
                    { label: '분석 성취율', val: '92%', emoji: <Trophy size={24} className="text-amber-500" /> },
                  ].map((stat, i) => (
                    <div key={i} className="flex flex-col items-center p-6 rounded-[32px] bg-gray-50 border border-gray-50 shadow-inner group hover:bg-white hover:shadow-xl transition-all">
                      <span className="text-[#1A2B27] mb-3 transform group-hover:scale-110 transition-transform">{stat.emoji}</span>
                      <span className="text-[10px] font-black text-gray-300 mb-1 uppercase tracking-tighter text-center">{stat.label}</span>
                      <span className="text-sm font-black text-[#1A2B27]">{stat.val}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-6">
                  <div className="p-8 rounded-[40px] bg-emerald-50 border border-emerald-100 shadow-inner">
                    <div className="flex items-center gap-3 mb-4">
                      <Brain size={20} className="text-emerald-700" />
                      <p className="text-lg font-black text-emerald-800">심층 분석 데이터 인사이트</p>
                    </div>
                    <div className="space-y-4">
                      {reportData?.insights?.map((insight: string, i: number) => (
                        <p key={i} className="text-base text-emerald-900/70 font-bold leading-relaxed flex items-start gap-2">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                          {insight}
                        </p>
                      ))}
                      {!reportData?.insights?.length && (
                        <p className="text-gray-400 italic">분석된 인사이트가 없습니다.</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              )}
            </div>

            {/* 잠금 오버레이 (비PRO 회원 전용) */}
            {!isPro && (
              <div className="absolute inset-0 z-10 flex items-center justify-center p-8">
                <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="w-full max-w-md bg-white/95 backdrop-blur-xl p-14 rounded-[56px] shadow-[0_32px_80px_rgba(0,0,0,0.15)] border border-white text-center"
                >
                  <div className="w-20 h-20 bg-amber-100 rounded-[32px] flex items-center justify-center mx-auto mb-6 shadow-inner transform rotate-6 hover:rotate-0 transition-transform duration-500">
                    <Lock size={36} className="text-amber-500" />
                  </div>
                  <h3 className="text-2xl font-black text-[#1A2B27] mb-3 tracking-tight">정밀 분석 리포트 잠금</h3>
                  <p className="text-gray-500 font-bold text-base mb-10 leading-relaxed">
                    7일간의 누적 기록을 바탕으로 산출되는 <br />
                    <span className="text-emerald-700">장 건강 점수</span>와 <span className="text-emerald-700">AI 푸의 맞춤 가이드</span>는<br />
                    <span className="text-[#1B4332] font-black">PRO 멤버십</span> 회원에게만 제공됩니다.
                  </p>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/premium')}
                    className="w-full py-6 bg-[#1B4332] text-white font-black rounded-[28px] shadow-2xl shadow-emerald-900/40 flex items-center justify-center gap-3 text-lg"
                  >
                    PRO 멤버십 가입하고 확인하기 <ArrowRight size={22} />
                  </motion.button>
                </motion.div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* 진단서 모달 (PRO 전용이나 기존 로직 유지용) */}
      <AnimatePresence>
        {reportOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setReportOpen(false)}
              className="fixed inset-0 z-[200]"
              style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ type: 'spring', stiffness: 300, damping: 28 }}
              className="fixed z-[201] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 overflow-y-auto"
              style={{
                width: 'min(520px, calc(100vw - 32px))',
                maxHeight: 'calc(100dvh - 48px)',
                background: '#ffffff', borderRadius: '28px',
                border: '1px solid rgba(26,43,39,0.08)',
                boxShadow: '0 32px 80px rgba(0,0,0,0.25)',
              }}>
              <div className="p-6">
                <div className="flex items-start justify-between mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest block mb-1"
                      style={{ color: 'rgba(26,43,39,0.3)' }}>주간 진단서</span>
                    <KnockoutWobble
                      text="닥터 푸의 주간 리포트"
                      gradient="linear-gradient(135deg, #1B4332 0%, #2D6A4F 50%, #E8A838 100%)"
                      fontSize="18px" fontWeight={900} wobbleDuration={400}
                    />
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    onClick={() => setReportOpen(false)}
                    className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ml-3"
                    style={{ background: 'rgba(26,43,39,0.06)', color: 'rgba(26,43,39,0.4)' }}>
                    <X size={15} />
                  </motion.button>
                </div>
                {/* 비PRO 회원이면 여기서도 안내 가능하지만 일단은 기본 형태 */}
                {!isPro ? (
                  <div className="text-center py-10">
                    <Lock size={40} className="mx-auto text-amber-500 mb-4" />
                    <p className="font-black text-[#1A2B27] mb-2">PRO 전용 정밀 리포트입니다</p>
                    <p className="text-sm text-gray-500 mb-6">멤버십을 구독하고 전체 내용을 확인하세요.</p>
                    <button onClick={() => navigate('/premium')} className="px-6 py-3 bg-[#1B4332] text-white rounded-xl font-bold">PRO 가입하기</button>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-center mb-6">
                      <div className="relative">
                        <svg width="120" height="120" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="50" fill="none" stroke="rgba(26,43,39,0.06)" strokeWidth="8" />
                          <motion.circle cx="60" cy="60" r="50" fill="none"
                            stroke="#E8A838" strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 50}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 50 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 50 * 0.15 }}
                            transition={{ duration: 1.2, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                            transform="rotate(-90 60 60)" />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="font-black text-3xl" style={{ color: '#E8A838', letterSpacing: '-0.04em' }}>85</span>
                          <span className="text-[10px]" style={{ color: 'rgba(26,43,39,0.4)' }}>쾌변 점수</span>
                        </div>
                      </div>
                    </div>
                    {/* ... (기존 리포트 내용) */}
                    <div className="rounded-2xl p-4 mb-4"
                      style={{ background: 'rgba(27,67,50,0.05)', border: '1px solid rgba(82,183,136,0.18)' }}>
                      <p className="text-xs font-bold mb-3" style={{ color: '#2D6A4F' }}>🤖 AI 인사이트</p>
                      <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(26,43,39,0.7)' }}>
                        성격이 급하신가요? 배변 데이터가 조금 불규칙해요. 다음 주는 조금 더 여유를 가져보세요.
                      </p>
                    </div>
                  </>
                )}
                <div className="flex gap-2.5">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setReportOpen(false)}
                    className="flex-1 py-4 rounded-2xl font-black text-sm"
                    style={{ background: '#1B4332', color: '#fff' }}>
                    닫기
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── 설정 탭 ───────────────────────────────────────────────────────────
function SettingsTab({ user, refreshUser, logout, deleteMe }: { 
  user: UserProfile | null; 
  refreshUser: () => void; 
  logout: () => Promise<void>;
  deleteMe: (password: string) => Promise<void>;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [modalType, setModalType] = useState<'nickname' | 'password' | 'withdraw' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    if (!confirm('로그아웃 하시겠습니까?')) return;
    try {
      await logout();
      navigate('/');
    } catch (err: any) {
      console.error('Logout failed:', err);
      // 에러가 나더라도 클라이언트 상태는 이미 로그아웃 처리되었을 것이므로 메인으로 이동
      navigate('/');
    }
  };

  const handleNicknameChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/profile', { nickname: inputValue });
      alert('닉네임이 변경되었습니다.');
      refreshUser();
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!inputValue.trim()) return;
    setIsSubmitting(true);
    try {
      await api.patch('/auth/password', { password: inputValue });
      alert('비밀번호가 변경되었습니다.');
      setModalType(null);
    } catch (err: any) {
      alert(err.message || '변경에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWithdraw = async () => {
    if (!inputValue.trim()) {
      alert('비밀번호를 입력해주세요.');
      return;
    }
    if (!confirm('정말로 탈퇴하시겠습니까? 관련 데이터가 모두 삭제되며 복구할 수 없습니다.')) return;

    setIsSubmitting(true);
    try {
      await deleteMe(inputValue);
      alert('회원 탈퇴가 완료되었습니다. 그동안 이용해주셔서 감사합니다.');
      setModalType(null);
    } catch (err: any) {
      console.error('회원 탈퇴 에러:', err);

      // 에러 메시지 구분
      if (err.message?.includes('서버 내부 오류')) {
        alert('회원 탈퇴 처리 중 서버 오류가 발생했습니다.\n\n현재 회원 탈퇴 기능에 일시적인 문제가 있습니다.\n백엔드 팀에 문의해주세요.');
      } else if (err.message?.includes('비밀번호')) {
        alert('비밀번호가 일치하지 않습니다. 다시 확인해주세요.');
      } else {
        alert(err.message || '회원 탈퇴 처리에 실패했습니다.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const sections = [
    {
      title: '기본 정보',
      items: [
        { label: '이메일 주소', value: user?.email || '데이터 없음', icon: <Package size={18} />, action: null },
        { label: '현재 닉네임', value: user?.nickname || '데이터 없음', icon: <Activity size={18} />, action: '변경', onClick: () => { setInputValue(user?.nickname || ''); setModalType('nickname'); } },
        { label: '접속 비밀번호', value: '********', icon: <Lock size={18} />, action: '설정', onClick: () => { setInputValue(''); setModalType('password'); } },
      ]
    },
    {
      title: '멤버십 및 계정',
      items: [
        { 
          label: '멤버십 등급', 
          value: user?.role === 'PRO' ? 'PRO 프리미엄 멤버십' : 'FREE 일반 회원', 
          icon: <Trophy size={18} />, 
          action: '관리', 
          onClick: () => {
            if (user?.role !== 'PRO' && user?.role !== 'PREMIUM') {
              navigate('/premium');
            } else {
              alert('현재 멤버십을 이용 중입니다. 관리 기능은 준비 중입니다.');
            }
          } 
        },
        { label: '계정 생성일', value: user?.createdAt ? (user.createdAt as string).split('T')[0] : '-', icon: <Calendar size={18} />, action: null },
      ]
    }
  ];

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-8">
      
      {sections.map((section, idx) => (
        <motion.div key={idx} variants={fadeUp(idx * 0.1)} className="bg-white rounded-[40px] border border-gray-100 shadow-sm overflow-hidden p-4">
          <div className="px-10 pt-10 pb-6">
            <p className="text-xs font-black text-emerald-600 uppercase tracking-[0.25em] mb-2">{section.title}</p>
          </div>
          <div className="px-6 pb-6">
            {section.items.map((item, i) => (
              <div key={i} className="flex items-center justify-between p-6 rounded-3xl hover:bg-gray-50/50 transition-colors">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 shadow-inner">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 mb-1">{item.label}</p>
                    <p className="text-lg font-black text-[#1A2B27] tracking-tight">{item.value}</p>
                  </div>
                </div>
                {item.action && (
                  <motion.button 
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={item.onClick}
                    className="px-6 py-3 rounded-2xl text-sm font-black bg-white border border-gray-200 text-gray-500 hover:text-emerald-600 hover:border-emerald-100 hover:shadow-lg transition-all"
                  >
                    {item.action}
                  </motion.button>
                )}
              </div>
            ))}
          </div>
        </motion.div>
      ))}

      <motion.div variants={fadeUp(0.3)} className="flex flex-col gap-4 mb-20">
        <div className="flex gap-4">
          <motion.button 
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={handleLogout}
            className="flex-[2] py-6 rounded-[32px] bg-white border border-gray-100 text-gray-500 font-black text-lg flex items-center justify-center gap-3 shadow-xl shadow-gray-100/20 hover:bg-gray-50 transition-colors"
          >
            <LogOut size={20} /> 로그아웃 하기
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}
            onClick={() => { setInputValue(''); setModalType('withdraw'); }}
            className="flex-1 py-6 rounded-[32px] bg-red-50 border border-red-100/50 text-red-400 font-bold text-base flex items-center justify-center gap-3 shadow-xl shadow-red-100/20 hover:bg-red-100/30 transition-colors"
          >
            <Trash2 size={18} /> 회원 탈퇴
          </motion.button>
        </div>
        <p className="text-center text-xs text-gray-300 font-black uppercase tracking-[0.3em] py-8">
          DayPoo App Version 2.5.0 (Standard)
        </p>
      </motion.div>

      {/* 모달 */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalType(null)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
            <motion.div initial={{ scale: 0.95, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative w-full max-w-sm bg-white rounded-[40px] p-10 shadow-3xl border border-white">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 ${modalType === 'withdraw' ? 'bg-red-50 text-red-500' : 'bg-emerald-50 text-emerald-600'}`}>
                {modalType === 'nickname' ? <Activity size={28} /> : modalType === 'password' ? <Lock size={28} /> : <Trash2 size={28} />}
              </div>
              <h3 className="text-2xl font-black text-[#1A2B27] mb-2">
                {modalType === 'nickname' ? '새로운 닉네임' : modalType === 'password' ? '비밀번호 재설정' : '계정 삭제'}
              </h3>
              <p className="text-xs font-medium text-gray-400 mb-8 leading-relaxed">
                {modalType === 'nickname' ? '부르고 싶은 멋진 닉네임을 입력해주세요.' : 
                 modalType === 'password' ? '보안을 위해 강력한 비밀번호를 설정하세요.' : 
                 '탈퇴를 진행하시려면 본인 확인을 위해 현재 비밀번호를 입력해주세요.'}
              </p>
              
              <input
                type={modalType === 'nickname' ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={modalType === 'nickname' ? '닉네임 입력' : '비밀번호 입력'}
                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-[20px] mb-8 outline-none focus:border-emerald-500/30 font-black text-lg text-[#1A2B27] placeholder:text-gray-400"
              />
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setModalType(null)} 
                  className="flex-1 py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  취소
                </button>
                <button 
                  onClick={
                    modalType === 'nickname' ? handleNicknameChange : 
                    modalType === 'password' ? handlePasswordChange : 
                    handleWithdraw
                  }
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white font-black rounded-[20px] shadow-xl shadow-emerald-900/20 disabled:opacity-50"
                >
                  {isSubmitting ? '처리 중...' : '확인'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ── MyPage ────────────────────────────────────────────────────────────
export function MyPage({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading, refreshUser, isAuthenticated, logout, deleteMe } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [prevTab, setPrevTab] = useState<TabKey>('home');
  const [avatarItems, setAvatarItems] = useState<AvatarItem[]>(FALLBACK_AVATAR_ITEMS);
  const [titles, setTitles] = useState<any[]>(FALLBACK_TITLES);
  const [equipped, setEquipped] = useState<AvatarItem>(FALLBACK_AVATAR_ITEMS[0]);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await api.get<any[]>('/records');
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    }
  }, []);

  const fetchShopData = useCallback(async () => {
    try {
      const [items, titlesData] = await Promise.all([
        api.get<AvatarItem[]>('/shop/items'),
        api.get<any[]>('/shop/titles').catch(() => FALLBACK_TITLES)
      ]);
      
      if (Array.isArray(items) && items.length > 0) setAvatarItems(items);
      if (Array.isArray(titlesData) && titlesData.length > 0) setTitles(titlesData);
      
      // 장착된 아이템 초기화
      const equip = items?.find(i => i.owned) || FALLBACK_AVATAR_ITEMS[0];
      setEquipped(equip);
    } catch (err) {
      console.warn('Failed to fetch shop data, using fallback:', err);
    }
  }, []);

  useEffect(() => {
    // URL 쿼리 파라미터 확인 (예: /mypage?tab=collection&sub=shop)
    const params = new URLSearchParams(location.search);
    const tabParam = params.get('tab') as TabKey;
    if (tabParam && tabOrder.includes(tabParam)) {
      setActiveTab(tabParam);
    }
  }, [location.search]);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        openAuth('login');
      } else {
        fetchRecords();
        fetchShopData();
      }
    }
  }, [loading, isAuthenticated, navigate, openAuth, fetchRecords, fetchShopData]);

  const tabOrder: TabKey[] = ['home', 'collection', 'report', 'settings'];
  const tabDir = tabOrder.indexOf(activeTab) >= tabOrder.indexOf(prevTab) ? 1 : -1;

  const handleTabChange = (k: TabKey) => { setPrevTab(activeTab); setActiveTab(k); };

  const slideVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -40 : 40 }),
  };

  if (loading) {
    return <MyPageSkeleton />;
  }

  return (
    <div className="min-h-screen" style={{ background: '#f8faf9' }}>
      <Navbar openAuth={openAuth} />
      <HeroBanner equippedItem={equipped} onAvatarClick={() => handleTabChange('home')} user={user} />
      <TabBar active={activeTab} onChange={handleTabChange} />
      <div className="max-w-4xl mx-auto px-6 py-8 pb-20 overflow-hidden">
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div key={activeTab} custom={tabDir} variants={slideVar}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
            {activeTab === 'home'       && (
              <HomeTab 
                equipped={equipped} 
                setEquipped={setEquipped} 
                user={user} 
                avatarItems={avatarItems} 
                initialShopTab={new URLSearchParams(location.search).get('sub') === 'shop' ? 'shop' : 'inventory'}
              />
            )}
            {activeTab === 'collection' && <CollectionTab titles={titles} setTitles={setTitles} />}
            {activeTab === 'report'     && <ReportTab records={records} />}
            {activeTab === 'settings'   && <SettingsTab user={user} refreshUser={refreshUser} logout={logout} deleteMe={deleteMe} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
