/**
 * Standardized Animation System & Motion Tokens
 * Ultimate Dex Tracker
 */

export const transitions = {
  instant: {
    duration: 0.08,
    ease: "easeOut",
  },
  fast: {
    duration: 0.15,
    ease: [0.16, 1, 0.3, 1], // snappy easeOut
  },
  default: {
    duration: 0.22,
    ease: [0.16, 1, 0.3, 1],
  },
  page: {
    duration: 0.24,
    ease: [0.16, 1, 0.3, 1],
  },
  modal: {
    duration: 0.2,
    ease: [0.16, 1, 0.3, 1],
  },
  dropdown: {
    duration: 0.14,
    ease: [0.16, 1, 0.3, 1],
  },
};

/**
 * Route / Page Entrance Variant
 * Subtle 6-8px translateY + opacity fade for natural settling
 */
export const pageVariants = {
  initial: {
    opacity: 0,
    y: 8,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.page,
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.12,
      ease: "easeIn",
    },
  },
};

/**
 * Section & Container Group Variant
 */
export const sectionVariants = {
  initial: {
    opacity: 0,
    y: 6,
  },
  animate: {
    opacity: 1,
    y: 0,
    transition: transitions.default,
  },
};

/**
 * Modal Dialog Variant (Scale 0.98 -> 1 with subtle translateY)
 */
export const modalVariants = {
  backdrop: {
    initial: { opacity: 0 },
    animate: { opacity: 1, transition: { duration: 0.18, ease: "easeOut" } },
    exit: { opacity: 0, transition: { duration: 0.14, ease: "easeIn" } },
  },
  dialog: {
    initial: { opacity: 0, scale: 0.98, y: 6 },
    animate: { opacity: 1, scale: 1, y: 0, transition: transitions.modal },
    exit: { opacity: 0, scale: 0.98, y: 4, transition: { duration: 0.14, ease: "easeIn" } },
  },
};

/**
 * Dropdown & Popover Variant
 */
export const dropdownVariants = {
  initial: { opacity: 0, scale: 0.98, y: -4 },
  animate: { opacity: 1, scale: 1, y: 0, transition: transitions.dropdown },
  exit: { opacity: 0, scale: 0.98, y: -4, transition: { duration: 0.1, ease: "easeIn" } },
};

/**
 * Simple Fade Variant
 */
export const fadeVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: transitions.fast },
  exit: { opacity: 0, transition: { duration: 0.1 } },
};

/**
 * Tab Content Transition Variant
 */
export const tabContentVariants = {
  initial: { opacity: 0, y: 4 },
  animate: { opacity: 1, y: 0, transition: transitions.fast },
  exit: { opacity: 0, transition: { duration: 0.08 } },
};
