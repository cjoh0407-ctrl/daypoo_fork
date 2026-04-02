import { m, useScroll, useTransform, useMotionValueEvent, AnimatePresence } from 'framer-motion';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Bell, User, LogOut, Menu, X, Map, Trophy, HelpCircle, Crown, Home } from 'lucide-react';
import { useState, useEffect } from 'react';
import { AnimatedUnderlink } from './AnimatedUnderlink';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { NotificationPanel } from './NotificationPanel';

const NAV_LINKS = [
  { label: '지도', path: '/map', icon: Map, variant: 0 },
  { label: '랭킹', path: '/ranking', icon: Trophy, variant: 1 },
  { label: 'FAQ', path: '/support', icon: HelpCircle, variant: 0 },
];

export function Navbar({ openAuth }: { openAuth: (mode: 'login' | 'signup') => void }) {
  const { scrollY } = useScroll();
  const scale = useTransform(scrollY, [0, 100], [1, 0.97]);
  const [hidden, setHidden] = useState(false);
  const { user, logout, isAuthenticated } = useAuth();
  const { unreadCount, fetchNotifications } = useNotification();
  const [notifOpen, setNotifOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

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

  // 페이지 이동 시 드로어 닫기
  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  // 드로어 열릴 때 body 스크롤 잠금
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [drawerOpen]);

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
    navigate('/main');
  };

  const handleLogoClick = (e: React.MouseEvent) => {
    if (window.location.pathname.endsWith('/main') || window.location.pathname.endsWith('/')) {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const isActivePath = (path: string) => location.pathname === path;

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
          padding: '0 16px',
          pointerEvents: 'none',
        }}
      >
        <m.nav
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
            padding: '12px 20px 12px 24px',
            boxShadow: '0 12px 48px rgba(0,0,0,0.3)',
            gap: '16px',
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

          {/* 구분선 - 데스크톱 */}
          <div className="hidden md:block" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

          {/* 네비 링크 - 데스크톱 */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }} className="hidden md:flex flex-nowrap">
            {NAV_LINKS.map((link) => (
              <div key={link.path} className="whitespace-nowrap flex-shrink-0">
                <AnimatedUnderlink
                  to={link.path}
                  text={link.label}
                  style={{ fontSize: '15px' }}
                  variant={link.variant}
                />
              </div>
            ))}
          </div>

          {/* 구분선 - 데스크톱 */}
          <div className="hidden md:block" style={{ width: '1px', height: '16px', background: 'rgba(255,255,255,0.15)' }} />

          {/* 우측 — 데스크톱 인증 버튼 */}
          <div className="hidden md:flex" style={{ alignItems: 'center', gap: '12px' }}>
            {isAuthenticated ? (
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
          </div>

          {/* 알림 벨 (로그인 상태에서만 표시) */}
          {isAuthenticated && (
            <m.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => setNotifOpen(!notifOpen)}
              className="relative p-2 rounded-full transition-colors hover:bg-white/10 hidden md:flex items-center justify-center"
              style={{ color: 'rgba(255,255,255,0.6)', background: 'none', border: 'none' }}
              aria-label={unreadCount > 0 ? `알림 (읽지 않은 알림 ${unreadCount}개)` : '알림'}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <m.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: '#E85D5D', border: '1.5px solid #1A2B27' }}
                  aria-hidden="true"
                />
              )}
            </m.button>
          )}

          {/* 햄버거 메뉴 - 모바일 */}
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden flex items-center justify-center p-2 rounded-full transition-colors hover:bg-white/10"
            style={{ color: 'rgba(255,255,255,0.7)', background: 'none', border: 'none' }}
          >
            <Menu size={20} />
          </button>
        </m.nav>
      </div>

      {/* ── 모바일 사이드 드로어 ── */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            {/* 백드롭 */}
            <m.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm md:hidden"
            />

            {/* 드로어 패널 */}
            <m.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              className="fixed top-0 right-0 z-[151] w-[280px] h-full flex flex-col md:hidden"
              style={{
                background: 'linear-gradient(180deg, #1A2B27 0%, #0F1D19 100%)',
                boxShadow: '-8px 0 40px rgba(0,0,0,0.3)',
              }}
            >
              {/* 드로어 헤더 */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <span
                  style={{
                    fontFamily: 'SchoolSafetyNotification, sans-serif',
                    fontSize: '20px',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                >
                  Day<span style={{ color: '#E8A838' }}>.</span>Poo
                </span>
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-white/10"
                  style={{ color: 'rgba(255,255,255,0.5)', background: 'none', border: 'none' }}
                >
                  <X size={20} />
                </button>
              </div>

              {/* 구분선 */}
              <div className="mx-6 h-px bg-white/10" />

              {/* 네비 링크 */}
              <div className="flex-1 overflow-y-auto px-4 py-6 space-y-1">
                <Link
                  to="/main"
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                    isActivePath('/main')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Home size={20} />
                  <span className="text-[15px] font-bold">홈</span>
                </Link>

                {NAV_LINKS.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      onClick={() => setDrawerOpen(false)}
                      className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                        isActivePath(link.path)
                          ? 'bg-white/10 text-white'
                          : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-[15px] font-bold">{link.label}</span>
                      {isActivePath(link.path) && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                      )}
                    </Link>
                  );
                })}

                {isAuthenticated && (
                  <Link
                    to="/mypage"
                    onClick={() => setDrawerOpen(false)}
                    className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                      isActivePath('/mypage')
                        ? 'bg-white/10 text-white'
                        : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                    }`}
                  >
                    <User size={20} />
                    <span className="text-[15px] font-bold">마이페이지</span>
                    {isActivePath('/mypage') && (
                      <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#E8A838]" />
                    )}
                  </Link>
                )}

                <Link
                  to="/premium"
                  onClick={() => setDrawerOpen(false)}
                  className={`flex items-center gap-4 px-4 py-3.5 rounded-2xl transition-all ${
                    isActivePath('/premium')
                      ? 'bg-white/10 text-white'
                      : 'text-white/60 hover:bg-white/5 hover:text-white/80'
                  }`}
                >
                  <Crown size={20} />
                  <span className="text-[15px] font-bold">프리미엄</span>
                </Link>
              </div>

              {/* 하단 인증 영역 */}
              <div className="px-4 pb-8">
                <div className="mx-2 h-px bg-white/10 mb-6" />
                {isAuthenticated ? (
                  <div className="space-y-3">
                    <div className="px-4 py-2">
                      <p className="text-[11px] font-bold text-white/30 uppercase tracking-widest mb-1">로그인 중</p>
                      <p className="text-sm font-bold text-white/80 truncate">{user?.nickname || user?.email}</p>
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-white/40 hover:bg-white/5 hover:text-white/60 transition-all"
                      style={{ background: 'none', border: 'none' }}
                    >
                      <LogOut size={18} />
                      <span className="text-sm font-bold">로그아웃</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => { setDrawerOpen(false); openAuth('login'); }}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.08)',
                        color: 'rgba(255,255,255,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                      }}
                    >
                      로그인
                    </button>
                    <button
                      onClick={() => { setDrawerOpen(false); openAuth('signup'); }}
                      className="w-full py-3 rounded-2xl text-sm font-bold transition-all"
                      style={{
                        background: '#E8A838',
                        color: '#1A2B27',
                        border: 'none',
                      }}
                    >
                      회원가입
                    </button>
                  </div>
                )}
              </div>
            </m.div>
          </>
        )}
      </AnimatePresence>

      <NotificationPanel isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
