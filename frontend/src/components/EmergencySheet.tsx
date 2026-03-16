import { motion, AnimatePresence } from 'framer-motion';
import { Phone, Navigation, X } from 'lucide-react';

interface EmergencySheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const EMERGENCY_LIST = [
  { name: '대치빌딩 1층 화장실', distance: '45m', time: '1분' },
  { name: 'GS25 혜민병원점', distance: '120m', time: '2분' },
  { name: '중앙 공영 주차장', distance: '210m', time: '4분' },
];

export function EmergencySheet({ isOpen, onClose }: EmergencySheetProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[1000] bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 z-[1001] rounded-t-[32px] p-8 md:p-12"
            style={{ backgroundColor: 'var(--green-deep)' }}
          >
            <div className="max-w-xl mx-auto">
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-white/20 rounded-full mx-auto mb-8" />

              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl md:text-3xl font-bold text-white">
                  🚨 비상! <span className="opacity-70 font-normal">가장 가까운 화장실 TOP 3</span>
                </h2>
                <button onClick={onClose} className="p-2 text-white/50 hover:text-white transition-colors">
                  <X size={28} />
                </button>
              </div>

              <div className="space-y-4">
                {EMERGENCY_LIST.map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                    className="p-5 rounded-2xl flex items-center justify-between"
                    style={{ backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
                  >
                    <div>
                      <h4 className="font-bold text-white text-lg">{item.name}</h4>
                      <p className="text-white/60">거리 {item.distance} • 도보 {item.time}</p>
                    </div>
                    <button 
                      className="px-5 py-2.5 rounded-full flex items-center gap-2 font-bold transition-all hover:bg-amber hover:text-green-deep" 
                      style={{ border: '1px solid var(--amber)', color: 'var(--amber)' }}
                    >
                      <Navigation size={18} />
                      길찾기
                    </button>
                  </motion.div>
                ))}
              </div>

              <div className="mt-8 text-center">
                <p className="text-white/40 text-sm italic">
                  * 주변 화장실 정보는 수시로 업데이트 됩니다
                </p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
