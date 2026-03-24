import { motion, useScroll, useTransform, useMotionValueEvent } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, User, LogOut } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatedUnderlink } from './AnimatedUnderlink';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { NotificationPanel } from './NotificationPanel';

export function Navbar({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);
  const [hidden, setHidden] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, fetchNotifications } = useNotification();
  const [notifOpen, setNotifOpen] = useState(false);
  const navigate = useNavigate();

  useMotionValueEvent(scrollY, 'change', (latest) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (latest > previous && latest > 150) {
      setHidden(true);
    } else {
      setHidden(false);
    }
  });

  // 초기 알림 데이터 로드
  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications();
    }
  }, [isAuthenticated, fetchNotifications]);

  const handleLogout = () => {
    logout();
    navigate('/main');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname.endsWith('/main') || window.location.pathname.endsWith('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <>
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
          variants={{
            visible: { y: 0, opacity: 1 },
            hidden: { y: -110, opacity: 0 },
          }}
          animate={hidden ? 'hidden' : 'visible'}
          transition={{ duration: 0.35, ease: 'easeInOut' }}
          style={{
            scale,
            pointerEvents: 'auto',
            display: 'flex',
            alignItems: 'center',
            background: '#1A2B27',
            borderRadius: '100px',
            padding: '12px 20px 12px 32px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
            gap: '20px',
          }}
        >
          {/* 로고 */}
          <Link
            to="/main"
            onClick={handleLogoClick}
            style={{
              fontFamily: 'SchoolSafetyNotification, sans-serif',
              fontSize: '22px',
              color: '#fff',
              textDecoration: 'none',
              letterSpacing: '-0.01em',
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            Day<span style={{ color: '#E8A838' }}>.</span>Poo
          </Link>

          {/* 구분선 */}
          <div style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

          {/* 지도, 랭킹 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }} className="hidden md:flex">
            {[
              { label: '지도', path: '/map', variant: 0 },
              { label: '랭킹', path: '/ranking', variant: 1 },
              { label: 'FAQ', path: '/support', variant: 0 },
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

          {/* 우측 — 로그인 상태 분기 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

            {isAuthenticated ? (
              /* 로그인 상태 */
              <>
                <Link
                  to="/mypage"
                  className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.85)' }}
                >
                  <User size={15} />
                  마이페이지
                </Link>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold transition-all hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.4)', background: 'none', border: 'none' }}
                >
                  <LogOut size={13} />
                  로그아웃
                </button>
              </>
            ) : (
              /* 비로그인 상태 */
              <>
                <button
                  onClick={() => openAuth('login')}
                  className="text-sm font-bold transition-all hover:text-white cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}
                >
                  로그인
                </button>
                <button
                  onClick={() => openAuth('signup')}
                  className="text-sm font-bold transition-all hover:text-white cursor-pointer"
                  style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}
                >
                  회원가입
                </button>
              </>
            )}

            {/* 알림 벨 (우측 끝으로 이동 - 로그인 상태에서만 표시) */}
            {isAuthenticated && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setNotifOpen(!notifOpen)}
                className="relative p-2 rounded-full transition-colors hover:bg-white/10"
                style={{ color: 'rgba(255,255,255,0.6)', marginLeft: '4px', background: 'none', border: 'none' }}
                title="알림"
              >
                <Bell size={18} />
                {unreadCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: '#E85D5D', border: '1.5px solid #1A2B27' }}
                  />
                )}
              </motion.button>
            )}
          </div>
        </motion.nav>
      </div>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
