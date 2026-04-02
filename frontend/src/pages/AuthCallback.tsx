import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (navigatedRef.current) return;

    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken) {
      navigatedRef.current = true;
      const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';

      // AuthContext.login() 호출 → refreshUser() → /auth/me → user 상태 설정
      login(accessToken, refreshToken || '', stayLoggedIn).then(() => {
        // JWT 디코딩하여 어드민 여부 확인
        try {
          const payload = JSON.parse(atob(accessToken.split('.')[1]));
          if (payload.role === 'ROLE_ADMIN') {
            localStorage.removeItem('returnUrl');
            navigate('/admin', { replace: true });
            return;
          }
        } catch {}

        // 일반 유저: 메인 또는 원래 있던 페이지로 이동
        const returnUrl = localStorage.getItem('returnUrl') || '/main';
        localStorage.removeItem('returnUrl');
        navigate(returnUrl, { replace: true });
      });
    } else if (searchParams.has('access_token') === false) {
      navigatedRef.current = true;
      console.error('인증 토큰을 찾을 수 없습니다.');
      navigate('/main', { replace: true });
    }
  }, [searchParams, navigate, login]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#152e22] text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">로그인 중입니다. 잠시만 기다려주세요...</p>
      </div>
    </div>
  );
};
