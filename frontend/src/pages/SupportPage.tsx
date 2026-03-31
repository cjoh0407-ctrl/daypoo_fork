import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import type React from 'react';
import {
  motion,
  AnimatePresence,
  useInView,
  useMotionValue,
  useSpring,
} from 'framer-motion';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';
import { WaveDivider } from '../components/WaveDivider';
import { api } from '../services/apiClient';
import {
  Search,
  ChevronDown,
  Plus,
  MessageSquare,
  Clock,
  CheckCircle,
  Send,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  LifeBuoy,
  User,
  FileText,
  AlertCircle,
  Hash,
  ArrowRight,
  Filter,
} from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────────────
type SupportTab = 'faq' | 'inquiry' | 'myinquiry';
type FaqCategory = '전체' | '건강/AI분석' | '이용방법' | '결제/아바타' | '계정/보안';
type InquiryStatus = '답변 대기' | '답변 완료';
type InquiryCategory = '결제/아이템 문의' | '건강 분석 오류' | '기타';

interface FaqItem {
  id: string;
  category: Exclude<FaqCategory, '전체'>;
  q: string;
  a: string;
  num: string;
}

interface Inquiry {
  id: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  createdAt: string;
  answer?: string;
}

// ── 데이터 (Fallback용) ──────────────────────────────────────────────────
const FALLBACK_FAQ: FaqItem[] = [
  {
    id: 'f1',
    num: '01',
    category: '건강/AI분석',
    q: 'AI 건강 분석 결과는 의학적으로 정확한가요?',
    a: '본 서비스의 AI 분석은 사용자가 입력한 데이터를 바탕으로 한 일반적인 가이드일 뿐, 전문적인 의학적 진단을 대신할 수 없습니다.',
  },
  {
    id: 'f2',
    num: '02',
    category: '건강/AI분석',
    q: '브리스톨 척도란 무엇인가요?',
    a: '브리스톨 척도는 대변의 형태를 7가지 유형으로 분류한 기준입니다. Day.Poo는 이를 기반으로 장 건강을 시각화합니다.',
  },
  {
    id: 'f3',
    num: '03',
    category: '이용방법',
    q: '화장실 정보가 최신화되나요?',
    a: '공공데이터 API와 자동으로 동기화되어 이름, 주소, 개방시간 등이 항상 최신 상태로 유지됩니다.',
  },
  {
    id: 'f4',
    num: '04',
    category: '이용방법',
    q: '방문 인증은 어떻게 하나요?',
    a: "지도에서 화장실 선택 후 '방문 인증하기' 버튼을 통해 상태와 색상을 기록하면 💩 마커로 변합니다.",
  },
  {
    id: 'f5',
    num: '05',
    category: '결제/아바타',
    q: '획득한 칭호는 어디서 확인하나요?',
    a: "마이페이지의 '컬렉션' 탭에서 칭호를 관리하고 장착할 수 있습니다.",
  },
  {
    id: 'f6',
    num: '06',
    category: '결제/아바타',
    q: '환불 정책이 궁금해요.',
    a: '디지털 아이템은 사용 전 7일 이내 환불 가능하며, 시스템 오류로 인한 미지급은 1:1 문의로 해결해 드립니다.',
  },
];

const CATEGORIES: FaqCategory[] = ['전체', '건강/AI분석', '이용방법', '결제/아바타', '계정/보안'];

// ── 애니메이션 베리언츠 ───────────────────────────────────────
const cardVariants = {
  initial: { opacity: 0, y: 15, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: 'spring' as const, stiffness: 100, damping: 20 },
  },
  exit: { opacity: 0, x: -20, transition: { duration: 0.3 } },
};

const containerVariants = {
  animate: {
    transition: {
      staggerChildren: 0.08, // 폭포수 효과 핵심 (2번 효과)
    },
  },
};

const listItemVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { 
    opacity: 1, 
    y: 0, 
    transition: { type: 'spring' as const, stiffness: 150, damping: 15 } 
  },
};

// ── 1번 효과: Magnetic Search Bar ────────────────────────────────────
function ModernSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // 마우스 트래킹을 위한 모션 밸류
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 반응형 감도 조절 (Spring으로 부드럽게)
  const springX = useSpring(mouseX, { stiffness: 150, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 150, damping: 20 });

  function handleMouseMove(e: React.MouseEvent) {
    if (!searchRef.current) return;
    const rect = searchRef.current.getBoundingClientRect();
    const x = e.clientX - (rect.left + rect.width / 2);
    const y = e.clientY - (rect.top + rect.height / 2);
    // 살짝만 따라오도록 배율 조정 (Magnetic 효과)
    mouseX.set(x * 0.15);
    mouseY.set(y * 0.15);
  }

  function handleMouseLeave() {
    mouseX.set(0);
    mouseY.set(0);
  }

  return (
    <div className="relative w-full max-w-2xl mx-auto mb-8">
      <motion.div
        ref={searchRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ x: springX, y: springY }}
        animate={{
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused ? '0 15px 45px rgba(27,67,50,0.15)' : '0 4px 25px rgba(0,0,0,0.06)',
        }}
        className="relative flex items-center bg-white border border-black/[0.05] rounded-[24px] sm:rounded-[28px] p-1.5 sm:p-2 pr-4 sm:pr-6 overflow-hidden transition-shadow mx-4 sm:mx-0"
      >
        <div className="flex items-center justify-center w-12 h-12 text-[#2D6A4F]/40">
          <Search size={20} className={isFocused ? 'text-[#52B788]' : ''} />
        </div>
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="도움이 필요하신 내용을 검색해보세요"
          className="flex-1 bg-transparent border-none outline-none py-3 text-[16px] font-bold text-[#1A2B27] placeholder:text-[#5C6B68]/30 placeholder:font-medium"
        />
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAF9] border border-black/[0.03] rounded-xl">
          <span className="text-[10px] font-black text-[#5C6B68]/40">ENTER</span>
        </div>
      </motion.div>
    </div>
  );
}

// ── 3번 효과: Modern Magnetic Glow FAQ Item ────────────────────────────────────
function TrendyFaqItem({
  item,
  isOpen,
  onToggle,
}: {
  item: FaqItem;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const [isHovered, setIsHovered] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  // Magnetic pull effect (subtle cursor following)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    // Magnetic pull (subtle)
    const deltaX = (event.clientX - centerX) * 0.08;
    const deltaY = (event.clientY - centerY) * 0.08;
    x.set(deltaX);
    y.set(deltaY);

    // Track mouse for glow effect
    setMousePosition({
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  }

  function handleMouseLeave() {
    x.set(0);
    y.set(0);
    setIsHovered(false);
  }

  return (
    <motion.div
      variants={listItemVariants}
      layout
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={handleMouseLeave}
      style={{ x: springX, y: springY }}
      className="group relative mb-4"
    >
      {/* 동적 커서 추적 Glow 효과 */}
      <AnimatePresence>
        {isHovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-0 pointer-events-none"
            style={{
              background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(82, 183, 136, 0.15), transparent 40%)`,
            }}
          />
        )}
      </AnimatePresence>

      {/* Open 상태 글로우 (기존 유지) */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1.02 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="absolute -inset-1 bg-gradient-to-r from-[#52B788]/20 via-[#E8A838]/10 to-[#52B788]/20 blur-xl rounded-[32px] z-0"
            transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse' }}
          />
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          scale: isHovered ? 1.02 : 1,
          boxShadow: isHovered
            ? '0 20px 60px rgba(27, 67, 50, 0.15)'
            : isOpen
            ? '0 10px 40px rgba(27, 67, 50, 0.1)'
            : '0 2px 8px rgba(0, 0, 0, 0.04)',
        }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative z-10 bg-white rounded-[26px] border overflow-hidden ${
          isOpen
            ? 'border-[#52B788]/40'
            : isHovered
            ? 'border-[#52B788]/20'
            : 'border-black/[0.04]'
        }`}
      >
        <button
          onClick={onToggle}
          className="w-full flex items-center gap-3 sm:gap-5 px-4 sm:px-6 py-4 sm:py-6 text-left"
        >
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#1B4332] text-white' : 'bg-[#f4f9f6] text-[#52B788]'}`}
          >
            <Hash size={14} className={isOpen ? 'opacity-100' : 'opacity-40'} />
          </div>
          <span className={`flex-1 text-[14px] sm:text-[16px] font-bold ${isOpen ? 'text-[#1B4332]' : 'text-[#1A2B27]'}`}>
            {item.q}
          </span>
          <motion.div
            animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.2 : 1 }}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'text-[#52B788]' : 'text-[#5C6B68]/30'}`}
          >
            <ChevronDown size={22} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 pl-16 sm:pl-24 relative">
                <div className="absolute left-[32px] sm:left-[38px] top-0 bottom-8 w-[2px] bg-gradient-to-b from-[#52B788]/30 to-transparent rounded-full" />
                <p className="text-[15px] leading-relaxed text-[#5C6B68] font-medium whitespace-pre-wrap">
                  {item.a}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

// ── 1:1 문의 섹션 ───────────────────────────────────────────────────
function ModernInquiryForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    category: '기타' as InquiryCategory,
    title: '',
    content: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || formData.content.length < 10) return;
    setLoading(true);
    try {
      await api.post('/support/inquiries', formData);
      onSuccess();
    } catch (err: any) {
      setError(err.message || '등록 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const CATEGORY_OPTIONS: InquiryCategory[] = ['결제/아이템 문의', '건강 분석 오류', '기타'];

  return (
    <motion.div
      variants={cardVariants}
      className="max-w-2xl mx-auto bg-white rounded-[32px] sm:rounded-[44px] p-6 sm:p-14 border border-black/[0.04] shadow-2xl relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-12 text-[#52B788]/5 pointer-events-none">
        <Send size={180} />
      </div>

      <div className="relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black text-[#1A2B27] mb-8 sm:mb-12 flex items-center gap-3 sm:gap-4">
          <div className="w-14 h-14 bg-[#1B4332] rounded-[22px] shadow-lg flex items-center justify-center text-white">
            <Plus size={32} />
          </div>
          새로운 문의 남기기
        </h2>

        <form onSubmit={submit} className="space-y-10">
          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">문의 유형</label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_OPTIONS.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, category: cat }))}
                  className={`px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[13px] sm:text-[14px] font-black transition-all ${formData.category === cat ? 'bg-[#1B4332] text-white shadow-xl scale-105' : 'bg-[#f4f9f6] text-[#5C6B68]/60 hover:bg-[#eaf4ee]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">문의 제목</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력해 주세요"
              className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-[20px] sm:rounded-[24px] p-4 sm:p-5.5 text-[15px] sm:text-[17px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner"
            />
          </div>

          <div className="space-y-4">
            <label className="text-[12px] font-black text-[#5C6B68]/50 uppercase tracking-[0.2em] ml-2">내용</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
              placeholder="최소 10자 이상 입력해 주세요"
              rows={8}
              className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-[24px] sm:rounded-[30px] p-5 sm:p-7 text-[15px] sm:text-[17px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-inner resize-none"
            />
            <div className="flex justify-between items-center px-2 text-[12px] font-bold">
              <span className={formData.content.length < 10 ? 'text-red-400' : 'text-[#52B788]'}>{formData.content.length}자</span>
              <span className="text-[#5C6B68]/30">평일 기준 24시간 내 순차적 답변</span>
            </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !formData.title || formData.content.length < 10}
            className={`w-full py-6 rounded-3xl font-black text-[19px] shadow-2xl flex items-center justify-center gap-4 transition-all ${loading || !formData.title || formData.content.length < 10 ? 'bg-[#f4f9f6] text-[#5C6B68]/30 cursor-not-allowed' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] shadow-emerald-900/10'}`}
          >
            {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={24} /> 문의 보내기</>}
          </motion.button>
        </form>
      </div>
    </motion.div>
  );
}

// ── 내 문의 내역 섹션 ─────────────────────────────────────────────────
function ModernHistory() {
  const [inquiries, setInquiries] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/support/inquiries')
      .then((data) => { if (Array.isArray(data)) setInquiries(data); })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center flex flex-col items-center gap-4"><div className="w-12 h-12 border-4 border-[#52B788]/20 border-t-[#52B788] rounded-full animate-spin" /><p className="text-sm font-black text-[#5C6B68]/30 tracking-widest uppercase">Fetching Data...</p></div>;

  return (
    <motion.div variants={containerVariants} initial="initial" animate="animate" className="grid gap-6 max-w-3xl mx-auto">
      {inquiries.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[44px] border border-black/[0.02] shadow-sm">
          <div className="w-24 h-24 bg-[#f4f9f6] rounded-[36px] mx-auto mb-8 flex items-center justify-center text-5xl">📫</div>
          <p className="text-[#5C6B68]/40 text-lg font-black">아직 등록된 문의 내역이 없어요</p>
        </div>
      ) : (
        inquiries.map((inq, idx) => (
          <motion.div
            key={inq.id}
            variants={listItemVariants}
            className="bg-white border border-black/[0.04] rounded-[24px] sm:rounded-[36px] p-6 sm:p-10 hover:shadow-2xl hover:border-emerald-500/10 transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-wider ${inq.status === '답변 완료' ? 'bg-[#52B788]/10 text-[#2D6A4F]' : 'bg-[#E8A838]/10 text-[#B5810F]'}`}>{inq.status}</span>
              <span className="text-[13px] font-bold text-[#5C6B68]/30">{inq.createdAt}</span>
            </div>
            <h3 className="text-[18px] sm:text-[22px] font-black text-[#1A2B27] mb-4 group-hover:text-[#52B788] transition-colors">{inq.title}</h3>
            <p className="text-[16px] text-[#5C6B68]/70 line-clamp-2 leading-relaxed font-medium">{inq.content}</p>
            {inq.answer && (
              <div className="mt-10 pt-8 border-t border-black/[0.03] flex items-start gap-6">
                <div className="w-12 h-12 rounded-2xl bg-[#1B4332] flex items-center justify-center text-white shrink-0 shadow-lg"><Sparkles size={22} /></div>
                <div className="flex-1 bg-[#f4f9f6] p-7 rounded-[32px]"><p className="text-[16px] font-bold text-[#1B4332] leading-relaxed">" {inq.answer} "</p></div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </motion.div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function SupportPage({ openAuth }: { openAuth: (mode: 'login' | 'signup', callback?: () => void) => void; }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const initialTab = (searchParams.get('tab') as SupportTab) || 'faq';

  const [activeTab, setActiveTab] = useState<SupportTab>(initialTab);
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [faqData, setFaqData] = useState<FaqItem[]>(FALLBACK_FAQ);

  useEffect(() => {
    api.get<FaqItem[]>('/support/faqs')
      .then((data) => { if (Array.isArray(data) && data.length > 0) setFaqData(data); })
      .catch((err) => console.warn('Using fallback FAQs:', err));
  }, []);

  const filteredFaqs = useMemo(() => {
    return faqData.filter((item) => {
      const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
      const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqData, activeCategory, searchQuery]);

  const handleTabChange = (k: SupportTab) => {
    if (k !== 'faq') {
      const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken');
      if (!token) {
        openAuth?.('login', () => { setActiveTab(k); setSearchParams({ tab: k }); });
        return;
      }
    }
    setActiveTab(k);
    setSearchParams({ tab: k });
  };

  return (
    <div className="min-h-screen bg-white text-[#1A2B27] font-pretendard selection:bg-[#52B788]/20">
      <Navbar openAuth={openAuth} />

      {/* Hero Section */}
      <section className="relative pt-[120px] sm:pt-[180px] pb-[60px] sm:pb-[80px] px-4 sm:px-6 overflow-hidden bg-[#F8FAF9]">
        <div className="absolute top-[-10%] left-[-10%] w-[45%] h-[45%] bg-[#52B788] blur-[140px] rounded-full opacity-[0.1]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-[#E8A838] blur-[140px] rounded-full opacity-[0.08]" />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#1B4332]/5 rounded-full mb-10 border border-[#1B4332]/5">
            <Sparkles size={14} className="text-[#E8A838]" />
            <span className="text-[12px] font-black text-[#1B4332] uppercase tracking-[0.25em]">Customer Support</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }} className="text-4xl sm:text-6xl md:text-8xl font-black mb-8 sm:mb-12 leading-[1.1] sm:leading-[0.95] tracking-tighter text-[#1A2B27]">
            우리가 무엇을<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] via-[#2D6A4F] to-[#52B788]">도와드릴까요?</span>
          </motion.h1>

          <ModernSearch value={searchQuery} onChange={setSearchQuery} />
        </div>
        <WaveDivider fill="white" />
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 bg-white">
        <div className="max-w-[1240px] mx-auto px-4 sm:px-6 pt-[40px] sm:pt-[60px] pb-[80px] sm:pb-[120px] flex flex-col lg:flex-row gap-8 sm:gap-16">
          <aside className="w-full lg:w-[260px] shrink-0">
            <div className="sticky top-[120px] space-y-12">
              <div className="flex flex-col gap-2.5">
                {[
                  { id: 'faq' as const, label: '자주 묻는 질문', icon: <MessageSquare size={19} /> },
                  { id: 'inquiry' as const, label: '1:1 문의하기', icon: <Plus size={19} /> },
                  { id: 'myinquiry' as const, label: '나의 문의 내역', icon: <FileText size={19} /> },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => handleTabChange(tab.id)}
                    className={`flex items-center justify-between group px-4 sm:px-6 py-4 sm:py-5 rounded-[18px] sm:rounded-[22px] transition-all duration-300 relative overflow-hidden ${activeTab === tab.id ? 'bg-[#1B4332] text-white shadow-2xl scale-[1.03]' : 'bg-[#f4f9f6] hover:bg-[#eaf4ee] text-[#5C6B68]'}`}
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <span className={activeTab === tab.id ? 'text-[#52B788]' : 'text-[#5C6B68]/40 group-hover:text-[#52B788]'}>{tab.icon}</span>
                      <span className="text-[15px] font-black tracking-tight">{tab.label}</span>
                    </div>
                    <ArrowRight size={16} className={`relative z-10 transition-transform duration-500 ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0 group-hover:translate-x-0 group-hover:opacity-100'}`} />
                  </button>
                ))}
              </div>

              <AnimatePresence>
                {activeTab === 'faq' && (
                  <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-5">
                    <div className="flex items-center gap-2.5 px-3 text-[11px] font-black text-[#5C6B68]/40 uppercase tracking-[0.2em]"><Filter size={13} /> CATEGORIES</div>
                    <div className="grid grid-cols-2 lg:flex lg:flex-col gap-2 px-1">
                      {CATEGORIES.map((cat) => (
                        <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-5 py-3 rounded-2xl text-[14px] font-black text-left transition-all ${activeCategory === cat ? 'bg-[#52B788]/15 text-[#1B4332] shadow-sm' : 'bg-transparent text-[#5C6B68]/50 hover:text-[#1A2B27] hover:bg-[#f4f9f6]'}`}>
                          {cat}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="hidden lg:block bg-gradient-to-br from-[#1B4332] to-[#0A1F17] rounded-[36px] p-8 text-white overflow-hidden relative group shadow-2xl">
                <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-[#52B788]/20 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-1000" />
                <div className="relative z-10">
                  <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center mb-6"><LifeBuoy className="text-[#52B788]" size={24} /></div>
                  <h4 className="text-[17px] font-black mb-2">도움이 필요하신가요?</h4>
                  <p className="text-[13px] text-white/50 leading-relaxed mb-6 font-medium">평일 09:00 - 18:00 운영<br />친밀하고 정확한 상담</p>
                  <button 
                    onClick={() => navigate('/privacy')}
                    className="px-5 py-2.5 rounded-xl bg-[#52B788] text-[#1B4332] text-[12px] font-black hover:bg-white transition-colors duration-300"
                  >
                    운영정책 전체보기
                  </button>
                </div>
              </div>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            {/* 4번 효과: AnimatePresence를 사용한 탭 슬라이드 전환 */}
            <AnimatePresence mode="wait">
              {activeTab === 'faq' && (
                <motion.div key="faq" variants={containerVariants} initial="initial" animate="animate" exit="exit" className="space-y-6">
                  <div className="flex items-center gap-4 mb-10 px-2 lg:px-0">
                    <div className="p-4 bg-[#1B4332]/5 rounded-[22px] text-[#1B4332]"><MessageSquare size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-[#1A2B27] tracking-tight">{activeCategory}</h2>
                      <p className="text-[13px] font-bold text-[#5C6B68]/40">{filteredFaqs.length}개의 정제된 답변이 확인되었습니다.</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {filteredFaqs.length > 0 ? (
                      filteredFaqs.map((item) => (
                        <TrendyFaqItem key={item.id} item={item} isOpen={openFaqId === item.id} onToggle={() => setOpenFaqId(openFaqId === item.id ? null : item.id)} />
                      ))
                    ) : (
                      <div className="text-center py-24 bg-[#f8faf9]/50 rounded-[44px] border border-black/[0.03]"><div className="text-5xl mb-6">🏜️</div><p className="text-[#5C6B68]/40 font-black text-lg">해당 키워드의 검색 결과가 없습니다</p></div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === 'inquiry' && (
                <motion.div key="inquiry" variants={cardVariants} initial="initial" animate="animate" exit="exit">
                  <ModernInquiryForm onSuccess={() => handleTabChange('myinquiry')} />
                </motion.div>
              )}

              {activeTab === 'myinquiry' && (
                <motion.div key="myinquiry" variants={containerVariants} initial="initial" animate="animate" exit="exit">
                  <div className="flex items-center gap-4 mb-10">
                    <div className="p-4 bg-amber-100 rounded-[22px] text-amber-600 shadow-sm"><FileText size={24} /></div>
                    <div>
                      <h2 className="text-2xl font-black text-[#1A2B27]">나의 문의 내역</h2>
                      <p className="text-[13px] font-bold text-[#5C6B68]/40">최근 3개월간의 내역입니다.</p>
                    </div>
                  </div>
                  <ModernHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
        <WaveDivider fill="#111e18" />
      </main>

      <Footer />
    </div>
  );
}
