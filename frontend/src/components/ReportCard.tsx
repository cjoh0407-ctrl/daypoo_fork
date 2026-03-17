import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Lock, TrendingUp, Sparkles, ArrowRight } from 'lucide-react';
import {
  PieChart, Pie, Cell, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
} from 'recharts';

const PIE_DATA = [
  { name: 'Healthy', value: 85 },
  { name: 'Remaining', value: 15 },
];

const BAR_DATA = [
  { day: '월', score: 4 },
  { day: '화', score: 3 },
  { day: '수', score: 5 },
  { day: '목', score: 4 },
  { day: '금', score: 2 },
  { day: '토', score: 6 },
  { day: '일', score: 4 },
];

// 블러 처리된 AI 인사이트 항목 (가입 유도)
const LOCKED_INSIGHTS = [
  {
    icon: '🍽️',
    label: '식습관 분석',
    preview: '매운 음식 섭취와 장 자극 패턴이 관찰되고 있어요',
  },
  {
    icon: '💧',
    label: '수분 섭취 연관성',
    preview: '수분이 부족한 날 브리스톨 지수가 낮아지는 경향이...',
  },
  {
    icon: '😴',
    label: '수면 & 장 리듬',
    preview: '수면 패턴과 배변 타이밍 사이에 유의미한 상관관계가...',
  },
];

export function ReportCard() {
  const navigate = useNavigate();

  return (
    <section className="pt-32 pb-48 px-6" style={{ backgroundColor: '#eef5f0' }}>
      <div className="max-w-5xl mx-auto">

        {/* ── 섹션 헤더 ─────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p
            className="text-xs font-bold uppercase tracking-widest mb-3"
            style={{ color: 'var(--green-mid)' }}
          >
            AI HEALTH REPORT
          </p>
          <h2
            className="text-3xl md:text-5xl font-black"
            style={{ color: 'var(--text-main)', letterSpacing: '-0.02em' }}
          >
            당신의 장이 말하고 있어요
          </h2>
          <p className="mt-4 text-lg" style={{ color: 'var(--text-sec)' }}>
            기록만 하면 AI가 알아서 분석합니다
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── 좌측: 차트 카드 (3/5) ──────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="lg:col-span-3 p-8 rounded-[32px] shadow-xl overflow-hidden"
            style={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border-light)',
            }}
          >
            {/* 카드 헤더 */}
            <div className="flex items-center justify-between mb-8">
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text-sec)' }}>
                  2026년 3월 3주차
                </p>
                <h3 className="text-xl font-bold" style={{ color: 'var(--text-main)' }}>
                  이번 주 쾌변 리포트
                </h3>
              </div>
              <span
                className="px-3 py-1 rounded-full text-sm font-bold"
                style={{ backgroundColor: 'rgba(232,168,56,0.12)', color: 'var(--amber)' }}
              >
                ✨ AI 분석 완료
              </span>
            </div>

            <div className="grid grid-cols-2 gap-6 items-center">
              {/* Pie */}
              <div className="flex flex-col items-center">
                <div className="w-full h-[220px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PIE_DATA}
                        cx="50%" cy="50%"
                        innerRadius={55} outerRadius={75}
                        paddingAngle={5}
                        dataKey="value"
                        startAngle={90} endAngle={450}
                      >
                        <Cell fill="var(--amber)" />
                        <Cell fill="var(--border-light)" />
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl font-black" style={{ color: 'var(--text-main)' }}>85</span>
                    <span className="text-sm font-medium" style={{ color: 'var(--text-sec)' }}>쾌변 점수</span>
                  </div>
                </div>
                <div className="flex gap-3 text-xs mt-1">
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-sec)' }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--amber)' }} /> 건강함
                  </span>
                  <span className="flex items-center gap-1" style={{ color: 'var(--text-sec)' }}>
                    <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: 'var(--border-light)' }} /> 개선 필요
                  </span>
                </div>
              </div>

              {/* Bar */}
              <div className="w-full">
                <div className="w-full h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={BAR_DATA} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                      <XAxis
                        dataKey="day"
                        axisLine={false} tickLine={false}
                        tick={{ fill: 'var(--text-sec)', fontSize: 11 }}
                      />
                      <YAxis hide />
                      <Tooltip
                        cursor={{ fill: 'rgba(0,0,0,0.04)' }}
                        contentStyle={{
                          borderRadius: '12px', border: 'none',
                          boxShadow: '0 10px 24px rgba(0,0,0,0.1)',
                          fontSize: '13px',
                        }}
                        formatter={(v) => [`${v}형`, '브리스톨']}
                      />
                      <Bar dataKey="score" fill="var(--green-mid)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-center text-xs mt-2" style={{ color: 'var(--text-sec)' }}>
                  7일 브리스톨 척도
                </p>
              </div>
            </div>

            {/* AI 코멘트 */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4 }}
              className="mt-6 p-5 rounded-2xl flex items-center gap-4"
              style={{ backgroundColor: 'rgba(232,168,56,0.08)', border: '1px solid rgba(232,168,56,0.2)' }}
            >
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-lg"
                style={{ backgroundColor: 'var(--amber)' }}
              >
                ✨
              </div>
              <div>
                <p className="text-xs font-bold mb-0.5" style={{ color: 'var(--amber)' }}>AI 한줄 조언</p>
                <p className="text-sm font-medium" style={{ color: 'var(--text-main)' }}>
                  "매운 음식 줄이면 쾌변 점수 더 올라가요 🌶️ 수분 섭취도 늘려보세요!"
                </p>
              </div>
            </motion.div>
          </motion.div>

          {/* ── 우측: 잠긴 AI 인사이트 (2/5) ──────────── */}
          <motion.div
            initial={{ opacity: 0, x: 32 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            className="lg:col-span-2 flex flex-col gap-4"
          >
            {/* 안내 배너 */}
            <div
              className="p-5 rounded-2xl"
              style={{
                background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)',
              }}
            >
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-amber-400" style={{ color: 'var(--amber)' }} />
                <p className="text-sm font-bold text-white">AI 심층 분석</p>
              </div>
              <p className="text-white/70 text-sm leading-relaxed">
                가입하면 식습관·수분·수면과 연결된 개인화 인사이트를 받을 수 있어요.
              </p>
            </div>

            {/* 잠긴 인사이트 카드들 */}
            {LOCKED_INSIGHTS.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="relative p-5 rounded-2xl overflow-hidden"
                style={{
                  backgroundColor: 'var(--surface)',
                  border: '1px solid var(--border-light)',
                }}
              >
                {/* 잠금 오버레이 */}
                <div
                  className="absolute inset-0 flex items-center justify-center z-10 rounded-2xl"
                  style={{ backdropFilter: 'blur(6px)', backgroundColor: 'rgba(255,255,255,0.5)' }}
                >
                  <div className="flex flex-col items-center gap-1">
                    <Lock size={20} style={{ color: 'var(--green-mid)' }} />
                    <span className="text-xs font-semibold" style={{ color: 'var(--green-mid)' }}>가입 후 확인</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <span className="text-2xl">{item.icon}</span>
                  <div>
                    <p className="text-sm font-bold mb-1" style={{ color: 'var(--text-main)' }}>{item.label}</p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--text-sec)' }}>{item.preview}</p>
                  </div>
                </div>
              </motion.div>
            ))}

            {/* 마이페이지 이동 버튼 */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/signup')}
              className="w-full p-4 rounded-2xl flex items-center justify-center gap-2 font-bold transition-all"
              style={{
                backgroundColor: 'var(--amber)',
                color: '#1B4332',
                boxShadow: '0 4px 20px rgba(232,168,56,0.3)',
              }}
            >
              <TrendingUp size={18} />
              내 건강 리포트 보기
              <ArrowRight size={16} />
            </motion.button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
