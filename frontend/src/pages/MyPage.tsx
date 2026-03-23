import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { Navbar } from '../components/Navbar';
import {
  ShoppingBag, Package, Star, TrendingUp, MapPin,
  Settings, ChevronRight, Lock, Check, X,
  Sparkles, Trophy, Calendar, BarChart3, LogOut, Trash2,
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
}

interface AvatarItem {
  id: string; emoji: string; name: string;
  type: '헤드' | '이펙트' | '마커';
  owned: boolean; price?: number;
}

// ── Mock 데이터 ───────────────────────────────────────────────────────
const AVATAR_ITEMS: AvatarItem[] = [
  { id:'i1', emoji:'👑', name:'황금 왕관',   type:'헤드',   owned:true },
  { id:'i2', emoji:'🎩', name:'마법사 모자', type:'헤드',   owned:true },
  { id:'i3', emoji:'✨', name:'황금 오라',   type:'이펙트', owned:true },
  { id:'i4', emoji:'🌟', name:'별빛 오라',   type:'이펙트', owned:false, price:500 },
  { id:'i5', emoji:'🦋', name:'나비 날개',   type:'이펙트', owned:false, price:800 },
  { id:'i6', emoji:'💎', name:'다이아 마커', type:'마커',   owned:false, price:1200 },
];

const TITLES = [
  { id:'t1', label:'전설의 쾌변가', earned:true,  selected:true  },
  { id:'t2', label:'화장실 정복자', earned:true,  selected:false },
  { id:'t3', label:'쾌변 마스터',   earned:true,  selected:false },
  { id:'t4', label:'섬유질왕',      earned:true,  selected:false },
  { id:'t5', label:'7일 연속왕',    earned:false, selected:false },
  { id:'t6', label:'100회 달성',    earned:false, selected:false },
];

const BRISTOL_DATA = [
  { day:'월', type:2, emoji:'🍫', color:'#E8A838' },
  { day:'화', type:3, emoji:'🌽', color:'#52b788' },
  { day:'수', type:4, emoji:'🍌', color:'#52b788' },
  { day:'목', type:4, emoji:'🍌', color:'#52b788' },
  { day:'금', type:5, emoji:'🫘', color:'#E8A838' },
  { day:'토', type:6, emoji:'🌊', color:'#E85D5D' },
  { day:'일', type:4, emoji:'🍌', color:'#52b788' },
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
                <div className="relative z-10 flex items-center justify-center rounded-[32px] transition-all duration-300 group-hover:shadow-2xl"
                  style={{
                    width: '92px', height: '92px', background: '#ffffff',
                    border: '1.5px solid rgba(26,43,39,0.08)', fontSize: '42px',
                    boxShadow: '0 12px 32px rgba(27,67,50,0.08)',
                  }}>
                  {equippedItem?.emoji ?? '💩'}
                </div>
                <div className="absolute -bottom-1 -right-1 z-20 flex items-center justify-center rounded-xl font-black text-[11px] shadow-lg"
                  style={{
                    width: '30px', height: '30px',
                    background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)',
                    color: '#1B4332', border: '3px solid #ffffff',
                  }}>
                  12
                </div>
                <div className="absolute inset-0 -z-10 blur-2xl opacity-40 group-hover:opacity-60 transition-opacity"
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

              <motion.div variants={fadeUp(0.15)} className="flex items-center gap-2 mt-2">
                <div className="relative overflow-hidden rounded-full"
                  style={{ width: '120px', height: '5px', background: 'rgba(26,43,39,0.08)' }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: '68%' }}
                    transition={{ duration: 1.2, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ background: '#E8A838' }} />
                </div>
                <span className="text-[10px] font-semibold" style={{ color: 'rgba(26,43,39,0.4)' }}>
                  Lv.12 · 68%
                </span>
              </motion.div>
            </div>
          </motion.div>

          {/* 우측 통계 */}
          <motion.div variants={stagger} initial="hidden" animate="show"
            className="hidden sm:flex flex-col gap-2 pb-1">
            {[
              { label: '총 인증', value: 247, suffix: '회', color: '#E8A838' },
              { label: '방문 화장실', value: 38, suffix: '곳', color: '#52b788' },
              { label: '연속 기록', value: 12, suffix: '일', color: '#52b788' },
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
  { key: 'home',       label: '홈',     icon: <Sparkles size={15} /> },
  { key: 'collection', label: '컬렉션', icon: <Trophy size={15} /> },
  { key: 'report',     label: '리포트', icon: <BarChart3 size={15} /> },
  { key: 'settings',   label: '설정',   icon: <Settings size={15} /> },
];

function TabBar({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) {
  return (
    <div className="sticky top-20 z-40 flex gap-1 px-4 py-2 mx-auto"
      style={{
        maxWidth: '720px', background: 'transparent',
        backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(26,43,39,0.05)',
      }}>
      {TABS.map((t) => (
        <button key={t.key} onClick={() => onChange(t.key)}
          className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold transition-colors"
          style={{ color: active === t.key ? '#E8A838' : 'rgba(26,43,39,0.35)' }}>
          {active === t.key && (
            <motion.div layoutId="tabHighlight" className="absolute inset-0 rounded-xl"
              style={{ background: 'rgba(232,168,56,0.1)', border: '1px solid rgba(232,168,56,0.2)' }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
          )}
          <span className="relative z-10 flex items-center gap-1.5">{t.icon}{t.label}</span>
        </button>
      ))}
    </div>
  );
}

// ── 홈 탭 ─────────────────────────────────────────────────────────────
function HomeTab({ equipped, setEquipped, user }: { equipped: AvatarItem | null; setEquipped: (i: AvatarItem) => void; user: UserProfile | null }) {
  const [shopTab, setShopTab] = useState<'inventory' | 'shop'>('inventory');
  const [preview, setPreview] = useState<AvatarItem | null>(null);
  const [saved, setSaved] = useState(false);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const items = shopTab === 'inventory'
    ? AVATAR_ITEMS.filter((i) => i.owned)
    : AVATAR_ITEMS.filter((i) => !i.owned);

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
      // 토스페이먼츠 테스트 클라이언트 키
      const tossPayments = await loadTossPayments('test_ck_LlDJaYngroyaax07NxRl3ezGdRpX');
      
      await tossPayments.requestPayment('카드', {
        amount: 5000, // 테스트 기본 금액
        orderId: `POOPMAP_${Math.random().toString(36).substring(2, 11)}`,
        orderName: '포인트 5,000P 충전',
        successUrl: window.location.origin + '/payment/success',
        failUrl: window.location.origin + '/mypage',      });
    } catch (err) {
      console.error('결제 요청 실패:', err);
      alert('결제창을 띄우는 중 오류가 발생했습니다.');
    } finally {
      setShowPaymentModal(false);
    }
  };

  const handleSave = () => {
    if (!preview) return;

    if (preview.owned) {
      // 이미 보유한 경우 착용
      setEquipped(preview);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      setPreview(null);
    } else {
      // TEST: 무조건 결제 모달 띄우기 (포인트와 관계없이)
      setShowPaymentModal(true);
    }
  };

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-5">

      {/* ★ DepthDeck 아이템 섹션 */}
      <motion.div variants={fadeUp(0)} className="rounded-[28px] overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)', boxShadow: '0 2px 16px rgba(26,43,39,0.05)' }}>

        {/* 탭 헤더 */}
        <div className="flex items-center justify-between px-6 pt-6 pb-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
              style={{ color: 'rgba(26,43,39,0.35)' }}>아바타 꾸미기</p>
            <div className="flex items-center gap-2">
              <span className="text-base font-black" style={{ color: '#1A2B27', letterSpacing: '-0.03em' }}>
                {shopTab === 'inventory' ? '보유 아이템' : '상점 아이템'}
              </span>
              {shopTab === 'shop' && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold shadow-sm"
                  style={{ background: 'rgba(232,168,56,0.12)', color: '#E8A838', border: '1px solid rgba(232,168,56,0.2)' }}
                >
                  <Sparkles size={11} /> {(user?.points ?? 0).toLocaleString()}P
                </motion.span>
              )}
            </div>
          </div>
          <div className="flex rounded-2xl p-1"
            style={{ background: 'rgba(26,43,39,0.04)', border: '1px solid rgba(26,43,39,0.07)' }}>
            {(['inventory', 'shop'] as const).map((t) => (
              <button key={t} onClick={() => { setShopTab(t); setPreview(null); }}
                className="relative px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                style={{ color: shopTab === t ? '#1B4332' : 'rgba(26,43,39,0.4)' }}>
                {shopTab === t && (
                  <motion.div layoutId="shopTab" className="absolute inset-0 rounded-xl"
                    style={{ background: '#E8A838' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }} />
                )}
                <span className="relative z-10 flex items-center gap-1.5">
                  {t === 'inventory' ? <><Package size={12} />인벤토리</> : <><ShoppingBag size={12} />상점</>}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ★ DepthDeck 캐러셀 */}
        <div className="px-4 pb-2">
          <AnimatePresence mode="wait">
            <motion.div key={shopTab}
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22 }}>
              {deckCards.length > 0 ? (
                <DepthDeckCarousel
                  cards={deckCards}
                  onSelect={(id) => {
                    const item = items.find((i) => i.id === id);
                    if (item) setPreview(item);
                  }}
                  cardWidth={160}
                  cardHeight={200}
                />
              ) : (
                <div className="flex items-center justify-center h-40 text-sm"
                  style={{ color: 'rgba(26,43,39,0.3)' }}>아이템이 없어요</div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 힌트 */}
        <p className="text-center text-xs py-2" style={{ color: 'rgba(26,43,39,0.3)' }}>
          클릭하거나 드래그해서 아이템을 선택하세요
        </p>

        {/* 저장/구매 버튼 */}
        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              className="flex gap-3 px-6 pb-6 pt-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={() => setPreview(null)}
                className="flex-shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl"
                style={{ background: 'rgba(26,43,39,0.05)', border: '1px solid rgba(26,43,39,0.08)' }}>
                <X size={16} style={{ color: 'rgba(26,43,39,0.4)' }} />
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={handleSave}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm"
                style={{
                  background: preview.owned
                    ? 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)'
                    : 'linear-gradient(135deg, #E85D5D 0%, #c04040 100%)',
                  color: preview.owned ? '#1B4332' : '#fff',
                  boxShadow: `0 4px 16px ${preview.owned ? 'rgba(232,168,56,0.3)' : 'rgba(232,93,93,0.3)'}`,
                }}>
                {saved
                  ? <><Check size={15} /> 저장됨!</>
                  : preview.owned
                  ? <><Check size={15} /> 착용 저장하기</>
                  : <><ShoppingBag size={15} /> {preview.price?.toLocaleString()}P 구매하기</>}
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* 데일리 분석 — 가독성 개선 */}
      <motion.div variants={fadeUp(0.1)} className="rounded-[28px] p-6"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)', boxShadow: '0 2px 16px rgba(26,43,39,0.05)' }}>
        <p className="text-[11px] font-bold uppercase tracking-widest mb-1"
          style={{ color: 'rgba(26,43,39,0.35)' }}>데일리 자동 분석</p>
        <p className="text-base font-black mb-5" style={{ color: '#1A2B27', letterSpacing: '-0.03em' }}>
          오늘의 건강 현황
        </p>
        <div className="grid grid-cols-3 gap-3 mb-5">
          {[
            { label: '오늘 점수', value: 89, suffix: '점', color: '#E8A838' },
            { label: '브리스톨', value: 4,  suffix: '형', color: '#52b788' },
            { label: '연속 기록', value: 12, suffix: '일', color: '#2D6A4F' },
          ].map((s, i) => (
            <motion.div key={s.label}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.07, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center py-4 rounded-2xl"
              style={{ background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
              <span className="font-black text-3xl leading-none" style={{ color: s.color, letterSpacing: '-0.04em' }}>
                <CountUp target={s.value} suffix={s.suffix} />
              </span>
              <span className="text-xs font-semibold mt-2" style={{ color: 'rgba(26,43,39,0.5)' }}>{s.label}</span>
            </motion.div>
          ))}
        </div>
        <div className="flex items-start gap-3 p-4 rounded-2xl"
          style={{ background: 'rgba(232,168,56,0.07)', border: '1px solid rgba(232,168,56,0.18)' }}>
          <Sparkles size={18} style={{ color: '#E8A838', flexShrink: 0, marginTop: '1px' }} />
          <div>
            <p className="text-xs font-black mb-1" style={{ color: '#E8A838' }}>AI 한줄 조언</p>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(26,43,39,0.7)' }}>
              "매운 음식을 줄이면 쾌변 점수 더 올라가요 🌶️ 수분 섭취도 늘려보세요!"
            </p>
          </div>
        </div>
      </motion.div>

      {/* 포인트 부족/결제 안내 모달 */}
      <AnimatePresence>
        {showPaymentModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowPaymentModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] overflow-hidden shadow-2xl p-8 text-center"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBag size={36} className="text-amber-500" />
              </div>
              <h3 className="text-2xl font-black text-[#1B4332] mb-3">포인트가 부족해요!</h3>
              <p className="text-gray-500 font-medium leading-relaxed mb-8">
                아이템을 구매하기 위한 포인트가 부족합니다.<br />
                토스페이로 포인트를 충전하시겠습니까?
              </p>
              <div className="flex flex-col gap-3">
                <button
                  onClick={handleTossPayment}
                  className="w-full py-4 bg-[#1B4332] text-white font-black rounded-2xl shadow-xl hover:scale-[1.02] transition-transform"
                >
                  결제하러 가기
                </button>
                <button
                  onClick={() => setShowPaymentModal(false)}
                  className="w-full py-4 text-gray-400 font-bold hover:bg-gray-50 rounded-2xl transition-colors"
                >
                  나중에 하기
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
function CollectionTab() {
  const [titles, setTitles] = useState(TITLES);
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  const selectTitle = (id: string) =>
    setTitles((prev) => prev.map((t) => ({ ...t, selected: t.id === id && t.earned })));

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
      className="flex flex-col gap-5">

      {/* 통계 카드 — 가독성 개선 */}
      <motion.div variants={fadeUp(0)} className="grid grid-cols-2 gap-3">
        {[
          { label: '총 인증 횟수', value: 247, suffix: '회', icon: <Check size={16} />, color: '#E8A838' },
          { label: '방문한 화장실', value: 38, suffix: '곳', icon: <MapPin size={16} />, color: '#52b788' },
          { label: '획득 칭호', value: 4, suffix: '개', icon: <Trophy size={16} />, color: '#cd7c4a' },
          { label: '연속 기록',  value: 12, suffix: '일', icon: <Calendar size={16} />, color: '#2D6A4F' },
        ].map((s, i) => (
          <motion.div key={s.label}
            initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
            className="flex items-center gap-3 p-5 rounded-[20px]"
            style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)', boxShadow: '0 2px 12px rgba(26,43,39,0.04)' }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: `${s.color}15`, color: s.color }}>
              {s.icon}
            </div>
            <div>
              <p className="font-black text-2xl leading-none" style={{ color: s.color, letterSpacing: '-0.04em' }}>
                <CountUp target={s.value} suffix={s.suffix} />
              </p>
              <p className="text-xs font-semibold mt-1" style={{ color: 'rgba(26,43,39,0.4)' }}>{s.label}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ★ DepthDeck 칭호 도감 */}
      <motion.div variants={fadeUp(0.12)} className="rounded-[28px] overflow-hidden"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)', boxShadow: '0 2px 16px rgba(26,43,39,0.05)' }}>
        <div className="px-6 pt-6 pb-4">
          <p className="text-[11px] font-bold uppercase tracking-widest mb-0.5"
            style={{ color: 'rgba(26,43,39,0.35)' }}>칭호 도감</p>
          <p className="text-base font-black" style={{ color: '#1A2B27', letterSpacing: '-0.03em' }}>
            내 칭호 컬렉션
          </p>
        </div>

        <div className="px-4 pb-4">
          <DepthDeckCarousel
            cards={titleCards}
            onSelect={(id) => {
              const t = titles.find((x) => x.id === id);
              if (t?.earned) selectTitle(id);
            }}
            cardWidth={160}
            cardHeight={200}
          />
        </div>

        <p className="text-center text-xs pb-4" style={{ color: 'rgba(26,43,39,0.3)' }}>
          획득한 칭호를 클릭해서 닉네임에 표시하세요
        </p>
      </motion.div>
    </motion.div>
  );
}

// ── 리포트 탭 ─────────────────────────────────────────────────────────
function ReportTab({ records = [] }: { records?: any[] }) {
  const [reportOpen, setReportOpen] = useState(false);
  
  // 실제 기록이 있으면 그 중 최근 7일을 추출하거나, 없으면 Mock 사용
  const displayData = records.length > 0 
    ? records.slice(-7).map((r, i) => ({
        day: ['월','화','수','목','금','토','일'][new Date(r.createdAt).getDay()],
        type: r.bristolType,
        emoji: ['🍫','🌽','🍌','🍌','🫘','🌊','🔥'][r.bristolType - 1] || '💩',
        color: r.bristolType >= 3 && r.bristolType <= 5 ? '#52b788' : '#E8A838'
      }))
    : BRISTOL_DATA;

  const completedDays = records.length > 0 ? records.length : 5;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-4">

      <motion.div variants={fadeUp(0)} className="rounded-[24px] p-5 mb-1"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'rgba(26,43,39,0.3)' }}>
              {records.length > 0 ? '전체 기록 분석' : '7일 정밀 분석'}
            </p>
            <p className="text-sm font-black text-[#1A2B27]" style={{ letterSpacing: '-0.02em' }}>
              닥터 푸의 주간 진단서
            </p>
          </div>
          <span className="text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)' }}>
            {completedDays}회 기록됨
          </span>
        </div>
        <div className="flex gap-1.5 mb-4">
          {['월','화','수','목','금','토','일'].map((d, i) => {
            const hasRecord = displayData.some(rd => rd.day === d);
            return (
              <motion.div key={d}
                initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
                transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 300, damping: 24 }}
                style={{ transformOrigin: 'bottom', flex: 1 }}>
                <div className="flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-bold"
                  style={{
                    background: hasRecord ? 'rgba(82,183,136,0.12)' : 'rgba(26,43,39,0.04)',
                    border: `1px solid ${hasRecord ? 'rgba(82,183,136,0.25)' : 'rgba(26,43,39,0.06)'}`,
                    color: hasRecord ? '#52b788' : 'rgba(26,43,39,0.2)',
                  }}>
                  {hasRecord ? '✓' : '·'}
                  <span>{d}</span>
                </div>
              </motion.div>
            );
          })}
        </div>
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={() => setReportOpen(true)}
          className="w-full py-3.5 rounded-2xl font-black text-sm flex items-center justify-center gap-2"
          style={{ background: 'transparent', color: '#1B4332', border: '1.5px solid rgba(27,67,50,0.15)' }}>
          <BarChart3 size={16} />📋 주간 진단서 열기
        </motion.button>
      </motion.div>

      <motion.div variants={fadeUp(0.1)} className="rounded-[24px] p-5"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest mb-4" style={{ color: 'rgba(26,43,39,0.3)' }}>
          기록 통계
        </p>
        <div className="flex gap-2">
          {displayData.map((d, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.07, type: 'spring', stiffness: 260, damping: 22 }}
              className="flex-1 flex flex-col items-center gap-1.5 py-3 rounded-2xl"
              style={{ background: 'rgba(26,43,39,0.04)', border: '1px solid rgba(26,43,39,0.06)' }}>
              <span style={{ fontSize: '18px' }}>{d.emoji}</span>
              <span className="text-[10px]" style={{ color: 'rgba(26,43,39,0.3)' }}>{d.day}</span>
              <span className="text-[11px] font-black" style={{ color: d.color }}>{d.type}형</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* 진단서 모달 */}
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
                    {/* ★ 모달 타이틀도 KnockoutWobble */}
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
                <p className="text-[10px] font-bold uppercase tracking-widest mb-3"
                  style={{ color: 'rgba(26,43,39,0.3)' }}>7일 브리스톨 척도</p>
                <div className="flex gap-2 mb-5">
                  {BRISTOL_DATA.map((d, i) => (
                    <motion.div key={d.day}
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.06 }}
                      className="flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl"
                      style={{ background: 'rgba(26,43,39,0.04)', border: '1px solid rgba(26,43,39,0.06)' }}>
                      <span style={{ fontSize: '16px' }}>{d.emoji}</span>
                      <span className="text-[9px]" style={{ color: 'rgba(26,43,39,0.3)' }}>{d.day}</span>
                      <span className="text-[10px] font-black" style={{ color: d.color }}>{d.type}형</span>
                    </motion.div>
                  ))}
                </div>
                <div className="rounded-2xl p-4 mb-4"
                  style={{ background: 'rgba(27,67,50,0.05)', border: '1px solid rgba(82,183,136,0.18)' }}>
                  <p className="text-xs font-bold mb-3" style={{ color: '#2D6A4F' }}>🤖 AI 인사이트</p>
                  <p className="text-sm leading-relaxed mb-3" style={{ color: 'rgba(26,43,39,0.7)' }}>
                    🌶️ 매운 음식을 드신 다음 날은 항상 묽은 변이 관찰돼요. 장이 조금 예민한 편이시군요!
                  </p>
                  <div className="rounded-xl p-3"
                    style={{ background: 'rgba(232,168,56,0.07)', border: '1px solid rgba(232,168,56,0.15)' }}>
                    <p className="text-[10px] font-bold mb-1" style={{ color: '#E8A838' }}>💡 솔루션</p>
                    <p className="text-xs" style={{ color: 'rgba(26,43,39,0.6)' }}>
                      내일부터는 따뜻한 차를 한 잔 마셔보는 게 어떨까요?
                    </p>
                  </div>
                </div>
                <div className="flex gap-2.5">
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    className="flex-1 py-3 rounded-2xl font-bold text-sm"
                    style={{ background: 'rgba(26,43,39,0.05)', border: '1px solid rgba(26,43,39,0.08)', color: 'rgba(26,43,39,0.55)' }}>
                    📸 이미지 저장
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                    onClick={() => setReportOpen(false)}
                    className="flex-1 py-3 rounded-2xl font-black text-sm"
                    style={{ background: 'linear-gradient(135deg, #E8A838 0%, #d4922a 100%)', color: '#1B4332', boxShadow: '0 4px 16px rgba(232,168,56,0.28)' }}>
                    확인 완료 ✓
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
function SettingsTab({ user, refreshUser, logout }: { user: UserProfile | null; refreshUser: () => void, logout: () => void }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [modalType, setModalType] = useState<'nickname' | 'password' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const rows = [
    { label: '이메일',   value: user?.email || '데이터 없음', action: null },
    { label: '닉네임',   value: user?.nickname  || '데이터 없음', action: '변경', onClick: () => { setInputValue(user?.nickname || ''); setModalType('nickname'); } },
    { label: '비밀번호', value: '********', action: '변경', onClick: () => { setInputValue(''); setModalType('password'); } },
    { label: '가입일',   value: user?.createdAt ? (user.createdAt as string).split('T')[0] : '-', action: null },
  ];

  return (
    <motion.div ref={ref} variants={stagger} initial="hidden" animate={inView ? 'show' : 'hidden'}
      className="flex flex-col gap-4">
      <motion.div variants={fadeUp(0)} className="rounded-[24px] p-5 mb-1"
        style={{ background: '#ffffff', border: '1px solid rgba(26,43,39,0.08)' }}>
        <p className="text-xs font-bold uppercase tracking-widest px-5 pt-5 pb-3"
          style={{ color: 'rgba(26,43,39,0.3)' }}>회원 정보</p>
        <div className="px-5 pb-2">
          {rows.map((r, i) => (
            <motion.div key={r.label}
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.07, duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="flex items-center justify-between py-3.5"
              style={{ borderBottom: i < rows.length - 1 ? '1px solid rgba(26,43,39,0.05)' : 'none' }}>
              <span className="text-sm" style={{ color: 'rgba(26,43,39,0.4)' }}>{r.label}</span>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold text-[#1A2B27]">{r.value}</span>
                {r.action && (
                  <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                    onClick={r.onClick}
                    className="text-xs font-bold px-2.5 py-1 rounded-lg"
                    style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788', border: '1px solid rgba(82,183,136,0.2)' }}>
                    {r.action}
                  </motion.button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp(0.18)} className="flex gap-2.5">
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
          onClick={logout}
          className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
          style={{ background: 'rgba(232,93,93,0.08)', border: '1px solid rgba(232,93,93,0.2)', color: '#E85D5D' }}>
          <LogOut size={15} /> 로그아웃
        </motion.button>
      </motion.div>

      {/* 단순 모달 구현 (실제론 더 예쁘게 가능하지만 핵심 로직 위주) */}
      <AnimatePresence>
        {modalType && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setModalType(null)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-sm bg-white rounded-[32px] p-8 shadow-2xl border border-gray-100">
              <h3 className="text-xl font-black text-[#1A2B27] mb-6">
                {modalType === 'nickname' ? '닉네임 변경' : '비밀번호 변경'}
              </h3>
              <input 
                type={modalType === 'nickname' ? 'text' : 'password'}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder={modalType === 'nickname' ? '새 닉네임 입력' : '새 비밀번호 입력'}
                className="w-full p-4 bg-gray-50 border border-gray-100 rounded-2xl mb-6 outline-none focus:border-emerald-500/30 font-semibold"
              />
              <div className="flex gap-3">
                <button onClick={() => setModalType(null)} className="flex-1 py-3 text-gray-400 font-bold">취소</button>
                <button 
                  onClick={modalType === 'nickname' ? handleNicknameChange : handlePasswordChange}
                  disabled={isSubmitting}
                  className="flex-1 py-3 bg-[#1B4332] text-white font-black rounded-xl shadow-lg shadow-emerald-900/20"
                >
                  {isSubmitting ? '처리 중...' : '변경하기'}
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
  const { user, loading, refreshUser, isAuthenticated, logout } = useAuth();
  const [records, setRecords] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<TabKey>('home');
  const [prevTab, setPrevTab] = useState<TabKey>('home');
  const [equipped, setEquipped] = useState<AvatarItem>(AVATAR_ITEMS[0]);

  const fetchRecords = useCallback(async () => {
    try {
      const data = await api.get('/records');
      setRecords(data);
    } catch (err) {
      console.error('Failed to fetch records', err);
    }
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!isAuthenticated) {
        openAuth('login');
      } else {
        fetchRecords();
      }
    }
  }, [loading, isAuthenticated, navigate, openAuth, fetchRecords]);

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
      <div className="max-w-3xl mx-auto px-4 py-6 pb-16 overflow-hidden">
        <AnimatePresence mode="wait" custom={tabDir}>
          <motion.div key={activeTab} custom={tabDir} variants={slideVar}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}>
            {activeTab === 'home'       && <HomeTab equipped={equipped} setEquipped={setEquipped} user={user} />}
            {activeTab === 'collection' && <CollectionTab />}
            {activeTab === 'report'     && <ReportTab records={records} />}
            {activeTab === 'settings'   && <SettingsTab user={user} refreshUser={refreshUser} logout={logout} />}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
