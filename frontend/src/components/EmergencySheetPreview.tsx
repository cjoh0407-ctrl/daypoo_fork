import { motion } from 'framer-motion';
import { Navigation, Clock } from 'lucide-react';

interface ToiletItem {
  id: string;
  rank: number;
  name: string;
  distanceStr: string;
  timeStr: string;
  isOpen24h: boolean;
  lat: number;
  lng: number;
}

interface EmergencySheetPreviewProps {
  processedToilets: ToiletItem[];
  openNav: (item: ToiletItem) => void;
}

/**
 * EmergencySheetPreview: 급똥 발생 시 가장 직관적인 '가로 스크롤 카드(Horizontal Scroll Snap)' 
 * 디자인을 적용하여 사용자에게 최적의 화장실 경로를 추천합니다.
 */
export function EmergencySheetPreview({ processedToilets, openNav }: EmergencySheetPreviewProps) {
  
  if (!processedToilets || processedToilets.length === 0) {
    return (
      <div className="py-12 text-center text-white/40">
        <p className="text-sm font-medium">주변 1km 이내에 개방된 화장실이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold text-white/80 px-1 italic tracking-tight">가까운 경로 추천</h3>
      
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {processedToilets.map((item, i) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className={`snap-start min-w-[82%] rounded-2xl p-5 border backdrop-blur-xl transition-all
              ${i === 0 ? 'bg-rose-500/20 border-rose-300/30 shadow-lg shadow-rose-900/10' : 'bg-white/5 border-white/10'}`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className={`text-[10px] font-black tracking-widest ${i === 0 ? 'text-rose-300' : 'text-white/40'}`}>
                  #{item.rank} RECOMMENDATION
                </p>
                <p className="text-lg font-black text-white mt-1 truncate max-w-[180px]">{item.name}</p>
                <p className="text-sm text-white/70 mt-1.5 flex items-center gap-1.5">
                  <Clock size={12} className="text-emerald-400" />
                  {item.distanceStr} · 도보 {item.timeStr}
                </p>
              </div>
              {item.isOpen24h && (
                <span className="px-2 py-1 rounded-lg text-[10px] font-black bg-emerald-400/20 text-emerald-300 border border-emerald-400/20">
                  24H
                </span>
              )}
            </div>
            
            <button
              onClick={() => openNav(item)}
              className={`mt-6 w-full rounded-xl py-3.5 font-black text-sm transition-all shadow-xl shadow-black/20
                ${i === 0 ? 'bg-white text-slate-900 border border-white' : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'}`}
            >
              길안내 시작
            </button>
          </motion.div>
        ))}
        {/* 우측 여백 확보용 */}
        <div className="min-w-[10px]" />
      </div>
    </div>
  );
}
