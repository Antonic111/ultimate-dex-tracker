import React, { useState, useEffect } from "react";
import { useIsFetching } from "@tanstack/react-query";
import { motion, AnimatePresence } from "motion/react";

/**
 * Global Hairline Background Network Activity Indicator
 * Non-blocking indicator at the top of the viewport when queries are syncing in the background.
 */
export function BackgroundFetchIndicator() {
  const isFetching = useIsFetching();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let timer;
    if (isFetching > 0) {
      // 180ms threshold so instant responses don't cause flicker
      timer = setTimeout(() => {
        setVisible(true);
      }, 180);
    } else {
      setVisible(false);
    }

    return () => clearTimeout(timer);
  }, [isFetching]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed top-0 left-0 right-0 h-[2px] z-[9999] pointer-events-none overflow-hidden bg-transparent"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
        >
          <div
            className="w-full h-full bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent animate-pulse"
            style={{
              boxShadow: "0 0 8px var(--accent)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default BackgroundFetchIndicator;
