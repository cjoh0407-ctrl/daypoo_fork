import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import type React from 'react';
import { motion, AnimatePresence, useInView, useMotionValue, useSpring, useTransform } from 'framer-motion';
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
  Filter
} from 'lucide-react';

// ── 타입 ──────────────────────────────────────────────────────────────
type SupportTab = 'faq' | 'inquiry' | 'myinquiry';
type FaqCategory = '전체' | '건강/AI분석' | '이용방법' | '결제/아바타' | '계정/보안';
type InquiryStatus = '답변 대기' | '답변 완료';
type InquiryCategory = '화장실 정보 오류' | '결제/아이템 문의' | '건강 분석 오류' | '기타';

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

// ── 데이터 ────────────────────────────────────────────────────────────
// ── 데이터 (Fallback용) ──────────────────────────────────────────────────
const FALLBACK_FAQ: FaqItem[] = [
  { id:'f1', num:'01', category:'건강/AI분석', q:'AI 건강 분석 결과는 의학적으로 정확한가요?', a:'본 서비스의 AI 분석은 사용자가 입력한 데이터를 바탕으로 한 일반적인 가이드일 뿐, 전문적인 의학적 진단을 대신할 수 없습니다.' },
  { id:'f2', num:'02', category:'건강/AI분석', q:'브리스톨 척도란 무엇인가요?', a:'브리스톨 척도는 대변의 형태를 7가지 유형으로 분류한 기준입니다. Day.Poo는 이를 기반으로 장 건강을 시각화합니다.' },
  { id:'f3', num:'03', category:'이용방법', q:'화장실 정보가 틀린데 어떻게 수정하나요?', a:'상세 페이지의 \'정보 수정 요청\' 버튼을 누르거나 1:1 문의를 남겨주시면 즉시 검토하겠습니다.' },
  { id:'f4', num:'04', category:'이용방법', q:'방문 인증은 어떻게 하나요?', a:'지도에서 화장실 선택 후 \'방문 인증하기\' 버튼을 통해 상태와 색상을 기록하면 💩 마커로 변합니다.' },
  { id:'f5', num:'05', category:'결제/아바타', q:'획득한 칭호는 어디서 확인하나요?', a:'마이페이지의 \'컬렉션\' 탭에서 칭호를 관리하고 장착할 수 있습니다.' },
  { id:'f6', num:'06', category:'결제/아바타', q:'환불 정책이 궁금해요.', a:'디지털 아이템은 사용 전 7일 이내 환불 가능하며, 시스템 오류로 인한 미지급은 1:1 문의로 해결해 드립니다.' },
];

const CATEGORIES: FaqCategory[] = ['전체', '건강/AI분석', '이용방법', '결제/아바타', '계정/보안'];

// ── 공통 컴포넌트 & 애니메이션 ───────────────────────────────────────
const cardVariants = {
  initial: { opacity: 0, scale: 0.95, y: 20 },
  animate: { opacity: 1, scale: 1, y: 0, transition: { type: "spring" as const, stiffness: 100, damping: 20 } },
  exit: { opacity: 0, scale: 0.95, y: -20, transition: { duration: 0.2 } }
};

// ── 인터랙티브 서치바 ────────────────────────────────────────────────
function ModernSearch({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [isFocused, setIsFocused] = useState(false);
  
  return (
    <div className="relative w-full max-w-2xl mx-auto mb-12">
      <motion.div 
        animate={{ 
          scale: isFocused ? 1.02 : 1,
          boxShadow: isFocused ? "0 10px 40px rgba(27,67,50,0.12)" : "0 4px 20px rgba(0,0,0,0.05)"
        }}
        className="relative flex items-center bg-white border border-black/[0.05] rounded-[24px] p-2 pr-6 overflow-hidden transition-all"
      >
        <div className="flex items-center justify-center w-12 h-12 text-[#2D6A4F]/40 group">
          <Search size={20} className={isFocused ? "text-[#52B788]" : ""} />
        </div>
        <input 
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder="도움이 필요하신 내용을 검색해보세요"
          className="flex-1 bg-transparent border-none outline-none py-3 text-[15px] font-bold text-[#1A2B27] placeholder:text-[#5C6B68]/30 placeholder:font-medium"
        />
        <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-[#F8FAF9] border border-black/[0.03] rounded-lg">
          <span className="text-[10px] font-black text-[#5C6B68]/40">ESC</span>
        </div>
      </motion.div>
    </div>
  );
}

// ── 3D FAQ 아이템 ───────────────────────────────────────────────────
function TrendyFaqItem({ item, isOpen, onToggle }: { item: FaqItem; isOpen: boolean; onToggle: () => void }) {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]));
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]));

  function handleMouseMove(event: React.MouseEvent<HTMLDivElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  }

  return (
    <motion.div
      layout
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={`group relative perspective-1000 mb-4 transition-all duration-500`}
    >
      <div className={`relative bg-white rounded-[24px] border ${isOpen ? 'border-[#52B788]/30 shadow-[0_20px_50px_rgba(27,67,50,0.08)]' : 'border-black/[0.03] shadow-sm'} overflow-hidden transition-all duration-300`}>
        <button 
          onClick={onToggle}
          className="w-full flex items-center gap-5 px-6 py-6 text-left relative z-10"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isOpen ? 'bg-[#52B788] text-white' : 'bg-[#f4f9f6] text-[#52B788]'}`}>
             <Hash size={14} className="opacity-50" />
          </div>
          <span className={`flex-1 text-[15px] font-bold ${isOpen ? 'text-[#1A2B27]' : 'text-[#5C6B68]'}`}>
            {item.q}
          </span>
          <motion.div 
            animate={{ rotate: isOpen ? 180 : 0, scale: isOpen ? 1.1 : 1 }}
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${isOpen ? 'text-[#52B788]' : 'text-[#5C6B68]/30'}`}
          >
            <ChevronDown size={20} />
          </motion.div>
        </button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="px-6 pb-6 pt-2 pl-[76px] relative">
                <div className="absolute left-[36px] top-0 bottom-6 w-[2px] bg-gradient-to-b from-[#52B788]/20 to-transparent rounded-full" />
                <p className="text-[14px] leading-relaxed text-[#5C6B68] font-medium whitespace-pre-wrap">
                  {item.a}
                </p>
                <div className="mt-6 flex items-center gap-3">
                  <span className="text-[11px] font-black text-[#52B788]/60 uppercase tracking-widest">Helpful?</span>
                  <div className="flex gap-1">
                    {[1,2].map(i => (
                      <button key={i} className="w-8 h-8 rounded-lg bg-[#f4f9f6] hover:bg-[#52B788] hover:text-white transition-colors flex items-center justify-center text-[12px]">
                        {i === 1 ? '👍' : '👎'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ── 1:1 문의 섹션 ───────────────────────────────────────────────────
function ModernInquiryForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({ category: '기타' as InquiryCategory, title: '', content: '' });
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

  const CATEGORY_OPTIONS: InquiryCategory[] = ['화장실 정보 오류', '결제/아이템 문의', '건강 분석 오류', '기타'];

  return (
    <motion.div variants={cardVariants} className="max-w-2xl mx-auto bg-white rounded-[40px] p-10 sm:p-14 border border-black/[0.04] shadow-[0_30px_80px_rgba(27,67,50,0.08)] relative overflow-hidden">
      <div className="absolute top-0 right-0 p-12 text-[#52B788]/5 pointer-events-none">
        <Send size={160} />
      </div>

      <div className="relative z-10">
        <h2 className="text-3xl font-black text-[#1A2B27] mb-10 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#52B788] rounded-2xl flex items-center justify-center text-white">
            <Plus size={28} />
          </div>
          새로운 문의 남기기
        </h2>

        <form onSubmit={submit} className="space-y-8">
          <div className="space-y-4">
            <label className="text-[12px] font-black black text-[#5C6B68]/50 uppercase tracking-[0.15em] ml-1">문의 유형을 선택해주세요</label>
            <div className="flex flex-wrap gap-2.5">
              {CATEGORY_OPTIONS.map(cat => (
                <button
                  key={cat} type="button"
                  onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                  className={`px-5 py-3 rounded-2xl text-[14px] font-bold transition-all duration-300 ${formData.category === cat ? 'bg-[#1B4332] text-white shadow-xl scale-105' : 'bg-[#f4f9f6] text-[#5C6B68]/60 hover:bg-[#eaf4ee]'}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
             <label className="text-[12px] font-black black text-[#5C6B68]/50 uppercase tracking-[0.15em] ml-1">제목</label>
             <input
               type="text"
               value={formData.title}
               onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
               placeholder="문의 제목을 입력해주세요"
               className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-2xl p-5 text-[16px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-sm placeholder:text-[#5C6B68]/40"
             />
          </div>

          <div className="space-y-4">
             <label className="text-[12px] font-black black text-[#5C6B68]/50 uppercase tracking-[0.15em] ml-1">상세 내용</label>
             <textarea
               value={formData.content}
               onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
               placeholder="구체적인 상황을 알려주시면 빠르게 답변해 드릴게요 (최소 10자)"
               rows={8}
               className="w-full bg-[#f8faf9] border border-black/[0.04] rounded-2xl p-6 text-[16px] font-bold text-[#1A2B27] outline-none focus:border-[#52B788]/50 focus:bg-white transition-all shadow-sm resize-none placeholder:text-[#5C6B68]/40"
             />
             <div className="flex justify-between items-center px-1 text-[12px]">
               <span className={formData.content.length < 10 ? "text-red-400" : "text-[#52B788] font-bold"}>{formData.content.length}자 입력함</span>
               <span className="text-[#5C6B68]/40 italic">평일 기준 24시간 내 답변 예정</span>
             </div>
          </div>

          {error && <p className="text-red-500 text-sm font-bold text-center">{error}</p>}

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            disabled={loading || !formData.title || formData.content.length < 10}
            className={`w-full py-5 rounded-2xl font-black text-[18px] shadow-2xl flex items-center justify-center gap-4 transition-all ${loading || !formData.title || formData.content.length < 10 ? 'bg-[#f4f9f6] text-[#5C6B68]/30 cursor-not-allowed' : 'bg-[#1B4332] text-white hover:bg-[#2D6A4F] shadow-emerald-900/20'}`}
          >
            {loading ? <div className="w-6 h-6 border-3 border-white/30 border-t-white rounded-full animate-spin" /> : <><Send size={22} /> 문의 등록하기</>}
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
    api.get('/support/inquiries').then(data => {
      if(Array.isArray(data)) setInquiries(data);
    }).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="py-20 text-center flex flex-col items-center gap-4">
    <div className="w-12 h-12 border-4 border-[#52B788]/20 border-t-[#52B788] rounded-full animate-spin" />
    <p className="text-sm font-bold text-[#5C6B68]/50 uppercase tracking-widest leading-loose">Loading your history...</p>
  </div>;

  return (
    <div className="grid gap-6 max-w-3xl mx-auto">
      {inquiries.length === 0 ? (
        <div className="py-32 text-center bg-white rounded-[40px] border border-black/[0.03]">
          <div className="w-24 h-24 bg-[#f4f9f6] rounded-[32px] mx-auto mb-8 flex items-center justify-center text-5xl">📭</div>
          <p className="text-[#5C6B68]/40 text-lg font-bold">아직 등록된 문의 내역이 없어요</p>
        </div>
      ) : (
        inquiries.map((inq, idx) => (
          <motion.div 
            key={inq.id}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
            className="bg-white border border-black/[0.03] rounded-[32px] p-8 hover:shadow-2xl transition-all group"
          >
            <div className="flex justify-between items-start mb-6">
              <span className={`px-4 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider ${inq.status === '답변 완료' ? 'bg-[#52B788]/10 text-[#2D6A4F]' : 'bg-[#E8A838]/10 text-[#B5810F]'}`}>
                {inq.status}
              </span>
              <span className="text-[13px] font-medium text-[#5C6B68]/30">{inq.createdAt}</span>
            </div>
            <h3 className="text-[20px] font-black text-[#1A2B27] mb-3 group-hover:text-[#52B788] transition-colors">{inq.title}</h3>
            <p className="text-[15px] text-[#5C6B68]/70 line-clamp-3 leading-relaxed">{inq.content}</p>
            {inq.answer && (
              <div className="mt-8 pt-6 border-t border-black/[0.03] flex items-start gap-4">
                 <div className="w-10 h-10 rounded-xl bg-[#2D6A4F] flex items-center justify-center text-white shrink-0">
                    <Sparkles size={18} />
                 </div>
                 <div className="flex-1 bg-[#f4f9f6] p-6 rounded-3xl">
                    <p className="text-[15px] font-bold text-[#1B4332] leading-relaxed italic">" {inq.answer} "</p>
                 </div>
              </div>
            )}
          </motion.div>
        ))
      )}
    </div>
  );
}

// ── 메인 페이지 ───────────────────────────────────────────────────────
export function SupportPage({ openAuth }: { openAuth: (mode: 'login' | 'signup', callback?: () => void) => void }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = (searchParams.get('tab') as SupportTab) || 'faq';
  
  const [activeTab, setActiveTab] = useState<SupportTab>(initialTab);
  const [activeCategory, setActiveCategory] = useState<FaqCategory>('전체');
  const [searchQuery, setSearchQuery] = useState('');
  const [openFaqId, setOpenFaqId] = useState<string | null>(null);
  const [faqData, setFaqData] = useState<FaqItem[]>(FALLBACK_FAQ);

  useEffect(() => {
    api.get<FaqItem[]>('/support/faqs')
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setFaqData(data);
        }
      })
      .catch(err => {
        console.warn('Failed to fetch FAQs, using fallback:', err);
      });
  }, []);

  // 필터링된 FAQ 데이터
  const filteredFaqs = useMemo(() => {
    return faqData.filter(item => {
      const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
      const matchesSearch = item.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
                           item.a.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [faqData, activeCategory, searchQuery]);

  const handleTabChange = (k: SupportTab) => {
    if (k !== 'faq') {
      const token = localStorage.getItem('accessToken');
      if (!token) { 
        openAuth?.('login', () => {
          setActiveTab(k);
          setSearchParams({ tab: k });
        }); 
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
      <section className="relative pt-[160px] pb-[120px] px-6 overflow-hidden bg-[#F8FAF9]">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-[#52B788] blur-[120px] rounded-full opacity-[0.08]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-[#E8A838] blur-[120px] rounded-full opacity-[0.05]" />
        
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1B4332]/5 rounded-full mb-8"
          >
            <div className="w-2 h-2 bg-[#52B788] rounded-full animate-pulse" />
            <span className="text-[11px] font-black text-[#1B4332] uppercase tracking-[0.2em]">Support Center</span>
          </motion.div>
          
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-7xl font-black mb-10 leading-[1.05] tracking-tight text-[#1A2B27]"
          >
            우리가 무엇을<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#1B4332] to-[#52B788]">도와드릴까요?</span>
          </motion.h1>

          <ModernSearch value={searchQuery} onChange={setSearchQuery} />
        </div>

        {/* Hero to Content divider */}
        <WaveDivider fill="white" />
      </section>

      {/* Main Content Area */}
      <main className="relative z-10 bg-white">
        <div className="max-w-6xl mx-auto px-6 py-[100px] flex flex-col md:flex-row gap-12">
          
          {/* Navigation Sidebar (Desktop) */}
          <aside className="w-full md:w-[240px] shrink-0">
            <div className="sticky top-[100px] space-y-10">
              {/* Main Tabs */}
              <div className="flex flex-col gap-2">
                  {[
                    { id: 'faq' as const, label: '자주 묻는 질문', icon: <MessageSquare size={18} /> },
                    { id: 'inquiry' as const, label: '1:1 문의하기', icon: <Plus size={18} /> },
                    { id: 'myinquiry' as const, label: '나의 문의 내역', icon: <FileText size={18} /> }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`flex items-center justify-between group px-5 py-4 rounded-2xl transition-all duration-300 relative overflow-hidden ${activeTab === tab.id ? 'bg-[#1B4332] text-white shadow-[0_10px_20px_rgba(27,67,50,0.15)]' : 'bg-[#f4f9f6] hover:bg-[#eaf4ee] text-[#5C6B68]'}`}
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <span className={activeTab === tab.id ? 'text-[#52B788]' : 'text-[#5C6B68]/40 group-hover:text-[#52B788]'}>{tab.icon}</span>
                        <span className="text-[14px] font-black">{tab.label}</span>
                      </div>
                      <ArrowRight size={14} className={`relative z-10 transition-transform ${activeTab === tab.id ? 'translate-x-0 opacity-100' : '-translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-40'}`} />
                    </button>
                  ))}
              </div>

              {/* Categories Filter (Only visible when FAQ active) */}
              <AnimatePresence>
                {activeTab === 'faq' && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 px-2 text-[11px] font-black text-[#5C6B68]/30 uppercase tracking-widest">
                      <Filter size={12} /> Categories
                    </div>
                    <div className="flex flex-wrap md:flex-col gap-1.5 px-1">
                      {CATEGORIES.map(cat => (
                          <button
                            key={cat}
                            onClick={() => setActiveCategory(cat)}
                            className={`px-4 py-2 rounded-xl text-[13px] font-bold text-left transition-all ${activeCategory === cat ? 'bg-[#52B788]/10 text-[#2D6A4F]' : 'bg-transparent text-[#5C6B68]/40 hover:text-[#5C6B68] hover:bg-[#f4f9f6]'}`}
                          >
                            {cat}
                          </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Support Card */}
              <div className="hidden md:block bg-[#1B4332] rounded-[28px] p-6 text-white overflow-hidden relative group shadow-xl">
                  <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700" />
                  <div className="relative z-10">
                    <LifeBuoy className="text-[#52B788] mb-4" />
                    <h4 className="text-[15px] font-black mb-1">고객센터 운영안내</h4>
                    <p className="text-[12px] text-white/50 leading-relaxed mb-4">평일 09:00 - 18:00<br/>보통 24시간 내에 답변드립니다.</p>
                    <button className="text-[11px] font-bold text-[#52B788] flex items-center gap-1 group">
                      운영정책 보기 <ChevronRight size={10} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
              </div>
            </div>
          </aside>

          {/* Dynamic content area */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {activeTab === 'faq' && (
                <motion.div key="faq" variants={cardVariants} initial="initial" animate="animate" exit="exit" className="space-y-4">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-[#52B788]/10 rounded-2xl text-[#2D6A4F]">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#1A2B27]">{activeCategory}</h2>
                        <p className="text-[12px] font-medium text-[#5C6B68]/40">{filteredFaqs.length}개의 관련 질문이 있습니다.</p>
                      </div>
                    </div>
                  </div>

                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map(item => (
                      <TrendyFaqItem 
                        key={item.id} 
                        item={item} 
                        isOpen={openFaqId === item.id}
                        onToggle={() => setOpenFaqId(openFaqId === item.id ? null : item.id)}
                      />
                    ))
                  ) : (
                    <div className="text-center py-20 bg-[#f4f9f6] rounded-[32px] border border-black/[0.03]">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-[#5C6B68]/40 font-bold">검색 결과가 없어요. 다른 키워드를 입력해보세요.</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'inquiry' && (
                <motion.div key="inquiry" variants={cardVariants} initial="initial" animate="animate" exit="exit">
                  <ModernInquiryForm onSuccess={() => handleTabChange('myinquiry')} />
                </motion.div>
              )}

              {activeTab === 'myinquiry' && (
                <motion.div key="myinquiry" variants={cardVariants} initial="initial" animate="animate" exit="exit" className="pt-2">
                  <div className="flex items-center gap-3 mb-10">
                      <div className="p-3 bg-amber-100 rounded-2xl text-amber-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <h2 className="text-xl font-black text-[#1A2B27]">나의 문의 내역</h2>
                        <p className="text-[12px] font-medium text-[#5C6B68]/40">답변 완료까지 조금만 기다려주세요</p>
                      </div>
                  </div>
                  <ModernHistory />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content to Footer divider */}
        <div className="h-32" />
        <WaveDivider fill="#111e18" />
      </main>

      {/* Bottom accent bar */}
      <div className="fixed bottom-0 left-0 w-full h-1 bg-gradient-to-r from-[#1B4332] via-[#52B788] to-[#E8A838] opacity-30 z-50 px-6 sm:px-12" />
      
      <Footer />
    </div>
  );
}
