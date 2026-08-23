import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import "./SectionLoader.css";

/**
 * Branded Section Loader
 * Features a gentle rotating Pokéball.
 * Includes anti-flash delay so fast requests (<180ms) never flicker.
 */
export function SectionLoader({
  message = "Loading...",
  size = "md",
  minHeight = "220px",
  showMessage = true,
  delay = 180,
  className = "",
  style = {},
}) {
  const [visible, setVisible] = useState(delay === 0);
  const [showLongMessage, setShowLongMessage] = useState(false);

  useEffect(() => {
    if (delay === 0) {
      setVisible(true);
      return;
    }

    const timer = setTimeout(() => {
      setVisible(true);
    }, delay);

    // Show contextual message after 400ms if still loading
    const messageTimer = setTimeout(() => {
      setShowLongMessage(true);
    }, 400);

    return () => {
      clearTimeout(timer);
      clearTimeout(messageTimer);
    };
  }, [delay]);

  if (!visible) {
    return <div className={`section-loader-placeholder ${className}`} style={{ minHeight, ...style }} />;
  }

  const ballSize = size === "sm" ? 36 : size === "lg" ? 64 : 48;

  return (
    <AnimatePresence>
      <motion.div
        className={`section-loader-container ${className}`}
        style={{ minHeight, ...style }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.18 }}
      >
        <div className="section-loader-core">
          <div className="section-loader-pokeball-wrap" style={{ width: ballSize, height: ballSize }}>
            <svg
              className="section-loader-pokeball"
              viewBox="0 0 100 100"
              width={ballSize}
              height={ballSize}
            >
              {/* Top Half (Red/Accent) */}
              <path
                d="M 5 50 A 45 45 0 0 1 95 50 Z"
                fill="var(--accent, #e53e3e)"
              />
              {/* Bottom Half (White) */}
              <path
                d="M 5 50 A 45 45 0 0 0 95 50 Z"
                fill="#f1f5f9"
              />
              {/* Center Dividing Band */}
              <line
                x1="5"
                y1="50"
                x2="95"
                y2="50"
                stroke="#18181b"
                strokeWidth="7"
              />
              {/* Outer Border */}
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="#18181b"
                strokeWidth="7"
              />
              {/* Outer Button Ring */}
              <circle
                cx="50"
                cy="50"
                r="15"
                fill="#18181b"
              />
              {/* Inner Button */}
              <circle
                cx="50"
                cy="50"
                r="8"
                fill="#ffffff"
                stroke="#d1d5db"
                strokeWidth="2"
              />
            </svg>
          </div>

          {showMessage && showLongMessage && message && (
            <motion.p
              className="section-loader-text"
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {message}
            </motion.p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default SectionLoader;
