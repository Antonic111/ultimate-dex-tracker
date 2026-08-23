import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { pageVariants } from "../../utils/animations";

/**
 * Reusable Page Route Transition Wrapper
 * Applies subtle fade + 8px translateY (240ms ease-out) on route change
 */
export function PageTransition({ children, className = "", style = {} }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`page-transition-wrap ${className}`} style={style}>{children}</div>;
  }

  return (
    <motion.div
      className={`page-transition-wrap ${className}`}
      style={style}
      initial="initial"
      animate="animate"
      exit="exit"
      variants={pageVariants}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
