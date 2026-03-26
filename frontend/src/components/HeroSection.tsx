import { motion, useAnimation, useInView } from 'framer-motion';
import { useRef, useEffect, useState } from 'react';
import { Activity, MapPin, Sparkles, TrendingUp, Zap } from 'lucide-react';
import WaveButton from './WaveButton';
import { TimelineSteps } from './TimelineSteps';
import { BlobStatsSection } from './BlobStatsSection';
import { WaveDivider } from './WaveDivider';
import { useToilets } from '../hooks/useToilets';

interface HeroSectionProps {
  onCtaClick: () => void;
  openAuth: (mode: 'login' | 'signup') => void;
}

export function HeroSection({ onCtaClick, openAuth }: HeroSectionProps) {
  const controls = useAnimation();
  const ref = useRef(null);
  const inView = useInView(ref);
  
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
    if (inView) controls.start("visible");
  }, [controls, inView]);

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
      <section ref={ref} className="relative min-h-screen flex items-center justify-center bg-[#111E18] overflow-hidden px-8 py-32">
        {/* Dynamic Background Noise */}
        <div className="absolute inset-0 opacity-[0.15] mix-blend-color-dodge pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-emerald-400/20 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-12 gap-16 items-center relative z-20">
          
          {/* Left: Text Content (60%) */}
          <div className="lg:col-span-7 space-y-10 text-left">
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-3 px-4 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 w-max">
                <Zap size={14} className="text-emerald-400" />
                <span className="text-emerald-300 text-[10px] font-black uppercase tracking-widest">실시간 건강 엔진 작동 중</span>
              </div>

              <h1 className="text-6xl lg:text-[100px] font-black leading-[0.9] text-white tracking-tighter">
                건강은 <br />
                <span className="text-emerald-400">데이터</span>로 말합니다.
              </h1>

              <p className="text-lg md:text-2xl text-slate-400 font-medium leading-relaxed max-w-xl">
                단순한 지도가 아닙니다. <br />
                사용자의 기록과 AI 분석이 결합된 <br className="hidden md:block" />
                차세대 라이프스타일 헬스케어 시스템.
              </p>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-6 pt-4"
            >
              <WaveButton onClick={onCtaClick} variant="primary" className="px-10 py-5 text-lg font-bold">
                우리 동네 순위 확인하기
              </WaveButton>
              <WaveButton 
                onClick={() => openAuth('signup')} 
                variant="outline" 
                className="px-10 py-5 text-lg font-bold border-white/40 text-white hover:bg-white/5"
              >
                무료 리포트 받기
              </WaveButton>
            </motion.div>
          </div>

          {/* Right: Functional Widget Block (40%) */}
          <div className="lg:col-span-5 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: 2 }}
              animate={{ opacity: 1, scale: 1, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative p-8 rounded-[40px] bg-slate-900/40 backdrop-blur-3xl border border-white/10 shadow-3xl shadow-emerald-500/5 space-y-8"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-3xl bg-emerald-500/10 border border-emerald-500/10 text-center space-y-2">
                  <div className="text-emerald-400 text-2xl font-black">{stats.todayReports.toLocaleString()}</div>
                  <div className="text-[10px] text-emerald-300/60 font-medium uppercase tracking-widest">오늘의 리포트</div>
                </div>
                <div className="p-4 rounded-3xl bg-slate-800/30 border border-white/5 text-center space-y-2">
                  <div className="text-white text-2xl font-black">{stats.accuracy}%</div>
                  <div className="text-[10px] text-white/40 font-medium uppercase tracking-widest">분석 정확도</div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400 font-medium flex items-center gap-2"><Activity size={12} /> 실시간 데이터 분석</span>
                  <span className="text-emerald-400 font-black animate-pulse">LIVE</span>
                </div>
                <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.random() * 20 + 75}%` }}
                    transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
                    className="h-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.5)]"
                  />
                </div>
                <div className="grid grid-cols-4 gap-2 h-12 overflow-hidden items-end">
                  {[4, 7, 2, 9, 3, 6, 8, 5].map((h, i) => (
                    <motion.div 
                      key={i} 
                      animate={{ height: [`${h*10}%`, `${(h+2)*10}%`, `${h*10}%`] }}
                      transition={{ repeat: Infinity, duration: 1 + i * 0.1 }}
                      className="w-full bg-emerald-400/20 rounded-t-lg"
                    />
                  ))}
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
                  <div className="text-sm font-bold text-white">{locationName}</div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {toiletsLoading ? "갱신 중..." : `현재 가장 깨끗한 화장실 ${toilets.length}곳 발견`}
                  </div>
                </div>
                <TrendingUp size={20} className="text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </motion.div>

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

      <section id="steps-section" className="relative pt-20 pb-32 px-6 overflow-hidden bg-[#F8FAF9]">
        <div className="max-w-5xl mx-auto mb-12">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-3 text-emerald-600">HOW IT WORKS</p>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight">
              3단계로 끝나는 <br />
              <span className="text-emerald-600">스마트 헬스케어</span>
            </h2>
          </motion.div>
          <TimelineSteps openAuth={openAuth} />
        </div>
        
        {/* TimelineSteps -> ReportCard (#eef5f0) */}
        <WaveDivider fill="#eef5f0" />
      </section>
    </>
  );
}
