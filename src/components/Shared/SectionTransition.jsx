import React from "react";
import { motion, useReducedMotion } from "motion/react";
import { sectionVariants } from "../../utils/animations";

/**
 * Reusable Section Transition Wrapper
 * For smooth, grouped entrance of major UI blocks
 */
export function SectionTransition({ children, className = "", style = {}, delay = 0 }) {
  const shouldReduceMotion = useReducedMotion();

  if (shouldReduceMotion) {
    return <div className={`section-transition-wrap ${className}`} style={style}>{children}</div>;
  }

  const customVariants = delay > 0 ? {
    ...sectionVariants,
    animate: {
      ...sectionVariants.animate,
      transition: {
        ...sectionVariants.animate.transition,
        delay,
      }
    }
  } : sectionVariants;

  return (
    <motion.div
      className={`section-transition-wrap ${className}`}
      style={style}
      initial="initial"
      animate="animate"
      variants={customVariants}
    >
      {children}
    </motion.div>
  );
}

export default SectionTransition;
