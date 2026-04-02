import { useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export const AuthCallback = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const navigatedRef = useRef(false);

  useEffect(() => {
    if (navigatedRef.current) return;
    
    const accessToken = searchParams.get('access_token');
    const refreshToken = searchParams.get('refresh_token');

    if (accessToken) {
      navigatedRef.current = true;
      // 로그인 유지 설정에 따라 저장소 선택
      const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';
      if (stayLoggedIn) {
        const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
        localStorage.setItem('accessToken', accessToken);
        if (refreshToken) localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpiresAt', String(Date.now() + THREE_DAYS_MS));
      } else {
        sessionStorage.setItem('accessToken', accessToken);
        if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);
      }
      
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
    } else if (searchParams.has('access_token') === false) {
      // accessToken이 아예 없는 경우만 에러 처리 (Strict Mode 대비)
      navigatedRef.current = true;
      console.error('인증 토큰을 찾을 수 없습니다.');
      navigate('/main', { replace: true });
    }
  }, [searchParams, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#152e22] text-white">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
        <p className="text-lg">로그인 중입니다. 잠시만 기다려주세요...</p>
      </div>
    </div>
  );
};
