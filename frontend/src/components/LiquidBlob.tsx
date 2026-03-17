import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function LiquidBlob() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // 스프링 설정으로 부드러운 움직임 구현
  const springConfig = { damping: 20, stiffness: 150, mass: 0.5 };
  const trailX = useSpring(mouseX, springConfig);
  const trailY = useSpring(mouseY, springConfig);
  
  const trailX2 = useSpring(mouseX, { ...springConfig, damping: 15, stiffness: 100 });
  const trailY2 = useSpring(mouseY, { ...springConfig, damping: 15, stiffness: 100 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <>
      {/* 구이(Gooey) 효과를 위한 SVG 필터 */}
      <svg style={{ position: "absolute", width: 0, height: 0 }}>
        <filter id="goo">
          <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="blur" />
          <feColorMatrix
            in="blur"
            mode="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -10"
            result="goo"
          />
          <feComposite in="SourceGraphic" in2="goo" operator="atop" />
        </filter>
      </svg>

      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
          zIndex: 10,
          filter: "url(#goo)",
        }}
      >
        {/* 메인 블롭 (마우스 포인터) */}
        <motion.div
          style={{
            position: "absolute",
            x: mouseX,
            y: mouseY,
            width: 40,
            height: 40,
            backgroundColor: "var(--amber)", // 프로젝트 포인트 컬러
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.6,
          }}
        />

        {/* 따라오는 잔상 블롭 1 */}
        <motion.div
          style={{
            position: "absolute",
            x: trailX,
            y: trailY,
            width: 60,
            height: 60,
            backgroundColor: "var(--green-mid)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.4,
          }}
        />

        {/* 따라오는 잔상 블롭 2 */}
        <motion.div
          style={{
            position: "absolute",
            x: trailX2,
            y: trailY2,
            width: 50,
            height: 50,
            backgroundColor: "var(--green-deep)",
            borderRadius: "50%",
            transform: "translate(-50%, -50%)",
            opacity: 0.3,
          }}
        />
      </div>
    </>
  );
}
