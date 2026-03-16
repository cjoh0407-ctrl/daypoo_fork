import { motion } from 'framer-motion';

interface EmergencyButtonProps {
  onClick: () => void;
}

const wiggleTransition = {
  rotate: [0, -10, 10, -10, 10, 0],
  transition: {
    duration: 0.5,
    repeat: Infinity,
    repeatDelay: 2
  }
};

export function EmergencyButton({ onClick }: EmergencyButtonProps) {
  return (
    <motion.div
      className="fixed bottom-8 right-8 z-[900]"
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 1, type: 'spring' }}
    >
      <motion.button
        onClick={onClick}
        whileHover={{ scale: 1.08 }}
        animate={wiggleTransition}
        className="flex items-center gap-3 px-8 py-4 shadow-2xl text-white font-bold text-lg md:text-xl transition-all"
        style={{ 
          backgroundColor: 'var(--coral)', 
          borderRadius: '100px',
        }}
      >
        <span className="text-2xl">🚨</span>
        급똥
      </motion.button>
    </motion.div>
  );
}
