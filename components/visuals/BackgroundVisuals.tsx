'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const backgrounds = [
  '/backgrounds/concert.png',
  '/backgrounds/sports.png',
];

export const BackgroundVisuals = () => {
  const [index, setIndex] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % backgrounds.length);
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="fixed inset-0 z-0 overflow-hidden bg-brand-dark">
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 1.1 }}
          animate={{ opacity: 0.25, scale: 1.0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 3, ease: "easeInOut" }}
          className="absolute inset-0 grayscale contrast-125 md:opacity-15"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={backgrounds[index]}
            alt="Event background"
            className="w-full h-full object-cover"
          />
          {/* Subtle overlay to match brand */}
          <div className="absolute inset-0 bg-brand-dark/20" />
        </motion.div>
      </AnimatePresence>
      
      {/* Vignette effect blending into brand-dark */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-brand-dark/40 to-brand-dark opacity-90" />
    </div>
  );
};
