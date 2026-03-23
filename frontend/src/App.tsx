import { useState, useCallback } from 'react';
import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { SplashPage } from './pages/SplashPage';
import { MainPage } from './pages/MainPage';
import { MapPage } from './pages/MapPage';
import { RankingPage } from './pages/RankingPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { TransitionProvider } from './context/TransitionContext';
import { AuthModal } from './components/AuthModal';
import { ForgotPage } from './pages/ForgotPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { MyPage } from './pages/MyPage';
import { SupportPage } from './pages/SupportPage';
import { PaymentSuccessPage } from './pages/PaymentSuccessPage';
import { AuthCallback } from './pages/AuthCallback';
import { AdminPage } from './pages/AdminPage';
import { SocialSignupPage } from './pages/SocialSignupPage';
import { AuthProvider } from './context/AuthContext';
import { ErrorBoundary } from './components/ErrorBoundary';

function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#152e22] text-white">
      <h1 className="text-2xl">로그인 페이지 (/login)</h1>
    </div>
  );
}

function App() {
  const [onAuthSuccess, setOnAuthSuccess] = useState<(() => void) | null>(null);
  const [authOpen, setAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  const openAuth = useCallback((mode: 'login' | 'signup', callback?: () => void) => {
    setAuthMode(mode);
    setOnAuthSuccess(() => callback || null);
    setAuthOpen(true);
  }, []);

  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthProvider>
          <TransitionProvider>
            <Routes>
              <Route path="/" element={<SplashPage />} />
              <Route path="/main" element={<MainPage openAuth={openAuth} />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/map" element={<MapPage openAuth={openAuth} />} />
              <Route path="/ranking" element={<RankingPage openAuth={openAuth} />} />
              <Route path="/forgot-password" element={<ForgotPage />} />
              <Route path="/terms" element={<TermsPage />} />
              <Route path="/privacy" element={<PrivacyPage />} />
              <Route path="/mypage" element={<MyPage openAuth={openAuth} />} />
              <Route path="/support" element={<SupportPage openAuth={openAuth} />} />
              <Route path="/auth/callback" element={<AuthCallback />} />
              <Route path="/signup/social" element={<SocialSignupPage />} />
              <Route path="/payment/success" element={<PaymentSuccessPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
            <AuthModal 
              isOpen={authOpen} 
              onClose={() => setAuthOpen(false)} 
              defaultMode={authMode}
              onSuccess={() => {
                if (onAuthSuccess) onAuthSuccess();
                setOnAuthSuccess(null);
              }}
            />
          </TransitionProvider>
        </AuthProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
