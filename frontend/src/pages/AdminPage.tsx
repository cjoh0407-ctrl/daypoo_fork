import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard, Users, MapPin, MessageSquare,
  ShoppingBag, Settings, ChevronRight, ChevronLeft,
  TrendingUp, AlertTriangle, Activity, DollarSign,
  LogOut, Bell, RefreshCw, Plus, Shield, Zap, Search, Clock, Calendar,
  Navigation,
  Star,
  Maximize2,
  X,
  Home,
  Trash2
} from 'lucide-react';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from 'recharts';
import { useToilets } from '../hooks/useToilets';
import { ToiletData, MOCK_TOILETS } from '../types/toilet';
import { api } from '../services/apiClient';
import {
  AdminUserListResponse,
  AdminInquiryListResponse,
  AdminToiletListResponse,
  PageResponse,
  Role,
  InquiryStatus,
  ItemResponse,
  ItemType,
  AdminStatsResponse
} from '../types/admin';

// ── Shared Constants & Types ──────────────────────────────────────────
type AdminTab = 'dashboard' | 'users' | 'toilets' | 'cs' | 'store' | 'system' | 'add-item' | 'logs';

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
const GlassCard = ({ children, className = '', glowColor = 'rgba(27,67,50,0.05)', onClick }: { children: React.ReactNode, className?: string, glowColor?: string, onClick?: () => void }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    whileHover={{ y: -4, boxShadow: `0 20px 40px ${glowColor}` }}
    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    onClick={onClick}
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
const DashboardView = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [liveUsers, setLiveUsers] = useState(342);
  
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<AdminStatsResponse>('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('Admin stats fetch error', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setLiveUsers(prev => Math.max(300, prev + Math.floor(Math.random() * 7 - 3)));
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const trendData = stats?.weeklyTrend.map((d) => ({
    name: d.date,
    users: d.users,
    sales: d.sales
  })) || [];

  const pieData = [
    { name: '프리미엄 (PRO)', value: 400, color: COLORS.primary },
    { name: '베이직', value: 300, color: '#52b788' },
    { name: '무료', value: 300, color: COLORS.accent },
  ];

  const totalUsersCount = stats?.totalUsers || 0;

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <RefreshCw size={40} className="animate-spin text-[#1B4332] opacity-20" />
      <p className="text-sm font-black text-black/20 uppercase tracking-[0.3em]">Analyzing Real-time Data...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <div className="cursor-pointer" onClick={() => setActiveTab('users')}>
          <StatWidget title="현재 접속자" value={liveUsers} trend="+12.5%" isUp color={COLORS.primary} icon={Activity} />
        </div>
        <div className="cursor-pointer" onClick={() => setActiveTab('users')}>
          <StatWidget title="누적 가입자" value={(stats?.totalUsers || 0).toLocaleString()} trend="+4.3%" isUp color={COLORS.accent} icon={Users} />
        </div>
        <div className="cursor-pointer" onClick={() => setActiveTab('toilets')}>
          <StatWidget title="누적 화장실" value={(stats?.totalToilets || 0).toLocaleString()} trend="+5.2%" isUp color={COLORS.secondary} icon={MapPin} />
        </div>
        <div className="cursor-pointer" onClick={() => setActiveTab('cs')}>
          <StatWidget title="미답변 문의" value={`${stats?.pendingInquiries || 0}건`} trend="-2%" isUp={false} color={COLORS.error} icon={AlertTriangle} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-black" style={{ letterSpacing: '-0.03em' }}>성장 지표 시각화</h3>
              <p className="text-sm font-bold text-black/50">가입 유저 및 상점 매출 추세</p>
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
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#333' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fontWeight: 700, fill: '#333' }} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="users" name="신규 방문" stroke={COLORS.primary} strokeWidth={3} fillOpacity={1} fill="url(#colorUsers)" />
                <Area type="monotone" dataKey="sales" name="매출 건수" stroke={COLORS.accent} strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        <GlassCard>
           <h3 className="text-xl font-black mb-1 text-black" style={{ letterSpacing: '-0.03em' }}>멤버십 세그먼트</h3>
           <p className="text-sm mb-6 font-bold text-black/50">사용자 티어 분포 비율</p>
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
                 <span className="text-2xl font-black text-black">{(totalUsersCount / 1000).toFixed(1)}K</span>
              </div>
           </div>
           <div className="mt-6 space-y-3">
              {pieData.map((item) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                    <span className="text-xs font-bold text-black/70">{item.name}</span>
                  </div>
                  <span className="text-sm font-black text-black">{totalUsersCount > 0 ? ((item.value / totalUsersCount) * 100).toFixed(0) : 0}%</span>
                </div>
              ))}
           </div>
        </GlassCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <GlassCard>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-black text-black">실시간 시스템 로그</h3>
            <button 
              onClick={() => setActiveTab('logs')}
              className="text-xs font-bold text-[#1B4332] hover:underline flex items-center gap-1"
            >
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
                    <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: log.color }}>{log.type}</span>
                    <span className="text-[10px] text-black/30 font-bold">{log.time}</span>
                  </div>
                  <p className="text-sm font-bold text-black/80 truncate">{log.msg}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>

        <div className="grid grid-cols-2 gap-6">
           <GlassCard 
             onClick={() => setActiveTab('add-item')}
             className="flex flex-col items-center justify-center text-center group cursor-pointer" glowColor={`${COLORS.primary}20`}
           >
              <div className="w-16 h-16 rounded-3xl bg-[#1B4332]/10 text-[#1B4332] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:rotate-6">
                 <Plus size={32} />
              </div>
              <h4 className="font-black text-lg text-black">상점 아이템 추가</h4>
              <p className="text-xs text-black/50 font-bold mt-1 leading-tight">새로운 칭호나 아바타를<br/>단독 카탈로그에 등록하세요</p>
           </GlassCard>
           
           <GlassCard 
             onClick={() => setActiveTab('toilets')}
             className="flex flex-col items-center justify-center text-center group cursor-pointer" glowColor={`${COLORS.error}20`}
           >
              <div className="w-16 h-16 rounded-3xl bg-[#FF4B4B]/10 text-[#FF4B4B] flex items-center justify-center mb-4 transition-transform group-hover:scale-110 group-hover:-rotate-6">
                 <AlertTriangle size={32} />
              </div>
              <h4 className="font-black text-lg text-black">신고 현황 확인</h4>
              <p className="text-xs text-black/50 font-bold mt-1 leading-tight">대기 중인 12건의<br/>화장실 신고를 긴급 처리하세요</p>
           </GlassCard>

           <div className="col-span-2 p-6 rounded-[24px] bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] text-white overflow-hidden relative shadow-xl shadow-green-900/30">
              <div className="relative z-10">
                <h4 className="text-xl font-black mb-1">시스템 최적화 점검</h4>
                <p className="text-sm text-white font-bold mb-6">현재 리소스 캐싱 사용률이 높습니다.<br/>정리하여 퍼포먼스를 극대화하세요.</p>
                <motion.button 
                  whileHover={{ scale: 1.05 }} 
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setActiveTab('system')}
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

// ── Screen: Users Management ─────────────────────────────────────────
const UsersView = () => {
  const [users, setUsers] = useState<AdminUserListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
      });
      if (search) params.append('search', search);

      const response = await api.get<PageResponse<AdminUserListResponse>>(`/admin/users?${params}`);
      setUsers(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('유저 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, search]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setPage(0);
    fetchUsers();
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace('.', '');
  };

  const getRoleBadge = (role: Role) => {
    return role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-black">유저 데이터 센터</h3>
          <p className="text-sm text-black/60 font-bold">총 {totalElements.toLocaleString()}명의 사용자</p>
        </div>
        <div className="flex gap-2">
          <form onSubmit={handleSearch} className="flex gap-2">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="이메일 또는 닉네임 검색"
              className="px-4 py-2.5 rounded-2xl border bg-white/80 backdrop-blur-sm text-sm font-bold focus:ring-2 ring-[#1B4332]/20 outline-none"
            />
            <button type="submit" className="px-5 py-2.5 rounded-2xl bg-[#1B4332] text-white font-black text-xs shadow-lg">
              <Search size={16} />
            </button>
          </form>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
        </div>
      ) : (
        <>
          <GlassCard className="p-0 border-none bg-transparent shadow-none">
            <div className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl" style={{ borderColor: COLORS.border }}>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">사용자 정보</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">가입일</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">레벨</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">포인트</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">기록 수</th>
                    <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">관리</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} className="border-b transition-colors hover:bg-black/[0.01]" style={{ borderColor: COLORS.border }}>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-black/[0.05] flex items-center justify-center font-black text-black/60 text-xs">
                            {u.id}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-black text-sm text-[#1B4332]">{u.nickname}</span>
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                                u.role === 'ROLE_ADMIN'
                                  ? 'bg-red-100 text-red-600'
                                  : 'bg-black/5 text-black/40'
                              }`}>
                                {getRoleBadge(u.role)}
                              </span>
                            </div>
                            <p className="text-xs text-black/30 font-bold">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-sm font-bold text-black/60">{formatDate(u.createdAt)}</td>
                      <td className="px-8 py-5 font-black text-[#2D6A4F]">Lv.{u.level}</td>
                      <td className="px-8 py-5 font-black text-[#E8A838]">{u.points.toLocaleString()} P</td>
                      <td className="px-8 py-5 font-bold text-black/60">{u.recordCount}건</td>
                      <td className="px-8 py-5 text-right">
                        <button className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black/60 transition-colors">
                          <Settings size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={() => setPage(Math.max(0, page - 1))}
                disabled={page === 0}
                className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ── Recent Toilets Panel Component ────────────────────────────────────
const RecentToiletsPanel = () => {
  const [recentToilets, setRecentToilets] = useState<AdminToiletListResponse[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);

  useEffect(() => {
    const fetchRecentToilets = async () => {
      try {
        const response = await api.get<PageResponse<AdminToiletListResponse>>('/admin/toilets?page=0&size=5');
        setRecentToilets(response.content);
      } catch (error) {
        console.error('최근 화장실 목록 조회 실패:', error);
      } finally {
        setLoadingRecent(false);
      }
    };
    fetchRecentToilets();
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffHours < 1) return '방금 전';
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <div className="space-y-6">
      <GlassCard className="h-full">
        <div className="flex items-center justify-between mb-6">
          <h4 className="text-xl font-black text-black">최근 등록 화장실</h4>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#1B4332]/50">
            {recentToilets.length}건
          </span>
        </div>
        {loadingRecent ? (
          <div className="flex items-center justify-center py-10">
            <RefreshCw size={24} className="animate-spin text-[#1B4332]" />
          </div>
        ) : recentToilets.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-sm text-black/40 font-bold">등록된 화장실이 없습니다.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentToilets.map((toilet) => (
              <div
                key={toilet.id}
                className="p-5 rounded-[28px] border transition-all hover:border-[#1B4332]/20 hover:bg-[#1B4332]/[0.02]"
                style={{ borderColor: COLORS.border }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-green-50 text-green-600">
                      {toilet.is24h ? '24시간' : '시간제'}
                    </span>
                    {toilet.isUnisex && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-blue-50 text-blue-600">
                        남녀공용
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] text-black/50 font-bold italic">
                    {formatTimeAgo(toilet.createdAt)}
                  </span>
                </div>
                <p className="font-black text-sm mb-1 leading-tight text-black">{toilet.name}</p>
                <p className="text-[11px] font-bold text-black/60 mb-1">{toilet.address}</p>
                <p className="text-[10px] text-black/40 font-bold">
                  운영시간: {toilet.openHours || '정보 없음'}
                </p>
              </div>
            ))}
          </div>
        )}
        <div className="mt-8 pt-6 border-t border-dashed">
          <button className="w-full py-4 rounded-2xl border-2 border-dashed border-black/10 text-[11px] font-black text-black/30 hover:bg-black/[0.02] transition-colors">
            전체 화장실 목록 보기
          </button>
        </div>
      </GlassCard>
    </div>
  );
};

// ── Screen: Map & Toilets Management ──────────────────────────────────
const ToiletsView = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [selectedToilet, setSelectedToilet] = useState<ToiletData | null>(null);
  const [mapScale, setMapScale] = useState(3);
  const [mapCenter, setMapCenter] = useState({ lat: 37.5172, lng: 127.0473 }); // 강남구청 중심 소폭 조절

  const { toilets: apiToilets, loading } = useToilets({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
    radius: 1000,
    level: mapScale
  });

  // API 실패 시 fallback으로 MOCK_TOILETS 사용 (UI 깨짐 방지)
  const toilets = apiToilets.length > 0 ? apiToilets : MOCK_TOILETS;

  // 1. 지도 초기화
  useEffect(() => {
    if (!mapContainerRef.current) return;
    
    const { kakao } = window as any;
    if (!kakao) return;

    kakao.maps.load(() => {
      const options = {
        center: new kakao.maps.LatLng(mapCenter.lat, mapCenter.lng),
        level: mapScale
      };
      const map = new kakao.maps.Map(mapContainerRef.current, options);
      mapRef.current = map;

      // 지도 이동 시 센터 업데이트 (useToilets 훅 트리거)
      kakao.maps.event.addListener(map, 'idle', () => {
        const center = map.getCenter();
        setMapCenter({ lat: center.getLat(), lng: center.getLng() });
        setMapScale(map.getLevel());
      });
    });
  }, []);

  // 2. 마كر 업데이트
  useEffect(() => {
    if (!mapRef.current || !toilets) return;
    const { kakao } = window as any;

    // 기존 마커 제거
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    // 신규 마커 추가
    const newMarkers = toilets.map((t) => {
      const marker = new kakao.maps.Marker({
        position: new kakao.maps.LatLng(t.lat, t.lng),
        map: mapRef.current,
        title: t.name
      });

      kakao.maps.event.addListener(marker, 'click', () => {
        setSelectedToilet(t);
      });

      return marker;
    });

    markersRef.current = newMarkers;
  }, [toilets]);

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
              <div className="relative h-[750px] rounded-[32px] overflow-hidden border-4 border-white shadow-2xl">
                {/* Real Kakao Map Container */}
                <div id="map" ref={mapContainerRef} className="w-full h-full" />
                
                {/* Map Overlay Controls (Custom Style) */}
                <div className="absolute top-6 left-6 flex flex-col gap-2 z-10">
                   <div className="bg-white/90 backdrop-blur-md p-2 rounded-2xl border shadow-xl flex flex-col gap-1">
                      <button onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() - 1)} className="p-2 rounded-xl hover:bg-black/5 transition-colors text-[#1B4332]"><Plus size={18} /></button>
                      <button onClick={() => mapRef.current?.setLevel(mapRef.current.getLevel() + 1)} className="p-2 rounded-xl hover:bg-black/5 transition-colors font-black text-lg text-[#1B4332]" style={{ lineHeight: 1 }}>-</button>
                   </div>
                   <button onClick={() => {
                     if (navigator.geolocation) {
                       navigator.geolocation.getCurrentPosition((pos) => {
                         const latlng = new (window as any).kakao.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
                         mapRef.current?.setCenter(latlng);
                       });
                     }
                   }} className="bg-white/90 backdrop-blur-md p-3 rounded-2xl border shadow-xl hover:bg-white transition-colors">
                      <Navigation size={18} className="text-[#1B4332]" />
                   </button>
                </div>

                {/* Status Overlay */}
                <div className="absolute bottom-6 left-6 right-6 z-10">
                   <GlassCard className="bg-white/95 py-4 px-6">
                      <div className="flex items-center justify-between">
                         <div className="flex gap-4">
                            <div className="p-2.5 rounded-2xl bg-green-50 text-green-600">
                               <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                            </div>
                            <div>
                               <p className="text-xs font-black text-black/70">실시간 데이터 스트림</p>
                               <p className="text-sm font-black tracking-tight text-black">현재 영역 {toilets.length}개 노드 활성</p>
                            </div>
                         </div>
                         <div className="flex gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${loading ? 'bg-amber-400' : 'bg-green-500'} animate-pulse`} />
                            <span className="text-[10px] font-black uppercase text-black/60">{loading ? 'Syncing...' : 'Sync OK'}</span>
                         </div>
                      </div>
                   </GlassCard>
                </div>
             </div>

             {/* Selected Toilet Detail (Admin View) */}
             <AnimatePresence>
               {selectedToilet && (
                 <motion.div
                   initial={{ opacity: 0, y: 20 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: 20 }}
                 >
                   <GlassCard className="border-2 border-[#E8A838]/30">
                     <div className="flex justify-between items-start mb-6">
                       <div className="flex gap-4">
                         <div className="w-16 h-16 rounded-[24px] bg-[#1B4332]/5 flex items-center justify-center text-3xl">
                           💩
                         </div>
                         <div>
                           <div className="flex items-center gap-2 mb-1">
                             <h4 className="text-lg font-black">{selectedToilet.name}</h4>
                             <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-md font-bold text-black/40">ID: {selectedToilet.id}</span>
                           </div>
                           <p className="text-sm text-black/40 font-bold">{selectedToilet.roadAddress}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <div className="flex gap-0.5 text-[#E8A838]">
                               <Star size={14} fill="currentColor" />
                               <span className="text-xs font-black ml-1">{selectedToilet.rating || 0}</span>
                             </div>
                             <span className="text-[10px] text-black/20 font-black uppercase italic tracking-widest">Global Master Data</span>
                           </div>
                         </div>
                       </div>
                       <div className="flex gap-2">
                         <button className="px-4 py-2 rounded-xl bg-[#1B4332] text-white text-xs font-black shadow-lg shadow-green-900/20">수정</button>
                         <button onClick={() => setSelectedToilet(null)} className="p-2 rounded-xl hover:bg-black/5"><X size={18} /></button>
                       </div>
                     </div>
                     <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                       <div className="p-4 rounded-2xl bg-black/[0.02] border">
                         <p className="text-[10px] font-black text-black/30 mb-1">개방 시간</p>
                         <p className="text-xs font-black">{selectedToilet.openTime || '24시간'}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-black/[0.02] border">
                         <p className="text-[10px] font-black text-black/30 mb-1">방문 횟수</p>
                         <p className="text-xs font-black">{(selectedToilet.reviewCount || 0) * 12}회 (추산)</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-black/[0.02] border">
                         <p className="text-[10px] font-black text-black/30 mb-1">상태</p>
                         <p className="text-xs font-black text-green-500 italic">Operating Normal</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-black/[0.02] border">
                         <p className="text-[10px] font-black text-black/30 mb-1">신고 지수</p>
                         <p className="text-xs font-black text-red-500">가중치 0.02</p>
                       </div>
                     </div>
                   </GlassCard>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>

          <RecentToiletsPanel />
       </div>
    </div>
  );
};

// ── Screen: Customer Service ──────────────────────────────────────────
const CsView = () => {
  const [inquiries, setInquiries] = useState<AdminInquiryListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InquiryStatus | 'ALL'>('PENDING');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [pendingCount, setPendingCount] = useState(0);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('status', filter);

      const response = await api.get<PageResponse<AdminInquiryListResponse>>(`/admin/inquiries?${params}`);
      setInquiries(response.content);
      setTotalPages(response.totalPages);

      // 미답변 개수 별도 조회
      const pendingRes = await api.get<PageResponse<AdminInquiryListResponse>>(`/admin/inquiries?status=PENDING&page=0&size=1`);
      setPendingCount(pendingRes.totalElements);
    } catch (error) {
      console.error('문의 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries();
  }, [page, filter]);

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금 전';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-4">
          <div>
             <h3 className="text-2xl font-black text-black">고객 지원 센터</h3>
             <p className="text-sm text-black/60 font-bold">1:1 문의 관리 및 답변</p>
          </div>
          <div className="flex gap-2">
             <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'ALL'
                      ? 'bg-[#1B4332] text-white shadow-lg'
                      : 'bg-white border hover:bg-black/5'
                }`}
             >
                전체
             </button>
             <button
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'PENDING'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white border hover:bg-black/5'
                }`}
             >
                미답변 {pendingCount > 0 && `(${pendingCount})`}
             </button>
             <button
                onClick={() => setFilter('COMPLETED')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'COMPLETED'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white border hover:bg-black/5'
                }`}
             >
                답변 완료
             </button>
          </div>
       </div>

       {loading ? (
          <div className="flex items-center justify-center py-20">
             <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
          </div>
       ) : (
          <>
             <GlassCard className="p-0 border-none bg-transparent shadow-none">
                <div className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl" style={{ borderColor: COLORS.border }}>
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">사용자</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">문의 유형</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">제목</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">등록 시간</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">상태</th>
                            <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">관리</th>
                         </tr>
                      </thead>
                      <tbody>
                         {inquiries.map((inq) => (
                            <tr key={inq.id} className="border-b transition-colors hover:bg-black/[0.01]" style={{ borderColor: COLORS.border }}>
                               <td className="px-8 py-5">
                                  <div>
                                     <div className="font-black text-sm text-black">{inq.userName}</div>
                                     <div className="text-xs text-black/30 font-bold">{inq.userEmail}</div>
                                  </div>
                               </td>
                               <td className="px-8 py-5 text-sm font-bold text-black/60">{inq.type}</td>
                               <td className="px-8 py-5 font-bold text-black max-w-xs truncate">{inq.title}</td>
                               <td className="px-8 py-5 text-xs font-bold text-black/40">{formatTimeAgo(inq.createdAt)}</td>
                               <td className="px-8 py-5">
                                  <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                     inq.status === 'PENDING'
                                        ? 'bg-red-100 text-red-600'
                                        : 'bg-green-100 text-green-600'
                                  }`}>
                                     {inq.status === 'PENDING' ? '미답변' : '완료'}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button className="px-3 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-black hover:bg-[#2D6A4F] transition-colors">
                                     {inq.status === 'PENDING' ? '답변하기' : '상세보기'}
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </GlassCard>

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                   <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronLeft size={18} />
                   </button>
                   <span className="px-4 py-2 font-bold text-sm">
                      {page + 1} / {totalPages}
                   </span>
                   <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronRight size={18} />
                   </button>
                </div>
             )}
          </>
       )}
    </div>
  );
};

// ── Screen: Store & Items Management ──────────────────────────────────
const StoreView = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
  const [items, setItems] = useState<ItemResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<ItemType | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '12',
      });
      if (filter !== 'ALL') params.append('type', filter);

      const response = await api.get<PageResponse<ItemResponse>>(`/admin/shop/items?${params}`);
      setItems(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
    } catch (error) {
      console.error('아이템 목록 조회 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, [page, filter]);

  const handleDeleteItem = async (id: number, name: string) => {
    if (!confirm(`"${name}" 아이템을 삭제하시겠습니까?`)) return;

    try {
      await api.delete(`/admin/shop/items/${id}`);
      alert('아이템이 삭제되었습니다.');
      fetchItems();
    } catch (error: any) {
      alert(error.message || '아이템 삭제에 실패했습니다.');
    }
  };

  const getItemTypeColor = (type: ItemType) => {
    switch (type) {
      case 'TITLE': return '#E8A838';
      case 'AVATAR': return '#3B82F6';
      case 'EFFECT': return '#52b788';
      default: return '#1B4332';
    }
  };

  const getItemTypeLabel = (type: ItemType) => {
    switch (type) {
      case 'TITLE': return '칭호';
      case 'AVATAR': return '아바타';
      case 'EFFECT': return '이펙트';
      default: return type;
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-4">
          <div className="flex gap-4">
             <GlassCard className="py-2 px-4 shadow-none border-dashed bg-transparent" glowColor="transparent">
                <span className="text-[10px] font-black uppercase text-[#1B4332]/50 mr-2">총 아이템</span>
                <span className="font-black text-[#E8A838]">{totalElements}개</span>
             </GlassCard>
             <div className="flex gap-2">
                {(['ALL', 'TITLE', 'AVATAR', 'EFFECT'] as const).map((type) => (
                   <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${
                         filter === type
                            ? 'bg-[#1B4332] text-white shadow-lg'
                            : 'bg-white border hover:bg-black/5'
                      }`}
                   >
                      {type === 'ALL' ? '전체' : getItemTypeLabel(type as ItemType)}
                   </button>
                ))}
             </div>
          </div>
          <button onClick={() => setActiveTab('add-item')} className="flex items-center gap-2 px-6 py-3 bg-[#1B4332] text-white rounded-2xl font-black text-xs shadow-xl shadow-green-900/20">
             <Plus size={16} /> 신규 아이템 등록
          </button>
       </div>

       {loading ? (
          <div className="flex items-center justify-center py-20">
             <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
          </div>
       ) : items.length === 0 ? (
          <div className="text-center py-20">
             <ShoppingBag size={48} className="mx-auto mb-4 text-black/20" />
             <p className="font-bold text-black/40">등록된 아이템이 없습니다.</p>
          </div>
       ) : (
          <>
             <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                {items.map((item) => {
                   const color = getItemTypeColor(item.type);
                   return (
                      <GlassCard key={item.id} className="group cursor-pointer">
                         <div className="w-full aspect-square rounded-[24px] mb-4 bg-black/[0.02] flex items-center justify-center relative overflow-hidden">
                            {item.imageUrl ? (
                               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[24px]" />
                            ) : (
                               <>
                                  <div className="w-16 h-16 rounded-full blur-3xl opacity-20 absolute" style={{ background: color }} />
                                  <div className="p-6 transition-transform group-hover:scale-110 duration-500">
                                     <ShoppingBag size={48} style={{ color }} />
                                  </div>
                               </>
                            )}
                            <div className="absolute top-3 right-3 flex gap-1">
                               <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-white/90 border text-black/40">
                                  {getItemTypeLabel(item.type)}
                               </span>
                            </div>
                            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                               <button
                                  onClick={(e) => {
                                     e.stopPropagation();
                                     handleDeleteItem(item.id, item.name);
                                  }}
                                  className="p-1.5 rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors shadow-lg"
                               >
                                  <Trash2 size={14} />
                               </button>
                            </div>
                         </div>
                         <h5 className="font-black text-sm mb-1 text-black">{item.name}</h5>
                         <p className="text-xs text-black/50 mb-2 line-clamp-2 font-bold">{item.description}</p>
                         <p className="font-black text-lg mb-4" style={{ color }}>{item.price.toLocaleString()} P</p>
                         <div className="flex items-center justify-between border-t pt-4" style={{ borderColor: COLORS.border }}>
                            <span className="text-[9px] font-black text-black/40 uppercase tracking-widest">
                               {new Date(item.createdAt).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                            </span>
                            <span className="text-[10px] font-black italic text-green-500">판매중</span>
                         </div>
                      </GlassCard>
                   );
                })}
             </div>

             {/* Pagination */}
             {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2">
                   <button
                      onClick={() => setPage(Math.max(0, page - 1))}
                      disabled={page === 0}
                      className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronLeft size={18} />
                   </button>
                   <span className="px-4 py-2 font-bold text-sm">
                      {page + 1} / {totalPages}
                   </span>
                   <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-xl bg-white border hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronRight size={18} />
                   </button>
                </div>
             )}
          </>
       )}
    </div>
  );
};

// ── Screen: System Settings ───────────────────────────────────────────
const SystemView = () => {
  return (
    <div className="space-y-6">
       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
             <GlassCard>
                <h4 className="text-xl font-black mb-6 text-black">서버 리소스 인프라 필터</h4>
                <div className="h-[240px] w-full">
                   <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                         { name: 'Node 1', val: 78, color: '#1B4332' },
                         { name: 'Node 2', val: 92, color: '#FF4B4B' },
                         { name: 'Node 3', val: 45, color: '#E8A838' },
                         { name: 'Redis', val: 88, color: '#3B82F6' },
                         { name: 'PostGIS', val: 65, color: '#52b788' },
                      ]}>
                         <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.05} />
                         <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontStyle: 'italic', fontWeight: 'bold' }} />
                         <Tooltip cursor={{ fill: 'transparent' }} content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                               return (
                                  <div className="bg-white p-3 rounded-xl border-4 border-black/5 shadow-2xl font-black text-xs text-black">
                                     {payload[0].value}% 부하 발생 중
                                  </div>
                               );
                            }
                            return null;
                         }} />
                         <Bar dataKey="val" radius={[8, 8, 8, 8]} barSize={40}>
                            {
                               [1, 2, 3, 4, 5].map((_, i) => (
                                  <Cell key={`cell-${i}`} fillOpacity={0.8} fill={['#1B4332', '#FF4B4B', '#E8A838', '#3B82F6', '#52b788'][i]} />
                               ))
                            }
                         </Bar>
                      </BarChart>
                   </ResponsiveContainer>
                </div>
             </GlassCard>

             <GlassCard>
                <h4 className="text-xl font-black mb-6 text-black">보안 프로토콜 제어</h4>
                <div className="divide-y" style={{ borderColor: COLORS.border }}>
                   {[
                      { label: '2단계 인증(MFA) 강제 적용', desc: '모든 관리자 로그인 시 모바일 인증 필수', active: true },
                      { label: 'IP 화이트리스트 필터링', desc: '사내 지정 IP 대역 외 접근 전면 차단', active: false },
                      { label: '데이터 자동 백업 주기', desc: '매일 새벽 04:00 증분 백업 실행 중', active: true },
                   ].map((item, i) => (
                      <div key={i} className="py-5 flex items-center justify-between">
                         <div>
                            <p className="font-black text-sm text-black">{item.label}</p>
                            <p className="text-xs text-black/60 font-bold">{item.desc}</p>
                         </div>
                         <div className={`w-12 h-6 rounded-full transition-all relative ${item.active ? 'bg-[#1B4332]' : 'bg-black/10'}`}>
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${item.active ? 'right-1' : 'left-1'}`} />
                         </div>
                      </div>
                   ))}
                </div>
             </GlassCard>
          </div>

          <div className="space-y-6">
             <GlassCard className="border shadow-[0_20px_50px_rgba(27,67,50,0.1)]">
                <div className="mb-8 p-4 rounded-2xl bg-[#1B4332]/5 inline-block">
                   <Shield size={32} className="text-[#E8A838]" />
                </div>
                <h4 className="text-2xl font-black mb-2 tracking-tighter text-[#1B4332]">System Health</h4>
                <p className="text-[#2D6A4F] text-sm font-bold mb-8">모든 서비스 엔진이 정상 범주 내에서 응답하고 있습니다.</p>
                <div className="space-y-4">
                   <div className="p-4 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/10">
                      <p className="text-[10px] font-black uppercase text-[#E8A838] mb-2 tracking-widest">Uptime</p>
                      <p className="text-3xl font-black tracking-tighter text-[#1B4332]">99.98<span className="text-sm font-bold ml-1 text-[#2D6A4F]">%</span></p>
                   </div>
                   <div className="p-4 rounded-2xl bg-[#1B4332]/5 border border-[#1B4332]/10">
                      <p className="text-[10px] font-black uppercase text-[#E8A838] mb-2 tracking-widest">Latent Response</p>
                      <p className="text-3xl font-black tracking-tighter text-[#1B4332]">14<span className="text-sm font-bold ml-1 text-[#2D6A4F]">ms</span></p>
                   </div>
                </div>
             </GlassCard>
          </div>
       </div>
    </div>
  );
};


// ── Screen: Add Item Form ─────────────────────────────────────────────
const AddItemView = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <button onClick={() => setActiveTab('store')} className="p-2 rounded-xl hover:bg-black/5 transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h3 className="text-2xl font-black text-black">신규 상점 아이템 등록</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-1">
          <GlassCard className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-black/10 bg-black/[0.01]">
            <ShoppingBag size={48} className="text-black/10 mb-4" />
            <p className="text-xs font-black text-black/30">이미지 업로드 (PNG/GIF)</p>
          </GlassCard>
        </div>
        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">아이템 명칭</label>
                <input className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black" placeholder="예: 황금 변기 칭호" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">가격 (POOP POINT)</label>
                  <input className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black" placeholder="5,000" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">카테고리</label>
                  <select className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black">
                    <option>칭호</option>
                    <option>아바타 아이콘</option>
                    <option>특수 이펙트</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">아이템 설명</label>
                <textarea className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black" placeholder="아이템에 대한 상세 설명을 입력하세요..." />
              </div>
              <div className="pt-4 flex gap-4">
                <button className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20">등록 완료</button>
                <button onClick={() => setActiveTab('store')} className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black">취소</button>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </div>
  );
};

// ── Screen: System Logs View ──────────────────────────────────────────
const LogsView = () => {
  // TODO: 백엔드 로그 API 연동 시 실제 데이터로 교체 필요 (현재 UI 데모용 mock 데이터)
  const logs = [
    { id: 1, type: 'SECURITY', msg: 'Admin login detected from 192.168.0.1', time: '15:02:11', status: 'OK' },
    { id: 2, type: 'API', msg: 'GET /api/v1/toilets response 200', time: '15:01:45', status: 'OK' },
    { id: 3, type: 'DB', msg: 'PostGIS query took 42ms', time: '15:01:30', status: 'SLOW' },
    { id: 4, type: 'AUTH', msg: 'JWT Token refreshed for user id: 402', time: '15:00:55', status: 'OK' },
    { id: 5, type: 'WARN', msg: 'Cache hit rate dropped below 80%', time: '14:58:22', status: 'WARN' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-black text-black">실시간 시스템 로그</h3>
          <p className="text-sm font-bold text-black/40">백엔드 및 인프라 엔진의 모든 런타임 이벤트를 모니터링합니다.</p>
        </div>
        <button className="px-4 py-2 rounded-xl bg-black text-white font-black text-[10px] uppercase shadow-lg">Export CSV</button>
      </div>
      <GlassCard className="p-0 border-none bg-transparent shadow-none">
        <div className="overflow-x-auto rounded-[28px] border bg-white/50 backdrop-blur-xl" style={{ borderColor: COLORS.border }}>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-black/[0.02] border-b" style={{ borderColor: COLORS.border }}>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">Timestamp</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">Type</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40">Message</th>
                <th className="px-8 py-5 text-[11px] font-black uppercase tracking-widest text-black/40 text-right">Status</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b transition-colors hover:bg-black/[0.01]" style={{ borderColor: COLORS.border }}>
                  <td className="px-8 py-5 text-xs font-bold text-black/60">{log.time}</td>
                  <td className="px-8 py-5 text-[10px] font-black text-black/30 tracking-widest">{log.type}</td>
                  <td className="px-8 py-5 text-sm font-black text-black">{log.msg}</td>
                  <td className="px-8 py-5 text-right flex justify-end">
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black ${log.status === 'OK' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{log.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
};

// ── Main Page Layout: Admin Dashboard ─────────────────────────────────
export function AdminPage() {
  const navigate = useNavigate();
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');

  if (loading) return <div className="h-screen flex items-center justify-center bg-[#f8faf9] text-[#1B4332] font-black tracking-widest text-xl">LOADING ENGINE...</div>;
  if (!user || (user.role !== 'ROLE_ADMIN' && user.role !== 'ADMIN')) {
    return <Navigate to="/404-not-found-unauthorized" replace />;
  }

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
             <motion.span 
               onClick={() => setActiveTab('dashboard')} 
               initial={{ opacity: 0 }} 
               animate={{ opacity: 1 }} 
               className="text-2xl font-black cursor-pointer" 
               style={{ fontFamily: "'SchoolSafetyNotification'", color: COLORS.primary, letterSpacing: '-0.05em' }}
             >
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

        <div className="w-full px-4 mt-auto space-y-1">
           <button 
             onClick={() => navigate('/')}
             className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-emerald-50 text-emerald-600 font-bold text-sm"
           >
             <div className="p-1.5 rounded-xl bg-emerald-100"><Home size={20} /></div>
             {!sidebarCollapsed && <span>메인 페이지로</span>}
           </button>
           <button 
             onClick={logout}
             className="w-full py-4 rounded-2xl flex items-center gap-4 px-4 transition-colors hover:bg-red-50 text-red-500 font-bold text-sm"
           >
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
                  {activeTab === 'dashboard' ? <LayoutDashboard size={20} style={{ color: COLORS.primary }} /> : 
                   activeTab === 'users' ? <Users size={20} style={{ color: COLORS.primary }} /> :
                   activeTab === 'toilets' ? <MapPin size={20} style={{ color: COLORS.primary }} /> :
                   activeTab === 'cs' ? <MessageSquare size={20} style={{ color: COLORS.primary }} /> :
                   activeTab === 'store' ? <ShoppingBag size={20} style={{ color: COLORS.primary }} /> :
                   <Settings size={20} style={{ color: COLORS.primary }} />}
               </div>
               <div className="flex flex-col">
                     <h2 className="text-sm font-black text-black/90 uppercase tracking-widest">
                       {activeTab === 'dashboard' ? '관리자 대시보드' : 
                        activeTab === 'users' ? '유저 제어 센터' :
                        activeTab === 'toilets' ? '맵 엔진 관제' :
                        activeTab === 'cs' ? '고객 통합 지원' :
                        activeTab === 'store' ? '프리미엄 샵 관리' :
                        activeTab === 'add-item' ? '신규 아이템 카탈로그' :
                        activeTab === 'logs' ? '시스템 런타임 로그' :
                        '시스템 인프라 설정'}
                     </h2>
                 <div className="flex items-center gap-2 text-[11px] text-black/40 font-bold">
                    <Calendar size={12} /> {currentTime.toLocaleDateString()}
                    <Clock size={12} className="ml-2" /> {currentTime.toLocaleTimeString()}
                 </div>
               </div>
             </div>

             <div className="flex items-center gap-6">
                <div className="hidden md:flex items-center bg-black/[0.03] border px-4 py-2.5 rounded-2xl gap-2 focus-within:bg-white focus-within:ring-2 ring-[#1B4332]/20 transition-all z-30 relative" style={{ borderColor: COLORS.border }}>
                   <Search size={16} className="text-black/30" />
                   <input 
                     type="text" 
                     value={globalSearch}
                     onChange={(e) => setGlobalSearch(e.target.value)}
                     placeholder="통합 검색 (유저/신고/상점)" 
                     className="bg-transparent border-none outline-none text-xs font-bold w-56" 
                   />
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
                  {activeTab === 'dashboard' && <DashboardView setActiveTab={setActiveTab} />}
                  {activeTab === 'users' && <UsersView />}
                  {activeTab === 'toilets' && <ToiletsView />}
                  {activeTab === 'cs' && <CsView />}
                  {activeTab === 'store' && <StoreView setActiveTab={setActiveTab} />}
                  {activeTab === 'system' && <SystemView />}
                  {activeTab === 'add-item' && <AddItemView setActiveTab={setActiveTab} />}
                  {activeTab === 'logs' && <LogsView />}
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
