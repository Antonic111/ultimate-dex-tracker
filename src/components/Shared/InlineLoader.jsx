import React from "react";
import { Loader2 } from "lucide-react";
import { motion } from "motion/react";

/**
 * Minimal Inline Loader for small background data updates / filter changes
 * Never blocks or wipes existing content.
 */
export function InlineLoader({
  size = 14,
  label = "Updating...",
  showLabel = false,
  className = "",
}) {
  return (
    <motion.span
      className={`inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 opacity-90 ${className}`}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.15 }}
    >
      <Loader2 size={size} className="animate-spin text-[var(--accent)] shrink-0" />
      {showLabel && <span className="text-[11px] uppercase tracking-wider">{label}</span>}
    </motion.span>
  );
}

export default InlineLoader;
