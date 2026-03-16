import { motion } from 'framer-motion';

interface HeroSectionProps {
  onCtaClick: () => void;
}

export function HeroSection({ onCtaClick }: HeroSectionProps) {
  const fadeUp = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: 'easeOut' }
  };

  return (
    <section 
      className="relative min-h-screen flex flex-col items-center justify-center px-6 text-center"
      style={{ backgroundColor: 'var(--bg-light)' }}
    >
      <motion.div
        initial="initial"
        whileInView="whileInView"
        viewport={{ once: true }}
        transition={{ staggerChildren: 0.2 }}
        className="max-w-4xl"
      >
        <motion.h1 
          variants={fadeUp}
          className="text-[42px] md:text-[80px] font-bold leading-[1.1] whitespace-pre-line"
          style={{ color: 'var(--text-main)' }}
        >
          당신의 흔적이{"\n"}
          <span style={{ color: 'var(--green-deep)' }}>건강이 됩니다</span>
        </motion.h1>

        <motion.p 
          variants={fadeUp}
          className="mt-6 text-lg md:text-2xl"
          style={{ color: 'var(--text-sec)' }}
        >
          매일의 배변 기록으로 만드는 나만의 건강 지도
        </motion.p>

        <motion.div 
          variants={fadeUp}
          className="mt-12"
        >
          <button
            onClick={onCtaClick}
            className="px-10 py-4 text-lg md:text-xl font-semibold text-white transition-transform hover:scale-105 active:scale-95 shadow-lg"
            style={{ 
              backgroundColor: 'var(--green-deep)',
              borderRadius: '100px'
            }}
          >
            지도 보러가기
          </button>
        </motion.div>
      </motion.div>

      {/* Decorative Element */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1, duration: 1 }}
        className="absolute bottom-12 left-1/2 -translate-x-1/2"
      >
        <div className="w-px h-16 bg-gradient-to-b from-green-deep/50 to-transparent" />
      </motion.div>
    </section>
  );
}
