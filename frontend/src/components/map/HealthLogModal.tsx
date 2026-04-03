import { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, AlertTriangle, Sparkles } from 'lucide-react';
import WaveButtonComponent from '../WaveButton';
import {
  ToiletData,
  PoopColor,
  ConditionTag,
  FoodTag,
  BRISTOL_TYPES,
  POOP_COLORS,
  CONDITION_TAGS,
  FOOD_TAGS,
} from '../../types/toilet';

export interface HealthLogResult {
  bristolType: number | null;
  color: PoopColor | null;
  conditionTags: ConditionTag[];
  foodTags: FoodTag[];
}

interface HealthLogModalProps {
  /** 화장실 방문 연동 시 전달. null/undefined이면 독립 기록 모드 (toiletId 없이 저장). */
  toilet?: ToiletData | null;
  /** TODO: /ai/analyze 엔드포인트 구현 후 AI 분석 결과를 전달. 현재는 항상 null. */
  initialBristolType?: number | null;
  /** TODO: /ai/analyze 엔드포인트 구현 후 AI 분석 결과를 전달. 현재는 항상 null. */
  initialColor?: PoopColor | null;
  onClose: () => void;
  onComplete: (result: HealthLogResult) => Promise<void>;
}

const STEPS = ['모양 선택', '색상 선택', '추가 정보'];

export function HealthLogModal({
  toilet,
  initialBristolType,
  initialColor,
  onClose,
  onComplete,
}: HealthLogModalProps) {
  const [step, setStep] = useState(0);
  const [bristolType, setBristolType] = useState<number | null>(initialBristolType ?? null);
  const [color, setColor] = useState<PoopColor | null>(initialColor ?? null);
  const [conditions, setConditions] = useState<ConditionTag[]>([]);
  const [foods, setFoods] = useState<FoodTag[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleNext = async () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      await onComplete({ bristolType, color, conditionTags: conditions, foodTags: foods });
    }
  };

  const handleBackdropClick = () => {
    if (bristolType !== null || color !== null || conditions.length > 0 || foods.length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[2100] flex items-center justify-center p-4">
      <m.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <m.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl max-h-[calc(100vh-80px)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
          <div>
            {toilet && (
              <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">
                {toilet.name}
              </p>
            )}
            <h2 className="font-black text-xl text-[#1a2b22]">배변 건강 기록</h2>
          </div>
          <button
            onClick={handleBackdropClick}
            aria-label="닫기"
            className="w-10 h-10 rounded-full bg-[#f4faf6] text-[#7a9e8a] flex items-center justify-center hover:bg-[#e8f3ec] transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Progress */}
        <div className="flex items-center px-6 py-4 gap-1.5 bg-[#fcfdfc] border-b border-[#eef5f0]">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#eef5f0]">
              <m.div
                initial={false}
                animate={{ scaleX: i <= step ? 1 : 0 }}
                className="h-full bg-[#1B4332] w-full origin-left"
              />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar min-h-[320px]">
          <AnimatePresence mode="wait">
            <m.div
              key={step}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-4">
                  <div>
                    <p className="font-black text-lg text-[#1a2b22]">모양 선택</p>
                    <p className="text-xs text-[#7a9e8a] mt-1">
                      브리스톨 척도 1~7번 중 선택해주세요.
                    </p>
                  </div>
                  <div className="grid gap-2.5 pb-2">
                    {BRISTOL_TYPES.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => setBristolType(b.type)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          bristolType === b.type
                            ? 'border-[#1B4332] bg-[#f4faf6]'
                            : 'border-[#eef5f0] bg-white'
                        }`}
                      >
                        <span className="text-3xl">{b.emoji}</span>
                        <div className="text-left flex-1">
                          <p
                            className={`text-sm font-bold ${bristolType === b.type ? 'text-[#1B4332]' : 'text-[#1a2b22]'}`}
                          >
                            {b.type}형 · {b.label}
                          </p>
                          <p className="text-[11px] text-[#7a9e8a] leading-tight mt-0.5">
                            {b.desc}
                          </p>
                        </div>
                        {bristolType === b.type && <Check size={18} className="text-[#1B4332]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <p className="font-black text-lg text-[#1a2b22]">색상을 골라주세요</p>
                    <p className="text-xs text-[#7a9e8a] mt-1">가장 가까운 색 하나를 선택합니다.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(
                      Object.entries(POOP_COLORS) as [PoopColor, { hex: string; label: string }][]
                    ).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setColor(key)}
                        aria-label={`${val.label} 색상 선택`}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          color === key
                            ? 'border-[#1B4332] bg-[#f4faf6]'
                            : 'border-[#eef5f0] bg-white'
                        }`}
                      >
                        <div
                          className="w-12 h-12 rounded-full shadow-inner"
                          style={{ backgroundColor: val.hex }}
                        />
                        <span className="text-sm font-bold text-[#1a2b22]">{val.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="font-black text-lg text-[#1a2b22]">상태는 어떠셨나요?</p>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setConditions((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                            )
                          }
                          className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                            conditions.includes(tag)
                              ? 'bg-[#1B4332] border-[#1B4332] text-white'
                              : 'bg-white border-[#eef5f0] text-[#1B4332]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <p className="font-black text-lg text-[#1a2b22]">최근 드신 음식은?</p>
                    <div className="flex flex-wrap gap-2">
                      {FOOD_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() =>
                            setFoods((prev) =>
                              prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
                            )
                          }
                          className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                            foods.includes(tag)
                              ? 'bg-[#E8A838] border-[#E8A838] text-white'
                              : 'bg-white border-[#eef5f0] text-[#b5810f]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </m.div>
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-6 py-6 bg-[#fcfdfc] border-t border-[#eef5f0] flex gap-3">
          {step > 0 && (
            <button
              onClick={() => setStep(step - 1)}
              aria-label="이전 단계"
              className="flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-[#eef5f0] text-[#7a9e8a] hover:bg-[#f4faf6]"
            >
              <ChevronLeft size={24} />
            </button>
          )}
          <WaveButtonComponent
            onClick={handleNext}
            disabled={step === 0 ? !bristolType : step === 1 ? !color : false}
            variant="primary"
            size="lg"
            className="flex-1 shadow-lg"
            icon={step === 2 ? <Sparkles size={20} /> : <ChevronRight size={20} />}
          >
            {step === 2 ? '기록 완료하기 ✨' : '다음 단계로'}
          </WaveButtonComponent>
        </div>
      </m.div>

      {/* 닫기 확인 */}
      <AnimatePresence>
        {showCloseConfirm && (
          <m.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2200] flex items-center justify-center p-6"
          >
            <div
              className="absolute inset-0 bg-black/40"
              onClick={() => setShowCloseConfirm(false)}
            />
            <m.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-[#E8A838]" />
              </div>
              <h3 className="font-black text-lg text-[#1a2b22] mb-2">기록을 중단할까요?</h3>
              <p className="text-sm text-[#7a9e8a] mb-6">
                {toilet
                  ? '방문 인증은 유지되며, 건강 기록만 취소됩니다.'
                  : '입력한 내용이 사라집니다.'}
              </p>
              <div className="flex gap-3">
                <WaveButtonComponent
                  onClick={() => setShowCloseConfirm(false)}
                  variant="outline"
                  size="md"
                  className="flex-1"
                >
                  계속 작성
                </WaveButtonComponent>
                <WaveButtonComponent onClick={onClose} variant="error" size="md" className="flex-1">
                  나가기
                </WaveButtonComponent>
              </div>
            </m.div>
          </m.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef5f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
