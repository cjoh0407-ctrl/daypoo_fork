import { motion } from 'framer-motion';
import { useState } from 'react';
import { Siren } from 'lucide-react';

interface EmergencyButtonProps {
  onClick: () => void;
}

export function EmergencyButton({ onClick }: EmergencyButtonProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <motion.button
      // 둥실둥실 — 상시
      animate={{ y: [0, -10, 0] }}
      transition={{
        duration: 2.2,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      // hover glow + scale
      whileHover={{
        scale: 1.1,
        boxShadow: '0 0 12px rgba(232,93,93,0.7), 0 0 28px rgba(232,93,93,0.5), 0 0 52px rgba(232,93,93,0.3)',
      }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      onClick={onClick}
      className="fixed bottom-6 right-6 md:bottom-10 md:right-10 z-[900] flex flex-col items-center gap-0.5"
      style={{
        background: '#E85D5D',
        color: '#fff',
        border: 'none',
        borderRadius: '100px',
        padding: '12px 20px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
      }}
    >
      <motion.span
        animate={hovered ? {
          rotate: [-18, 18, -18, 18, -18]
        } : { rotate: 0 }}
        transition={{
          duration: 0.28,
          repeat: hovered ? 999999 : 0,
          ease: 'easeInOut',
        }}
        style={{ display: 'inline-block' }}
      >
        <Siren size={20} />
      </motion.span>
      급똥
    </motion.button>
  );
}
