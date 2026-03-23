import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Users, MapPin, MessageSquare,
  ShoppingBag, Settings, ChevronRight, ChevronLeft,
  TrendingUp, AlertTriangle, Activity, DollarSign,
  Check, X, Edit2, Trash2, LogOut, Bell,
  BarChart3, Eye, Ban, RefreshCw, Plus,
  Shield, FileText, Zap,
} from 'lucide-react';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Legend,
} from 'recharts';
import { api } from '../services/apiClient';

// ── 타입 ──────────────────────────────────────────────────────────────
interface AdminStats {
  totalUsers: number;
  totalToilets: number;
  pendingInquiries: number;
  todayNewUsers: number;
  todayInquiries: number;
  weeklyTrend: {
    date: string;
    users: number;
    inquiries: number;
    sales: number;
  }[];
}
type AdminTab =
  | 'dashboard' | 'users' | 'toilets' | 'cs' | 'store' | 'system';

// ── 차트 데이터 ───────────────────────────────────────────────────────
const CHART_DATA = {
  daily: [
    { label:'03/13', sales:42000, users:180 },
    { label:'03/14', sales:38000, users:165 },
    { label:'03/15', sales:55000, users:220 },
    { label:'03/16', sales:61000, users:245 },
    { label:'03/17', sales:47000, users:198 },
    { label:'03/18', sales:72000, users:287 },
    { label:'03/19', sales:84500, users:312 },
  ],
  weekly: [
    { label:'1월4주', sales:280000, users:1200 },
    { label:'2월1주', sales:310000, users:980 },
    { label:'2월2주', sales:245000, users:1340 },
    { label:'2월3주', sales:390000, users:1560 },
    { label:'2월4주', sales:420000, users:1420 },
    { label:'3월1주', sales:510000, users:1780 },
    { label:'3월2주', sales:580000, users:1950 },
  ],
  monthly: [
    { label:'10월', sales:820000, users:4200 },
    { label:'11월', sales:960000, users:5100 },
    { label:'12월', sales:1240000, users:6800 },
    { label:'1월',  sales:1050000, users:5900 },
    { label:'2월',  sales:1380000, users:7200 },
    { label:'3월',  sales:1620000, users:8400 },
  ],
};

const API_COST_DATA = [
  { day:'13일', cost:3.2 }, { day:'14일', cost:2.8 },
  { day:'15일', cost:4.1 }, { day:'16일', cost:5.2 },
  { day:'17일', cost:3.7 }, { day:'18일', cost:4.8 },
  { day:'19일', cost:4.23 },
];

// ── 사이드바 메뉴 ─────────────────────────────────────────────────────
const NAV_ITEMS: {
  key: AdminTab; label: string; icon: React.ReactNode; badge?: number;
}[] = [
  { key:'dashboard', label:'대시보드',    icon:<LayoutDashboard size={18}/> },
  { key:'users',     label:'유저 관리',   icon:<Users size={18}/>,        badge:3 },
  { key:'toilets',   label:'화장실 관리', icon:<MapPin size={18}/>,       badge:7 },
  { key:'cs',        label:'문의/FAQ',    icon:<MessageSquare size={18}/>, badge:12 },
  { key:'store',     label:'상점 관리',   icon:<ShoppingBag size={18}/> },
  { key:'system',    label:'시스템 설정', icon:<Settings size={18}/> },
];

// ── KPI 카드 ──────────────────────────────────────────────────────────
function KpiCard({
  label, value, change, changeUp, color, fillPct, icon,
}: {
  label: string; value: string; change: string; changeUp: boolean;
  color: string; fillPct: number; icon: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="rounded-2xl p-5 flex flex-col gap-3"
      style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[13px] font-bold uppercase tracking-widest" style={{ color:'rgba(26,43,39,0.4)' }}>
          {label}
        </span>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background:`${color}15`, color }}>
          {icon}
        </div>
      </div>
      <div>
        <p className="font-black text-3xl leading-none" style={{ color, letterSpacing:'-0.04em' }}>
          {value}
        </p>
        <p className="text-[14px] font-semibold mt-2.5 flex items-center gap-1"
          style={{ color: changeUp ? '#52b788' : '#E85D5D' }}>
          <TrendingUp size={15} style={{ transform: changeUp ? 'none' : 'scaleY(-1)' }} />
          {change}
        </p>
      </div>
      {/* 미니 진행바 */}
      <div className="h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(26,43,39,0.07)' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${fillPct}%` }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>
    </motion.div>
  );
}

// ── 커스텀 툴팁 ───────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-xl p-3" style={{
      background:'#fff', border:'1px solid rgba(26,43,39,0.1)',
      boxShadow:'0 8px 24px rgba(26,43,39,0.1)', fontSize:'13px',
    }}>
      <p className="font-bold mb-2" style={{ color:'rgba(26,43,39,0.5)', fontSize:'12px' }}>{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} className="font-black" style={{ color: p.color }}>
          {p.name === 'sales' ? `₩${p.value.toLocaleString()}` : `${p.value}명`}
        </p>
      ))}
    </div>
  );
}

// ── 대시보드 탭 ───────────────────────────────────────────────────────
function DashboardTab() {
  const [period, setPeriod] = useState<'daily'|'weekly'|'monthly'>('daily');
  const [liveUsers, setLiveUsers] = useState(247);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get('/admin/stats');
        setStats(data);
      } catch (err) {
        console.error('어드민 통계 로드 실패:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    const t = setInterval(() => {
      setLiveUsers((n) => Math.max(200, n + Math.round((Math.random() - 0.4) * 4)));
    }, 5000);
    return () => clearInterval(t);
  }, []);

  const stagger = { hidden:{}, show:{ transition:{ staggerChildren:0.07 } } };

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="flex flex-col gap-5">

      {/* KPI 4개 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard label="실시간 접속자" value={loading ? '...' : String(liveUsers)} change="지난 1시간 +18%"
          changeUp color="#1B4332" fillPct={72} icon={<Activity size={18}/>} />
        <KpiCard label="전체 유저 수" value={loading ? '...' : (stats?.totalUsers.toLocaleString() || '0')} change={`오늘 +${stats?.todayNewUsers || 0}명`}
          changeUp color="#E8A838" fillPct={85} icon={<Users size={18}/>} />
        <KpiCard label="전체 화장실" value={loading ? '...' : (stats?.totalToilets.toLocaleString() || '0')} change="어제 대비 +2건"
          changeUp color="#2D6A4F" fillPct={55} icon={<MapPin size={18}/>} />
        <KpiCard label="답변 대기 문의" value={loading ? '...' : String(stats?.pendingInquiries || 0)} change={`전체 ${stats?.todayInquiries || 0}건`}
          changeUp={false} color="#E85D5D" fillPct={42} icon={<MessageSquare size={18}/>} />
      </div>

      {/* 매출 차트 + 급똥/AI 비용 */}
      <div className="grid grid-cols-3 gap-5">

        {/* 매출 라인 차트 — LineChart Pro 스타일 */}
        <div className="col-span-2 rounded-2xl p-6"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="font-black text-lg" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>매출 및 유저 추이</p>
              <p className="text-[13px] mt-0.5" style={{ color:'rgba(26,43,39,0.4)' }}>상점 아이템 판매 합계</p>
            </div>
            <div className="flex rounded-xl p-0.5 gap-0.5" style={{ background:'rgba(26,43,39,0.05)' }}>
              {(['daily','weekly','monthly'] as const).map((p) => (
                <button key={p} onClick={() => setPeriod(p)}
                  className="relative px-3.5 py-2 rounded-xl text-xs font-bold transition-colors"
                  style={{ color: period===p ? '#1B4332' : 'rgba(26,43,39,0.4)' }}>
                  {period===p && (
                    <motion.div layoutId="periodBg" className="absolute inset-0 rounded-xl"
                      style={{ background:'#fff', boxShadow:'0 1px 4px rgba(26,43,39,0.1)' }}
                      transition={{ type:'spring', stiffness:400, damping:30 }} />
                  )}
                  <span className="relative z-10">{p==='daily'?'일간':p==='weekly'?'주간':'월간'}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 범례 */}
          <div className="flex items-center gap-4 mb-4">
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:'rgba(26,43,39,0.5)' }}>
              <span className="w-3 h-1 rounded-full inline-block" style={{ background:'#1B4332' }}/>매출
            </span>
            <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color:'rgba(26,43,39,0.5)' }}>
              <span className="w-3 h-1 rounded-full inline-block" style={{ background:'#E8A838' }}/>신규 유저
            </span>
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={period}
              initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}
              transition={{ duration:0.3 }}>
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={stats?.weeklyTrend || []} margin={{ top:4, right:4, bottom:0, left:-10 }}>
                  <defs>
                    <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B4332" stopOpacity={0.12}/>
                      <stop offset="95%" stopColor="#1B4332" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="usersGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#E8A838" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#E8A838" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(26,43,39,0.06)" vertical={false}/>
                  <XAxis dataKey="date" axisLine={false} tickLine={false}
                    tick={{ fill:'rgba(26,43,39,0.35)', fontSize:12 }} />
                  <YAxis yAxisId="sales" orientation="left" axisLine={false} tickLine={false}
                    tick={{ fill:'rgba(26,43,39,0.35)', fontSize:12 }}
                    tickFormatter={(v) => `₩${Math.round(v/1000)}K`} />
                  <YAxis yAxisId="users" orientation="right" axisLine={false} tickLine={false}
                    tick={{ fill:'rgba(232,168,56,0.6)', fontSize:12 }} />
                  <Tooltip content={<ChartTooltip />} />
                  <Area yAxisId="sales" type="monotone" dataKey="sales" name="sales"
                    stroke="#1B4332" strokeWidth={2.5} fill="url(#salesGrad)"
                    dot={false} activeDot={{ r:5, fill:'#1B4332' }} />
                  <Area yAxisId="users" type="monotone" dataKey="users" name="users"
                    stroke="#E8A838" strokeWidth={2} strokeDasharray="5 3"
                    fill="url(#usersGrad)"
                    dot={false} activeDot={{ r:4, fill:'#E8A838' }} />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 우측: AI 비용 + 급똥 */}
        <div className="flex flex-col gap-4">
          {/* AI API 비용 바차트 */}
          <div className="rounded-2xl p-5 flex-1"
            style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
            <div className="flex items-center justify-between mb-1">
              <p className="font-black text-[16px]" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>AI API 비용</p>
              <span className="font-black text-xl" style={{ color:'#E85D5D' }}>$4.23</span>
            </div>
            <p className="text-[13px] mb-2" style={{ color:'rgba(26,43,39,0.4)' }}>일일 예산 $10 기준 42%</p>
            <div className="h-1.5 rounded-full overflow-hidden mb-3" style={{ background:'rgba(26,43,39,0.07)' }}>
              <motion.div initial={{ width:0 }} animate={{ width:'42%' }}
                transition={{ duration:1, delay:0.5 }}
                className="h-full rounded-full"
                style={{ background:'#E85D5D' }} />
            </div>
            <ResponsiveContainer width="100%" height={90}>
              <BarChart data={API_COST_DATA} margin={{ top:0, right:0, bottom:0, left:-28 }}>
                <CartesianGrid strokeDasharray="2 2" stroke="rgba(26,43,39,0.05)" vertical={false}/>
                <XAxis dataKey="day" axisLine={false} tickLine={false}
                  tick={{ fill:'rgba(26,43,39,0.3)', fontSize:11 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize:11, fill:'rgba(26,43,39,0.3)' }} />
                <Bar dataKey="cost" radius={[3,3,0,0]}
                  fill="#E85D5D" fillOpacity={0.7} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex justify-between text-xs mt-2" style={{ color:'rgba(26,43,39,0.4)' }}>
              <span>이번 달 누적</span>
              <span className="font-black" style={{ color:'#E85D5D' }}>$87.40 / $300</span>
            </div>
          </div>

          {/* 급똥 핫스팟 */}
          <div className="rounded-2xl p-5"
            style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
            <div className="flex items-center justify-between mb-4">
              <p className="font-black text-[16px]" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>🚨 급똥 핫스팟</p>
              <span className="text-sm" style={{ color:'rgba(26,43,39,0.35)' }}>최근 1시간</span>
            </div>
            {[
              { region:'강남구', count:48, color:'#E85D5D', pct:90 },
              { region:'마포구', count:31, color:'#E8A838', pct:65 },
              { region:'서초구', count:21, color:'#52b788', pct:45 },
              { region:'송파구', count:14, color:'#2D6A4F', pct:30 },
            ].map((h) => (
              <div key={h.region} className="flex items-center gap-2 mb-3">
                <span className="text-[15px] font-semibold w-14 flex-shrink-0" style={{ color:'#1A2B27' }}>{h.region}</span>
                <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background:'rgba(26,43,39,0.07)' }}>
                  <motion.div initial={{ width:0 }} animate={{ width:`${h.pct}%` }}
                    transition={{ duration:0.8, delay:0.2 }}
                    className="h-full rounded-full" style={{ background:h.color }} />
                </div>
                <span className="text-[15px] font-black w-8 text-right" style={{ color:h.color }}>{h.count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 하단 3컬럼 */}
      <div className="grid grid-cols-3 gap-5">
        {/* 최근 유저 */}
        <div className="rounded-2xl p-6"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="font-black text-base" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>최근 가입 유저</p>
            <button onClick={() => (window as any).setAdminTab?.('users')} className="text-sm font-bold" style={{ color:'#2D6A4F', background:'none', border:'none', cursor:'pointer' }}>전체 보기 →</button>
          </div>
          {[
            { nick:'급똥전문가', date:'03/19', status:'정상', color:'#52b788' },
            { nick:'장건강지킴이', date:'03/19', status:'정상', color:'#52b788' },
            { nick:'새벽배변러', date:'03/18', status:'주의', color:'#E8A838' },
            { nick:'섬유질왕', date:'03/17', status:'정지', color:'#E85D5D' },
          ].map((u) => (
            <div key={u.nick} className="flex items-center justify-between py-3"
              style={{ borderBottom:'1px solid rgba(26,43,39,0.05)' }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                  style={{ background:'rgba(27,67,50,0.08)', color:'#1B4332' }}>
                  {u.nick[0]}
                </div>
                <span className="text-[13px] font-semibold" style={{ color:'#1A2B27' }}>{u.nick}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xs" style={{ color:'rgba(26,43,39,0.35)' }}>{u.date}</span>
                <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                  style={{ background:`${u.color}15`, color:u.color }}>{u.status}</span>
              </div>
            </div>
          ))}
        </div>

        {/* 미답변 문의 */}
        <div className="rounded-2xl p-6"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-5">
            <p className="font-black text-base" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>미답변 문의</p>
            <span className="text-sm font-bold px-2.5 py-1 rounded-full"
              style={{ background:'rgba(232,93,93,0.1)', color:'#E85D5D' }}>12건</span>
          </div>
          {[
            { title:'아이템 구매 후 없어요', cat:'결제', time:'2시간 전', urgent:true },
            { title:'화장실 위치 오류 신고', cat:'정보 오류', time:'4시간 전', urgent:false },
            { title:'AI 분석 이상한 것 같아요', cat:'건강 분석', time:'6시간 전', urgent:false },
          ].map((q, i) => (
            <div key={i} className="flex items-start gap-2.5 py-3"
              style={{ borderBottom: i<2 ? '1px solid rgba(26,43,39,0.05)' : 'none' }}>
              <div className="w-1.5 h-1.5 rounded-full mt-2 flex-shrink-0"
                style={{ background: q.urgent ? '#E85D5D' : '#E8A838' }} />
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate" style={{ color:'#1A2B27' }}>{q.title}</p>
                <p className="text-xs mt-0.5" style={{ color:'rgba(26,43,39,0.4)' }}>{q.cat} · {q.time}</p>
              </div>
              <button onClick={() => (window as any).setAdminTab?.('cs')} className="text-xs font-bold px-3 py-2 rounded-lg flex-shrink-0 transition-colors hover:bg-green-50"
                style={{ border:'1px solid rgba(27,67,50,0.15)', color:'#1B4332', cursor:'pointer' }}>
                답변
              </button>
            </div>
          ))}
        </div>

        {/* 빠른 작업 + 경고 */}
        <div className="flex flex-col gap-4">
          <div className="rounded-2xl p-6 flex-1"
            style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
            <p className="font-black text-[15px] mb-4" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>빠른 작업</p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon:'🚻', label:'화장실 신고', tab:'toilets', color:'rgba(27,67,50,0.07)' },
                { icon:'💬', label:'FAQ 편집', tab:'cs', color:'rgba(232,168,56,0.07)' },
                { icon:'🛍', label:'아이템 등록', tab:'store', color:'rgba(82,183,136,0.07)' },
                { icon:'📋', label:'시스템 로그', tab:'system', color:'rgba(26,43,39,0.04)' },
              ].map((a) => (
                <motion.button key={a.label} 
                  whileHover={{ scale:1.05, y:-2, boxShadow:'0 4px 12px rgba(26,43,39,0.08)' }} 
                  whileTap={{ scale:0.95 }}
                  onClick={() => (window as any).setAdminTab?.(a.tab as any)}
                  className="flex flex-col items-center gap-2 p-3.5 rounded-xl text-[13px] font-bold transition-shadow"
                  style={{ background:a.color, border:'1px solid rgba(26,43,39,0.08)', color:'#1A2B27' }}>
                  <span style={{ fontSize:'24px' }}>{a.icon}</span>
                  {a.label}
                </motion.button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl p-5"
            style={{ background:'rgba(232,93,93,0.05)', border:'1px solid rgba(232,93,93,0.15)' }}>
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle size={18} style={{ color:'#E85D5D' }} />
              <p className="text-base font-black" style={{ color:'#E85D5D' }}>주의 필요</p>
            </div>
            <p className="text-sm leading-relaxed" style={{ color:'rgba(26,43,39,0.6)' }}>
              화장실 신고 <strong>7건</strong> 미처리<br/>
              AI 비용 일일 예산 <strong>42%</strong> 소진
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── 유저 관리 탭 ──────────────────────────────────────────────────────
function UsersTab() {
  const [search, setSearch] = useState('');
  const users = [
    { nick:'황금변기왕', email:'he***@gmail.com', joined:'2026-01-15', count:1204, points:2500, status:'정상' },
    { nick:'변비탈출러', email:'va***@naver.com', joined:'2026-02-03', count:847, points:1200, status:'주의' },
    { nick:'새벽배변러', email:'ni***@kakao.com', joined:'2026-03-01', count:498, points:300, status:'정지' },
    { nick:'급똥전문가', email:'ab***@gmail.com', joined:'2026-03-19', count:12, points:0, status:'정상' },
  ].filter(u => u.nick.includes(search) || u.email.includes(search));

  const statusStyle = (s: string) => ({
    '정상': { bg:'rgba(82,183,136,0.1)', color:'#2D6A4F' },
    '주의': { bg:'rgba(232,168,56,0.1)', color:'#b5810f' },
    '정지': { bg:'rgba(232,93,93,0.1)', color:'#E85D5D' },
  }[s] ?? { bg:'rgba(26,43,39,0.06)', color:'rgba(26,43,39,0.4)' });

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-black text-xl" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>유저 관리</p>
          <p className="text-sm mt-0.5" style={{ color:'rgba(26,43,39,0.45)' }}>총 3,241명 · 오늘 신규 18명</p>
        </div>
        <input value={search} onChange={e=>setSearch(e.target.value)}
          placeholder="닉네임·이메일 검색..."
          className="outline-none text-sm"
          style={{ padding:'9px 14px', borderRadius:'12px', border:'1px solid rgba(26,43,39,0.1)', width:'220px', color:'#1A2B27', background:'#fff' }} />
      </div>
      <div className="rounded-2xl overflow-hidden"
        style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
        <table className="w-full" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(26,43,39,0.07)' }}>
              {['닉네임','이메일','가입일','인증 수','포인트','상태','작업'].map(h => (
                <th key={h} className="text-left px-5 py-4 text-[13px] font-bold uppercase tracking-wide"
                  style={{ color:'rgba(26,43,39,0.5)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {users.map((u, i) => (
              <motion.tr key={u.nick} initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:i*0.06 }}
                style={{ borderBottom: i<users.length-1 ? '1px solid rgba(26,43,39,0.05)' : 'none' }}>
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                      style={{ background:'rgba(27,67,50,0.08)', color:'#1B4332' }}>{u.nick[0]}</div>
                    <span className="text-sm font-bold" style={{ color:'#1A2B27' }}>{u.nick}</span>
                  </div>
                </td>
                <td className="px-5 py-3.5 text-sm" style={{ color:'rgba(26,43,39,0.5)' }}>{u.email}</td>
                <td className="px-5 py-3.5 text-sm" style={{ color:'rgba(26,43,39,0.5)' }}>{u.joined}</td>
                <td className="px-5 py-3.5 text-sm font-black" style={{ color:'#E8A838' }}>{u.count.toLocaleString()}</td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:'#1A2B27' }}>{u.points.toLocaleString()}P</td>
                <td className="px-5 py-3.5">
                  <span className="text-[11px] font-bold px-2.5 py-1 rounded-full"
                    style={{ background:statusStyle(u.status).bg, color:statusStyle(u.status).color }}>
                    {u.status}
                  </span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                      style={{ border:'1px solid rgba(27,67,50,0.15)', color:'#1B4332', background:'rgba(27,67,50,0.04)' }}>
                      상세
                    </motion.button>
                    {u.status === '정지' ? (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                        style={{ border:'1px solid rgba(82,183,136,0.2)', color:'#2D6A4F', background:'rgba(82,183,136,0.05)' }}>
                        해제
                      </motion.button>
                    ) : (
                      <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                        className="text-[11px] font-bold px-3 py-1.5 rounded-lg"
                        style={{ border:'1px solid rgba(232,93,93,0.2)', color:'#E85D5D', background:'rgba(232,93,93,0.04)' }}>
                        정지
                      </motion.button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── 화장실 관리 탭 ────────────────────────────────────────────────────
function ToiletsTab() {
  const [selectedReport, setSelectedReport] = useState<number|null>(null);
  const [reports, setReports] = useState([
    { id:0, name:'강남구청 공중화장실', type:'위치 오류', user:'황금변기왕', time:'2시간 전', desc:'"현재 핀이 실제 화장실에서 50m 벗어나 있어요. 지도에서 확인해주세요."', urgent:true },
    { id:1, name:'서울시청 화장실', type:'정보 오류', user:'변비탈출러', time:'5시간 전', desc:'"운영 시간이 24시간이 아닌데 24시간으로 표시되고 있어요."', urgent:false },
    { id:2, name:'홍대 공중화장실', type:'청결 신고', user:'섬유질왕', time:'8시간 전', desc:'"화장실 내부 상태가 매우 불량합니다. 청소가 필요해 보여요."', urgent:false },
  ]);

  const handleAction = (id: number, action: '승인' | '반려') => {
    alert(`${action}되었습니다.`);
    setReports(prev => prev.filter(r => r.id !== id));
    setSelectedReport(null);
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }} className="flex flex-col gap-4">
      <div>
        <p className="font-black text-xl" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>화장실 관리</p>
        <p className="text-sm mt-0.5" style={{ color:'rgba(26,43,39,0.45)' }}>신고 대기 7건 · 전체 화장실 72,841개</p>
      </div>

      <div className="grid grid-cols-5 gap-4">
        {/* 신고 목록 */}
        <div className="col-span-2 rounded-2xl p-5"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm" style={{ color:'#1A2B27' }}>📥 신고함</p>
            <span className="text-[10px] font-bold px-2 py-1 rounded-full"
              style={{ background:'rgba(232,93,93,0.1)', color:'#E85D5D' }}>7건 대기</span>
          </div>
          <div className="flex flex-col gap-2">
            {reports.map((r) => (
              <motion.div key={r.id} whileHover={{ scale:1.01 }} onClick={() => setSelectedReport(r.id)}
                className="p-3.5 rounded-xl cursor-pointer transition-all"
                style={{
                  background: selectedReport===r.id ? 'rgba(27,67,50,0.06)' : 'rgba(26,43,39,0.02)',
                  border: selectedReport===r.id ? '1.5px solid rgba(27,67,50,0.2)' : '1px solid rgba(26,43,39,0.08)',
                }}>
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-xs font-black" style={{ color:'#1A2B27' }}>{r.name}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                    style={{ background: r.urgent ? 'rgba(232,93,93,0.1)' : 'rgba(232,168,56,0.1)',
                      color: r.urgent ? '#E85D5D' : '#b5810f' }}>{r.type}</span>
                </div>
                <p className="text-[11px]" style={{ color:'rgba(26,43,39,0.5)' }}>{r.user} · {r.time}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* 신고 상세 */}
        <div className="col-span-3 rounded-2xl overflow-hidden"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <AnimatePresence mode="wait">
            {selectedReport !== null ? (
              <motion.div key={selectedReport}
                initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                className="h-full flex flex-col p-5">
                {/* 신고 정보 */}
                <div className="mb-4">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      style={{ background:'rgba(232,168,56,0.1)', color:'#b5810f' }}>
                      {reports[selectedReport].type}
                    </span>
                    <span className="text-[11px]" style={{ color:'rgba(26,43,39,0.4)' }}>
                      {reports[selectedReport].user} · {reports[selectedReport].time}
                    </span>
                  </div>
                  <p className="font-black text-base" style={{ color:'#1A2B27', letterSpacing:'-0.02em' }}>
                    {reports[selectedReport].name}
                  </p>
                  <p className="text-sm mt-1.5 leading-relaxed" style={{ color:'rgba(26,43,39,0.6)' }}>
                    {reports[selectedReport].desc}
                  </p>
                </div>

                {/* 지도 뷰어 영역 */}
                <div className="flex-1 rounded-xl overflow-hidden mb-4 flex items-center justify-center"
                  style={{ background:'#e8f0ec', border:'1px solid rgba(27,67,50,0.15)', minHeight:'200px' }}>
                  <div className="text-center">
                    <p className="text-2xl mb-2">🗺️</p>
                    <p className="text-sm font-bold" style={{ color:'#1B4332' }}>카카오맵 지도 뷰어</p>
                    <p className="text-xs mt-1" style={{ color:'rgba(27,67,50,0.5)' }}>
                      🔵 현재 좌표 (DB) · 🔴 신고 좌표 비교
                    </p>
                    <div className="flex gap-4 mt-3 justify-center text-xs font-semibold">
                      <span style={{ color:'#3B82F6' }}>● 현재: 37.5172, 127.0473</span>
                      <span style={{ color:'#E85D5D' }}>● 신고: 37.5178, 127.0481</span>
                    </div>
                    <p className="text-[11px] mt-2" style={{ color:'rgba(26,43,39,0.4)' }}>
                      실제 환경에서 카카오맵 SDK 연결 필요
                    </p>
                  </div>
                </div>

                {/* 승인/반려 버튼 */}
                <div className="flex gap-3">
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={() => setSelectedReport(null)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-black text-sm"
                    style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff',
                      boxShadow:'0 4px 16px rgba(27,67,50,0.25)' }}>
                    <Check size={15}/> 승인 · 좌표 반영
                  </motion.button>
                  <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                    onClick={() => setSelectedReport(null)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold text-sm"
                    style={{ border:'1px solid rgba(232,93,93,0.25)', color:'#E85D5D', background:'rgba(232,93,93,0.05)' }}>
                    <X size={15}/> 반려 · 거절
                  </motion.button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity:0 }} animate={{ opacity:1 }}
                className="h-full flex flex-col items-center justify-center py-16">
                <MapPin size={32} style={{ color:'rgba(26,43,39,0.2)' }} />
                <p className="text-sm font-semibold mt-3" style={{ color:'rgba(26,43,39,0.35)' }}>
                  신고 항목을 클릭해서 검토하세요
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

// ── 문의/FAQ 탭 ───────────────────────────────────────────────────────
function CsTab() {
  const [replyTarget, setReplyTarget] = useState<number|null>(null);
  const [replyText, setReplyText] = useState('');
  const inquiries = [
    { id:0, title:'아이템 구매 후 인벤토리에 없어요', cat:'결제/아이템', user:'급똥전문가', time:'2시간 전', urgent:true },
    { id:1, title:'화장실 위치가 잘못 표시돼 있어요', cat:'정보 오류', user:'변비탈출러', time:'4시간 전', urgent:false },
    { id:2, title:'AI 분석 결과가 이상해요', cat:'건강 분석', user:'섬유질왕', time:'6시간 전', urgent:false },
  ];

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }} className="flex flex-col gap-4">
      <p className="font-black text-xl" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>문의/FAQ 관리</p>

      <div className="grid grid-cols-2 gap-4">
        {/* 1:1 문의 */}
        <div className="rounded-2xl p-5"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm" style={{ color:'#1A2B27' }}>1:1 문의 답변</p>
            <div className="flex gap-2">
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background:'rgba(232,93,93,0.1)', color:'#E85D5D' }}>미답변 12</span>
              <span className="text-[10px] font-bold px-2 py-1 rounded-full"
                style={{ background:'rgba(82,183,136,0.1)', color:'#2D6A4F' }}>완료 48</span>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            {inquiries.map((q) => (
              <div key={q.id}>
                <div className="flex items-start gap-2 p-3 rounded-xl"
                  style={{ background: replyTarget===q.id ? 'rgba(27,67,50,0.04)' : 'transparent',
                    border: replyTarget===q.id ? '1px solid rgba(27,67,50,0.12)' : '1px solid transparent' }}>
                  <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                    style={{ background: q.urgent ? '#E85D5D' : '#E8A838' }} />
                  <div className="flex-1">
                    <p className="text-xs font-bold" style={{ color:'#1A2B27' }}>{q.title}</p>
                    <p className="text-[10px] mt-0.5" style={{ color:'rgba(26,43,39,0.4)' }}>
                      {q.cat} · {q.user} · {q.time}
                    </p>
                  </div>
                  <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                    onClick={() => setReplyTarget(replyTarget===q.id ? null : q.id)}
                    className="text-[10px] font-black px-2.5 py-1.5 rounded-lg flex-shrink-0"
                    style={{ background:'#1B4332', color:'#fff', border:'none' }}>
                    답변
                  </motion.button>
                </div>
                <AnimatePresence>
                  {replyTarget === q.id && (
                    <motion.div initial={{ height:0, opacity:0 }} animate={{ height:'auto', opacity:1 }}
                      exit={{ height:0, opacity:0 }} transition={{ duration:0.25 }}
                      style={{ overflow:'hidden' }}>
                      <div className="px-3 pb-3">
                        <textarea value={replyText} onChange={e=>setReplyText(e.target.value)}
                          placeholder="답변을 입력하세요..."
                          rows={3}
                          className="w-full outline-none text-xs resize-none"
                          style={{ padding:'10px 12px', borderRadius:'10px',
                            border:'1px solid rgba(26,43,39,0.1)', color:'#1A2B27',
                            background:'rgba(26,43,39,0.02)', lineHeight:'1.6' }} />
                        <div className="flex gap-2 mt-2">
                          <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
                            onClick={() => { setReplyTarget(null); setReplyText(''); }}
                            className="flex-1 py-2 rounded-xl font-black text-xs"
                            style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff', border:'none' }}>
                            답변 등록
                          </motion.button>
                          <button onClick={() => setReplyTarget(null)}
                            className="px-3 py-2 rounded-xl text-xs font-semibold"
                            style={{ border:'1px solid rgba(26,43,39,0.1)', color:'rgba(26,43,39,0.5)' }}>
                            취소
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ 편집 */}
        <div className="rounded-2xl p-5"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <p className="font-black text-sm" style={{ color:'#1A2B27' }}>FAQ 편집</p>
            <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold"
              style={{ border:'1px solid rgba(27,67,50,0.2)', color:'#1B4332', background:'rgba(27,67,50,0.04)' }}>
              <Plus size={12}/> 추가
            </motion.button>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { q:'AI 건강 분석 결과는 의학적으로 정확한가요?', cat:'건강/AI분석' },
              { q:'화장실 정보가 틀린데 어떻게 수정하나요?', cat:'이용방법' },
              { q:'획득한 칭호는 어떻게 적용하나요?', cat:'결제/아바타' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background:'rgba(26,43,39,0.02)', border:'1px solid rgba(26,43,39,0.07)' }}>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                  style={{ background:'rgba(27,67,50,0.1)', color:'#1B4332' }}>{f.cat}</span>
                <p className="flex-1 text-xs font-semibold truncate" style={{ color:'#1A2B27' }}>{f.q}</p>
                <div className="flex gap-1.5 flex-shrink-0">
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}>
                    <Edit2 size={13} style={{ color:'rgba(26,43,39,0.4)' }}/>
                  </motion.button>
                  <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}>
                    <Trash2 size={13} style={{ color:'#E85D5D' }}/>
                  </motion.button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── 상점 관리 탭 ──────────────────────────────────────────────────────
function StoreTab() {
  const [items, setItems] = useState([
    { id:1, name:'👑 황금 왕관', type:'헤드', price:500, sold:284, status:'판매중' },
    { id:2, name:'💎 다이아 마커', type:'마커', price:1200, sold:156, status:'판매중' },
    { id:3, name:'🦋 나비 날개', type:'이펙트', price:800, sold:98, status:'한정 10개' },
    { id:4, name:'🌟 별빛 오라', type:'이펙트', price:500, sold:67, status:'판매중' },
  ]);

  const handleEdit = (name: string) => alert(`${name} 수정 모드로 진입합니다.`);
  const handleStop = (id: number) => {
    if(confirm('정말 판매를 중단하시겠습니까?')) {
      setItems(prev => prev.map(item => item.id === id ? { ...item, status: '중단됨' } : item));
      alert('판매 중단되었습니다.');
    }
  };

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }} className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-black text-xl" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>상점 관리</p>
          <p className="text-sm mt-0.5" style={{ color:'rgba(26,43,39,0.45)' }}>아이템 카탈로그 · 칭호 관리</p>
        </div>
        <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
          onClick={() => alert('신규 아이템 등록 창을 엽니다.')}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-black text-sm"
          style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff',
            boxShadow:'0 4px 16px rgba(27,67,50,0.22)' }}>
          <Plus size={15}/> 아이템 등록
        </motion.button>
      </div>
      <div className="rounded-2xl overflow-hidden"
        style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
        <table className="w-full" style={{ borderCollapse:'collapse' }}>
          <thead>
            <tr style={{ borderBottom:'1px solid rgba(26,43,39,0.07)' }}>
              {['아이템명','타입','가격','판매 수','매출','상태','작업'].map(h => (
                <th key={h} className="text-left px-5 py-3.5 text-[11px] font-bold uppercase tracking-wide"
                  style={{ color:'rgba(26,43,39,0.4)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, i) => (
              <tr key={item.id} style={{ borderBottom: i<items.length-1 ? '1px solid rgba(26,43,39,0.05)' : 'none' }}>
                <td className="px-5 py-3.5 text-sm font-bold" style={{ color:'#1A2B27' }}>{item.name}</td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background:'rgba(27,67,50,0.08)', color:'#1B4332' }}>{item.type}</span>
                </td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:'#1A2B27' }}>{item.price.toLocaleString()}P</td>
                <td className="px-5 py-3.5 text-sm font-black" style={{ color:'#E8A838' }}>{item.sold}</td>
                <td className="px-5 py-3.5 text-sm font-semibold" style={{ color:'#2D6A4F' }}>
                  ₩{(item.price * item.sold * 10).toLocaleString()}
                </td>
                <td className="px-5 py-3.5">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                    style={{
                      background: item.status==='판매중' ? 'rgba(82,183,136,0.1)' : item.status==='중단됨' ? 'rgba(232,93,93,0.1)' : 'rgba(232,168,56,0.1)',
                      color: item.status==='판매중' ? '#2D6A4F' : item.status==='중단됨' ? '#E85D5D' : '#b5810f',
                    }}>{item.status}</span>
                </td>
                <td className="px-5 py-3.5">
                  <div className="flex gap-2">
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      onClick={() => handleEdit(item.name)}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                      style={{ border:'1px solid rgba(26,43,39,0.1)', color:'rgba(26,43,39,0.6)' }}>
                      수정
                    </motion.button>
                    <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }}
                      onClick={() => handleStop(item.id)}
                      className="text-[11px] font-bold px-2.5 py-1.5 rounded-lg"
                      style={{ border:'1px solid rgba(232,93,93,0.2)', color:'#E85D5D' }}>
                      중단
                    </motion.button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}

// ── 시스템 설정 탭 ────────────────────────────────────────────────────
function SystemTab() {
  const [prompt, setPrompt] = useState(
    '친근하고 따뜻한 톤으로 배변 건강에 대한 조언을 제공하세요.\n의학적 진단은 피하고, 일반적인 건강 가이드 수준으로 작성하세요.\n이모지를 적절히 활용해 읽기 쉽게 만들어주세요.'
  );

  return (
    <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }}
      transition={{ duration:0.4 }} className="flex flex-col gap-4">
      <p className="font-black text-xl" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>시스템 설정</p>

      <div className="grid grid-cols-2 gap-4">
        {/* AI 프롬프트 */}
        <div className="rounded-2xl p-5"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center gap-2 mb-1">
            <Zap size={16} style={{ color:'#E8A838' }}/>
            <p className="font-black text-sm" style={{ color:'#1A2B27' }}>AI 프롬프트 관리</p>
          </div>
          <p className="text-[11px] mb-3" style={{ color:'rgba(26,43,39,0.45)' }}>OpenAI 건강 분석 조언 톤앤매너</p>
          <textarea value={prompt} onChange={e=>setPrompt(e.target.value)} rows={5}
            className="w-full outline-none text-xs resize-none"
            style={{ padding:'12px', borderRadius:'12px', border:'1px solid rgba(26,43,39,0.1)',
              color:'#1A2B27', background:'rgba(26,43,39,0.02)', lineHeight:'1.7' }} />
          <div className="flex gap-2 mt-3">
            <motion.button whileHover={{ scale:1.02 }} whileTap={{ scale:0.97 }}
              className="flex-1 py-2.5 rounded-xl font-black text-sm"
              style={{ background:'linear-gradient(135deg,#1B4332,#2D6A4F)', color:'#fff', border:'none' }}>
              저장
            </motion.button>
            <button className="px-4 py-2.5 rounded-xl text-sm font-semibold"
              style={{ border:'1px solid rgba(26,43,39,0.1)', color:'rgba(26,43,39,0.5)' }}>
              초기화
            </button>
          </div>
        </div>

        {/* 작업 로그 */}
        <div className="rounded-2xl p-5"
          style={{ background:'#fff', border:'1px solid rgba(26,43,39,0.08)', boxShadow:'0 2px 12px rgba(26,43,39,0.04)' }}>
          <div className="flex items-center gap-2 mb-4">
            <FileText size={16} style={{ color:'#2D6A4F' }}/>
            <p className="font-black text-sm" style={{ color:'#1A2B27' }}>최근 작업 로그</p>
          </div>
          <div className="flex flex-col gap-2">
            {[
              { time:'03/19 14:32', admin:'관리자', action:'유저 \'새벽배변러\' 계정 정지', type:'warn' },
              { time:'03/19 11:15', admin:'관리자', action:'FAQ \'브리스톨 척도란?\' 수정', type:'info' },
              { time:'03/18 16:45', admin:'관리자', action:'강남구청 화장실 좌표 업데이트', type:'success' },
              { time:'03/18 10:20', admin:'관리자', action:'AI 프롬프트 톤 수정 저장', type:'info' },
              { time:'03/17 15:30', admin:'관리자', action:'다이아 마커 아이템 한정 설정', type:'info' },
            ].map((log, i) => (
              <div key={i} className="flex items-start gap-3 p-3 rounded-xl"
                style={{ background:'rgba(26,43,39,0.02)', border:'1px solid rgba(26,43,39,0.06)' }}>
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                  style={{ background: log.type==='warn' ? '#E85D5D' : log.type==='success' ? '#52b788' : '#E8A838' }} />
                <div>
                  <p className="text-xs font-bold" style={{ color:'#1A2B27' }}>{log.action}</p>
                  <p className="text-[10px] mt-0.5" style={{ color:'rgba(26,43,39,0.4)' }}>
                    {log.time} · {log.admin}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ══════════════════════════════════════════════════════════════════════
// RAIL NAVIGATION 사이드바
// - collapsed(아이콘만) ↔ expanded(텍스트+아이콘) 토글
// - hover 툴팁, layoutId 활성 pill 슬라이드
// ══════════════════════════════════════════════════════════════════════
function RailSidebar({
  active, onChange,
}: { active: AdminTab; onChange: (t: AdminTab) => void }) {
  const [expanded, setExpanded] = useState(true);
  const [tooltip, setTooltip] = useState<string|null>(null);

  return (
    <motion.div
      animate={{ width: expanded ? 220 : 68 }}
      transition={{ type:'spring', stiffness:320, damping:30 }}
      className="flex flex-col flex-shrink-0 overflow-hidden"
      style={{ background:'#1B4332', minHeight:'100vh', position:'relative' }}
    >
      {/* 로고 */}
      <div className="flex items-center justify-between px-4 py-5"
        style={{ borderBottom:'1px solid rgba(255,255,255,0.07)', minHeight:'72px' }}>
        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}>
              <div className="text-white text-xl" style={{ fontFamily:'SchoolSafetyNotification, sans-serif', fontWeight:700, letterSpacing:'-0.01em' }}>
                Day<span style={{ color:'#E8A838' }}>.</span>Poo
              </div>
              <div className="text-[12px] font-bold uppercase tracking-widest mt-0.5"
                style={{ color:'rgba(255,255,255,0.4)' }}>Admin</div>
            </motion.div>
          )}
        </AnimatePresence>
        <motion.button
          whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
          onClick={() => setExpanded(!expanded)}
          className="flex items-center justify-center rounded-xl flex-shrink-0"
          style={{ width:32, height:32, background:'rgba(255,255,255,0.08)', color:'rgba(255,255,255,0.6)', border:'none', cursor:'pointer' }}>
          {expanded ? <ChevronLeft size={14}/> : <ChevronRight size={14}/>}
        </motion.button>
      </div>

      {/* 네비 항목 */}
      <nav className="flex-1 px-3 py-3" style={{ overflowY:'auto' }}>
        {NAV_ITEMS.map((item) => (
          <div key={item.key} className="relative mb-1"
            onMouseEnter={() => !expanded && setTooltip(item.label)}
            onMouseLeave={() => setTooltip(null)}>
            <button
              onClick={() => onChange(item.key)}
              className="relative w-full flex items-center gap-3 rounded-xl transition-colors"
              style={{
                padding: expanded ? '10px 12px' : '10px',
                justifyContent: expanded ? 'flex-start' : 'center',
                color: active===item.key ? '#E8A838' : 'rgba(255,255,255,0.5)',
                border: 'none', background: 'transparent', cursor: 'pointer',
              }}
            >
              {/* 활성 배경 pill */}
              {active===item.key && (
                <motion.div layoutId="railActive" className="absolute inset-0 rounded-xl"
                  style={{ background:'rgba(232,168,56,0.15)', border:'1px solid rgba(232,168,56,0.25)' }}
                  transition={{ type:'spring', stiffness:400, damping:32 }} />
              )}
              <span className="relative z-10 flex-shrink-0">{item.icon}</span>
              <AnimatePresence>
                {expanded && (
                  <motion.span initial={{ opacity:0, width:0 }} animate={{ opacity:1, width:'auto' }}
                    exit={{ opacity:0, width:0 }} transition={{ duration:0.2 }}
                    className="relative z-10 text-sm font-bold whitespace-nowrap overflow-hidden"
                    style={{ color: active===item.key ? '#E8A838' : 'rgba(255,255,255,0.6)' }}>
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
              {/* 배지 */}
              {item.badge && item.badge > 0 && (
                <motion.span initial={{ scale:0 }} animate={{ scale:1 }}
                  className="z-10 text-[10px] font-black rounded-full flex items-center justify-center"
                  style={{
                    position: expanded ? 'static' : 'absolute',
                    top: expanded ? 'auto' : -2,
                    right: expanded ? 'auto' : -2,
                    marginLeft: expanded ? 'auto' : 0,
                    width:16, height:16,
                    background:'#E85D5D', color:'#fff', flexShrink:0,
                    boxShadow: expanded ? 'none' : '0 2px 6px rgba(232,93,93,0.4)',
                  }}>
                  {item.badge}
                </motion.span>
              )}
            </button>

            {/* 툴팁 (collapsed 상태) */}
            <AnimatePresence>
              {!expanded && tooltip===item.label && (
                <motion.div initial={{ opacity:0, x:-4 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }}
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-3 z-50 pointer-events-none"
                  style={{ whiteSpace:'nowrap' }}>
                  <div className="px-3 py-1.5 rounded-xl text-xs font-bold"
                    style={{ background:'#1A2B27', color:'#fff', boxShadow:'0 4px 16px rgba(0,0,0,0.25)' }}>
                    {item.label}
                    {item.badge ? <span className="ml-1.5 text-[10px] text-red-400">{item.badge}</span> : null}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </nav>

      {/* 하단 관리자 프로필 */}
      <div className="px-3 py-3" style={{ borderTop:'1px solid rgba(255,255,255,0.07)' }}>
        <div className="flex items-center gap-3 p-2.5 rounded-xl"
          style={{ background:'rgba(255,255,255,0.06)' }}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-black text-sm flex-shrink-0"
            style={{ background:'#E8A838', color:'#1B4332' }}>A</div>
          <AnimatePresence>
            {expanded && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
                className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">관리자</p>
                <p className="text-[10px]" style={{ color:'rgba(255,255,255,0.4)' }}>Super Admin</p>
              </motion.div>
            )}
          </AnimatePresence>
          {expanded && (
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              style={{ color:'rgba(255,255,255,0.35)', background:'none', border:'none', cursor:'pointer' }}>
              <LogOut size={14}/>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ── AdminPage 메인 ─────────────────────────────────────────────────────
export function AdminPage() {
  const [activeTab, setActiveTab] = useState<AdminTab>('dashboard');
  const [prevTab, setPrevTab] = useState<AdminTab>('dashboard');

  useEffect(() => {
    (window as any).setAdminTab = (tab: AdminTab) => {
      setPrevTab(activeTab);
      setActiveTab(tab);
    };
  }, [activeTab]);

  const TAB_ORDER: AdminTab[] = ['dashboard','users','toilets','cs','store','system'];
  const tabDir = TAB_ORDER.indexOf(activeTab) >= TAB_ORDER.indexOf(prevTab) ? 1 : -1;

  const handleTabChange = (t: AdminTab) => {
    setPrevTab(activeTab);
    setActiveTab(t);
  };

  const slideVar = {
    enter: (d: number) => ({ opacity:0, y: d > 0 ? 12 : -12 }),
    center: { opacity:1, y:0 },
    exit: (d: number) => ({ opacity:0, y: d > 0 ? -12 : 12 }),
  };

  const tabTitle: Record<AdminTab, string> = {
    dashboard:'대시보드', users:'유저 관리', toilets:'화장실 관리',
    cs:'문의/FAQ', store:'상점 관리', system:'시스템 설정',
  };

  return (
    <div className="flex" style={{
      background:'#F8FAF9',
      minHeight:'100vh',
      color:'#1A2B27',
      fontFamily: "'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, sans-serif"
    }}>

      {/* Rail Navigation 사이드바 */}
      <RailSidebar active={activeTab} onChange={handleTabChange} />

      {/* 메인 컨텐츠 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* 탑바 */}
        <div className="flex items-center justify-between px-6 py-4"
          style={{ background:'#fff', borderBottom:'1px solid rgba(26,43,39,0.07)', boxShadow:'0 1px 4px rgba(26,43,39,0.04)' }}>
          <div>
            <p className="font-black text-lg" style={{ color:'#1A2B27', letterSpacing:'-0.03em' }}>
              {tabTitle[activeTab]}
            </p>
            <p className="text-xs mt-0.5" style={{ color:'rgba(26,43,39,0.4)' }}>
              2026년 3월 19일 · <span style={{ fontFamily:'SchoolSafetyNotification, sans-serif', fontWeight:700 }}>Day.Poo</span> Admin Console
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* 실시간 배지 */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold"
              style={{ background:'rgba(82,183,136,0.08)', border:'1px solid rgba(82,183,136,0.2)', color:'#2D6A4F' }}>
              <motion.div animate={{ opacity:[1,0.3,1] }} transition={{ duration:1.5, repeat:Infinity }}
                className="w-1.5 h-1.5 rounded-full" style={{ background:'#52b788' }} />
              실시간 연결됨
            </div>
            {/* 알림 버튼 */}
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }}
              className="relative w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(26,43,39,0.05)', border:'1px solid rgba(26,43,39,0.08)', cursor:'pointer' }}>
              <Bell size={16} style={{ color:'rgba(26,43,39,0.55)' }}/>
              <div className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                style={{ background:'#E85D5D', border:'1.5px solid #fff' }} />
            </motion.button>
            {/* 새로고침 */}
            <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9, rotate:180 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background:'rgba(26,43,39,0.05)', border:'1px solid rgba(26,43,39,0.08)', cursor:'pointer' }}>
              <RefreshCw size={15} style={{ color:'rgba(26,43,39,0.55)' }}/>
            </motion.button>
          </div>
        </div>

        {/* 탭 컨텐츠 */}
        <div className="flex-1 overflow-auto p-6">
          <AnimatePresence mode="wait" custom={tabDir}>
            <motion.div key={activeTab} custom={tabDir} variants={slideVar}
              initial="enter" animate="center" exit="exit"
              transition={{ duration:0.28, ease:[0.16, 1, 0.3, 1] }}>
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'users'     && <UsersTab />}
              {activeTab === 'toilets'   && <ToiletsTab />}
              {activeTab === 'cs'        && <CsTab />}
              {activeTab === 'store'     && <StoreTab />}
              {activeTab === 'system'    && <SystemTab />}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
