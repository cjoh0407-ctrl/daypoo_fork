import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface GridFlipRevealProps {
  children: React.ReactNode;
  rows?: number;
  cols?: number;
}

export const GridFlipReveal: React.FC<GridFlipRevealProps> = ({ 
  children, 
  rows = 8, 
  cols = 8 
}) => {
  const [isStarted, setIsStarted] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    const startTimer = setTimeout(() => setIsStarted(true), 100);
    // 애니메이션이 완전히 끝난 후 오버레이 제거 (입력 방해 방지)
    const finishTimer = setTimeout(() => setIsFinished(true), 2500);

    return () => {
      clearTimeout(startTimer);
      clearTimeout(finishTimer);
    };
  }, []);

  // 그리드 인덱스 생성
  const tiles = useMemo(() => {
    const t = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        t.push({ r, c, id: `${r}-${c}` });
      }
    }
    return t;
  }, [rows, cols]);

  return (
    <div className="relative w-full min-h-screen bg-[#F8FAF9]">
      {/* 실제 콘텐츠 레이어 - 바닥에 깔려 있음 */}
      <div className="relative z-0">
        {children}
      </div>

      {/* 애니메이션 오버레이 레이어 */}
      {!isFinished && (
        <div className="fixed inset-0 z-[999] pointer-events-none grid"
             style={{ 
               gridTemplateRows: `repeat(${rows}, 1fr)`,
               gridTemplateColumns: `repeat(${cols}, 1fr)`,
               perspective: '1200px'
             }}>
          {tiles.map((tile) => (
            <div key={tile.id} className="relative w-full h-full" style={{ transformStyle: 'preserve-3d' }}>
              <motion.div
                initial={{ rotateY: 0 }}
                animate={isStarted ? { rotateY: 180 } : { rotateY: 0 }}
                transition={{
                  duration: 0.8,
                  ease: [0.45, 0, 0.55, 1], // 부드러운 가속/감속
                  delay: (tile.r + tile.c) * 0.08 // 대각선 물결 효과 핵심
                }}
                className="w-full h-full relative"
                style={{ transformStyle: 'preserve-3d' }}
              >
                {/* 앞면: 짙은 에메랄드 커버 */}
                <div 
                  className="absolute inset-0 w-full h-full bg-[#1B4332] border-[0.5px] border-emerald-900/20"
                  style={{ backfaceVisibility: 'hidden' }}
                />

                {/* 뒷면: 투명 (뒤집히면 아래 실제 콘텐츠가 보임) */}
                <div 
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    backfaceVisibility: 'hidden', 
                    transform: 'rotateY(180deg)',
                    background: 'transparent'
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>
      )}

      {/* 중앙 브랜드 텍스트 (피어오르는 시차 애니메이션) */}
      <AnimatePresence>
        {isStarted && !isFinished && (
          <motion.div
            className="fixed inset-0 flex items-center justify-center z-[1000] pointer-events-none"
          >
            <div className="flex gap-1 overflow-hidden">
              {"Day.poo".split("").map((char, index) => (
                <motion.span
                  key={index}
                  initial={{ opacity: 0, y: 40, filter: 'blur(15px)' }}
                  animate={{ 
                    opacity: [0, 1, 0], 
                    y: [40, 0, -20],
                    filter: ['blur(15px)', 'blur(0px)', 'blur(5px)'] 
                  }}
                  transition={{ 
                    duration: 1.8, 
                    delay: 0.3 + index * 0.1,
                    times: [0, 0.4, 1],
                    ease: "easeOut"
                  }}
                  className="text-7xl font-bold text-amber-400 drop-shadow-[0_0_25px_rgba(232,168,56,0.3)] tracking-tighter"
                  style={{ fontFamily: 'SchoolSafetyNotification, cursive' }}
                >
                  {char === " " ? "\u00A0" : char}
                </motion.span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
