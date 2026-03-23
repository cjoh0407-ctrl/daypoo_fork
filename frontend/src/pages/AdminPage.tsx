import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, MapPin, MessageSquare,
  ShoppingBag, Settings, ChevronRight, ChevronLeft,
  TrendingUp, AlertTriangle, Activity, DollarSign,
  LogOut, Bell, RefreshCw, Plus, Shield, Zap, Search, Clock, Calendar
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

// ── Shared Constants & Types ──────────────────────────────────────────
type AdminTab = 'dashboard' | 'users' | 'toilets' | 'cs' | 'store' | 'system';

const COLORS = {
  primary: '#1B4332',
  secondary: '#2D6A4F',
  accent: '#E8A838',
  error: '#FF4B4B',
  warning: '#F4A261',
  info: '#3B82F6',
  surface: '#FFFFFF',
  background: '#f8faf9',
  border: 'rgba(26,43,39,0.08)',
  textPrimary: '#1A2B27',
  textSecondary: 'rgba(26,43,39,0.5)',
};

// ── Sub-Components: Common Elements ──────────────────────────────────
const GlassCard = ({ children, className = '', glowColor = 'rgba(27,67,50,0.05)' }: { children: React.ReactNode, className?: string, glowColor?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, boxShadow: `0 20px 40px ${glowColor}` }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    className={`relative overflow-hidden rounded-[24px] p-6 ${className}`}
    style={{
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(20px)',
      border: `1px solid ${COLORS.border}`,
      boxShadow: '0 8px 30px rgba(0,0,0,0.03)',
    }}
  >
    {children}
  </motion.div>
);

const StatWidget = ({ title, value, trend, isUp, icon: Icon, color }: any) => (
  <GlassCard glowColor={`${color}15`}>
    <div className="flex justify-between items-start mb-4">
      <div className="p-3 rounded-[18px]" style={{ background: `${color}12`, color }}>
        <Icon size={22} />
      </div>
      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
        <TrendingUp size={12} className={isUp ? '' : 'rotate-180'} />
        {trend}
      </div>
    </div>
    <div className="flex flex-col">
      <span className="text-xs font-black uppercase tracking-widest mb-1" style={{ color: COLORS.textSecondary }}>{title}</span>
      <span className="text-3xl font-black" style={{ color: COLORS.textPrimary, letterSpacing: '-0.04em' }}>{value}</span>
    </div>
    <div className="mt-4 h-1.5 w-full bg-black/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }} 
        animate={{ width: '70%' }} 
        transition={{ duration: 1, ease: 'easeInOut' }}
        className="h-full rounded-full" 
        style={{ background: color }} 
      />
    </div>
  </GlassCard>
);

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 rounded-2xl shadow-2xl border bg-white/90 backdrop-blur-md" style={{ borderColor: COLORS.border }}>
        <p className="text-[11px] font-black uppercase tracking-wider mb-2" style={{ color: COLORS.textSecondary }}>{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1">
            <span className="text-xs font-bold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
              {entry.name}
            </span>
            <span className="text-sm font-black" style={{ color: COLORS.textPrimary }}>
              {entry.value.toLocaleString()}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// ── Screen: Dashboard (Overview) ──────────────────────────────────────
const DashboardView = () => {
  const [liveUsers, setLiveUsers] = useState(342);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => Math.max(300, prev + Math.floor(Math.random() * 7 - 3)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const trendData = [
    { name: '03.17', users: 1200, sales: 450 },
    { name: '03.18', users: 1500, sales: 620 },
    { name: '03.19', users: 1800, sales: 840 },
    { name: '03.20', users: 2400, sales: 1100 },
    { name: '03.21', users: 2100, sales: 950 },
    { name: '03.22', users: 2900, sales: 1350 },
    { name: '03.23', users: 3400, sales: 1620 },
  ];

  const pieData = [
    { name: '프리미엄 (PRO)', value: 400, color: COLORS.primary },
    { name: '베이직', value: 300, color: '#52b788' },
    { name: '무료', value: 300, color: COLORS.accent },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatWidget title="현재 접속자" value={liveUsers} trend="+12.5%" isUp color={COLORS.primary} icon={Activity} />
        <StatWidget title="누적 가입자" value="82.4K" trend="+4.3%" isUp color={COLORS.accent} icon={Users} />
        <StatWidget title="최근 수익" value="₩2.4M" trend="+18.2%" isUp color={COLORS.secondary} icon={DollarSign} />
        <StatWidget title="시스템 경고" value="3건" trend="-2%" isUp={false} color={COLORS.error} icon={AlertTriangle} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black" style={{ letterSpacing: '-0.03em' }}>성장 지표 시각화</h3>
              <p className="text-sm" style={{ color: COLORS.textSecondary }}>가입 유저 및 상점 매출 추세</p>
            </div>
          </div>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#999' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#999' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" name="신규 방문" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="sales" name="매출 건수" stroke={COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
           <h3 className="text-xl font-black mb-1" style={{ letterSpacing: '-0.03em' }}>멤버십 세그먼트</h3>
           <p className="text-sm mb-6" style={{ color: COLORS.textSecondary }}>사용자 티어 분포 비율</p>
           <div className="h-[220px] w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                 <span className="text-[10px] font-black uppercase text-black/40">총 유저</span>
                 <span className="text-2xl font-black text-black">1.0K</span>
              </div>
           </div>
           <div className="mt-6 space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs font-bold text-black/60">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-black/80">{((item.value / 1000) * 100).toFixed(0)}%</span>
                </div>
              ))}
           </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black">실시간 시스템 로그</h3>
            <button className="text-xs font-bold text-[#2d6a4f] hover:underline flex items-center gap-1">
              전체 보기 <ChevronRight size={14} />
            </button>
          </div>
          <div className="space-y-4">
            {[
              { id: 1, type: '보안', msg: '신규 관리자 "DayPoo_Admin" IP 접속 허용', time: '방금 전', color: COLORS.primary, icon: Shield },
              { id: 2, type: '결제', msg: '프리미엄 상점 황금 변기 아이템 결제 건수 증가', time: '5분 전', color: COLORS.accent, icon: ShoppingBag },
              { id: 3, type: '경고', msg: '마포구 인근 공중화장실 데이터 동기화 지연', time: '14분 전', color: COLORS.error, icon: AlertTriangle },
              { id: 4, type: '시스템', msg: '자동화 백업 및 AI 추천 로그 캐시 초기화 완료', time: '45분 전', color: COLORS.info, icon: RefreshCw },
            ].map((log) => (
              <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/[0.03] transition-colors hover:bg-black/[0.04]">
                <div className="p-2.5 rounded-xl border" style={{ borderColor: `${log.color}20`, color: log.color, background: `${log.color}08` }}>
                  <log.icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-0.5">
                    <span className="text-[10px] font-black tracking-widest" style={{ color: log.color }}>{log.type}</span>
                    <span className="text-[10px] text-black/30 font-bold">{log.time}</span>
                  </div>
                  <p className="text-sm font-bold text-black/80 truncate">{log.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-6">
           <GlassCard className="flex flex-col items-center justify-center text-center group cursor-pointer" glowColor={`${COLORS.primary}20`}>
              <div className="w-16 h-16 rounded-3xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6">
                 <Plus size={32} />
              </div>
              <h4 className="font-black text-lg">상점 아이템 추가</h4>
              <p className="text-xs text-black/40 mt-1">새로운 칭호나 아바타를<br/>단독 카탈로그에 등록하세요</p>
           </GlassCard>
           
           <GlassCard className="flex flex-col items-center justify-center text-center group cursor-pointer" glowColor={`${COLORS.error}20`}>
              <div className="w-16 h-16 rounded-3xl bg-[#FF4B4B]/10 text-[#FF4B4B] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                 <AlertTriangle size={32} />
              </div>
              <h4 className="font-black text-lg">신고 현황 확인</h4>
              <p className="text-xs text-black/40 mt-1">대기 중인 12건의<br/>화장실 신고를 긴급 처리하세요</p>
           </GlassCard>

           <div className="col-span-2 p-6 rounded-[24px] bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative shadow-xl shadow-green-900/30">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-1">시스템 최적화 점검</h4>
                <p className="text-sm text-white/70 mb-6">현재 리소스 캐싱 사용률이 높습니다.<br/>정리하여 퍼포먼스를 극대화하세요.</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 rounded-2xl bg-white text-[#1B4332] font-black text-xs shadow-xl"
                >
                  지금 즉시 최적화 실행
                </motion.button>
              </div>
              <Zap className="absolute -right-8 -bottom-8 w-48 h-48 opacity-10 rotate-12" />
           </div>
        </div>
      </div>
    </div>
  );
};

// ── Main Page Layout: Admin Dashboard ─────────────────────────────────
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { id: 'users', label: '유저 관리', icon: Users, badge: 12 },
    { id: 'toilets', label: '화장실 관리', icon: MapPin, badge: 4 },
    { id: 'cs', label: '고객 지원', icon: MessageSquare, badge: 7 },
    { id: 'store', label: '프리미엄 상점', icon: ShoppingBag },
    { id: 'system', label: '시스템 설정', icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden font-['Pretendard']" style={{ background: COLORS.background }}>
      
      {/* 🔮 Sidebar Navigation */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 96 : 300 }}
        className="h-full border-r bg-white/80 backdrop-blur-3xl z-30 transition-all flex flex-col py-8"
        style={{ borderColor: COLORS.border }}
      >
        <div className={`mb-12 px-6 flex items-center justify-between ${sidebarCollapsed ? 'justify-center mx-auto' : ''}`}>
          {!sidebarCollapsed && (
             <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-2xl font-black" style={{ fontFamily: "'SchoolSafetyNotification'", color: COLORS.primary, letterSpacing: '-0.05em' }}>
               Day<span style={{ color: COLORS.accent }}>.</span>Poo
               <span className="ml-2 px-2 py-0.5 text-[9px] bg-[#E8A838]/20 text-[#E8A838] rounded-lg">ADMIN</span>
             </motion.span>
          )}
          <button onClick={() => setSidebarCollapsed(!sidebarCollapsed)} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
            {sidebarCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
          </button>
        </div>

        <nav className="flex-1 w-full space-y-2 px-4">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as AdminTab)}
              className="group relative w-full flex items-center gap-4 px-4 py-4 rounded-2xl transition-all overflow-hidden"
              style={{ color: activeTab === item.id ? COLORS.primary : COLORS.textSecondary }}
            >
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTabBg"
                  className="absolute inset-0 bg-[#1B4332]/5 border-r-[4px] border-[#1B4332]"
                  transition={{ type: 'spring', stiffness: 350, damping: 30 }}
                />
              )}
              <div className={`relative z-10 p-1.5 rounded-xl transition-all ${activeTab === item.id ? 'bg-[#1B4332] text-white shadow-lg shadow-green-900/20' : 'group-hover:bg-black/5'}`}>
                <item.icon size={20} />
              </div>
              {!sidebarCollapsed && (
                <span className="relative z-10 text-sm font-black tracking-tight flex-1 text-left">{item.label}</span>
              )}
              {item.badge && !sidebarCollapsed && (
                <span className="relative z-10 text-[9px] font-black px-1.5 py-0.5 rounded-md bg-[#FF4B4B] text-white">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="w-full px-4 mt-auto">
           <button className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-red-50 text-red-500 font-bold text-sm">
             <div className="p-1.5 rounded-xl bg-red-100"><LogOut size={20} /></div>
             {!sidebarCollapsed && <span>로그아웃</span>}
           </button>
        </div>
      </motion.aside>

      {/* 🚀 Main Content Shell */}
      <main className="flex-1 h-full overflow-y-auto overflow-x-hidden relative flex flex-col">
          
          {/* 🧩 Header / TopBar */}
          <header className={`sticky top-0 z-20 px-8 py-5 flex items-center justify-between transition-all backdrop-blur-md border-b bg-white/40`} style={{ borderColor: COLORS.border }}>
             <div className="flex items-center gap-4">
               <div className="p-2.5 rounded-2xl bg-white shadow-sm border" style={{ borderColor: COLORS.border }}>
                  <LayoutDashboard size={20} style={{ color: COLORS.primary }} />
               </div>
               <div className="flex flex-col">
                 <h2 className="text-sm font-black text-black/90 uppercase tracking-widest">관리자 콘솔</h2>
                 <div className="flex items-center gap-2 text-[11px] text-black/40 font-bold">
                    <Calendar size={12} /> {currentTime.toLocaleDateString()}
                    <Clock size={12} className="ml-2" /> {currentTime.toLocaleTimeString()}
                 </div>
               </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center bg-black/[0.03] border px-4 py-2.5 rounded-2xl gap-2 focus-within:bg-white focus-within:ring-2 ring-[#1B4332]/20 transition-all" style={{ borderColor: COLORS.border }}>
                   <Search size={16} className="text-black/30" />
                   <input type="text" placeholder="통합 검색 (유저/신고/상점)" className="bg-transparent border-none outline-none text-xs font-bold w-56" />
                </div>
                
                <div className="flex items-center gap-3 pr-4 border-r" style={{ borderColor: COLORS.border }}>
                   <button className="p-2.5 rounded-2xl hover:bg-black/5 transition-colors relative">
                      <Bell size={20} className="text-black/50" />
                      <span className="absolute top-2.5 right-2.5 w-2.5 h-2.5 bg-[#FF4B4B] rounded-full ring-2 ring-white"></span>
                   </button>
                </div>

                <div className="flex items-center gap-3 group cursor-pointer pl-2">
                   <div className="text-right hidden sm:block">
                      <p className="text-sm font-black text-black/80 leading-none">시스템 마스터</p>
                      <p className="text-[10px] font-bold text-black/30 mt-1 uppercase tracking-tighter">최고 관리자 계정</p>
                   </div>
                   <div className="w-12 h-12 bg-gray-100 rounded-2xl overflow-hidden shadow-md border-2 border-[#1B4332]/20 group-hover:scale-105 transition-transform flex items-center justify-center">
                      <span className="text-xl">💩</span>
                   </div>
                </div>
             </div>
          </header>

          {/* 🌈 View Container */}
          <section className="flex-1 p-8">
             <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, scale: 0.98, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.98, y: -10 }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {activeTab === 'dashboard' && <DashboardView />}
                  {activeTab !== 'dashboard' && (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-50">
                       <LayoutDashboard size={64} className="mb-4 text-black/30" />
                       <h3 className="text-2xl font-black mb-2">{activeTab.toUpperCase()} 구역 접근 불가</h3>
                       <p className="text-sm font-bold text-black/60">현재 프리미엄 인터페이스로 업그레이드 중입니다.<br/>잠시 후 다시 시도해주세요.</p>
                       <button onClick={() => setActiveTab('dashboard')} className="mt-6 px-6 py-2 rounded-xl bg-black/10 hover:bg-black/20 font-bold text-sm transition-colors">
                          대시보드로 돌아가기
                       </button>
                    </div>
                  )}
                </motion.div>
             </AnimatePresence>
          </section>

      </main>

      {/* 🎇 Background Decoration */}
      <div className="fixed top-0 right-0 -z-10 w-[800px] h-[800px] bg-[#1B4332]/5 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2 pointer-events-none" />
      <div className="fixed bottom-0 left-0 -z-10 w-[600px] h-[600px] bg-[#E8A838]/5 blur-[120px] rounded-full -translate-x-1/2 translate-y-1/2 pointer-events-none" />
    </div>
  );
}
