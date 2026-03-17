import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import {
  ToiletData, VisitRecord, PoopColor, ConditionTag, FoodTag,
  BRISTOL_TYPES, POOP_COLORS, CONDITION_TAGS, FOOD_TAGS,
} from '../../types/toilet';

interface VisitModalProps {
  toilet: ToiletData;
  onClose: () => void;
  onComplete: (record: VisitRecord) => void;
}

const STEPS = ['브리스톨 척도', '색상 선택', '컨디션 태그', '먹은 음식'];

export function VisitModal({ toilet, onClose, onComplete }: VisitModalProps) {
  const [step, setStep] = useState(0);
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [color, setColor] = useState<PoopColor | null>(null);
  const [conditions, setConditions] = useState<ConditionTag[]>([]);
  const [foods, setFoods] = useState<FoodTag[]>([]);
  const [reactionColor, setReactionColor] = useState<PoopColor | null>(null);

  const canNext = [
    bristolType !== null,
    color !== null,
    true, // 컨디션 선택 선택사항
    true, // 음식 선택사항
  ];

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else {
      onComplete({
        toiletId: toilet.id,
        bristolType: bristolType!,
        color: color!,
        conditionTags: conditions,
        foodTags: foods,
        createdAt: new Date().toISOString(),
      });
    }
  };

  const handleColorSelect = (c: PoopColor) => {
    setColor(c);
    setReactionColor(c);
    setTimeout(() => setReactionColor(null), 1000);
  };

  const toggleCondition = (tag: ConditionTag) =>
    setConditions((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);
  const toggleFood = (tag: FoodTag) =>
    setFoods((prev) => prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]);

  return (
    <AnimatePresence>
      {/* 오버레이 */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[300]"
        style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      />

      {/* 모달 */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="fixed z-[301] left-1/2 -translate-x-1/2"
        style={{
          top: '50%', transform: 'translate(-50%, -50%)',
          width: 'min(480px, calc(100vw - 32px))',
          background: '#fff',
          borderRadius: '28px',
          boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
          overflow: 'hidden',
        }}
      >
        {/* 헤더 */}
        <div className="flex items-center justify-between px-6 py-5" style={{ borderBottom: '1px solid #eef5f0' }}>
          <div>
            <p className="text-xs font-semibold" style={{ color: '#7a9e8a' }}>{toilet.name}</p>
            <h2 className="font-black text-lg" style={{ color: '#1a2b22' }}>방문 인증하기 💩</h2>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#f4faf6', color: '#7a9e8a' }}>
            <X size={16} />
          </button>
        </div>

        {/* 스텝 인디케이터 */}
        <div className="flex items-center px-6 py-3 gap-2" style={{ borderBottom: '1px solid #eef5f0' }}>
          {STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 transition-all duration-300"
                style={{
                  background: i < step ? '#2D6A4F' : i === step ? '#1B4332' : '#eef5f0',
                  color: i <= step ? '#fff' : '#7a9e8a',
                }}
              >
                {i < step ? <Check size={12} /> : i + 1}
              </div>
              <span
                className="text-[10px] font-semibold hidden sm:block"
                style={{ color: i === step ? '#1B4332' : '#7a9e8a' }}
              >
                {s}
              </span>
              {i < 3 && (
                <div className="flex-1 h-px mx-1" style={{ background: i < step ? '#2D6A4F' : '#eef5f0' }} />
              )}
            </div>
          ))}
        </div>

        {/* 스텝 컨텐츠 */}
        <div className="px-6 py-5" style={{ minHeight: '280px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >

              {/* STEP 0: 브리스톨 척도 */}
              {step === 0 && (
                <div>
                  <p className="font-black text-base mb-1" style={{ color: '#1a2b22' }}>어떤 모양이었나요?</p>
                  <p className="text-xs mb-4" style={{ color: '#7a9e8a' }}>브리스톨 7척도 기반 — 솔직하게 선택해주세요 😊</p>
                  <div className="flex flex-col gap-2">
                    {BRISTOL_TYPES.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => setBristolType(b.type)}
                        className="flex items-center gap-3 p-3 rounded-2xl transition-all hover:scale-[1.01]"
                        style={{
                          border: `2px solid ${bristolType === b.type ? '#1B4332' : '#eef5f0'}`,
                          background: bristolType === b.type ? '#f4faf6' : '#fff',
                        }}
                      >
                        <span style={{ fontSize: '28px' }}>{b.emoji}</span>
                        <div className="text-left">
                          <p className="text-sm font-bold" style={{ color: '#1a2b22' }}>
                            {b.type}형 — {b.label}
                          </p>
                          <p className="text-xs" style={{ color: '#7a9e8a' }}>{b.desc}</p>
                        </div>
                        {bristolType === b.type && (
                          <Check size={16} className="ml-auto flex-shrink-0" style={{ color: '#1B4332' }} />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 1: 색상 선택 */}
              {step === 1 && (
                <div>
                  <p className="font-black text-base mb-1" style={{ color: '#1a2b22' }}>색상은 어땠나요?</p>
                  <p className="text-xs mb-6" style={{ color: '#7a9e8a' }}>건강 상태를 파악하는 데 도움이 됩니다</p>

                  {/* 반응 캐릭터 */}
                  <AnimatePresence>
                    {reactionColor && (
                      <motion.div
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="flex justify-center mb-4"
                      >
                        <div
                          className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                          style={{ background: POOP_COLORS[reactionColor].hex + '30', border: `3px solid ${POOP_COLORS[reactionColor].hex}` }}
                        >
                          💩
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(POOP_COLORS) as [PoopColor, { hex: string; label: string }][]).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => handleColorSelect(key)}
                        className="flex flex-col items-center gap-2 p-3 rounded-2xl transition-all hover:scale-105"
                        style={{
                          border: `2px solid ${color === key ? val.hex : '#eef5f0'}`,
                          background: color === key ? val.hex + '18' : '#fff',
                        }}
                      >
                        <div
                          className="w-10 h-10 rounded-full shadow-sm"
                          style={{ background: val.hex }}
                        />
                        <span className="text-xs font-semibold" style={{ color: '#1a2b22' }}>{val.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 2: 컨디션 태그 */}
              {step === 2 && (
                <div>
                  <p className="font-black text-base mb-1" style={{ color: '#1a2b22' }}>오늘 컨디션은?</p>
                  <p className="text-xs mb-4" style={{ color: '#7a9e8a' }}>여러 개 선택 가능 (선택사항)</p>
                  <div className="flex flex-wrap gap-2">
                    {CONDITION_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleCondition(tag)}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                        style={{
                          background: conditions.includes(tag) ? '#1B4332' : '#f4faf6',
                          color: conditions.includes(tag) ? '#fff' : '#2D6A4F',
                          border: `1.5px solid ${conditions.includes(tag) ? '#1B4332' : '#d4e8db'}`,
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 3: 음식 태그 */}
              {step === 3 && (
                <div>
                  <p className="font-black text-base mb-1" style={{ color: '#1a2b22' }}>어제 뭐 드셨어요?</p>
                  <p className="text-xs mb-4" style={{ color: '#7a9e8a' }}>AI가 식습관과 장 건강을 연결해 드립니다 (선택사항)</p>
                  <div className="flex flex-wrap gap-2">
                    {FOOD_TAGS.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleFood(tag)}
                        className="px-4 py-2 rounded-full text-sm font-semibold transition-all hover:scale-105"
                        style={{
                          background: foods.includes(tag) ? '#E8A838' : '#fdf8ee',
                          color: foods.includes(tag) ? '#1B4332' : '#b5810f',
                          border: `1.5px solid ${foods.includes(tag) ? '#E8A838' : '#f0d98a'}`,
                        }}
                      >
                        #{tag}
                      </button>
                    ))}
                  </div>

                  {/* 완료 미리보기 */}
                  {bristolType && color && (
                    <div
                      className="mt-5 p-4 rounded-2xl"
                      style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
                    >
                      <p className="text-xs font-bold text-white mb-2">🎉 인증 완료 후 마커가 컬러로 바뀝니다!</p>
                      <div className="flex items-center gap-3">
                        <span style={{ fontSize: '32px' }}>
                          {BRISTOL_TYPES.find((b) => b.type === bristolType)?.emoji}
                        </span>
                        <div>
                          <p className="text-xs font-semibold" style={{ color: 'rgba(255,255,255,0.9)' }}>
                            {bristolType}형 · {POOP_COLORS[color].label}
                          </p>
                          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                            {conditions.length > 0 && `#${conditions.join(' #')} `}
                            {foods.length > 0 && `#${foods.join(' #')}`}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

        {/* 하단 버튼 */}
        <div className="flex items-center gap-3 px-6 py-5" style={{ borderTop: '1px solid #eef5f0' }}>
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              className="flex items-center gap-1 px-4 py-3 rounded-2xl font-semibold text-sm"
              style={{ border: '1.5px solid #d4e8db', color: '#2D6A4F' }}
            >
              <ChevronLeft size={16} /> 이전
            </button>
          )}
          <button
            onClick={handleNext}
            disabled={!canNext[step]}
            className="flex-1 flex items-center justify-center gap-1.5 py-3 rounded-2xl font-black text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: step === 3
                ? 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)'
                : '#1B4332',
              color: '#fff',
              boxShadow: '0 4px 16px rgba(27,67,50,0.3)',
            }}
          >
            {step === 3 ? (
              <>인증 완료하고 💩 칠하기!</>
            ) : (
              <>다음 <ChevronRight size={16} /></>
            )}
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
