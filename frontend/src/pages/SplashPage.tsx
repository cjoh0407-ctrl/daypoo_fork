import { AnimatePresence, motion, useMotionValue } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { BlobBackground } from '../components/BlobBackground';
import { CustomCursor } from '../components/CustomCursor';
import { PaintCurtain } from '../components/PaintCurtain';
import { usePaintTransition } from '../hooks/usePaintTransition';

const containerVariants = {
  initial: { opacity: 0, y: 40 },
  animate: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.2, // 각 요소가 등장하는 간격을 늘림
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    y: -80,
    transition: { duration: 0.6, ease: 'easeInOut' as const },
  },
};

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

export function SplashPage() {
  const {
    visible,
    phase,
    transitionTo,
    handleDownComplete,
    handleUpComplete,
  } = usePaintTransition();

  // Initialize mouse motion values
  const mouseX = useMotionValue(
    typeof window !== 'undefined' ? window.innerWidth / 2 : 0
  );
  const mouseY = useMotionValue(
    typeof window !== 'undefined' ? window.innerHeight / 2 : 0
  );

  const handleStart = () => {
    transitionTo('/main'); // 메인 페이지 경로
  };

  return (
    <>
      {/* 커튼 — 최상단 */}
      <PaintCurtain
        isVisible={visible}
        phase={phase}
        onComplete={phase === 'down' ? handleDownComplete : handleUpComplete}
      />

      <div
      className="relative min-h-screen overflow-hidden"
      style={{ background: '#152e22', cursor: 'none' }}
      onMouseMove={(e) => {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }}
    >
      <CustomCursor />
      <BlobBackground/>

      {/* ✅ 콘텐츠 래퍼 — background 제거, 블롭이 비치게 */}
      <div className="relative z-10 flex min-h-screen items-center justify-center text-white">
        
        {/* 기존 Decorative shapes — 블롭이랑 겹치니까 주석 처리 */}
        {/* <div className="pointer-events-none absolute -left-20 -top-20 h-96 w-96 rounded-full bg-amber opacity-40 blur-[80px]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-[500px] w-[500px] rounded-full bg-green-mid opacity-30 blur-[100px]" /> */}

        <AnimatePresence>
          {phase === 'idle' && (
            <motion.div
              className="relative z-10 flex max-w-5xl flex-col items-center px-6 text-center"
              variants={containerVariants}
              initial="initial"
              animate="animate"
              exit="exit"
            >
              <motion.div variants={fadeUp} className="flex justify-center">
                <motion.div
                  initial={{ y: '100%' }}
                  animate={{ y: '0%' }}
                  transition={{ duration: 0.7, ease: 'easeOut' }}
                >
                  <motion.h1
                    className="text-[80px] leading-none text-white drop-shadow-sm md:text-[144px]"
                    style={{
                      fontFamily: 'SchoolSafetyNotification, system-ui',
                      fontWeight: 700,
                    }}
                  >
                    <span>Day</span>
                    <motion.span
                      className="mx-0.5 inline-block text-amber"
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{
                        delay: 0.4,
                        type: 'spring',
                        stiffness: 700,
                        damping: 18,
                      }}
                    >
                      .
                    </motion.span>
                    <span>Poo</span>
                  </motion.h1>
                </motion.div>
              </motion.div>

              <motion.p 
                variants={fadeUp} 
                className="mt-4 text-xl md:text-2xl text-white/70"
              >
                당신의 흔적이 건강이 됩니다
              </motion.p>

              <motion.div
                variants={fadeUp}
                className="mt-6 flex items-center justify-center gap-4 text-base md:text-lg text-white/50"
              >
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
                <span>GUT · HABIT · WELLNESS</span>
                <div className="h-px w-20 bg-gradient-to-r from-transparent via-white/40 to-transparent" />
              </motion.div>

              <motion.div 
                variants={fadeUp} 
                className="mt-8"
              >
                <button
                  type="button"
                  onClick={handleStart}
                  data-magnetic-target="true"
                  className="group relative inline-flex items-center justify-center rounded-full bg-amber px-16 py-5 text-lg md:text-xl font-semibold text-green-deep transition-transform duration-200 hover:-translate-y-0.5 focus:outline-none"
                >
                  <span className="relative z-10">시작하기</span>
                  <span className="absolute inset-0 rounded-full bg-white/20 opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
                </button>
              </motion.div>

              <motion.p
                variants={fadeUp}
                className="mt-5 text-[15px] md:text-base text-white/40"
              >
                계정이 없어도 괜찮아요
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-soft-light">
          <div className="h-full w-full bg-[radial-gradient(circle_at_0_0,#FFFFFF33,transparent_50%),radial-gradient(circle_at_100%_100%,#E8A83822,transparent_55%)]" />
        </div>
      </div>
      </div>
    </>
  );
}

