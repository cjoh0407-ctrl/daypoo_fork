import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useSpring } from 'framer-motion';

// ── 타입 ──────────────────────────────────────────────────────────────
interface BlobConfig {
  pathD: string;
  viewBox: string;
  fill: string;
  beamColorFrom: string;
  beamColorTo: string;
  beamDur: number;
  numColor: string;
  labelColor: string;
  gradientId: string;
  pathId: string;
}

interface StatConfig {
  target: number;
  format: (v: number) => string;
  label: string;        // 숫자 아래 큰 타이틀
  desc: string;         // 추가될 상세 설명
}

// ── 데이터 ────────────────────────────────────────────────────────────
const BLOBS: BlobConfig[] = [
  {
    pathId: 'bp0', gradientId: 'grad0',
    viewBox: '0 -4 220 236',
    // 좌측: 위쪽이 뾰족하게 올라온 유기적 blob
    pathD: 'M100,10 C128,-2 166,10 188,40 C212,74 212,122 194,156 C176,192 138,212 104,210 C68,208 32,188 16,156 C-2,120 2,72 22,44 C44,14 72,22 100,10Z',
    fill: '#daeee4',
    beamColorFrom: '#52b788', beamColorTo: '#1B4332',
    beamDur: 3200,
    numColor: '#1B4332', labelColor: '#2D6A4F',
  },
  {
    pathId: 'bp1', gradientId: 'grad1',
    viewBox: '-4 -4 228 240',
    // 중앙: 우측이 살짝 튀어나온 blob
    pathD: 'M108,8 C142,-4 184,14 206,50 C230,90 226,144 202,176 C178,210 136,228 100,224 C62,220 24,198 8,164 C-10,126 -4,76 20,48 C46,18 74,20 108,8Z',
    fill: '#1B4332',
    beamColorFrom: '#E8A838', beamColorTo: '#ffffff',
    beamDur: 2600,
    numColor: '#E8A838', labelColor: '#ffffff',
  },
  {
    pathId: 'bp2', gradientId: 'grad2',
    viewBox: '0 -2 220 232',
    // 우측: 좌하단이 불룩한 blob
    pathD: 'M112,12 C144,2 182,20 200,54 C220,92 216,142 194,172 C172,204 130,220 96,216 C60,212 26,192 12,160 C-4,124 2,78 26,50 C52,20 80,22 112,12Z',
    fill: '#e4f5ed',
    beamColorFrom: '#52b788', beamColorTo: '#2D6A4F',
    beamDur: 3600,
    numColor: '#2D6A4F', labelColor: '#2D6A4F',
  },
];

const STATS: StatConfig[] = [
  {
    target: 72000,
    format: (v) => v >= 1000 ? `${Math.round(v / 1000)}천+` : `${v}`,
    label: '전국 공용 화장실 정보',
    desc: '전국 7만 개 이상의 화장실 데이터를\n실시간으로 확인, 안심하고 이용하세요.',
  },
  {
    target: 31400,
    format: (v) => v >= 1000 ? `${((v / 1000) / 10).toFixed(1)}만+` : `${v}`,
    label: '누적 건강 체크 데이터',
    desc: '수많은 사용자의 실제 기록이 모여\n더 정확한 배변 건강 지도를 완성합니다.',
  },
  {
    target: 89,
    format: (v) => `${v}%`,
    label: '이용 환경 만족도 평균',
    desc: '청결도와 편의성 등 실제 리뷰를\n 바탕으로 사용자들이 직접 평가한 \n생생한 결과입니다.',
  },
];

// ── Border Beam Hook ──────────────────────────────────────────────────
function useBorderBeam(
  pathRef: React.RefObject<SVGPathElement | null>,
  glowRef: React.RefObject<SVGPathElement | null>,
  gradRef: React.RefObject<SVGLinearGradientElement | null>,
  dur: number
) {
  useEffect(() => {
    const path = pathRef.current;
    const glow = glowRef.current;
    const grad = gradRef.current;
    if (!path || !glow || !grad) return;

    const total = path.getTotalLength();
    const beamLen = total * 0.2;
    glow.setAttribute('stroke-dasharray', `${beamLen} ${total - beamLen}`);

    let raf: number;
    let start: number | null = null;

    function animate(ts: number) {
      if (!start) start = ts;
      const progress = ((ts - start) % dur) / dur;
      glow.setAttribute('stroke-dashoffset', String(total - progress * total));

      const pt1 = path.getPointAtLength((progress * total) % total);
      const pt2 = path.getPointAtLength((progress * total + beamLen) % total);
      grad.setAttribute('x1', String(pt1.x));
      grad.setAttribute('y1', String(pt1.y));
      grad.setAttribute('x2', String(pt2.x));
      grad.setAttribute('y2', String(pt2.y));

      raf = requestAnimationFrame(animate);
    }
    raf = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf);
  }, [pathRef, glowRef, gradRef, dur]);
}

// ── 카운트업 Hook ─────────────────────────────────────────────────────
function useCountUp(
  target: number,
  format: (v: number) => string,
  inView: boolean,
  delay = 0
) {
  const motionVal = useMotionValue(0);
  const spring = useSpring(motionVal, { stiffness: 45, damping: 18 });
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    if (!inView) return;
    const t = setTimeout(() => motionVal.set(target), delay);
    return () => clearTimeout(t);
  }, [inView, motionVal, target, delay]);

  useEffect(() => {
    return spring.on('change', (v) => setDisplay(format(Math.round(v))));
  }, [spring, format]);

  return display;
}

// ── 개별 Blob 카드 ────────────────────────────────────────────────────
function BlobCard({
  blob, stat, inView, delay, isCenter,
}: {
  blob: BlobConfig;
  stat: StatConfig;
  inView: boolean;
  delay: number;
  isCenter?: boolean;
}) {
  const measureRef = useRef<SVGPathElement>(null);
  const glowRef    = useRef<SVGPathElement>(null);
  const gradRef    = useRef<SVGLinearGradientElement>(null);

  useBorderBeam(measureRef, glowRef, gradRef, blob.beamDur);

  const display = useCountUp(stat.target, stat.format, inView, delay);

  return (
    <motion.div
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay: delay / 1000, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center"
      style={{ gap: '14px' }}
    >
      <motion.div
        whileHover={{ scale: 1.08 }}
        transition={{ type: 'spring', stiffness: 280, damping: 22 }}
        className="relative cursor-pointer"
        style={{
          width: isCenter ? '340px' : '300px',
          aspectRatio: '1 / 1.04',
          filter: isCenter
            ? 'drop-shadow(0 24px 60px rgba(27,67,50,0.35))'
            : 'drop-shadow(0 12px 32px rgba(27,67,50,0.12))',
        }}
      >
        <svg
          viewBox={blob.viewBox}
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full block overflow-visible"
        >
          <defs>
            <linearGradient
              id={blob.gradientId}
              gradientUnits="userSpaceOnUse"
              x1="0" y1="0" x2="0" y2="0"
              ref={gradRef}
            >
              <stop offset="0%"   stopColor={blob.beamColorFrom} stopOpacity={0} />
              <stop offset="50%"  stopColor={blob.beamColorFrom} stopOpacity={0.25} />
              <stop offset="100%" stopColor={blob.beamColorTo}   stopOpacity={0.05} />
            </linearGradient>
          </defs>

          {/* fill */}
          <path d={blob.pathD} fill={blob.fill} />

          {/* beam track */}
          <path
            d={blob.pathD}
            fill="none"
            stroke={blob.beamColorFrom}
            strokeWidth={1}
            opacity={0.03}
          />

          {/* beam glow */}
          <path
            ref={glowRef}
            d={blob.pathD}
            fill="none"
            stroke={`url(#${blob.gradientId})`}
            strokeWidth={isCenter ? 2.5 : 2}
            strokeLinecap="round"
          />

          {/* measure ref */}
          <path ref={measureRef} d={blob.pathD} fill="none" stroke="none" />
        </svg>

        {/* 내부 텍스트 */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none"
          style={{ padding: '20px' }}
        >
          {/* 숫자 */}
          <span
            className="font-black leading-none"
            style={{
              fontSize: isCenter ? '64px' : '52px',
              letterSpacing: '-0.04em',
              color: blob.numColor,
            }}
          >
            {display}
          </span>

          {/* 라벨 */}
          <span
            className="font-bold mt-2.5 leading-snug"
            style={{
              fontSize: '18px',
              color: blob.labelColor,
              opacity: 0.95,
            }}
          >
            {stat.label}
          </span>

          {/* 상세 설명 */}
          <p
            className="mt-3 leading-relaxed"
            style={{
              fontSize: '13px',
              color: blob.labelColor,
              opacity: 0.7,
              whiteSpace: 'pre-line',
              maxWidth: isCenter ? '220px' : '200px',
            }}
          >
            {stat.desc}
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── 메인 export ───────────────────────────────────────────────────────
export function BlobStatsSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-60px' });

  return (
    <section
      ref={ref}
      className="py-24 px-12"
      style={{
        backgroundColor: 'transparent',
      }}
    >
      {/* 카드 3개 — 가운데 정렬, 세로 중심 맞춤 */}
      <div
        className="flex items-center justify-center"
        style={{ gap: '60px', flexWrap: 'wrap' }}
      >
        {BLOBS.map((blob, i) => (
          <BlobCard
            key={blob.pathId}
            blob={blob}
            stat={STATS[i]}
            inView={inView}
            delay={i * 140}
            isCenter={i === 1}
          />
        ))}
      </div>
    </section>
  );
}