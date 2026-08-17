import React, { useState, useEffect, useRef, useCallback } from "react";
import { profileAPI } from "../../utils/api";
import { getTutorialSteps, tutorialSteps } from "./TutorialSteps";
import "../../css/InteractiveTutorial.css";

export default function InteractiveTutorial({ 
  initialStep = 1, 
  onComplete 
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(initialStep - 1);
  const [targetRect, setTargetRect] = useState(null);
  const [windowSize, setWindowSize] = useState({ width: window.innerWidth, height: window.innerHeight });
  const [saving, setSaving] = useState(false);
  
  const isMobile = windowSize.width <= 768;
  const steps = getTutorialSteps(isMobile);
  const step = steps[currentStepIndex];

  // Window resize listener
  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ width: window.innerWidth, height: window.innerHeight });
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Update position logic - purely measures the element without scrolling
  const updatePosition = useCallback(() => {
    if (!step) return;
    const targetIdToMeasure = step?.targetId;
    const els = Array.from(document.querySelectorAll(`[data-tutorial-id="${targetIdToMeasure}"]`));
    const el = els.find(e => e.offsetWidth > 0 || e.offsetHeight > 0) || els[0];
    if (el) {
      const rect = el.getBoundingClientRect();
      setTargetRect({
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height
      });
    } else {
      setTargetRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!step) return;
    const targetId = step?.targetId;
    let resizeObserver = null;
    let pollInterval = null;
    let attempts = 0;

    // Notify app of step change for dynamic UI reactions
    window.dispatchEvent(new CustomEvent('tutorialStepChange', { detail: { targetId } }));
    
    // Track programmatic scrolling perfectly
    window.addEventListener('scroll', updatePosition, { passive: true });

    const initTarget = () => {
      const els = Array.from(document.querySelectorAll(`[data-tutorial-id="${targetId}"]`));
      const el = els.find(e => e.offsetWidth > 0 || e.offsetHeight > 0) || els[0];
      if (el) {
        if (step.scrollToTop) {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          const doScroll = () => {
            // Element found! Temporarily inject scroll-margin-top to dodge the sticky header
            const oldScrollMargin = el.style.scrollMarginTop;
            el.style.scrollMarginTop = '150px';
            
            // Scroll natively, using 'center' to perfectly center the spotlight and avoid fixed footer elements
            el.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' });
            
            // Restore the original margin after a brief delay
            setTimeout(() => {
              if (el) el.style.scrollMarginTop = oldScrollMargin;
            }, 1000);
          };

          if (step.delayScroll) {
            setTimeout(doScroll, step.delayScroll);
          } else {
            doScroll();
          }
        }
        
        // Track position continuously for 600ms to catch CSS slide-in animations perfectly
        const startTime = performance.now();
        const trackAnimation = (time) => {
          updatePosition();
          if (time - startTime < 600) {
            requestAnimationFrame(trackAnimation);
          }
        };
        requestAnimationFrame(trackAnimation);
        
        // Attach ResizeObserver to dynamically track element size changes
        if (typeof ResizeObserver !== 'undefined') {
          resizeObserver = new ResizeObserver(() => updatePosition());
          resizeObserver.observe(el);
        }
        
        if (pollInterval) clearInterval(pollInterval);
        return true;
      }
      return false;
    };

    // Try finding it. If lazy loaded, poll every 50ms for up to 1 second
    if (!initTarget()) {
      pollInterval = setInterval(() => {
        attempts++;
        if (initTarget() || attempts > 20) {
          if (pollInterval) clearInterval(pollInterval);
        }
      }, 50);
    }

    // Set up click listener for "Requirement" steps
    const handleGlobalClick = (e) => {
      // Allow clicks on the tooltip or its children
      if (e.target.closest('.tutorial-tooltip')) return;

      const clickTargetId = step?.actionTargetId || step?.targetId;
      const els = Array.from(document.querySelectorAll(`[data-tutorial-id="${clickTargetId}"]`));
      const el = els.find(e => e.offsetWidth > 0 || e.offsetHeight > 0) || els[0];
      const isClickOnTarget = el && (el === e.target || el.contains(e.target));

      if (isClickOnTarget) {
        if (step?.requireAction) {
          // Required action performed on the target, allow it and advance
          if (!window.__tutorialAdvancing) {
            window.__tutorialAdvancing = true;
            window.__allowNextClick = true; // Allow the ghost click to pass through
            setTimeout(() => {
              window.__tutorialAdvancing = false;
              handleNext();
            }, 300);
          }
          return;
        } else if (step?.advanceOn) {
          // We are waiting for a custom event to advance, but we MUST allow them to click the target (e.g. long press)
          return;
        }
      }

      // If we just allowed a touchstart, we MUST allow the subsequent click event to pass through,
      // otherwise buttons won't fire their onClick on mobile because the step changed!
      if (e.type === 'click' && window.__allowNextClick) {
        // We let one click pass through, then reset
        // Use a short timeout to reset it in case a click never comes
        setTimeout(() => { window.__allowNextClick = false; }, 50);
        return;
      }

      // Block all other clicks
      e.stopPropagation();
      e.preventDefault();
    };

    // Prevent manual scrolling without using overflow: hidden (which breaks sticky header)
    const preventScroll = (e) => {
      if (e.target.closest('.tutorial-tooltip') || e.target.closest('.sidebar-container')) return;
      e.preventDefault();
    };
    
    // Add scroll prevention listeners (passive: false is required to use preventDefault)
    document.addEventListener('wheel', preventScroll, { passive: false });
    document.addEventListener('touchmove', preventScroll, { passive: false });

    const preventKeyScroll = (e) => {
      // Prevent scrolling with keys, unless typing in an input field
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        if (e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
          e.preventDefault();
        }
      }
    };
    document.addEventListener('keydown', preventKeyScroll, { passive: false });

    // Use capture phase to intercept clicks before they reach elements
    document.addEventListener("click", handleGlobalClick, true);
    document.addEventListener("touchstart", handleGlobalClick, { capture: true, passive: false });
    
    if (step?.targetId === "info-button" && !isMobile) {
      document.body.classList.add("tutorial-force-info");
    } else {
      document.body.classList.remove("tutorial-force-info");
    }
    
    // Disable scrolling and fix tip-me button z-index while tutorial is active
    document.documentElement.classList.add("tutorial-active");
    document.body.classList.add("tutorial-active");
    
    // Listen for custom advance events
    if (step?.advanceOn) {
      const handleCustomEvent = () => {
        if (!window.__tutorialAdvancing) {
          window.__tutorialAdvancing = true;
          setTimeout(() => {
            window.__tutorialAdvancing = false;
            handleNext();
          }, 300);
        }
      };
      window.addEventListener(step.advanceOn, handleCustomEvent);
      
      // Cleanup custom event listener
      const originalCleanup = window.__tutorialCleanup;
      window.__tutorialCleanup = () => {
        window.removeEventListener(step.advanceOn, handleCustomEvent);
        if (originalCleanup) originalCleanup();
      };
    }

    return () => {
      if (pollInterval) clearInterval(pollInterval);
      window.removeEventListener('scroll', updatePosition);
      document.removeEventListener("click", handleGlobalClick, true);
      document.removeEventListener("touchstart", handleGlobalClick, { capture: true, passive: false });
      document.removeEventListener('wheel', preventScroll);
      document.removeEventListener('touchmove', preventScroll);
      document.removeEventListener('keydown', preventKeyScroll);
      document.body.classList.remove("tutorial-force-info");
      document.documentElement.classList.remove("tutorial-active");
      document.body.classList.remove("tutorial-active");
      
      if (window.__tutorialCleanup) {
        window.__tutorialCleanup();
        window.__tutorialCleanup = null;
      }
      
      if (resizeObserver) resizeObserver.disconnect();
    };
  }, [currentStepIndex, windowSize, step, isMobile]);

  const saveProgress = async (newStepNum) => {
    try {
      await profileAPI.updateProfile({
        onboarding: { isComplete: false, tutorialStep: newStepNum }
      });
    } catch (err) {
      console.error("Failed to save tutorial progress", err);
    }
  };

  const handleNext = () => {
    if (currentStepIndex < steps.length - 1) {
      const nextIdx = currentStepIndex + 1;
      setCurrentStepIndex(nextIdx);
      saveProgress(nextIdx + 1); // 1-indexed
    } else {
      onComplete();
    }
  };
  
  const handleSkip = () => {
    // If they skip mid-way, they just exit. We don't mark it fully complete here
    // unless they do it from the prompt. But let's let them exit anyway.
    onComplete();
  };

  if (!step) return null;

  const spotlightPadding = 8;
  const sTop = targetRect ? targetRect.top - (step.paddingTop ?? spotlightPadding) : windowSize.height / 2;
  const sLeft = targetRect ? targetRect.left - (step.paddingLeft ?? spotlightPadding) : windowSize.width / 2;
  const sWidth = targetRect ? targetRect.width + (step.paddingLeft ?? spotlightPadding) + (step.paddingRight ?? spotlightPadding) : 0;
  const sHeight = targetRect ? targetRect.height + (step.paddingTop ?? spotlightPadding) + (step.paddingBottom ?? spotlightPadding) : 0;

  // Calculate smart tooltip position to avoid overlapping the target
  let tooltipTop = windowSize.height / 2;
  let tooltipLeft = windowSize.width / 2;
  let tooltipTransform = "translate(-50%, -50%)";
  
  if (targetRect && !step.noHighlight) {
    const tooltipW = 360; // Approximate width with padding/margin
    const tooltipH = 220; // Approximate height

    // Determine if the target is inside the sidebar
    const sidebarEl = document.querySelector('.sidebar-container');
    const targetEl = document.querySelector(`[data-tutorial-id="${step.targetId}"]`);
    const isInSidebar = sidebarEl && targetEl && sidebarEl.contains(targetEl);

    // If it's in the sidebar, we want to push the tooltip to the left of the entire sidebar
    let effectiveLeft = sLeft;
    if (isInSidebar && sidebarEl) {
      effectiveLeft = sidebarEl.getBoundingClientRect().left;
    }

    // Define possible placements
    const placements = {
      left: () => {
        if (effectiveLeft - 20 >= tooltipW) {
          tooltipLeft = effectiveLeft - 20;
          tooltipTop = sTop + (sHeight / 2);
          tooltipTransform = "translate(-100%, -50%)";
          if (tooltipTop - (tooltipH/2) < 20) {
            tooltipTop = 20;
            tooltipTransform = "translate(-100%, 0)";
          } else if (tooltipTop + (tooltipH/2) > windowSize.height - 20) {
            tooltipTop = windowSize.height - 20;
            tooltipTransform = "translate(-100%, -100%)";
          }
          return true;
        }
        return false;
      },
      below: () => {
        if (sTop + sHeight + 20 + tooltipH <= windowSize.height) {
          tooltipTop = sTop + sHeight + 20;
          
          if (windowSize.width <= 768) {
            tooltipLeft = 20;
            tooltipTransform = "translate(0, 0)";
          } else {
            tooltipLeft = sLeft + (sWidth / 2);
            tooltipTransform = "translate(-50%, 0)";
            if (tooltipLeft - (tooltipW/2) < 20) {
              tooltipLeft = 20;
              tooltipTransform = "translate(0, 0)";
            } else if (tooltipLeft + (tooltipW/2) > windowSize.width - 20) {
              tooltipLeft = windowSize.width - 20;
              tooltipTransform = "translate(-100%, 0)";
            }
          }
          return true;
        }
        return false;
      },
      above: () => {
        if (sTop - 20 - tooltipH >= 0) {
          tooltipTop = sTop - 20 - tooltipH;
          
          if (windowSize.width <= 768) {
            tooltipLeft = 20;
            tooltipTransform = "translate(0, 0)";
          } else {
            tooltipLeft = sLeft + (sWidth / 2);
            tooltipTransform = "translate(-50%, 0)";
            if (tooltipLeft - (tooltipW/2) < 20) {
              tooltipLeft = 20;
              tooltipTransform = "translate(0, 0)";
            } else if (tooltipLeft + (tooltipW/2) > windowSize.width - 20) {
              tooltipLeft = windowSize.width - 20;
              tooltipTransform = "translate(-100%, 0)";
            }
          }
          return true;
        }
        return false;
      },
      right: () => {
        if (sLeft + sWidth + 20 + tooltipW <= windowSize.width) {
          tooltipLeft = sLeft + sWidth + 20;
          tooltipTop = sTop + (sHeight / 2);
          tooltipTransform = "translate(0, -50%)";
          if (tooltipTop - (tooltipH/2) < 20) {
            tooltipTop = 20;
            tooltipTransform = "translate(0, 0)";
          } else if (tooltipTop + (tooltipH/2) > windowSize.height - 20) {
            tooltipTop = windowSize.height - 20;
            tooltipTransform = "translate(0, -100%)";
          }
          return true;
        }
        return false;
      }
    };

    // Determine preference order
    let prefs = isInSidebar ? ['left', 'below', 'above', 'right'] : ['below', 'above', 'right', 'left'];
    if (step?.placement) {
      prefs = [step.placement, ...prefs.filter(p => p !== step.placement)];
    }

    // Try placements in order
    let placed = false;
    for (const p of prefs) {
      if (placements[p]()) {
        placed = true;
        break;
      }
    }

    // 5. Fallback: Center on screen (will overlap)
    if (!placed) {
      tooltipTop = windowSize.height / 2;
      tooltipLeft = windowSize.width / 2;
      tooltipTransform = "translate(-50%, -50%)";
    }
  }

  return (
    <div className="tutorial-container">
      {/* 
        The SVG mask creates the semi-transparent black overlay
        with a fully transparent "hole" cut out for the spotlight.
      */}
      {!step.noHighlight && (
        <svg className="tutorial-mask" width="100%" height="100%">
          <defs>
            <mask id="spotlight-mask">
              <rect width="100%" height="100%" fill="white" />
              <rect 
                x={sLeft} 
                y={sTop} 
                width={sWidth} 
                height={sHeight} 
                rx="8" 
                ry="8" 
                fill="black"
                className="spotlight-transition"
              />
            </mask>
          </defs>
          <rect 
            width="100%" 
            height="100%" 
            fill="rgba(0, 0, 0, 0.75)" 
            mask="url(#spotlight-mask)" 
            style={{ pointerEvents: 'none' }} // Let clicks pass through, JS will intercept them
          />
          <rect 
            x={sLeft} 
            y={sTop} 
            width={sWidth} 
            height={sHeight} 
            rx="8" 
            ry="8" 
            fill="transparent"
            stroke="var(--accent)"
            strokeWidth="3"
            className="spotlight-transition"
            style={{ pointerEvents: (step?.requireAction || step?.advanceOn) ? 'none' : 'auto' }} 
          />
        </svg>
      )}

      {/* Tooltip Card */}
      <div 
        className="tutorial-tooltip tutorial-fade-in"
        style={{
          top: tooltipTop,
          left: tooltipLeft,
          transform: tooltipTransform
        }}
      >
        <div className="tutorial-progress">
          Step {currentStepIndex + 1} of {steps.length}
        </div>
        <h3 className="tutorial-title">{step.title}</h3>
        <div className="tutorial-desc" dangerouslySetInnerHTML={{ __html: step.description }} />
        
        <div className="tutorial-actions">
          <button className="tutorial-skip" onClick={handleSkip}>Exit</button>
          
          {(step.requireAction || step.advanceOn) ? (
            <div className="tutorial-action-required text-sm text-gray-400 italic">
              Perform the action to continue
            </div>
          ) : (
            <button className="tutorial-next" onClick={handleNext}>
              {currentStepIndex === steps.length - 1 ? 'Complete' : 'Next'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
