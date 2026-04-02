import { m } from 'framer-motion';
import { useEffect, useState } from 'react';
import { Activity, MapPin, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WaveButton from './WaveButton';
import { useAuth } from '../context/AuthContext';
import { TimelineSteps } from './TimelineSteps';
import { BlobStatsSection } from './BlobStatsSection';
import { WaveDivider } from './WaveDivider';
import { useToilets } from '../hooks/useToilets';

// Data Analysis Pipeline — lane positions (% from top)
const FLOW_LANES = [20, 48, 76];

// Particles flowing through each lane
const FLOW_DOTS = [
  { lane: 0, speed: 3.2, delay: 0,   size: 5 },
  { lane: 1, speed: 2.4, delay: 0.4, size: 7 },
  { lane: 2, speed: 3.6, delay: 0.9, size: 5 },
  { lane: 0, speed: 2.8, delay: 1.6, size: 4 },
  { lane: 1, speed: 2.6, delay: 2.1, size: 6 },
  { lane: 2, speed: 3.0, delay: 2.7, size: 4 },
  { lane: 1, speed: 2.2, delay: 3.4, size: 5 },
];

// Floating status labels
const PIPELINE_LABELS = [
  { text: '기록 수집',  x: '6%',  y: '6%',  delay: 0.3 },
  { text: 'AI 분석 중', x: '42%', y: '84%', delay: 2.0 },
  { text: '패턴 감지',  x: '78%', y: '6%',  delay: 3.8 },
];

interface HeroSectionProps {
  onCtaClick: () => void;
  openAuth: (mode: 'login' | 'signup') => void;
}

export function HeroSection({ onCtaClick, openAuth }: HeroSectionProps) {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Real-time Data States
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationName, setLocationName] = useState('위치 확인 중...');
  const [stats, setStats] = useState({
    todayReports: Math.floor(Math.random() * 500) + 2300, // Fallback base
    accuracy: 98.2,
    totalToilets: 72142
  });

  // Use real toilet hook
  const { toilets, loading: toiletsLoading } = useToilets({
    lat: userLocation?.lat || 37.5666,
    lng: userLocation?.lng || 126.9784,
    radius: 1500
  });

  useEffect(() => {
    // Get Location for Nearby Toilets
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setUserLocation({ lat: latitude, lng: longitude });
        setLocationName("내 주변 지역");
      },
      () => {
        setUserLocation({ lat: 37.5666, lng: 126.9784 });
        setLocationName("서울시 중구");
      }
    );

    // Dynamic stats simulation
    const interval = setInterval(() => {
      setStats(prev => ({
        ...prev,
        todayReports: prev.todayReports + (Math.random() > 0.7 ? 1 : 0)
      }));
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <section className="relative min-h-screen flex items-center justify-center bg-[#111E18] overflow-hidden px-4 sm:px-8 pt-24 pb-16 sm:pt-32 sm:pb-32">
        {/* Dynamic Background Noise */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400/20 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 sm:gap-16 items-center relative z-20">
          
          {/* Left: Text Content (60%) */}
          <div className="lg:col-span-7 space-y-6 sm:space-y-10 text-left">
          <m.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 w-max">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Zap size={11} className="text-emerald-400" />
                <span className="text-emerald-300 text-xs font-semibold uppercase tracking-wider">실시간 건강 엔진 작동 중</span>
              </div>

              <h1 className="text-[1.75rem] sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] text-white tracking-tight">
                건강은 <br />
                <span className="text-emerald-400">데이터</span>로 말합니다.
              </h1>

              <p className="text-sm sm:text-lg text-slate-400 font-normal leading-relaxed max-w-lg">
                단순한 지도가 아닙니다. <br />
                사용자의 기록과 AI 분석이 결합된 <br className="hidden md:block" />
                차세대 라이프스타일 헬스케어 시스템.
              </p>
          </m.div>

          <m.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 pt-4"
            >
              <WaveButton onClick={onCtaClick} variant="primary" className="px-5 py-3 sm:px-7 sm:py-3.5 text-[13px] sm:text-[15px] font-semibold">
                기록하러 가기
              </WaveButton>
              <WaveButton
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/mypage');
                  } else {
                    openAuth('signup');
                  }
                }}
                variant="accent"
                className="px-5 py-3 sm:px-7 sm:py-3.5 text-[13px] sm:text-[15px] font-semibold shadow-lg shadow-amber-500/20"
              >
                무료 리포트 시작하기
              </WaveButton>
          </m.div>
          </div>

          {/* Right: Functional Widget Block (40%) */}
          <div className="lg:col-span-5 relative">
          <m.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative p-4 sm:p-8 rounded-[24px] sm:rounded-[40px] bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-3xl shadow-emerald-500/5 space-y-4 sm:space-y-8"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/10 text-center space-y-1.5">
                  <div className="text-emerald-400 text-xl font-bold tabular-nums">{stats.todayReports.toLocaleString()}</div>
                  <div className="text-[11px] text-emerald-300/60 font-medium uppercase tracking-wider">오늘의 리포트</div>
                </div>
                <div className="p-4 rounded-2xl bg-slate-800/30 border border-white/5 text-center space-y-1.5">
                  <div className="text-white text-xl font-bold tabular-nums">{stats.accuracy}%</div>
                  <div className="text-[11px] text-white/40 font-medium uppercase tracking-wider">분석 정확도</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-2"><Activity size={12} /> 실시간 데이터 분석 엔진</span>
                  <span className="text-emerald-400 font-semibold animate-pulse flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> LIVE
                  </span>
                </div>
                
                {/* Data Analysis Pipeline Visualization */}
                <div
                  className="h-28 w-full relative overflow-hidden rounded-2xl border border-emerald-500/[0.08]"
                  style={{ background: '#060d0a' }}
                >
                  {/* Dot-grid background */}
                  <div
                    className="absolute inset-0 opacity-[0.035] pointer-events-none"
                    style={{ backgroundImage: 'radial-gradient(circle, #34d399 1px, transparent 1px)', backgroundSize: '16px 16px' }}
                  />

                  {/* Data flow lanes */}
                  {FLOW_LANES.map((y, i) => (
                    <div
                      key={i}
                      className="absolute left-0 right-0 h-px"
                      style={{
                        top: `${y}%`,
                        background: 'linear-gradient(to right, transparent 3%, rgba(52,211,153,0.12) 15%, rgba(52,211,153,0.12) 85%, transparent 97%)',
                      }}
                    />
                  ))}

                  {/* Central processing hub */}
                  <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
                    {/* Outer ring pulse */}
                  <m.div
                      className="absolute inset-0 rounded-xl"
                      animate={{
                        scale: [1, 1.8, 1],
                        opacity: [0.3, 0, 0.3],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeOut' }}
                      style={{ background: 'rgba(52,211,153,0.15)', width: 36, height: 36, margin: 'auto', inset: 0, position: 'absolute' }}
                    />
                    {/* Hub body */}
                  <m.div
                      className="relative w-9 h-9 rounded-xl border border-emerald-400/20 flex items-center justify-center"
                      style={{ background: 'radial-gradient(circle, rgba(52,211,153,0.12) 0%, transparent 70%)' }}
                      animate={{
                        borderColor: ['rgba(52,211,153,0.15)', 'rgba(52,211,153,0.45)', 'rgba(52,211,153,0.15)'],
                      }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                    <m.div
                        className="w-2.5 h-2.5 rounded-md bg-emerald-400"
                        animate={{ rotate: [0, 180, 360] }}
                        transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                        style={{ boxShadow: '0 0 10px rgba(52,211,153,0.7), 0 0 20px rgba(52,211,153,0.3)' }}
                      />
                  </m.div>
                  </div>

                  {/* Convergence lines — lanes to hub */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none z-[5]" preserveAspectRatio="none">
                    {FLOW_LANES.map((y, i) => (
                      <line
                        key={i}
                        x1="42%" y1={`${y}%`}
                        x2="50%" y2="50%"
                        stroke="rgba(52,211,153,0.06)"
                        strokeWidth="1"
                        strokeDasharray="3 6"
                      />
                    ))}
                    {FLOW_LANES.map((y, i) => (
                      <line
                        key={`r-${i}`}
                        x1="58%" y1="50%"
                        x2="50%" y2={`${y}%`}
                        stroke="rgba(52,211,153,0.06)"
                        strokeWidth="1"
                        strokeDasharray="3 6"
                        style={{ transform: 'translateX(16%)' }}
                      />
                    ))}
                  </svg>

                  {/* Flowing data particles */}
                  {FLOW_DOTS.map((dot, i) => (
                  <m.div
                      key={i}
                      className="absolute rounded-full z-20"
                      style={{
                        width: dot.size,
                        height: dot.size,
                        top: `${FLOW_LANES[dot.lane]}%`,
                        marginTop: -(dot.size / 2),
                        background: dot.lane === 1
                          ? 'radial-gradient(circle, #a7f3d0 0%, #34d399 50%, transparent 100%)'
                          : 'radial-gradient(circle, #6ee7b7 0%, #10b981 50%, transparent 100%)',
                        boxShadow: dot.lane === 1
                          ? '0 0 8px rgba(52,211,153,0.9), 0 0 16px rgba(52,211,153,0.4)'
                          : '0 0 6px rgba(52,211,153,0.7), 0 0 12px rgba(52,211,153,0.2)',
                      }}
                      animate={{ x: ['-20%', '1100%'] }}
                      transition={{
                        duration: dot.speed,
                        delay: dot.delay,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                    />
                  ))}

                  {/* Floating status labels */}
                  {PIPELINE_LABELS.map((label, i) => (
                    <m.span
                      key={i}
                      className="absolute text-[9px] font-medium tracking-wide text-emerald-400/60 pointer-events-none z-20"
                      style={{ left: label.x, top: label.y }}
                      animate={{ opacity: [0, 0, 0.7, 0.7, 0] }}
                      transition={{ duration: 4.5, delay: label.delay, repeat: Infinity, times: [0, 0.08, 0.2, 0.75, 1] }}
                    >
                      {label.text}
                    </m.span>
                  ))}

                  {/* Edge fade masks */}
                  <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-[#060d0a] to-transparent z-30 pointer-events-none" />
                  <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-[#060d0a] to-transparent z-30 pointer-events-none" />
                </div>
              </div>

              <div 
                onClick={onCtaClick}
                className="flex gap-4 p-4 rounded-3xl bg-slate-800/40 border border-white/5 items-center group cursor-pointer hover:bg-slate-700/60 transition-colors"
              >
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <MapPin size={24} />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold text-white">{locationName}</div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {toiletsLoading ? "갱신 중..." : `현재 가장 깨끗한 화장실 ${toilets.length}곳 발견`}
                  </div>
                </div>
                <TrendingUp size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
          </m.div>

            <div className="absolute -top-10 -right-10 w-40 h-40 bg-blue-500/20 blur-[130px] rounded-full pointer-events-none" />
            <div className="absolute -bottom-20 -left-10 w-80 h-80 bg-emerald-500/20 blur-[150px] rounded-full pointer-events-none" />
          </div>
        </div>
        
        {/* Hero -> TimelineSteps (#F8FAF9) */}
        <WaveDivider fill="#F8FAF9" />
      </section>

      {/* 숨김 처리된 섹션: 게이지바 (BlobStatsSection) */}
      {/* 
      <div className="relative z-10 bg-[#111E18]">
        <BlobStatsSection />
      </div>
      */}

      <section id="steps-section" className="relative pt-12 sm:pt-20 pb-20 sm:pb-32 px-4 sm:px-6 overflow-hidden bg-[#F8FAF9]">
        <div className="max-w-5xl mx-auto mb-12">
          <m.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-semibold uppercase tracking-wider mb-3 text-emerald-600">HOW IT WORKS</p>
            <h2 className="text-2xl sm:text-3xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
              3단계로 끝나는 <br />
              <span className="text-emerald-600">스마트 헬스케어</span>
            </h2>
          </m.div>
          <TimelineSteps openAuth={openAuth} />
        </div>
        
        {/* TimelineSteps -> ReportCard (#eef5f0) */}
        <WaveDivider fill="#eef5f0" />
      </section>
    </>
  );
}
