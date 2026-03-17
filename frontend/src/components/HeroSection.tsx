import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';
import { MapPin, Zap, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { NovaGlow } from './NovaGlow';

interface HeroSectionProps {
  onCtaClick: () => void;
}

// ── 애니메이션 숫자 카운터 ──────────────────────────────────────────────
function AnimatedCounter({ target, suffix = '' }: { target: number; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 60, damping: 20 });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (inView) motionVal.set(target);
  }, [inView, motionVal, target]);

  useEffect(() => {
    const unsubscribe = spring.on('change', (v) => setDisplay(Math.round(v)));
    return unsubscribe;
  }, [spring]);

  return (
    <span ref={ref}>
      {display.toLocaleString()}
      {suffix}
    </span>
  );
}

// ── 화장실 리뷰 ──────────────────────────────────────────────
const REVIEWS = [
  {
    avatar: '🚽',
    name: '강남역 쾌적러',
    location: '강남역 11번 출구 인근',
    text: '여태까지 가본 공용 화장실 중에 가장 깨끗해요! 앱 덕분에 급한 상황에서 천국을 맛봤습니다.',
    rating: 5,
  },
  {
    avatar: '☕',
    name: '카공족',
    location: '잠실역 인근 카페',
    text: '카메라로 찍은 듯한 상세한 위치 정보 덕분에 헤매지 않고 찾았어요. 청결도 점수가 정확하네요.',
    rating: 4,
  },
  {
    avatar: '✨',
    name: '깔끔이',
    location: '홍대입구역 상가',
    text: '기록 기능으로 화장실 상태를 공유할 수 있어서 좋아요. 서로 돕는 기분이 드네요!',
    rating: 5,
  },
];

// ── 3단계 기능 ────────────────────────────────────────────────────────
const STEPS = [
  {
    icon: <MapPin size={28} />,
    step: '01',
    title: '가까운 화장실 찾기',
    desc: '전국 7만 개 공중화장실 데이터. 24시간 개방 여부, 거리, 접근성을 한눈에.',
    color: '#2D6A4F',
  },
  {
    icon: <Zap size={28} />,
    step: '02',
    title: '다녀와서 인증하기',
    desc: '브리스톨 척도로 간단 기록. 30초면 충분해요. 매일 쌓이는 나만의 데이터.',
    color: '#E8A838',
  },
  {
    icon: <Brain size={28} />,
    step: '03',
    title: 'AI 건강 분석 받기',
    desc: '식습관·수분·스트레스와 연결된 맞춤 인사이트. 장 건강을 과학적으로.',
    color: '#E85D5D',
  },
];

// ── 통계 카드 데이터 ────────────────────────────────────────────────────
const STATS = [
  { value: 72000, suffix: '+', label: '등록 화장실', sublabel: '전국 공공데이터 기반' },
  { value: 31400, suffix: '+', label: '누적 기록', sublabel: '오늘도 쌓이는 중' },
  { value: 89, suffix: '%', label: '쾌변 만족도', sublabel: '평균 점수 89점' },
];

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  const [reviewIdx, setReviewIdx] = useState(0);

  // 자동 슬라이드
  useEffect(() => {
    const t = setInterval(() => setReviewIdx((i) => (i + 1) % REVIEWS.length), 4000);
    return () => clearInterval(t);
  }, []);

  const fadeUp = {
    hidden: { opacity: 0, y: 36 },
    show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
  };

  const stagger = {
    hidden: {},
    show: { transition: { staggerChildren: 0.18 } },
  };

  return (
    <>
      {/* ═══════════════════════════════════════════════
          1. HERO — 메인 카피 + CTA
      ═══════════════════════════════════════════════ */}
      <section
        className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
        style={{ backgroundColor: 'var(--bg-light)' }}
      >
        <NovaGlow />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="max-w-4xl relative z-10"
        >
          {/* 뱃지 */}
          <motion.div variants={fadeUp} className="flex justify-center mb-6">
            <span
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-sm font-semibold"
              style={{
                backgroundColor: 'rgba(45,106,79,0.1)',
                color: 'var(--green-mid)',
                border: '1px solid rgba(45,106,79,0.2)',
                backdropFilter: 'blur(4px)',
              }}
            >
              💩 세상에 없던 배변 건강 지도
            </span>
          </motion.div>

          {/* 메인 카피 */}
          <motion.h1
            variants={fadeUp}
            className="text-[42px] md:text-[84px] font-black leading-[1.05] tracking-tight"
            style={{ color: 'var(--text-main)' }}
          >
            당신의 흔적이 <br />
            <span
              style={{
                color: 'var(--green-deep)',
                background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              건강이 됩니다
            </span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            className="mt-6 text-lg md:text-2xl max-w-2xl mx-auto"
            style={{ color: 'var(--text-sec)', lineHeight: 1.6 }}
          >
            매일의 배변 기록으로 만드는 나만의 건강 지도.
            <br className="hidden md:block" />
            전국 화장실 데이터 + AI 분석이 합쳐졌습니다.
          </motion.p>

          {/* CTA 버튼들 */}
          <motion.div variants={fadeUp} className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={onCtaClick}
              className="group px-10 py-4 text-lg font-bold text-white transition-all hover:scale-105 active:scale-95 shadow-lg flex items-center justify-center gap-2"
              style={{
                backgroundColor: 'var(--green-deep)',
                borderRadius: '100px',
                boxShadow: '0 8px 32px rgba(27,67,50,0.35)',
              }}
            >
              <MapPin size={20} />
              지금 화장실 찾기
              <motion.span
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </button>

            <button
              onClick={() => document.getElementById('steps-section')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-10 py-4 text-lg font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                borderRadius: '100px',
                border: '1.5px solid rgba(27,67,50,0.25)',
                color: 'var(--green-deep)',
                backgroundColor: 'transparent',
              }}
            >
              서비스 둘러보기
            </button>
          </motion.div>

          <motion.p variants={fadeUp} className="mt-4 text-sm" style={{ color: 'var(--text-sec)', opacity: 0.6 }}>
            로그인 없이도 화장실 찾기 가능 · 기록은 가입 후
          </motion.p>
        </motion.div>

        {/* 아래 화살표 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
            style={{ color: 'var(--green-mid)', opacity: 0.4 }}
          >
            ↓
          </motion.div>
        </motion.div>
      </section>

      {/* ═══════════════════════════════════════════════
          2. 실시간 통계 카운터
      ═══════════════════════════════════════════════ */}
      <section
        className="py-16 px-6"
        style={{
          background: 'linear-gradient(180deg, var(--bg-light) 0%, #eef5f0 100%)',
          borderTop: '1px solid rgba(45,106,79,0.08)',
        }}
      >
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-8 text-center">
          {STATS.map((s, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.6 }}
              className="flex flex-col items-center"
            >
              <p
                className="text-4xl md:text-5xl font-black"
                style={{ color: 'var(--green-deep)', letterSpacing: '-0.02em' }}
              >
                <AnimatedCounter target={s.value} suffix={s.suffix} />
              </p>
              <p className="mt-2 text-base font-semibold" style={{ color: 'var(--text-main)' }}>
                {s.label}
              </p>
              <p className="text-sm mt-0.5" style={{ color: 'var(--text-sec)', opacity: 0.6 }}>
                {s.sublabel}
              </p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          3. 3단계 이용 방법
      ═══════════════════════════════════════════════ */}
      <section id="steps-section" className="py-24 px-6" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-5xl mx-auto">
          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--green-mid)' }}
            >
              HOW IT WORKS
            </p>
            <h2
              className="text-3xl md:text-5xl font-black"
              style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
            >
              3단계로 끝나는
              <br />
              <span style={{ color: 'var(--green-deep)' }}>장 건강 관리</span>
            </h2>
          </motion.div>

          {/* 카드들 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
            {/* 연결선 (데스크탑만) */}
            <div
              className="hidden md:block absolute top-12 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px"
              style={{ background: 'linear-gradient(90deg, rgba(45,106,79,0.2), rgba(232,168,56,0.3), rgba(232,93,93,0.2))' }}
            />

            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.18, duration: 0.65 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="relative p-8 rounded-[28px] flex flex-col gap-4"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.05)',
                }}
              >
                {/* 스텝 번호 */}
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.step}
                </div>

                {/* 아이콘 */}
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: s.color + '18', color: s.color }}
                >
                  {s.icon}
                </div>

                <h3
                  className="text-xl font-bold"
                  style={{ color: 'var(--text-main)' }}
                >
                  {s.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-sec)' }}>
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          4. 실시간 후기 슬라이더
      ═══════════════════════════════════════════════ */}
      <section
        className="py-24 px-6"
        style={{
          background: 'linear-gradient(180deg, var(--bg-light) 0%, #eef5f0 100%)',
        }}
      >
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <p
              className="text-xs font-bold uppercase tracking-widest mb-3"
              style={{ color: 'var(--green-mid)' }}
            >
              REAL REVIEWS
            </p>
            <h2
              className="text-3xl md:text-4xl font-black"
              style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
            >
              화장실 리뷰
            </h2>
          </motion.div>

          {/* 슬라이더 카드 */}
          <div className="relative">
            <motion.div
              key={reviewIdx}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.45 }}
              className="p-8 md:p-10 rounded-[28px]"
              style={{
                backgroundColor: 'var(--surface)',
                border: '1px solid var(--border-light)',
                boxShadow: '0 8px 40px rgba(0,0,0,0.07)',
              }}
            >
              <div className="flex items-center gap-4 mb-6">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                  style={{ backgroundColor: 'rgba(45,106,79,0.1)' }}
                >
                  {REVIEWS[reviewIdx].avatar}
                </div>
                <div>
                  <p className="font-bold" style={{ color: 'var(--text-main)' }}>
                    {REVIEWS[reviewIdx].name}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-sec)' }}>
                    📍 {REVIEWS[reviewIdx].location}
                  </p>
                </div>
                <span
                  className="ml-auto text-sm font-semibold px-3 py-1 rounded-full"
                  style={{ backgroundColor: 'rgba(232,168,56,0.12)', color: 'var(--amber)' }}
                >
                  {REVIEWS[reviewIdx].score}
                </span>
              </div>

              <p
                className="text-lg leading-relaxed"
                style={{ color: 'var(--text-main)' }}
              >
                "{REVIEWS[reviewIdx].text}"
              </p>

              {/* 별점 */}
              <div className="mt-5 flex gap-1">
                {[...Array(5)].map((_, i) => (
                  <span key={i} style={{ color: 'var(--amber)' }}>★</span>
                ))}
              </div>
            </motion.div>

            {/* 네비게이션 버튼 */}
            <div className="flex items-center justify-center gap-4 mt-6">
              <button
                onClick={() => setReviewIdx((i) => (i - 1 + REVIEWS.length) % REVIEWS.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ border: '1.5px solid var(--border-light)', color: 'var(--text-sec)' }}
              >
                <ChevronLeft size={18} />
              </button>

              {/* 인디케이터 dots */}
              <div className="flex gap-2">
                {REVIEWS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setReviewIdx(i)}
                    className="rounded-full transition-all duration-300"
                    style={{
                      width: i === reviewIdx ? '24px' : '8px',
                      height: '8px',
                      backgroundColor: i === reviewIdx ? 'var(--green-deep)' : 'rgba(45,106,79,0.2)',
                    }}
                  />
                ))}
              </div>

              <button
                onClick={() => setReviewIdx((i) => (i + 1) % REVIEWS.length)}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all hover:scale-110"
                style={{ border: '1.5px solid var(--border-light)', color: 'var(--text-sec)' }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════
          5. 두 번째 CTA (로그인 유도)
      ═══════════════════════════════════════════════ */}
      <section className="py-24 px-6" style={{ backgroundColor: 'var(--bg-light)' }}>
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="max-w-2xl mx-auto text-center p-12 rounded-[40px]"
          style={{
            background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
            boxShadow: '0 20px 60px rgba(27,67,50,0.3)',
          }}
        >
          <p className="text-5xl mb-4">💩</p>
          <h2 className="text-2xl md:text-3xl font-black text-white mb-3">
            오늘 첫 기록, 3초면 충분해요
          </h2>
          <p className="text-white/60 mb-8 text-lg">
            지금 가입하면 첫 주 AI 리포트 무료
          </p>
          <button
            className="inline-flex items-center gap-2 px-10 py-4 text-lg font-bold rounded-full transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'var(--amber)',
              color: '#1B4332',
              boxShadow: '0 8px 24px rgba(232,168,56,0.4)',
            }}
          >
            3초 만에 시작하기 →
          </button>
          <p className="mt-4 text-white/40 text-sm">소셜 로그인 지원 · 카드 불필요</p>
        </motion.div>
      </section>
    </>
  );
}
