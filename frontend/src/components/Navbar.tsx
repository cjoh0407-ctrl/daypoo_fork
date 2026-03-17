import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';
import { AnimatedUnderlink } from './AnimatedUnderlink';

export function Navbar() {
  const { scrollY } = useScroll();

  // 스크롤 내려도 pill은 유지, 살짝 축소되는 효과
  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);

  return (
    <div
      style={{
        position: 'fixed',
        top: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 100,
        width: '100%',
        display: 'flex',
        justifyContent: 'center',
        padding: '0 24px',
        pointerEvents: 'none',
      }}
    >
      <motion.nav
        style={{
          scale,
          pointerEvents: 'auto',
          display: 'flex',
          alignItems: 'center',
          background: '#1A2B27',
          borderRadius: '100px',
          padding: '12px 24px 12px 32px', // 패딩 최적화
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          gap: '24px', // 요소 간 간격 확대
        }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* 좌측 로고 */}
        <Link
          to="/"
          style={{
            fontFamily: 'SchoolSafetyNotification, sans-serif',
            fontSize: '22px',
            color: '#fff',
            textDecoration: 'none',
            letterSpacing: '-0.01em',
            fontWeight: 700,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            paddingRight: '4px',
          }}
        >
          Day<span style={{ color: '#E8A838' }}>.</span>Poo
        </Link>

        {/* 구분선 */}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

        {/* 중간 메뉴 (지도, 랭킹) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }} className="hidden md:flex">
          {[
            { label: '지도', path: '/map', variant: 0 },
            { label: '랭킹', path: '/ranking', variant: 1 },
          ].map((link) => (
            <AnimatedUnderlink
              key={link.path}
              to={link.path}
              text={link.label}
              style={{ fontSize: '15px' }}
              variant={link.variant}
            />
          ))}
        </div>

        {/* 구분선 */}
        <div className="hidden md:block" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

        {/* 우측 메뉴 (로그인, 회원가입) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          {[
            { label: '로그인', path: '/login', variant: 2 },
            { label: '회원가입', path: '/signup', variant: 3 },
          ].map((action) => (
            <AnimatedUnderlink
              key={action.path}
              to={action.path}
              text={action.label}
              style={{ fontSize: '14px' }}
              textColor="rgba(255,255,255,0.6)"
              variant={action.variant}
            />
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
