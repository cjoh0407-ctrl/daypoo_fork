import { useState, useEffect } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { MapPin, X, ShieldCheck, ChevronRight } from 'lucide-react';
import WaveButton from './WaveButton';

export function LocationConsentBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if permission was already handled in this session or granted
    const checkPermission = async () => {
      if (!('geolocation' in navigator)) return;

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' as PermissionName });
        
        // Show banner only if state is 'prompt'
        if (result.state === 'prompt') {
          // Add a small delay for premium feel
          const timer = setTimeout(() => setIsVisible(true), 1500);
          return () => clearTimeout(timer);
        }

        // Listen for changes
        result.onchange = () => {
          if (result.state === 'prompt') setIsVisible(true);
          else setIsVisible(false);
        };
      } catch (e) {
        // Fallback for browsers that don't support permissions.query for geolocation
        const hasPrompted = sessionStorage.getItem('location_prompted');
        if (!hasPrompted) {
          setTimeout(() => setIsVisible(true), 1500);
        }
      }
    };

    checkPermission();
  }, []);

  const handleAccept = () => {
    setIsVisible(false);
    sessionStorage.setItem('location_prompted', 'true');
    // Trigger the native browser permission dialog
    navigator.geolocation.getCurrentPosition(
      () => {
        // Success - permission granted
        console.log('Location access granted');
      },
      (error) => {
        // Error or denied
        console.warn('Location access denied:', error);
      }
    );
  };

  const handleDecline = () => {
    setIsVisible(false);
    sessionStorage.setItem('location_prompted', 'true');
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <m.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-[max(1.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 z-[9999] w-[calc(100%-32px)] max-w-[500px]"
        >
          <div className="relative overflow-hidden rounded-[32px] bg-[#111E18]/90 backdrop-blur-3xl border border-emerald-500/20 shadow-[0_20px_50px_rgba(0,0,0,0.4)] p-6 sm:p-8">
            {/* Ambient Background Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-[40px] rounded-full -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-blue-500/5 blur-[30px] rounded-full -ml-12 -mb-12" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <MapPin size={24} className="animate-pulse" />
                  </div>
                  <div>
                    <h3 className="text-white font-black text-lg tracking-tight">위치 정보 권한 요청</h3>
                    <div className="flex items-center gap-1.5 text-emerald-400/60 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                      <ShieldCheck size={10} />
                      <span>Privacy Guaranteed</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleDecline}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed font-medium">
                현위치를 기반으로 가장 가까운 <span className="text-emerald-400 font-bold">안심 화장실</span>을 찾고,<br className="hidden sm:block" /> 
                AI 건강 분석 리포트를 생성하기 위해 위치 정보가 필요합니다.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 mt-2">
                <WaveButton 
                  onClick={handleAccept}
                  variant="primary" 
                  className="flex-1 py-4 text-sm font-black shadow-lg shadow-emerald-500/20"
                >
                  동의하고 시작하기
                </WaveButton>
                <button 
                  onClick={handleDecline}
                  className="px-6 py-4 rounded-2xl bg-white/5 text-slate-400 text-sm font-bold hover:bg-white/10 hover:text-white transition-all flex items-center justify-center gap-2"
                >
                  다음에 하기
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          </div>
        </m.div>
      )}
    </AnimatePresence>
  );
}
