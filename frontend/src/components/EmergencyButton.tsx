import { motion } from 'framer-motion';
import { useState } from 'react';

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
        repeat: 999999, // Infinity 대신 큰 숫자 사용
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
      style={{
        position: 'fixed',
        bottom: '32px',
        right: '28px',
        background: '#E85D5D',
        color: '#fff',
        border: 'none',
        borderRadius: '100px',
        padding: '12px 20px',
        fontSize: '15px',
        fontWeight: 700,
        cursor: 'pointer',
        zIndex: 900,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '2px',
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
        🚨
      </motion.span>
      급똥
    </motion.button>
  );
}
