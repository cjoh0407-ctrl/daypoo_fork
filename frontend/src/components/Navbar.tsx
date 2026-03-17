import { motion, useScroll, useTransform } from 'framer-motion';
import { Link } from 'react-router-dom';

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
          padding: '12px 20px 12px 32px', // 전체적으로 패딩을 늘려 너비 확보
          boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          gap: '20px', // 요소 간 간격을 12px에서 20px로 확대
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
            paddingRight: '2px',
          }}
        >
          Day<span style={{ color: '#E8A838' }}>.</span>Poo
        </Link>

        {/* 구분선 */}
        <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

        {/* 중간 메뉴 (지도, 랭킹) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="hidden md:flex">
          {[
            { label: '지도', path: '/map' },
            { label: '랭킹', path: '/ranking' },
          ].map((link) => (
            <Link
              key={link.path}
              to={link.path}
              style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.7)',
                textDecoration: 'none',
                fontWeight: 500,
                transition: 'color 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = '#fff' }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => { e.currentTarget.style.color = 'rgba(255,255,255,0.7)' }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* 구분선 */}
        <div className="hidden md:block" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

        {/* 우측 메뉴 (로그인, 회원가입) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
          {[
            { label: '로그인', path: '/login' },
            { label: '회원가입', path: '/signup' },
          ].map((action) => (
            <Link
              key={action.path}
              to={action.path}
              style={{
                fontSize: '14px',
                color: 'rgba(255,255,255,0.6)',
                textDecoration: 'none',
                fontWeight: 500,
                padding: '6px 12px',
                borderRadius: '100px',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = '#fff';
                e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              }}
              onMouseLeave={(e: React.MouseEvent<HTMLAnchorElement>) => {
                e.currentTarget.style.color = 'rgba(255,255,255,0.6)';
                e.currentTarget.style.background = 'transparent';
              }}
            >
              {action.label}
            </Link>
          ))}
        </div>
      </motion.nav>
    </div>
  );
}
