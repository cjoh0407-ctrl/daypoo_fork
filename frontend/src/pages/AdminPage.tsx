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
  Trash2,
  Database
} from 'lucide-react';
import WaveButtonComponent from '../components/WaveButton';
import {
  AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis
} from 'recharts';
import { useToilets } from '../hooks/useToilets';
import { ToiletData } from '../types/toilet';
import { api } from '../services/apiClient';
import {
  AdminUserListResponse,
  AdminUserDetailResponse,
  AdminInquiryListResponse,
  AdminInquiryDetailResponse,
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

const StatWidget = ({ title, value, trend, isUp, icon: Icon, color, progress = 0, badge }: any) => {
  return (
    <GlassCard 
      glowColor={`${color}15`}
      className="group transition-all duration-500 hover:border-black/5 hover:-translate-y-1.5"
    >
      <div className="flex justify-between items-start mb-6">
        <div className="p-3.5 rounded-2xl transition-all duration-500 group-hover:scale-110 group-hover:rotate-6" style={{ background: `${color}10`, color }}>
          <Icon size={24} />
        </div>
        <div className="flex flex-col items-end gap-2">
          {badge && (
             <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-tighter bg-black text-white">{badge}</span>
          )}
          <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-[10px] font-black tracking-tight ${isUp ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingUp size={12} className="rotate-180" />}
            {trend}
          </div>
        </div>
      </div>
      <div className="flex flex-col mb-6">
        <span className="text-[11px] font-black uppercase tracking-[0.2em] mb-1.5" style={{ color: COLORS.textSecondary }}>{title}</span>
        <span className="text-4xl font-black text-black tracking-tighter" style={{ letterSpacing: '-0.05em' }}>{value}</span>
      </div>
      
      {/* 🚀 Gauge Bar Implementation */}
      <div className="mt-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[9px] font-black opacity-40 uppercase tracking-widest">Efficiency Index</span>
          <span className="text-[10px] font-black" style={{ color }}>{progress}%</span>
        </div>
        <div className="h-2 w-full bg-black/5 rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1.5, ease: [0.33, 1, 0.68, 1] }}
            className="h-full rounded-full relative"
            style={{ backgroundColor: color }}
          >
             <motion.div 
               animate={{ opacity: [0.4, 0.8, 0.4] }}
               transition={{ duration: 2, repeat: Infinity }}
               className="absolute inset-0 bg-white/20"
             />
          </motion.div>
        </div>
      </div>
    </GlassCard>
  );
};

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
const DashboardView = ({ stats, loading, setActiveTab }: { stats: AdminStatsResponse | null, loading: boolean, setActiveTab: (tab: AdminTab) => void }) => {
  const [liveUsers, setLiveUsers] = useState(342);
  
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

  const usersSpark = (stats?.weeklyTrend || []).map(d => ({ v: d.users }));
  const salesSpark = (stats?.weeklyTrend || []).map(d => ({ v: d.sales }));
  const inquiriesSpark = (stats?.weeklyTrend || []).map(d => ({ v: d.inquiries }));
  const toiletSpark = [12, 15, 18, 22, 25, 28, 32].map(v => ({ v })); // Mock trend

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-40 gap-4">
      <RefreshCw size={40} className="animate-spin text-[#1B4332] opacity-20" />
      <p className="text-sm font-black text-black/20 uppercase tracking-[0.3em]">Analyzing Real-time Data...</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-20">
      {/* 🍱 Bento Grid: Top Section (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="md:col-span-2 lg:col-span-1" onClick={() => setActiveTab('users')}>
           <StatWidget 
             title="현재 접속자" 
             value={liveUsers} 
             trend="+12%" 
             isUp 
             color={COLORS.info} 
             icon={Activity} 
             progress={Math.min(100, Math.floor((liveUsers / 500) * 100))}
             badge="Live"
           />
        </div>
        <div onClick={() => setActiveTab('users')}>
           <StatWidget 
             title="누적 사용자" 
             value={(stats?.totalUsers || 0).toLocaleString()} 
             trend="+4.3%" 
             isUp 
             color={COLORS.primary} 
             icon={Users} 
             progress={78} 
           />
        </div>
        <div onClick={() => setActiveTab('toilets')}>
           <StatWidget 
             title="관리 화장실" 
             value={(stats?.totalToilets || 0).toLocaleString()} 
             trend="+12" 
             isUp 
             color={COLORS.accent} 
             icon={MapPin} 
             progress={64} 
           />
        </div>
        <div onClick={() => setActiveTab('cs')}>
           <StatWidget 
             title="미답변 문의" 
             value={`${stats?.pendingInquiries || 0}`} 
             trend="-5%" 
             isUp={false} 
             color={COLORS.error} 
             icon={MessageSquare} 
             progress={Math.max(10, Math.min(100, (stats?.pendingInquiries || 0) * 10))} 
             badge={stats?.pendingInquiries && stats.pendingInquiries > 0 ? "Urgent" : undefined}
           />
        </div>
      </div>

      {/* 📊 Bento Grid: Main Analytics Section */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Growth Chart */}
        <GlassCard className="lg:col-span-8 group">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-xl font-black text-black">핵심 성장 지표</h3>
              <p className="text-xs font-bold text-black/40 uppercase tracking-widest mt-1">Growth & Revenue Analytics</p>
            </div>
            <div className="flex gap-2">
               <button className="px-3 py-1.5 rounded-lg bg-black/5 text-[10px] font-black hover:bg-black/10 transition-colors">7D</button>
               <button className="px-3 py-1.5 rounded-lg text-[10px] font-black text-black/40 hover:bg-black/5 transition-colors">30D</button>
            </div>
          </div>
          <div className="h-[380px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 20, right: 20, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.accent} stopOpacity={0.25}/>
                    <stop offset="95%" stopColor={COLORS.accent} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.03)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(0,0,0,0.2)' }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: 'rgba(0,0,0,0.2)' }} />
                <Tooltip content={<CustomTooltip />} cursor={{ stroke: 'rgba(0,0,0,0.05)', strokeWidth: 2 }} />
                <Area 
                  type="monotone" 
                  dataKey="users" 
                  name="신규 방문" 
                  stroke={COLORS.primary} 
                  strokeWidth={4} 
                  fill="url(#colorUsers)" 
                  animationDuration={2500} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.primary }}
                />
                <Area 
                  type="monotone" 
                  dataKey="sales" 
                  name="유료 결제" 
                  stroke={COLORS.accent} 
                  strokeWidth={4} 
                  fill="url(#colorSales)" 
                  animationDuration={2500} 
                  activeDot={{ r: 6, strokeWidth: 0, fill: COLORS.accent }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Membership Segment & Service Health */}
        <div className="lg:col-span-4 space-y-6">
          <GlassCard className="h-fit">
            <h3 className="text-lg font-black text-black mb-1">사용자 분포</h3>
            <p className="text-[10px] font-black text-black/30 uppercase tracking-widest mb-6">User Segments</p>
            <div className="h-[200px] w-full relative">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={pieData} innerRadius={65} outerRadius={85} paddingAngle={10} dataKey="value" stroke="none">
                     {pieData.map((entry, index) => <Cell key={index} fill={entry.color} />)}
                   </Pie>
                   <Tooltip />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-[10px] font-black text-black/30 uppercase">Total</span>
                  <span className="text-2xl font-black text-black">{(totalUsersCount / 1000).toFixed(1)}K</span>
               </div>
            </div>
            <div className="mt-6 grid grid-cols-1 gap-2">
               {pieData.map((item) => (
                 <div key={item.name} className="flex items-center justify-between p-2.5 rounded-xl hover:bg-black/5 transition-colors">
                   <div className="flex items-center gap-3">
                     <div className="w-2.5 h-2.5 rounded-full" style={{ background: item.color }} />
                     <span className="text-xs font-black text-black/60">{item.name}</span>
                   </div>
                   <span className="text-xs font-black text-black">{totalUsersCount > 0 ? ((item.value / totalUsersCount) * 100).toFixed(0) : 0}%</span>
                 </div>
               ))}
            </div>
          </GlassCard>

          <GlassCard className="bg-white border border-black/5 relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                   <div className="p-2 rounded-xl bg-[#1B4332]/10 text-[#1B4332]"><Shield size={20} /></div>
                   <span className="text-[10px] font-black text-black uppercase tracking-widest">Engine Healthy</span>
                </div>
                <h4 className="text-lg font-black mb-1 text-black">시스템 최적화</h4>
                <p className="text-xs font-bold text-black mb-6">리소스 사용량 82% 임계치 접근</p>
                <button 
                  onClick={() => setActiveTab('system')}
                  className="w-full py-3 bg-[#1B4332] text-white rounded-xl text-[11px] font-black transition-all hover:bg-[#E8A838] shadow-lg shadow-green-900/20"
                >
                  엔진 가속 실행
                </button>
             </div>
             <Zap className="absolute -right-8 -bottom-8 w-32 h-32 opacity-[0.03] group-hover:scale-110 transition-transform duration-700 pointer-events-none" />
          </GlassCard>
        </div>
      </div>

      {/* 🚀 Bento Grid: Bottom Section (Logs & Quick Actions) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Real-time Logs List */}
        <GlassCard className="lg:col-span-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-black text-black">시스템 타임라인</h3>
              <p className="text-[10px] font-black text-black/30 uppercase tracking-widest">Real-time Events</p>
            </div>
            <button onClick={() => setActiveTab('logs')} className="p-2 rounded-xl hover:bg-black/5 text-black/30 transition-all"><ChevronRight size={20} /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {[
               { id: 1, type: 'Security', msg: '신규 관리자 "admin2" 접속 허용', time: '방금 전', color: COLORS.primary, icon: Shield },
               { id: 2, type: 'Payment', msg: '프리미엄 멤버십 자동 갱신 (14건)', time: '5분 전', color: COLORS.accent, icon: ShoppingBag },
               { id: 3, type: 'Warning', msg: '화장실 데이터 동기화 지연 감지', time: '12분 전', color: COLORS.error, icon: AlertTriangle },
               { id: 4, type: 'System', msg: 'AI 분석 모델 성능 업데이트 완료', time: '42분 전', color: COLORS.info, icon: Zap },
             ].map((log) => (
               <div key={log.id} className="flex items-start gap-4 p-4 rounded-2xl bg-black/[0.02] border border-black/5 hover:border-black/10 transition-all">
                 <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${log.color}10`, color: log.color }}><log.icon size={18} /></div>
                 <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                       <span className="text-[9px] font-black tracking-widest uppercase" style={{ color: log.color }}>{log.type}</span>
                       <span className="text-[9px] text-black/30 font-bold">{log.time}</span>
                    </div>
                    <p className="text-[13px] font-bold text-black/80 truncate">{log.msg}</p>
                 </div>
               </div>
             ))}
          </div>
        </GlassCard>

        {/* Quick Actions Grid */}
        <div className="grid grid-cols-2 gap-4">
           <div 
             onClick={() => setActiveTab('add-item')}
             className="relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#1B4332]/30 group transition-all"
           >
              <div className="w-12 h-12 rounded-2xl bg-[#1B4332]/5 text-[#1B4332] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><Plus size={24} /></div>
              <span className="text-sm font-black text-black">아이템 등록</span>
           </div>
           <div 
             onClick={() => setActiveTab('toilets')}
             className="relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#E8A838]/30 group transition-all"
           >
              <div className="w-12 h-12 rounded-2xl bg-[#E8A838]/5 text-[#E8A838] flex items-center justify-center mb-3 group-hover:scale-110 transition-transform"><MapPin size={24} /></div>
              <span className="text-sm font-black text-black">맵 관제</span>
           </div>
           <div 
             onClick={() => setActiveTab('cs')}
             className="col-span-2 relative overflow-hidden rounded-[24px] p-6 bg-white border border-black/5 flex items-center gap-6 cursor-pointer hover:border-blue-500/30 group transition-all"
           >
              <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:rotate-12 transition-transform"><MessageSquare size={28} /></div>
              <div className="text-left">
                 <h4 className="text-base font-black text-black">고객 지원 센터</h4>
                 <p className="text-xs font-bold text-black/40">미해결 티켓: {stats?.pendingInquiries || 0}건</p>
              </div>
              <ChevronRight size={20} className="ml-auto text-black/10 group-hover:text-black/30 transition-all" />
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
  const [showUserModal, setShowUserModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState<AdminUserListResponse | null>(null);
  const [userDetail, setUserDetail] = useState<AdminUserDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

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

  const handleOpenUserDetail = async (user: AdminUserListResponse) => {
    setSelectedUser(user);
    setShowUserModal(true);
    setLoadingDetail(true);
    try {
      const detail = await api.get<AdminUserDetailResponse>(`/admin/users/${user.id}`);
      setUserDetail(detail);
    } catch (error: any) {
      console.error('유저 상세 조회 실패:', error);
      console.error('Error response:', error.response);
      const errorMsg = error.response?.data?.message || error.message || '알 수 없는 오류';
      alert(`유저 정보를 불러오는데 실패했습니다.\n상세: ${errorMsg}`);
      setShowUserModal(false); // 에러 시 모달 닫기
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleUpdateUserRole = async (userId: number, newRole: Role) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      alert('역할이 변경되었습니다.');
      setShowUserModal(false);
      fetchUsers(); // 목록 새로고침
    } catch (error: any) {
      console.error('역할 변경 실패:', error);
      alert('역할 변경에 실패했습니다.');
    }
  };

  const handleDeleteUser = async (userId: number, userEmail: string) => {
    const confirmed = window.confirm(
      `정말로 이 사용자를 탈퇴시키겠습니까?\n\n` +
      `이메일: ${userEmail}\n\n` +
      `⚠️ 경고: 모든 데이터가 영구적으로 삭제되며 복구할 수 없습니다.`
    );

    if (!confirmed) return;

    try {
      await api.delete(`/admin/users/${userId}`);
      alert('사용자가 성공적으로 탈퇴되었습니다.');
      setShowUserModal(false);
      fetchUsers(); // 목록 새로고침
    } catch (error: any) {
      console.error('사용자 삭제 실패:', error);
      alert('탈퇴 처리 중 오류가 발생했습니다. (권한 또는 데이터 제약 조건 확인 필요)');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.');
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
              className="px-4 py-2.5 rounded-2xl border bg-white/80 backdrop-blur-sm text-sm font-bold text-[#1A2B27] focus:ring-2 ring-[#1B4332]/20 outline-none"
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
                        <button
                          onClick={() => handleOpenUserDetail(u)}
                          className="p-2 rounded-xl hover:bg-black/5 text-black/20 hover:text-black/60 transition-colors"
                        >
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
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="px-4 py-2 font-bold text-sm text-black">
                {page + 1} / {totalPages}
              </span>
              <button
                onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                disabled={page >= totalPages - 1}
                className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          )}
        </>
      )}

      {/* User Detail Modal */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white rounded-3xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-[#1B4332]">유저 상세 정보</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              {loadingDetail ? (
                <div className="flex items-center justify-center py-20">
                  <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                </div>
              ) : userDetail ? (
                <div className="space-y-6">
                  {/* User Info Grid */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">이메일</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.email}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">닉네임</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.nickname}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">레벨</p>
                      <p className="text-sm font-black text-[#2D6A4F]">Lv.{userDetail.level}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">경험치</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.exp?.toLocaleString() || 0} EXP</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">포인트</p>
                      <p className="text-sm font-black text-[#E8A838]">{userDetail.points.toLocaleString()} P</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">기록 수</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.recordCount}건</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">결제 횟수</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.paymentCount || 0}회</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">총 결제 금액</p>
                      <p className="text-sm font-bold text-black/80">{userDetail.totalPaymentAmount?.toLocaleString() || 0}원</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">가입일</p>
                      <p className="text-sm font-bold text-black/80">{formatDate(userDetail.createdAt)}</p>
                    </div>
                    <div className="bg-black/[0.02] rounded-2xl p-4">
                      <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">최근 수정일</p>
                      <p className="text-sm font-bold text-black/80">{formatDate(userDetail.updatedAt)}</p>
                    </div>
                  </div>

                  {/* Role Change */}
                  <div className="bg-black/[0.02] rounded-2xl p-6">
                    <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-4">계정 설정 및 관리</p>
                    <div className="flex flex-col gap-6">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-bold text-black/60 mb-2">현재 역할</p>
                          <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                            userDetail.role === 'ROLE_ADMIN'
                              ? 'bg-red-100 text-red-600'
                              : 'bg-black/5 text-black/40'
                          }`}>
                            {userDetail.role === 'ROLE_ADMIN' ? 'ADMIN' : 'USER'}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_USER')}
                            disabled={userDetail.role === 'ROLE_USER'}
                            className="px-4 py-2 rounded-xl bg-black/5 text-black/60 text-xs font-black hover:bg-black/10 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            USER로 변경
                          </button>
                          <button
                            onClick={() => handleUpdateUserRole(userDetail.id, 'ROLE_ADMIN')}
                            disabled={userDetail.role === 'ROLE_ADMIN'}
                            className="px-4 py-2 rounded-xl bg-red-100 text-red-600 text-xs font-black hover:bg-red-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                          >
                            ADMIN으로 변경
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* User Delete */}
                  <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-xl bg-red-100">
                        <Trash2 size={20} className="text-red-600" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-black text-red-900 mb-1">위험 구역</p>
                        <p className="text-xs text-red-700 mb-4">
                          사용자를 영구적으로 삭제합니다. 이 작업은 되돌릴 수 없습니다.
                        </p>
                        <button
                          onClick={() => handleDeleteUser(userDetail.id, userDetail.email)}
                          className="px-4 py-2 rounded-xl bg-red-600 text-white text-xs font-black hover:bg-red-700 transition-colors flex items-center gap-2"
                        >
                          <Trash2 size={14} />
                          회원 탈퇴시키기
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="text-center text-black/40 py-10">유저 정보를 불러올 수 없습니다.</p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const [syncing, setSyncing] = useState(false);

  const { toilets: apiToilets, loading, refetch } = useToilets({
    lat: mapCenter.lat,
    lng: mapCenter.lng,
    radius: 1000,
    level: mapScale
  });

  // API에서 받은 데이터 사용 (빈 배열일 경우 "데이터 없음" UI 표시)
  const toilets = apiToilets;

  const handleSyncToilets = async () => {
    if (syncing) return;

    const confirmed = confirm(
      '공공데이터 API로부터 전국 화장실 데이터를 가져옵니다.\n' +
      '범위: 1~500 페이지 (약 5,000개 이상)\n' +
      '소요 시간: 1~3분\n\n' +
      '진행하시겠습니까?'
    );

    if (!confirmed) return;

    setSyncing(true);
    try {
      const response = await api.post('/admin/sync-toilets?startPage=1&endPage=500');
      alert(`동기화 완료!\n${response || '데이터가 성공적으로 동기화되었습니다.'}`);
      // 동기화 후 지도 새로고침
      refetch();
    } catch (error: any) {
      console.error('화장실 데이터 동기화 실패:', error);
      const errorMessage = error.message || '동기화 중 오류가 발생했습니다.';
      alert(`동기화 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    } finally {
      setSyncing(false);
    }
  };

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

  // 2. 마커 업데이트
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

                {/* Top Action Buttons */}
                <div className="absolute top-6 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
                  <WaveButtonComponent
                    onClick={handleSyncToilets}
                    disabled={syncing}
                    variant={syncing ? 'accent' : 'primary'}
                    size="md"
                    className="shadow-xl backdrop-blur-md"
                    icon={syncing ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                  >
                    {syncing ? '동기화 중...' : '공공데이터 동기화'}
                  </WaveButtonComponent>
                  <button
                    onClick={() => alert('전체 화장실 목록 기능은 준비 중입니다.')}
                    className="px-6 py-3 rounded-2xl border-2 bg-white/90 backdrop-blur-md border-black/10 text-xs font-black text-black/60 hover:bg-white hover:border-[#1B4332]/30 hover:text-[#1B4332] transition-all shadow-xl"
                  >
                    <span className="flex items-center gap-2">
                      <MapPin size={14} />
                      전체 목록
                    </span>
                  </button>
                </div>

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
                             <h4 className="text-lg font-black text-[#1A2B27]">{selectedToilet.name}</h4>
                             <span className="text-[10px] bg-black/5 px-2 py-0.5 rounded-md font-bold text-black/60">ID: {selectedToilet.id}</span>
                           </div>
                           <p className="text-sm text-black/60 font-bold">{selectedToilet.roadAddress}</p>
                           <div className="flex items-center gap-2 mt-2">
                             <div className="flex gap-0.5 text-[#E8A838]">
                               <Star size={14} fill="currentColor" />
                               <span className="text-xs font-black ml-1 text-[#1A2B27]">{selectedToilet.rating || 0}</span>
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
                          <p className="text-xs font-black text-[#1A2B27]">{selectedToilet.openTime || '24시간'}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-black/[0.02] border">
                         <p className="text-[10px] font-black text-black/30 mb-1">방문 횟수</p>
                          <p className="text-xs font-black text-[#1A2B27]">{(selectedToilet.reviewCount || 0) * 12}회 (추산)</p>
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
const CsView = ({ stats, onStatsRefresh }: { stats: AdminStatsResponse | null, onStatsRefresh: () => void }) => {
  const [inquiries, setInquiries] = useState<AdminInquiryListResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<InquiryStatus | 'ALL'>('ALL');
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [showInquiryModal, setShowInquiryModal] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AdminInquiryListResponse | null>(null);
  const [inquiryDetail, setInquiryDetail] = useState<AdminInquiryDetailResponse | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [answerText, setAnswerText] = useState('');
  const [submittingAnswer, setSubmittingAnswer] = useState(false);
  const [generatingData, setGeneratingData] = useState(false);

  const fetchInquiries = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '10',
      });
      if (filter !== 'ALL') params.append('status', filter);

      console.log(`[AdminInquiry] Fetching inquiries with params: ${params.toString()}`);
      const response = await api.get<PageResponse<AdminInquiryListResponse>>(`/admin/inquiries?${params}`);
      console.log('[AdminInquiry] Response received:', response);

      setInquiries(response.content || []);
      setTotalPages(response.totalPages || 0);
    } catch (error: any) {
      console.error('문의 목록 조회 실패:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        status: error.status,
        stack: error.stack
      });

      // 빈 데이터로 초기화하여 UI가 깨지지 않도록 함
      setInquiries([]);
      setTotalPages(0);

      // 서버 에러인 경우에만 alert 표시 (404나 빈 데이터는 조용히 처리)
      if (error.status && error.status >= 500) {
        const errorMessage = error.message || '서버 오류가 발생했습니다.';
        alert(`문의 목록 조회 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateTestData = async () => {
    if (generatingData) return;
    setGeneratingData(true);
    try {
      await api.post('/admin/inquiries/generate-test-data');
      alert('30개의 테스트 문의 데이터가 생성되었습니다.');
      fetchInquiries(); // 목록 새로고침
      onStatsRefresh(); // 상단 KPI 통계 새로고침
    } catch (error: any) {
      console.error('테스트 데이터 생성 실패:', error);
      const errorMessage = error.message || '데이터 생성 중 오류가 발생했습니다.';
      alert(`테스트 데이터 생성 실패: ${errorMessage}\n\n개발자 도구 콘솔을 확인해주세요.`);
    } finally {
      setGeneratingData(false);
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

  const handleOpenInquiryDetail = async (inquiry: AdminInquiryListResponse) => {
    setSelectedInquiry(inquiry);
    setShowInquiryModal(true);
    setLoadingDetail(true);
    setAnswerText('');
    try {
      const detail = await api.get<AdminInquiryDetailResponse>(`/admin/inquiries/${inquiry.id}`);
      setInquiryDetail(detail);
      if (detail.answer) {
        setAnswerText(detail.answer);
      }
    } catch (error) {
      console.error('문의 상세 조회 실패:', error);
      alert('문의 정보를 불러오는데 실패했습니다.');
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!inquiryDetail || !answerText.trim()) {
      alert('답변 내용을 입력해주세요.');
      return;
    }

    setSubmittingAnswer(true);
    try {
      await api.post(`/admin/inquiries/${inquiryDetail.id}/answer`, { answer: answerText });
      alert('답변이 등록되었습니다.');
      setShowInquiryModal(false);
      fetchInquiries(); // 목록 새로고침
      onStatsRefresh(); // 상단 KPI 통계 새로고침
    } catch (error) {
      console.error('답변 등록 실패:', error);
      alert('답변 등록에 실패했습니다.');
    } finally {
      setSubmittingAnswer(false);
    }
  };

  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
             <div>
                <h3 className="text-2xl font-black text-black">고객 지원 센터</h3>
                <p className="text-sm text-black/60 font-bold">1:1 문의 관리 및 답변</p>
             </div>
             <WaveButtonComponent
                onClick={handleGenerateTestData}
                disabled={generatingData}
                variant="accent"
                size="sm"
                className="shadow-lg"
                icon={generatingData ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
             >
                {generatingData ? '데이터 생성 중...' : '테스트 데이터 30개 생성'}
             </WaveButtonComponent>
          </div>
          <div className="flex gap-2">
             <button
                onClick={() => setFilter('ALL')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'ALL'
                      ? 'bg-[#1B4332] text-white shadow-lg'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-black/5 hover:border-[#1B4332]/40'
                }`}
             >
                전체
             </button>
             <button
                onClick={() => setFilter('PENDING')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'PENDING'
                      ? 'bg-red-500 text-white shadow-lg'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-400'
                }`}
             >
                미답변 {stats?.pendingInquiries && stats.pendingInquiries > 0 ? `(${stats.pendingInquiries})` : ''}
             </button>
             <button
                onClick={() => setFilter('COMPLETED')}
                className={`px-4 py-2 rounded-xl font-bold text-xs transition-all ${
                   filter === 'COMPLETED'
                      ? 'bg-green-600 text-white shadow-lg'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-green-50 hover:border-green-400'
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
       ) : inquiries.length === 0 ? (
          <GlassCard>
             <div className="flex flex-col items-center justify-center py-16 text-center">
                <MessageSquare size={48} className="text-black/20 mb-4" />
                <h4 className="text-lg font-black text-black mb-2">문의 데이터가 없습니다</h4>
                <p className="text-sm text-black/40 mb-6">
                   테스트 데이터를 생성하거나 실제 문의가 등록될 때까지 기다려주세요
                </p>
                <button
                   onClick={handleGenerateTestData}
                   disabled={generatingData}
                   className="flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-black text-sm shadow-lg transition-all disabled:opacity-50"
                >
                   {generatingData ? <RefreshCw size={16} className="animate-spin" /> : <Plus size={16} />}
                   {generatingData ? '생성 중...' : '테스트 데이터 생성'}
                </button>
             </div>
          </GlassCard>
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
                                  <button
                                     onClick={() => handleOpenInquiryDetail(inq)}
                                     className="px-3 py-1.5 rounded-xl bg-[#1B4332] text-white text-xs font-black hover:bg-[#2D6A4F] transition-colors"
                                  >
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
                      className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronLeft size={18} />
                   </button>
                   <span className="px-4 py-2 font-bold text-sm text-black">
                      {page + 1} / {totalPages}
                   </span>
                   <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronRight size={18} />
                   </button>
                </div>
             )}
          </>
       )}

       {/* Inquiry Detail Modal */}
       <AnimatePresence>
         {showInquiryModal && selectedInquiry && (
           <motion.div
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0 }}
             className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50"
             onClick={() => setShowInquiryModal(false)}
           >
             <motion.div
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               onClick={(e) => e.stopPropagation()}
               className="bg-white rounded-3xl p-8 max-w-3xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
             >
               <div className="flex items-center justify-between mb-6">
                 <h3 className="text-2xl font-black text-[#1B4332]">문의 상세</h3>
                 <button
                   onClick={() => setShowInquiryModal(false)}
                   className="p-2 rounded-xl hover:bg-black/5 text-black/40 hover:text-black/60 transition-colors"
                 >
                   <X size={20} />
                 </button>
               </div>

               {loadingDetail ? (
                 <div className="flex items-center justify-center py-20">
                   <RefreshCw size={32} className="animate-spin text-[#1B4332]" />
                 </div>
               ) : inquiryDetail ? (
                 <div className="space-y-6">
                   {/* Inquiry Info */}
                   <div className="grid grid-cols-2 gap-4">
                     <div className="bg-black/[0.02] rounded-2xl p-4">
                       <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">문의자</p>
                       <p className="text-sm font-bold text-black/80">{inquiryDetail.userName}</p>
                       <p className="text-xs text-black/40 mt-1">{inquiryDetail.userEmail}</p>
                     </div>
                     <div className="bg-black/[0.02] rounded-2xl p-4">
                       <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">문의 유형</p>
                       <p className="text-sm font-bold text-black/80">{inquiryDetail.type}</p>
                     </div>
                     <div className="bg-black/[0.02] rounded-2xl p-4">
                       <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">등록일</p>
                       <p className="text-sm font-bold text-black/80">{new Date(inquiryDetail.createdAt).toLocaleString('ko-KR')}</p>
                     </div>
                     <div className="bg-black/[0.02] rounded-2xl p-4">
                       <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-2">상태</p>
                       <span className={`inline-block text-xs font-black px-3 py-1.5 rounded-lg ${
                         inquiryDetail.status === 'PENDING'
                           ? 'bg-red-100 text-red-600'
                           : 'bg-green-100 text-green-600'
                       }`}>
                         {inquiryDetail.status === 'PENDING' ? '미답변' : '답변 완료'}
                       </span>
                     </div>
                   </div>

                   {/* Inquiry Content */}
                   <div className="bg-black/[0.02] rounded-2xl p-6">
                     <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">제목</p>
                     <p className="text-base font-bold text-black mb-4">{inquiryDetail.title}</p>
                     <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">문의 내용</p>
                     <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed">{inquiryDetail.content}</p>
                   </div>

                   {/* Answer Section */}
                   <div className="bg-black/[0.02] rounded-2xl p-6">
                     <p className="text-xs font-black uppercase tracking-widest text-black/40 mb-3">답변</p>
                     {inquiryDetail.status === 'PENDING' ? (
                       <div className="space-y-4">
                         <textarea
                           value={answerText}
                           onChange={(e) => setAnswerText(e.target.value)}
                           placeholder="답변 내용을 입력하세요..."
                           className="w-full h-40 px-4 py-3 rounded-2xl border bg-white text-sm text-black/80 focus:ring-2 ring-[#1B4332]/20 outline-none resize-none"
                         />
                         <button
                           onClick={handleSubmitAnswer}
                           disabled={submittingAnswer || !answerText.trim()}
                           className="w-full py-3 bg-[#1B4332] text-white rounded-2xl font-black text-sm hover:bg-[#2D6A4F] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                         >
                           {submittingAnswer ? '등록 중...' : '답변 등록'}
                         </button>
                       </div>
                     ) : (
                       <div className="space-y-3">
                         <p className="text-sm text-black/70 whitespace-pre-wrap leading-relaxed bg-white rounded-xl p-4">
                           {inquiryDetail.answer || '답변이 없습니다.'}
                         </p>
                         <p className="text-xs text-black/40">
                           답변일: {new Date(inquiryDetail.updatedAt).toLocaleString('ko-KR')}
                         </p>
                       </div>
                     )}
                   </div>
                 </div>
               ) : (
                 <p className="text-center text-black/40 py-10">문의 정보를 불러올 수 없습니다.</p>
               )}
             </motion.div>
           </motion.div>
         )}
       </AnimatePresence>
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

  const [syncingStore, setSyncingStore] = useState(false);
  const [generatingItems, setGeneratingItems] = useState(false);

  const handleSyncDefaultItems = async () => {
    if (syncingStore) return;
    const confirmed = confirm('마이페이지의 기본 아바타와 칭호 데이터를 상점에 동기화하시겠습니까?\n기존에 동일한 이름의 아이템이 있으면 중복 생성될 수 있습니다.');
    if (!confirmed) return;

    setSyncingStore(true);
    try {
      // 1. 아바타 아이템 (헤드, 이펙트, 마커)
      const avatars = [
        { name:'황금 왕관', type:'AVATAR', price:0, description:'[헤드] 👑 기품 있는 국왕의 상징' },
        { name:'마법사 모자', type:'AVATAR', price:0, description:'[헤드] 🎩 신비로운 마력을 지닌 모자' },
        { name:'핑크 리본', type:'AVATAR', price:300, description:'[헤드] 🎀 러블리한 감성의 핑크 리본' },
        { name:'힙합 스냅백', type:'AVATAR', price:450, description:'[헤드] 🧢 스트릿 감성이 넘치는 스냅백' },
        { name:'황금 오라', type:'EFFECT', price:0, description:'[이펙트] ✨ 몸 주변에서 빛나는 황금빛 기운' },
        { name:'별빛 오라', type:'EFFECT', price:500, description:'[이펙트] 🌟 밤하늘의 별을 담은 오라' },
        { name:'다이아 마커', type:'EFFECT', price:1200, description:'[마커] 💎 지도 위에서 빛나는 다이아몬드' },
        { name:'무지개 마커', type:'EFFECT', price:2500, description:'[마커] 🌈 화려한 무지개 색상의 이동 경로' },
      ];

      // 2. 칭호 아이템
      const titles = [
        { name:'전설의 쾌변가', type:'TITLE', price:0, description:'전설적인 기록을 남긴 자' },
        { name:'화장실 정복자', type:'TITLE', price:0, description:'모든 화장실을 섭렵한 정복자' },
        { name:'쾌변 마스터', type:'TITLE', price:0, description:'장 건강의 끝판왕' },
        { name:'섬유질왕', type:'TITLE', price:0, description:'야채를 사랑하는 건강 전도사' },
      ];

      const allItems = [...avatars, ...titles];
      
      for (const item of allItems) {
        await api.post('/admin/shop/items', {
          ...item,
          imageUrl: null
        });
      }

      alert('기본 아이템 동기화가 완료되었습니다.');
      fetchItems();
    } catch (error) {
      console.error('동기화 실패:', error);
      alert('동기화 중 오류가 발생했습니다.');
    } finally {
      setSyncingStore(false);
    }
  };

  const handleGenerateTestData = async () => {
    if (generatingItems) return;
    const confirmed = confirm('20개의 프리미엄 상점 테스트 데이터를 생성하시겠습니까?\n이 작업은 다소 시간이 걸릴 수 있습니다.');
    if (!confirmed) return;

    setGeneratingItems(true);
    try {
      const avatarEmojis = ['👑', '🎩', '🎀', '🧢', '🎓', '🪖', '🪓', '🦊', '🐱', '🐶', '🦄', '🌈', '🔥', '❄️', '💎', '🌟', '🍀', '🍎', '🍔', '🚀'];
      const effectEmojis = ['✨', '🌟', '💫', '🔥', '❄️', '🌊', '💨', '⚡', '🌈', '🌀', '🌌', '🦋', '🐝', '🍁', '🌸'];
      const titleEmojis = ['🏆', '🥇', '🏅', '🎖', '👑', '⭐️', '✨', '💩', '🔥', '💎'];

      const testItems = [];
      
      // 1. 아바타 8개
      for (let i = 0; i < 8; i++) {
        const emoji = avatarEmojis[i % avatarEmojis.length];
        testItems.push({
          name: `${emoji} 테스트 아바타 ${i + 1}`,
          type: 'AVATAR',
          price: Math.floor(Math.random() * 20) * 100 + 500,
          description: `[헤드] 멋진 ${emoji} 스타일의 아바타 아이템입니다.`,
          imageUrl: emoji
        });
      }

      // 2. 이펙트 6개
      for (let i = 0; i < 6; i++) {
        const emoji = effectEmojis[i % effectEmojis.length];
        testItems.push({
          name: `${emoji} 테스트 이펙트 ${i + 1}`,
          type: 'EFFECT',
          price: Math.floor(Math.random() * 30) * 100 + 1000,
          description: `[이펙트] 화려한 ${emoji} 효과를 경험해보세요.`,
          imageUrl: emoji
        });
      }

      // 3. 칭호 6개
      for (let i = 0; i < 6; i++) {
        const emoji = titleEmojis[i % titleEmojis.length];
        testItems.push({
          name: `${emoji} 테스트 칭호 ${i + 1}`,
          type: 'TITLE',
          price: Math.floor(Math.random() * 50) * 100,
          description: `${emoji} 등급의 명예로운 칭호입니다.`,
          imageUrl: emoji
        });
      }

      for (const item of testItems) {
        await api.post('/admin/shop/items', {
          ...item
        });
      }

      alert('20개의 다채로운 테스트 데이터 생성이 완료되었습니다!');
      fetchItems();
    } catch (error) {
      console.error('테스트 데이터 생성 실패:', error);
      alert('데이터 생성 중 오류가 발생했습니다.');
    } finally {
      setGeneratingItems(false);
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
      case 'AVATAR': return '아바타';
      case 'TITLE': return '칭호';
      case 'EFFECT': return '효과';
      default: return type;
    }
  };

  const isEmoji = (str: string) => {
    return str && str.length <= 4 && /\p{Extended_Pictographic}/u.test(str);
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
                {(['ALL', 'AVATAR', 'TITLE', 'EFFECT'] as const).map((type) => (
                   <button
                      key={type}
                      onClick={() => setFilter(type)}
                      className={`px-3 py-2 rounded-xl font-bold text-[10px] uppercase transition-all ${
                         filter === type
                            ? 'bg-[#1B4332] text-white shadow-lg'
                            : 'bg-white border border-gray-300 text-black hover:bg-black/5'
                      }`}
                   >
                      {type === 'ALL' ? '전체' : getItemTypeLabel(type as ItemType)}
                   </button>
                ))}
             </div>
             <div className="flex gap-2 ml-4">
                <WaveButtonComponent
                  onClick={handleSyncDefaultItems}
                  disabled={syncingStore}
                  variant="primary"
                  size="sm"
                  className="shadow-md"
                  icon={syncingStore ? <RefreshCw size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                >
                  {syncingStore ? '동기화 중...' : '마이페이지 동기화'}
                </WaveButtonComponent>
                <WaveButtonComponent
                  onClick={handleGenerateTestData}
                  disabled={generatingItems}
                  variant="accent"
                  size="sm"
                  className="shadow-md"
                  icon={generatingItems ? <RefreshCw size={14} className="animate-spin" /> : <Plus size={14} />}
                >
                  {generatingItems ? '생성 중...' : '테스트 아이템 20개 생성'}
                </WaveButtonComponent>
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
                            {item.imageUrl && !isEmoji(item.imageUrl) ? (
                               <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-[24px]" />
                            ) : (
                               <>
                                  <div className="w-16 h-16 rounded-full blur-3xl opacity-20 absolute" style={{ background: color }} />
                                  <div className="p-6 transition-transform group-hover:scale-110 duration-500 text-4xl">
                                     {isEmoji(item.imageUrl) ? item.imageUrl : <ShoppingBag size={48} style={{ color }} />}
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
                      className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                   >
                      <ChevronLeft size={18} />
                   </button>
                   <span className="px-4 py-2 font-bold text-sm text-black">
                      {page + 1} / {totalPages}
                   </span>
                   <button
                      onClick={() => setPage(Math.min(totalPages - 1, page + 1))}
                      disabled={page >= totalPages - 1}
                      className="p-2 rounded-xl bg-white border border-gray-300 text-[#1B4332] hover:bg-black/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
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
  const systemMetrics = [
    { subject: '사용자 인터페이스', value: 120, fullMark: 150 },
    { subject: '성능', value: 135, fullMark: 150 },
    { subject: '보안', value: 128, fullMark: 150 },
    { subject: '기능성', value: 110, fullMark: 150 },
    { subject: '사용 편의성', value: 125, fullMark: 150 },
    { subject: '고객 지원', value: 95, fullMark: 150 },
  ];

  const healthMetrics = [
    { label: '가동 시간', value: '99.98%', color: '#1B4332', icon: <Activity size={18} /> },
    { label: '응답 시간', value: '14ms', color: '#E8A838', icon: <Zap size={18} /> },
    { label: '활성 사용자', value: '1,247', color: '#3B82F6', icon: <Users size={18} /> },
    { label: '분당 요청', value: '8.5K', color: '#52b788', icon: <TrendingUp size={18} /> },
  ];

  return (
    <div className="space-y-4">
      <div className="mb-2">
        <h3 className="text-xl font-black text-black">시스템 성능 분석</h3>
        <p className="text-xs text-black/70 font-bold mt-0.5">실시간 인프라 및 서비스 지표 모니터링</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Radar Chart - Main Visual */}
        <div className="lg:col-span-3">
          <GlassCard className="h-full flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-base font-black text-black">시스템 성능 레이더</h4>
              <div className="px-2.5 py-1 rounded-lg bg-green-100 text-green-700 text-[10px] font-black uppercase tracking-wider">
                Optimal Status
              </div>
            </div>
            
            <div className="flex-1 w-full min-h-[380px] flex items-center justify-center -mt-6">
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart cx="50%" cy="50%" outerRadius="85%" data={systemMetrics}>
                  <PolarGrid stroke="rgba(27,67,50,0.15)" />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: 'rgba(26,43,39,0.85)', fontSize: 13, fontWeight: 900 }}
                  />
                  {/* 가독성을 위해 PolarRadiusAxis의 숫자를 제거함 (tick={false}) */}
                  <PolarRadiusAxis
                    angle={90}
                    domain={[0, 150]}
                    tick={false}
                    axisLine={false}
                  />
                  <Radar
                    name="시스템 지표"
                    dataKey="value"
                    stroke="#1B4332"
                    fill="#1B4332"
                    fillOpacity={0.45}
                    strokeWidth={4}
                    dot={{ r: 5, fill: '#E8A838', strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Tooltip
                    content={({ active, payload }: any) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-white/90 backdrop-blur-md p-4 rounded-2xl border shadow-2xl" style={{ borderColor: 'rgba(27,67,50,0.1)' }}>
                            <p className="font-black text-[10px] uppercase tracking-widest text-[#1B4332]/40 mb-1">
                              {payload[0].payload.subject}
                            </p>
                            <p className="text-2xl font-black text-[#1A2B27] tabular-nums">
                              {payload[0].value}
                              <span className="text-xs text-black/20 ml-1">
                                / {payload[0].payload.fullMark}
                              </span>
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
            
            <div className="mt-auto pt-4 flex justify-center gap-6 border-t border-black/[0.03]">
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#1B4332]" />
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-tight">현재 지표</span>
               </div>
               <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#E8A838]" />
                  <span className="text-[10px] font-black text-black/40 uppercase tracking-tight">중요 포인트</span>
               </div>
            </div>
          </GlassCard>
        </div>

        {/* Health Metrics - Side Panel */}
        <div className="lg:col-span-2 space-y-4">
          <GlassCard>
            <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-[#1B4332] to-[#2D6A4F] inline-block">
              <Shield size={24} className="text-white" />
            </div>
            <h4 className="text-base font-black mb-1.5 text-[#1B4332]">시스템 상태</h4>
            <p className="text-xs text-black/70 font-bold mb-4">
              모든 서비스가 정상 작동 중입니다
            </p>
            <div className="space-y-2.5">
              {healthMetrics.map((metric, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-lg bg-gradient-to-r from-black/[0.02] to-transparent border border-black/5 hover:border-[#1B4332]/20 transition-all"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div
                        className="p-1.5 rounded-lg"
                        style={{ backgroundColor: `${metric.color}15`, color: metric.color }}
                      >
                        {metric.icon}
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase text-black/50 tracking-wide">
                          {metric.label}
                        </p>
                        <p className="text-lg font-black text-black mt-0.5">{metric.value}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>

          <GlassCard>
            <h4 className="text-sm font-black mb-3 text-black">서비스 상태</h4>
            <div className="space-y-2">
              {[
                { label: '데이터베이스', status: '연결됨', color: 'green' },
                { label: '레디스 캐시', status: '활성', color: 'green' },
                { label: 'API 게이트웨이', status: '실행 중', color: 'green' },
                { label: '파일 저장소', status: '사용 가능', color: 'green' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between py-1.5">
                  <span className="text-xs font-bold text-black/70">{item.label}</span>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500 animate-pulse`} />
                    <span className="text-xs font-black text-green-600">{item.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        </div>
      </div>

      {/* Additional Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlassCard className="border-l-4 border-l-[#1B4332]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#1B4332]/10">
              <Activity size={22} className="text-[#1B4332]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-black/50 mb-0.5">CPU 사용률</p>
              <p className="text-2xl font-black text-black">32.5%</p>
              <p className="text-xs text-black/70 font-bold mt-0.5">4코어 평균</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-[#E8A838]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#E8A838]/10">
              <Activity size={22} className="text-[#E8A838]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-black/50 mb-0.5">메모리</p>
              <p className="text-2xl font-black text-black">8.2 GB</p>
              <p className="text-xs text-black/70 font-bold mt-0.5">전체 16GB 중</p>
            </div>
          </div>
        </GlassCard>

        <GlassCard className="border-l-4 border-l-[#3B82F6]">
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-[#3B82F6]/10">
              <Activity size={22} className="text-[#3B82F6]" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase text-black/50 mb-0.5">디스크 I/O</p>
              <p className="text-2xl font-black text-black">245 MB/s</p>
              <p className="text-xs text-black/70 font-bold mt-0.5">읽기/쓰기 속도</p>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};


// ── Screen: Add Item Form ─────────────────────────────────────────────
const AddItemView = ({ setActiveTab }: { setActiveTab: (tab: AdminTab) => void }) => {
  const [itemName, setItemName] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemType, setItemType] = useState<ItemType>('AVATAR');
  const [itemPrice, setItemPrice] = useState<number>(0);
  const [itemImageUrl, setItemImageUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // 유효성 검사
    if (!itemName.trim()) {
      alert('아이템 명칭을 입력해주세요.');
      return;
    }
    if (!itemDescription.trim()) {
      alert('아이템 설명을 입력해주세요.');
      return;
    }
    if (itemPrice < 0) {
      alert('가격은 0 이상이어야 합니다.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post('/admin/shop/items', {
        name: itemName,
        description: itemDescription,
        type: itemType,
        price: itemPrice,
        imageUrl: itemImageUrl || null
      });
      alert('아이템이 등록되었습니다.');
      // 폼 초기화
      setItemName('');
      setItemDescription('');
      setItemType('AVATAR');
      setItemPrice(0);
      setItemImageUrl('');
      // Store 탭으로 이동
      setActiveTab('store');
    } catch (error) {
      console.error('아이템 등록 실패:', error);
      alert('아이템 등록에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
            <p className="text-xs font-black text-black/30 mb-3">이미지 URL (선택)</p>
            <input
              type="text"
              value={itemImageUrl}
              onChange={(e) => setItemImageUrl(e.target.value)}
              className="w-full bg-white border border-black/10 px-4 py-2 rounded-xl text-xs font-bold text-black placeholder:text-black/40"
              placeholder="https://..."
            />
          </GlassCard>
        </div>
        <div className="md:col-span-2 space-y-6">
          <GlassCard>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">아이템 명칭 *</label>
                <input
                  type="text"
                  value={itemName}
                  onChange={(e) => setItemName(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold focus:ring-4 ring-[#1B4332]/10 outline-none transition-all text-black placeholder:text-black/40"
                  placeholder="예: 황금 변기 칭호"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">가격 (POOP POINT) *</label>
                  <input
                    type="number"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(Number(e.target.value))}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black placeholder:text-black/40"
                    placeholder="5000"
                    min="0"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">카테고리 *</label>
                  <select
                    value={itemType}
                    onChange={(e) => setItemType(e.target.value as ItemType)}
                    className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold text-black"
                  >
                    <option value="AVATAR">아바타</option>
                    <option value="TITLE">칭호</option>
                    <option value="EFFECT">효과</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-black/40 mb-2 block">아이템 설명 *</label>
                <textarea
                  value={itemDescription}
                  onChange={(e) => setItemDescription(e.target.value)}
                  className="w-full bg-black/[0.02] border border-black/5 px-5 py-4 rounded-2xl text-sm font-bold h-32 resize-none text-black placeholder:text-black/40"
                  placeholder="아이템에 대한 상세 설명을 입력하세요..."
                />
              </div>
              <div className="pt-4 flex gap-4">
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="flex-1 py-4 bg-[#1B4332] text-white rounded-2xl font-black shadow-xl shadow-green-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? '등록 중...' : '등록 완료'}
                </button>
                <button
                  onClick={() => setActiveTab('store')}
                  className="flex-1 py-4 bg-black/5 text-black/60 rounded-2xl font-black hover:bg-black/10 transition-colors"
                >
                  취소
                </button>
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
  const { user, loading: authLoading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [globalSearch, setGlobalSearch] = useState('');
  
  // Dashboard 통계 데이터 상태 관리
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  // 알림 확인 여부 관리 (localStorage 연동)
  const [visitedTabs, setVisitedTabs] = useState<AdminTab[]>(() => {
    const saved = localStorage.getItem('daypoo_admin_visited_tabs');
    return saved ? JSON.parse(saved) : [];
  });

  // 탭 변경 시 방문 기록 추가 및 저장
  const handleTabChange = (tabId: AdminTab) => {
    setActiveTab(tabId);
    setVisitedTabs(prev => {
      if (!prev.includes(tabId)) {
        const next = [...prev, tabId];
        localStorage.setItem('daypoo_admin_visited_tabs', JSON.stringify(next));
        return next;
      }
      return prev;
    });
  };

  // 권한 체크 로직 검증 및 로그
  if (authLoading) return <div className="h-screen flex items-center justify-center bg-[#f8faf9] text-[#1B4332] font-black tracking-widest text-xl">LOADING ENGINE...</div>;

  const isAdmin = user && (
    (typeof user.role === 'string' && user.role.toUpperCase().includes('ADMIN')) ||
    (Array.isArray(user.role) && user.role.some((r: string) => r.toUpperCase().includes('ADMIN')))
  );
  
  if (!isAdmin) {
    console.group('🚫 Unauthorized Access Blocked');
    console.warn('Page: AdminPage');
    console.warn('User ID:', user?.id);
    console.warn('User Role:', user?.role);
    console.warn('User Data:', user);
    console.groupEnd();
    return <Navigate to="/main" replace />;
  }

  const fetchStats = async () => {
    try {
      const data = await api.get<AdminStatsResponse>('/admin/stats');
      setStats(data);
    } catch (err) {
      console.error('Admin stats fetch error', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    // 5분마다 통계 데이터 갱신
    const statsTimer = setInterval(fetchStats, 300000);
    
    return () => {
      clearInterval(t);
      clearInterval(statsTimer);
    };
  }, []);

  const menuItems = [
    { id: 'dashboard', label: '대시보드', icon: LayoutDashboard },
    { 
      id: 'users', 
      label: '유저 관리', 
      icon: Users, 
      badge: !visitedTabs.includes('users') && stats?.todayNewUsers && stats.todayNewUsers > 0 ? stats.todayNewUsers : undefined 
    },
    { 
      id: 'toilets', 
      label: '화장실 관리', 
      icon: MapPin, 
      badge: undefined 
    },
    { 
      id: 'cs', 
      label: '고객 지원', 
      icon: MessageSquare, 
      badge: !visitedTabs.includes('cs') && stats?.pendingInquiries && stats.pendingInquiries > 0 ? stats.pendingInquiries : undefined 
    },
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
              onClick={() => handleTabChange(item.id as AdminTab)}
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
             onClick={() => navigate('/main')}
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
                     className="bg-transparent border-none outline-none text-xs font-bold w-56 text-black placeholder:text-black/30"
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
                  {activeTab === 'dashboard' && <DashboardView stats={stats} loading={statsLoading} setActiveTab={setActiveTab} />}
                  {activeTab === 'users' && <UsersView />}
                  {activeTab === 'toilets' && <ToiletsView />}
                  {activeTab === 'cs' && <CsView stats={stats} onStatsRefresh={fetchStats} />}
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
