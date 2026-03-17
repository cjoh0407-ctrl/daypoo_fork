import { motion, useInView, useMotionValue, useSpring, AnimatePresence } from 'framer-motion';
import { useEffect, useRef, useState, useCallback } from 'react';
import { MapPin, Zap, Brain, ChevronLeft, ChevronRight } from 'lucide-react';
import { NovaGlow } from './NovaGlow';
import { BlobStatsSection } from './BlobStatsSection';

interface HeroSectionProps {
  onCtaClick: () => void;
}

// ════════════════════════════════════════════════════════════
//  CIRCULAR CAROUSEL (사용되지 않지만 코드는 유지)
// ════════════════════════════════════════════════════════════

const SLIDES = [
  {
    id: 0,
    tag: '🗺 전국 커버리지',
    tagBg: '#e8f3ec',
    tagColor: '#2D6A4F',
    accentColor: '#1B4332',
    bigNumber: '72,000+',
    bigSub: '전국 공중화장실',
    title: '손 안에 전국 지도',
    desc: '공공데이터 기반 7만 개 화장실. 24시간 개방, 접근성 정보까지 실시간으로.',
    bullets: [
      { color: '#2D6A4F', label: '24시간 개방', value: '18,400곳' },
      { color: '#52b788', label: '장애인 접근', value: '31,200곳' },
      { color: '#E8A838', label: '오늘 신규 등록', value: '12곳 🔴' },
    ],
    cardBg: 'linear-gradient(145deg, #ffffff 0%, #f4faf6 100%)',
    border: '#d4e8db',
  },
  {
    id: 1,
    tag: '💩 실시간 활동',
    tagBg: '#fdf3de',
    tagColor: '#b5810f',
    accentColor: '#E8A838',
    bigNumber: '847',
    bigSub: '명이 지금 기록 중',
    title: '전국 어딘가에서 지금 이 순간',
    desc: '지난 1시간 동안 847명이 기록을 남겼어요. 당신의 기록이 다음 사람을 돕습니다.',
    bullets: [
      { color: '#E8A838', label: '오전 기록', value: '3,241건' },
      { color: '#E8A838', label: '오후 기록', value: '5,102건' },
      { color: '#E8A838', label: '저녁 기록', value: '2,889건' },
    ],
    cardBg: 'linear-gradient(145deg, #fffdf5 0%, #fdf8e8 100%)',
    border: '#f0d98a',
  },
  {
    id: 2,
    tag: '✨ AI 건강 분석',
    tagBg: '#fce8e8',
    tagColor: '#c0392b',
    accentColor: '#52b788',
    bigNumber: '89점',
    bigSub: '평균 쾌변 점수',
    title: '기록하면 건강이 보여요',
    desc: '브리스톨 척도 기반 AI가 식습관·수분·스트레스와 연결된 맞춤 인사이트를 줍니다.',
    bullets: [
      { color: '#52b788', label: '장 건강 점수', value: '89/100' },
      { color: '#E8A838', label: '이번 주 쾌변', value: '5회' },
      { color: '#2D6A4F', label: '연속 기록', value: '12일째' },
    ],
    cardBg: 'linear-gradient(145deg, #f6fdf9 0%, #eaf5ef 100%)',
    border: '#b2dfc5',
  },
];

const STEPS = [
  {
    icon: <MapPin size={28} />,
    step: '01',
    title: '가까운 화장실 찾기',
    desc: '전국 7만 개 공용 화장실 데이터를 언제 어디서나 실시간으로 확인하세요.',
    color: '#2D6A4F',
  },
  {
    icon: <Zap size={28} />,
    step: '02',
    title: '다녀와서 인증하기',
    desc: '브리스톨 척도로 30초 만에 기록하고 나만의 건강 데이터를 쌓아보세요.',
    color: '#E8A838',
  },
  {
    icon: <Brain size={28} />,
    step: '03',
    title: 'AI 건강 분석 받기',
    desc: '축적된 데이터를 기반으로 장 건강을 과학적으로 분석해 드립니다.',
    color: '#E85D5D',
  },
];

export function HeroSection({ onCtaClick }: HeroSectionProps) {
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
      {/* 1. HERO + STATS (Unified Background with Glow) */}
      <div className="relative" style={{ backgroundColor: 'var(--bg-light)' }}>
        <NovaGlow />

        <section
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 text-center overflow-hidden"
          style={{ backgroundColor: 'transparent' }}
        >
          <motion.div
            variants={stagger}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true }}
            className="max-w-4xl relative z-10"
          >
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
                  transition={{ duration: 1.5, repeat: Number.POSITIVE_INFINITY }}
                >
                  →
                </motion.span>
              </button>

              <button
                onClick={() =>
                  document.getElementById('steps-section')?.scrollIntoView({ behavior: 'smooth' })
                }
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

            <motion.p
              variants={fadeUp}
              className="mt-4 text-sm"
              style={{ color: 'var(--text-sec)', opacity: 0.6 }}
            >
              로그인 없이도 화장실 찾기 가능 · 기록은 가입 후
            </motion.p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="absolute bottom-10 left-1/2 -translate-x-1/2"
          >
            <motion.div
              animate={{ y: [0, 8, 0] }}
              transition={{ duration: 1.8, repeat: Number.POSITIVE_INFINITY, ease: 'easeInOut' }}
              style={{ color: 'var(--green-mid)', opacity: 0.4 }}
            >
              ↓
            </motion.div>
          </motion.div>
        </section>

        <div className="relative z-10 pb-40">
          <BlobStatsSection />
        </div>

        {/* 하단 페이드 아웃 오버레이 (배경 끊김 방지) */}
        <div 
          className="absolute bottom-0 left-0 right-0 h-64 pointer-events-none z-20"
          style={{
            background: 'linear-gradient(to bottom, transparent, var(--bg-light))'
          }}
        />
      </div>

      {/* 2. HOW IT WORKS (Unified context style, no glow) */}
      <section id="steps-section" className="py-24 px-6" style={{ backgroundColor: 'var(--bg-light)' }}>
        <div className="max-w-5xl mx-auto">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            <div
              className="hidden md:block absolute top-12 left-[calc(16.67%+32px)] right-[calc(16.67%+32px)] h-px"
              style={{
                background:
                  'linear-gradient(90deg, rgba(45,106,79,0.2), rgba(232,168,56,0.3), rgba(232,93,93,0.2))',
              }}
            />
            {STEPS.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 36 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.18, duration: 0.65 }}
                whileHover={{ y: -8, transition: { duration: 0.25 } }}
                className="relative p-8 rounded-[32px] flex flex-col gap-5"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  className="absolute -top-3 -right-3 w-8 h-8 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ backgroundColor: s.color }}
                >
                  {s.step}
                </div>
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center"
                  style={{ backgroundColor: s.color + '18', color: s.color }}
                >
                  {s.icon}
                </div>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
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

      {/* 3. FINAL CTA (Unified Background, no glow) */}
      <section className="pt-24 pb-64 px-6" style={{ backgroundColor: 'var(--bg-light)' }}>
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
          <p className="text-white/60 mb-8 text-lg">지금 가입하면 첫 주 AI 리포트 무료</p>
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
