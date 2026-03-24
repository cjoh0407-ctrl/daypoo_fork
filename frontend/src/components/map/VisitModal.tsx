import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronRight, ChevronLeft, Check, AlertTriangle, Camera, Zap, RotateCcw, Loader2, Sparkles } from 'lucide-react';
import {
  ToiletData, VisitRecord, PoopColor, ConditionTag, FoodTag,
  BRISTOL_TYPES, POOP_COLORS, CONDITION_TAGS, FOOD_TAGS,
} from '../../types/toilet';
import { api } from '../../services/apiClient';
import { AiAnalysisResponse } from '../../types/api';

interface VisitModalProps {
  toilet: ToiletData;
  onClose: () => void;
  onComplete: (record: any) => void;
  checkInTime: number | null;
}

const STEPS = ['AI 분석', '모양 선택', '색상 선택', '추가 정보'];

export function VisitModal({ toilet, onClose, onComplete, checkInTime }: VisitModalProps) {
  const [step, setStep] = useState(0);
  const [bristolType, setBristolType] = useState<number | null>(null);
  const [color, setColor] = useState<PoopColor | null>(null);
  const [conditions, setConditions] = useState<ConditionTag[]>([]);
  const [foods, setFoods] = useState<FoodTag[]>([]);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  // AI 관련 상태
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);

  // 타이머 관련 상태
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!checkInTime) return 60;
    const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
    return Math.max(0, 60 - elapsed);
  });
  const [canComplete, setCanComplete] = useState(false);

  useEffect(() => {
    if (!checkInTime) return;
    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - checkInTime) / 1000);
      const remaining = Math.max(0, 60 - elapsed);
      setRemainingSeconds(remaining);
      if (remaining === 0) {
        setCanComplete(true);
        clearInterval(interval);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [checkInTime]);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' }, 
        audio: false 
      });
      streamRef.current = stream;
      setIsCameraActive(true); // video 요소를 DOM에 마운트하여 useEffect에서 연결되도록 함
    } catch (err) {
      console.error('카메라 시작 실패:', err);
      alert('카메라 권한이 필요합니다.');
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        track.stop();
        streamRef.current?.removeTrack(track);
      });
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  }, []);

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    setIsAnalyzing(true);
    const canvas = canvasRef.current;
    const video = videoRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d')?.drawImage(video, 0, 0);
    
    const base64 = canvas.toDataURL('image/jpeg', 0.8);
    setCapturedImage(base64);
    stopCamera();

    try {
      // 백엔드 AI 분석 API 호출 (기존 POST /records와 통합된 구조일 경우)
      // 또는 분석 전용 API가 있다면 그것을 호출. 가이드에는 POST /records 시 imageBase64 담으면 결과 온다고 함.
      // 여기서는 '분석 전용' 호출 후 수동 저장을 위해 response를 받는다고 가정.
      const res = await api.post<AiAnalysisResponse>('/records/analyze', { imageBase64: base64 });
      
      if (res.bristolScale) setBristolType(res.bristolScale);
      if (res.color) setColor(res.color as PoopColor);
      
      alert('AI 분석이 완료되었습니다! 분석 결과를 확인해주세요.');
      setStep(1); // 브리스톨 확인 단계로 이동
    } catch (err: any) {
      console.error('AI 분석 실패:', err);
      alert('AI 분석 중 오류가 발생했습니다. 직접 입력해주세요.');
      setStep(1);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNext = () => {
    // 체류 시간 검증 (항상 필요)
    if (!canComplete) {
      alert(`⌛ 최소 ${remainingSeconds}초 더 체류가 필요합니다.`);
      return;
    }

    // Step 0에서 사진이 있으면 바로 완료 가능 (백엔드 변경사항: imageBase64 있으면 bristolScale, color 선택 불필요)
    if (step === 0 && capturedImage) {
      onComplete({
        toiletId: toilet.id,
        bristolType: bristolType,
        color: color,
        conditionTags: conditions,
        foodTags: foods,
        imageBase64: capturedImage,
        createdAt: new Date().toISOString(),
      });
      return;
    }

    // 일반 흐름
    if (step < 3) {
      setStep(step + 1);
    } else {
      onComplete({
        toiletId: toilet.id,
        bristolType: bristolType!,
        color: color!,
        conditionTags: conditions,
        foodTags: foods,
        imageBase64: capturedImage,
        createdAt: new Date().toISOString(),
      });
    }
  };

  // ★ 백드롭 클릭 시 확인 후 닫기 (실수 방지)
  const handleBackdropClick = () => {
    if (step > 0 || bristolType !== null) {
      // 이미 작성 중이면 확인 모달 표시
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  // isCameraActive가 true가 되면 (video DOM 마운트 후) srcObject 할당
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [isCameraActive]);

  // 카메라 종료 정리
  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4">
      <canvas ref={canvasRef} className="hidden" />
      <motion.div
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={handleBackdropClick}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="relative z-10 w-full max-w-[480px] bg-white rounded-[32px] overflow-hidden flex flex-col shadow-2xl"
        style={{ maxHeight: 'calc(100vh - 80px)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#eef5f0]">
          <div>
            <p className="text-[10px] font-bold text-[#7a9e8a] uppercase tracking-wider">{toilet.name}</p>
            <h2 className="font-black text-xl text-[#1a2b22] flex items-center gap-2">방문 인증 {remainingSeconds > 0 && <span className="text-sm font-bold text-amber-500 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-100 flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> {remainingSeconds}s</span>}</h2>
          </div>
          <button onClick={handleBackdropClick} className="w-10 h-10 rounded-full bg-[#f4faf6] text-[#7a9e8a] flex items-center justify-center hover:bg-[#e8f3ec] transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="flex items-center px-6 py-4 gap-1.5 bg-[#fcfdfc] border-b border-[#eef5f0]">
          {STEPS.map((_, i) => (
            <div key={i} className="flex-1 h-1.5 rounded-full overflow-hidden bg-[#eef5f0]">
              <motion.div 
                initial={false}
                animate={{ width: i <= step ? '100%' : '0%' }}
                className="h-full bg-[#1B4332]"
              />
            </div>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar" style={{ minHeight: '320px' }}>
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-black text-lg text-[#1a2b22]">AI 간편 촬영 분석</p>
                      <p className="text-xs text-[#7a9e8a] mt-1">상태를 촬영하면 AI가 자동으로 분석해드립니다.</p>
                    </div>
                    <Sparkles className="text-amber-500 animate-pulse" size={24} />
                  </div>
                  
                  <div className="relative aspect-square w-full bg-gray-900 rounded-[28px] overflow-hidden group shadow-2xl border-4 border-gray-100">
                    {!isCameraActive && !capturedImage && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                        <div className="w-20 h-20 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                          <Camera className="text-white" size={40} />
                        </div>
                        <button 
                          onClick={startCamera}
                          className="px-6 py-3 bg-white text-[#1B4332] font-black rounded-2xl shadow-xl hover:scale-105 transition-transform"
                        >
                          카메라 실행하기
                        </button>
                      </div>
                    )}

                    {isCameraActive && (
                      <>
                        <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover scale-x-[-1]" />
                        <div className="absolute inset-0 border-[20px] border-black/20 pointer-events-none">
                          <div className="w-full h-full border-2 border-white/50 rounded-2xl border-dashed" />
                        </div>
                        <div className="absolute bottom-6 left-0 right-0 flex justify-center gap-4 px-6">
                          <button 
                            onClick={captureAndAnalyze}
                            disabled={isAnalyzing}
                            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-2xl border-8 border-gray-100/30 active:scale-90 transition-all disabled:opacity-50"
                          >
                            {isAnalyzing ? <Loader2 className="animate-spin text-[#1B4332]" /> : <Zap className="text-[#1B4332] fill-[#1B4332]" size={36} />}
                          </button>
                        </div>
                      </>
                    )}

                    {capturedImage && (
                      <div className="absolute inset-0">
                        <img src={capturedImage} alt="Capture" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center gap-4 backdrop-blur-[2px]">
                          <div className="flex items-center gap-2 text-white font-black text-xl">
                            {isAnalyzing ? <><Loader2 className="animate-spin" /> AI 분석 중...</> : <><Check className="text-emerald-400" /> 분석 완료!</>}
                          </div>
                          {!isAnalyzing && (
                            <button 
                              onClick={() => { setCapturedImage(null); startCamera(); }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-white/20 hover:bg-white/30 text-white rounded-xl backdrop-blur-md font-bold transition-all"
                            >
                              <RotateCcw size={16} /> 다시 찍기
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* AI 촬영 완료 시 바로 완료 또는 수동 수정 선택 */}
                  {capturedImage && !isAnalyzing ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 justify-center text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl">
                        <Sparkles size={16} />
                        <span className="text-sm font-bold">AI 분석이 완료되었습니다!</span>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setStep(1)}
                          className="py-3 px-4 bg-white border-2 border-[#eef5f0] text-[#1B4332] font-bold text-sm rounded-2xl hover:bg-[#f4faf6] transition-all"
                        >
                          데이터 수정하기
                        </button>
                        <button
                          onClick={handleNext}
                          disabled={!canComplete}
                          className="py-3 px-4 font-bold text-sm rounded-2xl text-white transition-all disabled:opacity-40 disabled:grayscale"
                          style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
                        >
                          {canComplete ? '바로 인증 완료 ✨' : `${remainingSeconds}초 대기`}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setStep(1)}
                      className="w-full py-4 text-[#7a9e8a] font-bold text-sm hover:underline"
                    >
                      촬영 없이 수동으로 입력할게요
                    </button>
                  )}
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <div>
                    <p className="font-black text-lg text-[#1a2b22] flex items-center gap-2">
                       모양 선택 {capturedImage && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-bold">AI 추정됨</span>}
                    </p>
                    <p className="text-xs text-[#7a9e8a] mt-1">브리스톨 척도 1~7번 중 선택해주세요.</p>
                  </div>
                  <div className="grid gap-2.5 pb-2">
                    {BRISTOL_TYPES.map((b) => (
                      <button
                        key={b.type}
                        onClick={() => setBristolType(b.type)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all ${
                          bristolType === b.type ? 'border-[#1B4332] bg-[#f4faf6]' : 'border-[#eef5f0] bg-white'
                        }`}
                      >
                        <span className="text-3xl">{b.emoji}</span>
                        <div className="text-left flex-1">
                          <p className={`text-sm font-bold ${bristolType === b.type ? 'text-[#1B4332]' : 'text-[#1a2b22]'}`}>
                            {b.type}형 · {b.label}
                          </p>
                          <p className="text-[11px] text-[#7a9e8a] leading-tight mt-0.5">{b.desc}</p>
                        </div>
                        {bristolType === b.type && <Check size={18} className="text-[#1B4332]" />}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <p className="font-black text-lg text-[#1a2b22]">색상을 골라주세요</p>
                    <p className="text-xs text-[#7a9e8a] mt-1">가장 가까운 색 하나를 선택합니다.</p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {(Object.entries(POOP_COLORS) as [PoopColor, { hex: string; label: string }][]).map(([key, val]) => (
                      <button
                        key={key}
                        onClick={() => setColor(key)}
                        className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                          color === key ? 'border-[#1B4332] bg-[#f4faf6]' : 'border-[#eef5f0] bg-white'
                        }`}
                      >
                        <div className="w-12 h-12 rounded-full shadow-inner" style={{ background: val.hex }} />
                        <span className="text-sm font-bold text-[#1a2b22]">{val.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="font-black text-lg text-[#1a2b22]">상태는 어떠셨나요?</p>
                    <div className="flex flex-wrap gap-2">
                      {CONDITION_TAGS.map((tag) => (
                        <button
                          key={tag}
                          onClick={() => setConditions(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                            conditions.includes(tag) ? 'bg-[#1B4332] border-[#1B4332] text-white' : 'bg-white border-[#eef5f0] text-[#1B4332]'
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
                          onClick={() => setFoods(prev => prev.includes(tag) ? prev.filter(t=>t!==tag) : [...prev, tag])}
                          className={`px-5 py-2.5 rounded-full text-sm font-bold border-2 transition-all ${
                            foods.includes(tag) ? 'bg-[#E8A838] border-[#E8A838] text-white' : 'bg-white border-[#eef5f0] text-[#b5810f]'
                          }`}
                        >
                          #{tag}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* 푸터 버튼 (Step 0에서 사진이 있을 때는 숨김) */}
        {!(step === 0 && capturedImage && !isAnalyzing) && (
          <div className="px-6 py-6 bg-[#fcfdfc] border-t border-[#eef5f0] flex gap-3">
            {step > 0 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex items-center justify-center w-14 h-14 rounded-2xl border-2 border-[#eef5f0] text-[#7a9e8a] hover:bg-[#f4faf6]"
              >
                <ChevronLeft size={24} />
              </button>
            )}
            <button
              onClick={handleNext}
              disabled={
                step === 0 ? false : // Step 0은 항상 다음으로 이동 가능 (수동 입력)
                step === 1 ? !bristolType :
                step === 2 ? !color :
                false
              }
              className="flex-1 py-4 rounded-2xl font-black text-lg text-white shadow-lg transition-all active:scale-95 disabled:opacity-30 disabled:grayscale"
              style={{ background: 'linear-gradient(135deg, #1B4332 0%, #2D6A4F 100%)' }}
            >
              {step === 3 ? '인증 완료하기 ✨' : '다음 단계로'}
            </button>
          </div>
        )}
      </motion.div>

      {/* ★ 닫기 확인 모달 (실수로 밖을 터치했을 때) */}
      <AnimatePresence>
        {showCloseConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[2100] flex items-center justify-center p-6"
          >
            <div className="absolute inset-0 bg-black/40" onClick={() => setShowCloseConfirm(false)} />
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="relative bg-white rounded-3xl p-6 shadow-2xl max-w-[320px] w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-14 h-14 rounded-full bg-[#FFF3E0] flex items-center justify-center mx-auto mb-4">
                <AlertTriangle size={28} className="text-[#E8A838]" />
              </div>
              <h3 className="font-black text-lg text-[#1a2b22] mb-2">작성을 중단할까요?</h3>
              <p className="text-sm text-[#7a9e8a] mb-6">
                지금까지 입력한 내용이 사라집니다.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowCloseConfirm(false)}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm border-2 border-[#eef5f0] text-[#1a2b22] hover:bg-[#f4faf6]"
                >
                  계속 작성
                </button>
                <button
                  onClick={onClose}
                  className="flex-1 py-3 rounded-2xl font-bold text-sm text-white"
                  style={{ background: '#E85D5D' }}
                >
                  나가기
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #eef5f0; border-radius: 10px; }
      `}</style>
    </div>
  );
}
