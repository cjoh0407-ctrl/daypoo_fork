import { motion } from 'framer-motion';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip 
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

export function ReportCard() {
  return (
    <section className="py-24 px-6" style={{ backgroundColor: 'var(--bg-light)' }}>
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          whileHover={{ y: -10 }}
          className="p-8 md:p-12 rounded-[32px] shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'var(--surface)', border: '1px solid var(--border-light)' }}
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-10" style={{ color: 'var(--text-main)' }}>
            이번 주 쾌변 리포트
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            {/* Pie Chart Section */}
            <div className="flex flex-col items-center">
              <div className="w-full h-[250px] relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={PIE_DATA}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                    >
                      <Cell fill="var(--amber)" />
                      <Cell fill="var(--border-light)" />
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-4xl font-bold" style={{ color: 'var(--text-main)' }}>85</span>
                  <span className="text-sm font-medium" style={{ color: 'var(--text-sec)' }}>점</span>
                </div>
              </div>
              <p className="mt-4 font-medium" style={{ color: 'var(--text-main)' }}>쾌변 점수</p>
            </div>

            {/* Bar Chart Section */}
            <div className="w-full h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={BAR_DATA}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-light)" />
                  <XAxis 
                    dataKey="day" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'var(--text-sec)', fontSize: 12 }} 
                  />
                  <YAxis hide />
                  <Tooltip 
                    cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="score" fill="var(--green-mid)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-center mt-4 font-medium" style={{ color: 'var(--text-main)' }}>7일 브리스톨 척도</p>
            </div>
          </div>

          {/* AI Advice */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-12 p-6 rounded-2xl flex items-center gap-4"
            style={{ backgroundColor: 'rgba(232, 168, 56, 0.1)' }}
          >
            <div className="w-12 h-12 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--amber)' }}>
              <span className="text-xl">✨</span>
            </div>
            <p className="text-lg font-medium" style={{ color: 'var(--text-main)' }}>
              "매운 음식 줄이면 쾌변 점수 올라요 🌶️"
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
