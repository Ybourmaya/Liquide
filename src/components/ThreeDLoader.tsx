"use client";

import { motion } from "framer-motion";

export function ThreeDLoader() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background overflow-hidden">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-background to-background" />

      {/* 3D Wireframe Cube with Framer Motion */}
      <div className="relative w-32 h-32 [perspective:800px] mb-8">
        <motion.div
          animate={{
            rotateX: [0, 360],
            rotateY: [0, 360],
            rotateZ: [0, 180],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "linear",
          }}
          className="w-full h-full relative [transform-style:preserve-3d]"
        >
          {/* Front Face */}
          <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-900/40 backdrop-blur-[2px] shadow-[0_0_15px_rgba(52,211,153,0.6)] [transform:translateZ(64px)]" />
          {/* Back Face */}
          <div className="absolute inset-0 border-2 border-emerald-500 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.4)] [transform:rotateY(180deg)_translateZ(64px)]" />
          {/* Right Face */}
          <div className="absolute inset-0 border-2 border-emerald-400 bg-emerald-950/40 [transform:rotateY(90deg)_translateZ(64px)]" />
          {/* Left Face */}
          <div className="absolute inset-0 border-2 border-primary bg-emerald-900/40 [transform:rotateY(-90deg)_translateZ(64px)]" />
          {/* Top Face */}
          <div className="absolute inset-0 border-2 border-emerald-300 bg-emerald-800/40 [transform:rotateX(90deg)_translateZ(64px)]" />
          {/* Bottom Face */}
          <div className="absolute inset-0 border-2 border-emerald-600 bg-emerald-950/40 [transform:rotateX(-90deg)_translateZ(64px)]" />
        </motion.div>
      </div>

      <motion.h2 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="text-2xl font-light tracking-widest text-emerald-400 z-10"
      >
        INITIALIZING LIQUID
      </motion.h2>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-2 text-sm text-emerald-600/80 z-10 font-mono text-center flex gap-1"
      >
        <span>Loading AI protocols</span>
        <motion.span
          animate={{ opacity: [0, 1, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          ...
        </motion.span>
      </motion.p>
    </div>
  );
}
