import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Eye, EyeOff, X, ArrowRight, ArrowLeft,
  Check, AlertCircle, CheckCircle2, ChevronDown
} from 'lucide-react';
import { api } from '../services/apiClient';

// ── 타입 ──────────────────────────────────────────────────────────────
type AuthMode = 'login' | 'signup';

export interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultMode?: AuthMode;
  onSuccess?: () => void;
}

// ── 소셜 아이콘 ───────────────────────────────────────────────────────
function KakaoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 3C6.477 3 2 6.477 2 10.5c0 2.647 1.688 4.97 4.234 6.348L5.25 21l4.477-2.984A11.6 11.6 0 0012 18c5.523 0 10-3.477 10-7.5S17.523 3 12 3z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

// ── 공통 Input ────────────────────────────────────────────────────────
interface InputFieldProps {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  error?: string;
  hint?: string;
  autoComplete?: string;
  rightEl?: React.ReactNode;
  maxLength?: number;
}

function InputField({
  label, type = 'text', value, onChange, placeholder,
  error, hint, autoComplete, rightEl, maxLength,
}: InputFieldProps) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-bold"
        style={{ color: 'rgba(26,43,39,0.5)', letterSpacing: '0.06em' }}>
        {label}
      </label>
      <div className="relative flex items-center rounded-xl transition-all duration-200"
        style={{
          background: focused ? '#fff' : '#f8faf9',
          border: error
            ? '1.5px solid rgba(232,93,93,0.55)'
            : focused
            ? '1.5px solid rgba(232,168,56,0.6)'
            : '1.5px solid rgba(26,43,39,0.08)',
          boxShadow: focused ? '0 0 0 4px rgba(232,168,56,0.08)' : 'none',
        }}>
        <input
          type={type} value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          className="w-full bg-transparent outline-none text-sm font-medium px-4 py-3"
          style={{ color: '#1A2B27', caretColor: '#E8A838' }}
        />
        {rightEl && <div className="pr-3.5 flex-shrink-0">{rightEl}</div>}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="flex items-center gap-1.5 text-xs font-medium" style={{ color: '#E85D5D' }}>
            <AlertCircle size={11} />{error}
          </motion.p>
        )}
        {!error && hint && (
          <p className="text-xs" style={{ color: 'rgba(26,43,39,0.35)' }}>{hint}</p>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── 생년월일 드랍다운 ───────────────────────────────────────────────────
function BirthDropdowns({ 
  year, month, day, 
  onYearChange, onMonthChange, onDayChange 
}: { 
  year: string; month: string; day: string; 
  onYearChange: (v: string) => void; 
  onMonthChange: (v: string) => void; 
  onDayChange: (v: string) => void; 
}) {
  const currentYear = 2026;
  const years = Array.from({ length: currentYear - 1920 + 1 }, (_, i) => currentYear - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  
  const getDaysInMonth = (y: number, m: number) => {
    return new Date(y, m, 0).getDate();
  };

  const daysCount = year && month ? getDaysInMonth(parseInt(year), parseInt(month)) : 31;
  const days = Array.from({ length: daysCount }, (_, i) => i + 1);

  const SelectWrapper = ({ value, onChange, options, placeholder, suffix }: any) => (
    <div className="relative group flex-1">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f8faf9] outline-none text-sm font-medium px-4 py-3.5 rounded-xl appearance-none border border-transparent focus:border-[#E8A838]/60 focus:bg-white transition-all cursor-pointer"
        style={{ color: '#1A2B27' }}
      >
        <option value="" disabled>{placeholder}</option>
        {options.map((opt: any) => <option key={opt} value={opt}>{opt}{suffix}</option>)}
      </select>
      <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-rgba(26,43,39,0.3) transition-colors group-hover:text-[#E8A838]">
        <ChevronDown size={14} />
      </div>
    </div>
  );

  return (
    <div className="flex gap-2 mt-1.5">
      <SelectWrapper 
        value={year} 
        onChange={onYearChange} 
        options={years} 
        placeholder="년" 
        suffix="년" 
      />
      <SelectWrapper 
        value={month} 
        onChange={onMonthChange} 
        options={months} 
        placeholder="월" 
        suffix="월" 
      />
      <SelectWrapper 
        value={day} 
        onChange={onDayChange} 
        options={days} 
        placeholder="일" 
        suffix="일" 
      />
    </div>
  );
}

// ── 비밀번호 강도 ─────────────────────────────────────────────────────
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;
  const checks = [
    { label: '8자+', ok: password.length >= 8 },
    { label: '영문', ok: /[a-zA-Z]/.test(password) },
    { label: '숫자', ok: /[0-9]/.test(password) },
    { label: '특수문자', ok: /[!@#$%^&*]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const col = ['', '#E85D5D', '#E8A838', '#E8A838', '#52b788'][score];
  const lbl = ['', '약함', '보통', '좋음', '강함'][score];
  return (
    <div className="flex flex-col gap-1.5 mt-1.5">
      <div className="flex gap-1">
        {[0,1,2,3].map((i) => (
          <div key={i} className="flex-1 h-0.5 rounded-full transition-all duration-300"
            style={{ background: i < score ? col : 'rgba(26,43,39,0.08)' }} />
        ))}
      </div>
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {checks.map((c) => (
            <span key={c.label} className="flex items-center gap-0.5 text-[10px] font-medium"
              style={{ color: c.ok ? '#2d6a4f' : 'rgba(26,43,39,0.35)' }}>
              <Check size={9} strokeWidth={c.ok ? 3 : 1.5} />{c.label}
            </span>
          ))}
        </div>
        {score > 0 && (
          <span className="text-[10px] font-bold" style={{ color: col }}>{lbl}</span>
        )}
      </div>
    </div>
  );
}

// ── 약관 체크 ─────────────────────────────────────────────────────────
function TermsCheck({ checked, onChange, required, children }:
  { checked: boolean; onChange: (v: boolean) => void; required?: boolean; children: React.ReactNode }) {
  return (
    <button type="button" onClick={() => onChange(!checked)} className="flex items-start gap-3 text-left w-full group">
      <div className="w-5 h-5 rounded-md flex-shrink-0 flex items-center justify-center mt-0.5 transition-all duration-200"
        style={{
          background: checked ? '#E8A838' : '#f8faf9',
          border: checked ? '2px solid #E8A838' : '1.5px solid rgba(26,43,39,0.1)',
        }}>
        {checked && <Check size={11} strokeWidth={3} color="#1B4332" />}
      </div>
      <span className="text-sm leading-relaxed transition-colors group-hover:text-[#1A2B27]" style={{ color: 'rgba(26,43,39,0.6)' }}>
        {children}{required && <span style={{ color: '#E85D5D' }}> *</span>}
      </span>
    </button>
  );
}

// ── 스텝 도트 ─────────────────────────────────────────────────────────
function StepDots({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex items-center gap-1.5 mb-5">
      {Array.from({ length: total }).map((_, i) => (
        <motion.div key={i}
          animate={{
            width: i === step ? '20px' : '6px',
            background: i < step ? '#1B4332' : i === step ? '#E8A838' : 'rgba(26,43,39,0.1)',
          }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          style={{ height: '6px', borderRadius: '3px', flexShrink: 0 }}
        />
      ))}
      <span className="ml-1 text-[10px] font-bold" style={{ color: 'rgba(26,43,39,0.4)' }}>
        {step + 1}/{total}
      </span>
    </div>
  );
}

// ── 로그인 폼 ─────────────────────────────────────────────────────────
function LoginForm({ onSwitch, onSuccess, onClose }: { onSwitch: () => void; onSuccess?: () => void; onClose?: () => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);

  const validate = () => {
    const e: Record<string, string> = {};
    if (!email) e.email = '이메일을 입력해주세요';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아니에요';
    if (!password) e.password = '비밀번호를 입력해주세요';
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        username: email,
        password: password,
      });
      if (res && typeof res === 'object' && res.accessToken) {
        localStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        onSuccess?.();
      } else {
        throw new Error('인증 정보가 올바르지 않습니다.');
      }
    } catch (err: any) {
      setErrors({ email: '이메일 또는 비밀번호가 잘못되었습니다.' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="mb-5">
        <h2 className="font-black text-[#1A2B27] text-xl" style={{ letterSpacing: '-0.03em' }}>
          다시 만나서 반가워요 👋
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,43,39,0.45)' }}>
          계정에 로그인하세요
        </p>
      </div>

      {/* 소셜 */}
      <div className="flex flex-col gap-2 mb-5">
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/oauth2/authorization/kakao'}
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
          style={{ background: '#FEE500', color: '#1a1a1a', border: '1px solid rgba(254,229,0,0.2)' }}>
          <KakaoIcon />카카오로 로그인
        </motion.button>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
          onClick={() => window.location.href = '/oauth2/authorization/google'}
          className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
          style={{ background: '#fff', color: '#555', border: '1.5px solid rgba(26,43,39,0.08)' }}>
          <GoogleIcon />Google로 로그인
        </motion.button>
      </div>

      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
        <span className="text-xs font-medium" style={{ color: 'rgba(26,43,39,0.3)' }}>이메일로 로그인</span>
        <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <motion.div animate={shake && errors.email ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
          <InputField label="이메일" type="email" value={email} onChange={setEmail}
            placeholder="hello@example.com" error={errors.email} autoComplete="email" />
        </motion.div>
        <motion.div animate={shake && errors.password ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
          <InputField label="비밀번호" type={showPw ? 'text' : 'password'}
            value={password} onChange={setPassword}
            placeholder="비밀번호 입력" error={errors.password} autoComplete="current-password"
          rightEl={
            <button type="button" onClick={() => setShowPw(!showPw)}
              style={{ color: 'rgba(26,43,39,0.25)', lineHeight: 0 }}>
              {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          }
        />
        </motion.div>
        <div className="flex justify-end -mt-1">
          <Link 
            to="/forgot-password" 
            title="password reveal" 
            onClick={onClose}
            className="text-xs transition-colors hover:text-[#1A2B27]"
            style={{ color: 'rgba(26,43,39,0.4)', textDecoration: 'none' }}
          >
            이메일, 비밀번호를 잊으셨나요?
          </Link>
        </div>

        <motion.button type="submit" disabled={loading}
          whileHover={!loading ? { scale: 1.02 } : {}}
          whileTap={!loading ? { scale: 0.97 } : {}}
          className="w-full py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 mt-1"
          style={{
            background: loading ? 'rgba(27,67,50,0.4)' : '#1B4332',
            color: '#FFFFFF',
            boxShadow: loading ? 'none' : '0 6px 20px rgba(27,67,50,0.25)',
            cursor: loading ? 'not-allowed' : 'pointer',
          }}>
          {loading
            ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                style={{ display: 'inline-block', fontSize: '16px' }}>💩</motion.span>
            : <>로그인 <ArrowRight size={14} /></>}
        </motion.button>
      </form>

      <p className="text-center mt-5 text-sm" style={{ color: 'rgba(26,43,39,0.4)' }}>
        계정이 없으신가요?{' '}
        <button onClick={onSwitch} className="font-bold transition-colors hover:text-[#2d6a4f]"
          style={{ color: '#1B4332', background: 'none', border: 'none', cursor: 'pointer' }}>
          회원가입
        </button>
      </p>
    </div>
  );
}

// ── 회원가입 폼 ───────────────────────────────────────────────────────
function SignupForm({ onSwitch, onSuccess }: { onSwitch: () => void; onSuccess?: () => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pwConfirm, setPwConfirm] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [showPwC, setShowPwC] = useState(false);

  const [nickname, setNickname] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [birthMonth, setBirthMonth] = useState('');
  const [birthDay, setBirthDay] = useState('');

  const [agreeAll, setAgreeAll] = useState(false);
  const [agreeService, setAgreeService] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [shake, setShake] = useState(false);

  const handleAgreeAll = (v: boolean) => {
    setAgreeAll(v); setAgreeService(v); setAgreePrivacy(v); setAgreeMarketing(v);
  };
  const syncAll = (s: boolean, p: boolean, m: boolean) => setAgreeAll(s && p && m);

  const validateStep = (s: number) => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!email) e.email = '이메일을 입력해주세요';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = '올바른 이메일 형식이 아니에요';
      if (!password) e.password = '비밀번호를 입력해주세요';
      else if (password.length < 8) e.password = '8자 이상 입력해주세요';
      if (password !== pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않아요';
    }
    if (s === 1) {
      if (!nickname.trim()) e.nickname = '닉네임을 입력해주세요';
      else if (nickname.trim().length < 2) e.nickname = '닉네임을 2자 이상 입력해주세요';
      else if (nickname.trim().length > 12) e.nickname = '닉네임은 12자 이하여야 해요';

      if (!birthYear || !birthMonth || !birthDay) {
        e.birth = '생년월일을 모두 선택해주세요';
      }
    }
    if (s === 2) {
      if (!agreeService) e.terms = '서비스 이용약관에 동의해주세요';
      else if (!agreePrivacy) e.terms = '개인정보처리방침에 동의해주세요';
    }
    setErrors(e);
    return !Object.keys(e).length;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep(step)) {
      setShake(true);
      setTimeout(() => setShake(false), 500);
      return;
    }

    // 단계별 서버 측 검증 (중복 체크 등)
    if (step === 0) {
      setLoading(true);
      try {
        await api.get(`/auth/check-username?username=${email}`);
      } catch (err: any) {
        setErrors({ email: err.message || '이미 사용 중인 이메일입니다.' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      } finally {
        setLoading(false);
      }
    } else if (step === 1) {
      setLoading(true);
      try {
        await api.get(`/auth/check-nickname?nickname=${nickname}`);
      } catch (err: any) {
        setErrors({ nickname: err.message || '이미 사용 중인 닉네임입니다.' });
        setShake(true);
        setTimeout(() => setShake(false), 500);
        return;
      } finally {
        setLoading(false);
      }
    }

    if (step < 2) { setDir(1); setStep((s) => s + 1); return; }
    setLoading(true);
    try {
      await api.post('/auth/signup', {
        username: email,
        email: email,      // 이메일 필드 추가됨
        password: password,
        nickname: nickname,
        // birthDate: `${birthYear}-${birthMonth.padStart(2, '0')}-${birthDay.padStart(2, '0')}`, // 백엔드 준비 후 주석 해제
      });
      // 가입 성공 후 자동 로그인 시도
      const res = await api.post('/auth/login', { username: email, password });
      if (res && typeof res === 'object' && res.accessToken) {
        localStorage.setItem('accessToken', res.accessToken);
        if (res.refreshToken) localStorage.setItem('refreshToken', res.refreshToken);
        onSuccess?.();
      } else {
        throw new Error('로그인 정보를 가져올 수 없습니다.');
      }
    } catch (err: any) {
      setErrors({ terms: err.message || '회원가입에 실패했습니다.' });
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setLoading(false);
    }
  };

  const goPrev = () => { setDir(-1); setErrors({}); setStep((s) => s - 1); };

  const slideVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 28 : -28 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -28 : 28 }),
  };

  const stepTitles = ['계정 만들기', '나를 소개해요', '거의 다 됐어요!'];
  const stepDescs = ['소셜 또는 이메일로 가입하세요', '닉네임과 생년월일을 입력해주세요', '약관에 동의하면 시작할 수 있어요'];

  return (
    <div>
      <div className="mb-4">
        <h2 className="font-black text-[#1A2B27] text-xl" style={{ letterSpacing: '-0.03em' }}>
          {stepTitles[step]}
        </h2>
        <p className="text-sm mt-1" style={{ color: 'rgba(26,43,39,0.45)' }}>
          {stepDescs[step]}
        </p>
      </div>

      <StepDots step={step} total={3} />

      {/* 소셜 (step 0만) */}
      {step === 0 && (
        <div className="flex flex-col gap-2 mb-4">
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/oauth2/authorization/kakao'}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
            style={{ background: '#FEE500', color: '#1a1a1a', border: '1px solid rgba(254,229,0,0.2)' }}>
            <KakaoIcon />카카오로 시작하기
          </motion.button>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
            onClick={() => window.location.href = '/oauth2/authorization/google'}
            className="flex items-center justify-center gap-2.5 w-full py-3 rounded-xl text-sm font-bold shadow-sm"
            style={{ background: '#fff', color: '#555', border: '1.5px solid rgba(26,43,39,0.08)' }}>
            <GoogleIcon />Google로 시작하기
          </motion.button>
          <div className="flex items-center gap-3 mt-1">
            <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
            <span className="text-xs font-medium" style={{ color: 'rgba(26,43,39,0.3)' }}>이메일로 가입</span>
            <div className="flex-1 h-px" style={{ background: 'rgba(26,43,39,0.08)' }} />
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <AnimatePresence mode="wait" custom={dir}>
          <motion.div key={step} custom={dir} variants={slideVar}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}>

            {/* ── STEP 0: 계정 정보 ── */}
            {step === 0 && (
              <div className="flex flex-col gap-3">
                <motion.div animate={shake && errors.email ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                  <InputField label="이메일" type="email" value={email} onChange={setEmail}
                    placeholder="hello@example.com" error={errors.email} autoComplete="email" />
                </motion.div>
                <motion.div animate={shake && errors.password ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                  <InputField label="비밀번호" type={showPw ? 'text' : 'password'}
                    value={password} onChange={setPassword} placeholder="8자 이상" error={errors.password}
                    autoComplete="new-password"
                    rightEl={
                      <button type="button" onClick={() => setShowPw(!showPw)}
                        style={{ color: 'rgba(26,43,39,0.25)', lineHeight: 0 }}>
                        {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    }
                  />
                  <PasswordStrength password={password} />
                </motion.div>
                <motion.div animate={shake && errors.pwConfirm ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                  <InputField label="비밀번호 확인" type={showPwC ? 'text' : 'password'}
                  value={pwConfirm} onChange={setPwConfirm}
                  placeholder="비밀번호 재입력" error={errors.pwConfirm} autoComplete="new-password"
                  rightEl={
                    pwConfirm && password === pwConfirm
                      ? <CheckCircle2 size={15} color="#52b788" />
                      : <button type="button" onClick={() => setShowPwC(!showPwC)}
                          style={{ color: 'rgba(26,43,39,0.25)', lineHeight: 0 }}>
                          {showPwC ? <EyeOff size={15} /> : <Eye size={15} />}
                        </button>
                  }
                />
                </motion.div>
              </div>
            )}

            {/* ── STEP 1: 닉네임 + 생년월일 ── */}
            {step === 1 && (
              <div className="flex flex-col gap-4">
                <motion.div animate={shake && errors.nickname ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                  <InputField label="닉네임" value={nickname} onChange={setNickname}
                    placeholder="2~12자" error={errors.nickname} maxLength={12}
                    hint="랭킹과 지도에서 사용돼요"
                  rightEl={
                    <span className="text-xs font-medium" style={{ color: 'rgba(26,43,39,0.3)' }}>
                      {nickname.length}/12
                    </span>
                  }
                />
                {/* 닉네임 미리보기 */}
                <AnimatePresence>
                  {nickname.trim().length >= 2 && (
                    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl"
                      style={{ background: '#f8faf9', border: '1.5px solid rgba(26,43,39,0.06)' }}>
                      <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0"
                        style={{ background: '#fff', border: '2px solid rgba(232,168,56,0.3)', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                        💩
                      </div>
                      <div className="flex-1">
                        <p className="font-black text-[#1A2B27] text-sm">{nickname}</p>
                        <p className="text-[10px] font-bold" style={{ color: 'rgba(26,43,39,0.3)' }}>랭킹 미리보기</p>
                      </div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: 'rgba(82,183,136,0.1)', color: '#52b788' }}>
                        새내기 쾌변러
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>

                </motion.div>

                {/* 생년월일 */}
                <motion.div animate={shake && errors.birth ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                  <label className="text-xs font-bold block mb-1.5"
                    style={{ color: 'rgba(26,43,39,0.5)', letterSpacing: '0.06em' }}>
                    생년월일
                  </label>
                  <div className="flex flex-col">
                    <BirthDropdowns
                      year={birthYear}
                      month={birthMonth}
                      day={birthDay}
                      onYearChange={setBirthYear}
                      onMonthChange={setBirthMonth}
                      onDayChange={setBirthDay}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.birth && (
                      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs mt-1.5" style={{ color: '#E85D5D' }}>
                        <AlertCircle size={11} />{errors.birth}
                      </motion.p>
                    )}
                  </AnimatePresence>
                </motion.div>
              </div>
            )}

            {/* ── STEP 2: 약관 ── */}
            {step === 2 && (
              <motion.div className="flex flex-col gap-3" animate={shake && errors.terms ? { x: [-10, 10, -10, 10, 0] } : {}} transition={{ duration: 0.3 }}>
                <div className="p-3.5 rounded-xl transition-colors hover:bg-amber-50"
                  style={{ background: 'rgba(232,168,56,0.05)', border: '1.5px solid rgba(232,168,56,0.15)' }}>
                  <TermsCheck checked={agreeAll} onChange={handleAgreeAll}>
                    <span className="font-extrabold text-[#1A2B27] text-sm">전체 동의하기</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'rgba(26,43,39,0.4)' }}>
                      선택 항목 포함 모든 약관에 동의합니다
                    </span>
                  </TermsCheck>
                </div>
                <div className="h-px" style={{ background: 'rgba(26,43,39,0.08)', margin: '4px 0' }} />
                <div className="flex flex-col gap-3.5 px-0.5">
                  <TermsCheck checked={agreeService} required
                    onChange={(v) => { setAgreeService(v); syncAll(v, agreePrivacy, agreeMarketing); }}>
                    <span className="font-bold">서비스 이용약관</span>
                    <Link to="/terms" className="ml-1.5 text-[10px] font-bold underline transition-colors hover:text-[#1B4332]"
                      style={{ color: 'rgba(26,43,39,0.3)' }}
                      onClick={(e) => e.stopPropagation()}>보기</Link>
                  </TermsCheck>
                  <TermsCheck checked={agreePrivacy} required
                    onChange={(v) => { setAgreePrivacy(v); syncAll(agreeService, v, agreeMarketing); }}>
                    <span className="font-bold">개인정보처리방침</span>
                    <Link to="/privacy" className="ml-1.5 text-[10px] font-bold underline transition-colors hover:text-[#1B4332]"
                      style={{ color: 'rgba(26,43,39,0.3)' }}
                      onClick={(e) => e.stopPropagation()}>보기</Link>
                  </TermsCheck>
                  <TermsCheck checked={agreeMarketing}
                    onChange={(v) => { setAgreeMarketing(v); syncAll(agreeService, agreePrivacy, v); }}>
                    <span className="font-medium" style={{ color: 'rgba(26,43,39,0.5)' }}>마케팅 정보 수신 동의 (선택)</span>
                    <span className="block text-xs mt-0.5" style={{ color: 'rgba(26,43,39,0.3)' }}>
                      쾌변 팁, 이벤트 소식을 받아볼 수 있어요
                    </span>
                  </TermsCheck>
                </div>
                <AnimatePresence>
                  {errors.terms && (
                    <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                      className="flex items-center gap-1.5 text-xs" style={{ color: '#E85D5D' }}>
                      <AlertCircle size={11} />{errors.terms}
                    </motion.p>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* 하단 버튼 */}
        <div className="flex gap-2 mt-5">
          {step > 0 && (
            <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={goPrev}
              className="flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0 shadow-sm"
              style={{ background: '#fff', border: '1.5px solid rgba(26,43,39,0.08)' }}>
              <ArrowLeft size={16} style={{ color: 'rgba(26,43,39,0.45)' }} />
            </motion.button>
          )}
          <motion.button type="submit" disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="flex-1 py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2"
            style={{
              background: loading ? 'rgba(27,67,50,0.4)' : '#1B4332',
              color: '#FFFFFF',
              boxShadow: loading ? 'none' : '0 6px 20px rgba(27,67,50,0.25)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}>
            {loading
              ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  style={{ display: 'inline-block', fontSize: '16px' }}>💩</motion.span>
              : step < 2
              ? <>다음 <ArrowRight size={14} /></>
              : <>가입 완료하기 ✓</>}
          </motion.button>
        </div>
      </form>

      <p className="text-center mt-4 text-sm" style={{ color: 'rgba(26,43,39,0.4)' }}>
        이미 계정이 있으신가요?{' '}
        <button onClick={onSwitch} className="font-bold transition-colors hover:text-[#2d6a4f]"
          style={{ color: '#1B4332', background: 'none', border: 'none', cursor: 'pointer' }}>
          로그인
        </button>
      </p>
    </div>
  );
}

// ── AuthModal ─────────────────────────────────────────────────────────
export function AuthModal({ isOpen, onClose, defaultMode = 'login', onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<AuthMode>(defaultMode);
  const [modeDir, setModeDir] = useState(1);

  useEffect(() => { setMode(defaultMode); }, [defaultMode]);

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', fn);
    return () => window.removeEventListener('keydown', fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const toSignup = useCallback(() => { setModeDir(1); setMode('signup'); }, []);
  const toLogin = useCallback(() => { setModeDir(-1); setMode('login'); }, []);
  const handleSuccess = useCallback(() => { onSuccess?.(); onClose(); }, [onSuccess, onClose]);

  const modeVar = {
    enter: (d: number) => ({ opacity: 0, x: d > 0 ? 36 : -36 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: d > 0 ? -36 : 36 }),
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 오버레이 */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            onClick={onClose}
            className="fixed inset-0 z-[500]"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(8px)' }}
          />

          {/* 모달 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: 'spring', stiffness: 320, damping: 30 }}
            className="fixed z-[501] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
            style={{
              width: 'min(440px, calc(100vw - 32px))',
              maxHeight: 'calc(100dvh - 48px)',
              overflowY: 'auto',
            }}
          >
            <div className="relative rounded-[28px] p-8"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(26,43,39,0.06)',
                boxShadow: '0 32px 80px rgba(27,67,50,0.15)',
              }}>
              {/* 상단 글로우 (밝은 테마에 맞게 조정) */}
              <div className="absolute top-0 left-0 right-0 h-32 rounded-t-[28px] pointer-events-none overflow-hidden">
                <div style={{
                  position: 'absolute', top: '-60px', left: '50%', transform: 'translateX(-50%)',
                  width: '280px', height: '140px',
                  background: 'radial-gradient(ellipse, rgba(232,168,56,0.08) 0%, transparent 70%)',
                }} />
              </div>

              {/* 로고 + 닫기 */}
              <div className="relative z-10 flex items-center justify-between mb-8">
                <span className="font-black text-[#1A2B27]"
                  style={{ fontSize: '24px', letterSpacing: '-0.04em' }}>
                  Day<span style={{ color: '#E8A838' }}>.</span>Poo
                </span>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }} whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  onClick={onClose}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:bg-black/5"
                  style={{ background: '#f8faf9', color: 'rgba(26,43,39,0.3)', border: '1px solid rgba(26,43,39,0.06)' }}>
                  <X size={16} />
                </motion.button>
              </div>

              {/* 폼 전환 */}
              <div className="relative z-10 overflow-hidden">
                <AnimatePresence mode="wait" custom={modeDir}>
                  <motion.div key={mode} custom={modeDir} variants={modeVar}
                    initial="enter" animate="center" exit="exit"
                    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}>
                    {mode === 'login'
                      ? <LoginForm onSwitch={toSignup} onSuccess={handleSuccess} onClose={onClose} />
                      : <SignupForm onSwitch={toLogin} onSuccess={handleSuccess} />
                    }
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
