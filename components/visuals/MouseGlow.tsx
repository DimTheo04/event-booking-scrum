'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, useMotionTemplate } from 'framer-motion';

export const MouseGlow = () => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const [isMobile, setIsMobile] = useState(false);

  // Smooth out the motion
  const springConfig = { damping: 25, stiffness: 70 };
  const x = useSpring(mouseX, springConfig);
  const y = useSpring(mouseY, springConfig);

  const background = useMotionTemplate`radial-gradient(600px circle at ${isMobile ? '50%' : `${x}px`} ${isMobile ? '50%' : `${y}px`}, rgba(215, 111, 48, 0.15), transparent 80%)`;

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    
    const handleMouseMove = (e: MouseEvent) => {
      if (window.innerWidth >= 768) {
        mouseX.set(e.clientX);
        mouseY.set(e.clientY);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  return (
    <motion.div
      className="fixed inset-0 pointer-events-none z-[1]"
      style={{ background }}
    />
  );
};
