import React, { useEffect, useState, useRef } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, Info, CheckCircle2 } from "lucide-react";
import { Button } from "./Button";
import "../../css/Modal.css";

/**
 * Signature Pokéball Close Icon Component
 */
export function PokeballCloseIcon({ size = 36, className = "" }) {
  return (
    <span
      className={`pokeball-close-icon ${className}`}
      style={{ width: `${size}px`, height: `${size}px`, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
    >
      <img
        src="/pokeball_close_button.svg"
        alt="Close"
        width={size}
        height={size}
        style={{ width: `${size}px`, height: `${size}px`, display: "block", objectFit: "contain", pointerEvents: "none" }}
        draggable={false}
      />
    </span>
  );
}

export const ModalContext = React.createContext({
  close: (callback) => { },
  isClosing: false
});

export const useModalContext = () => React.useContext(ModalContext);

/**
 * Universal Modal Component
 */
export function Modal({
  isOpen = false,
  onClose,
  title,
  subtitle,
  icon,
  size = "md",
  actions,
  footer,
  showCloseButton = true,
  closeButtonDisabled = false,
  closeOnBackdrop = false,
  closeOnEscape = true,
  preventScroll = true,
  className = "",
  children
}) {
  const [mounted, setMounted] = useState(isOpen);
  const [closing, setClosing] = useState(false);
  const isClosingRef = useRef(false);

  const handleClose = (callback) => {
    if (typeof callback === "function") {
      callback();
    }
    onClose?.();
  };

  // Preserve the last non-empty content while closing so content never abruptly disappears
  const lastContentRef = useRef({
    title,
    subtitle,
    icon,
    actions,
    footer,
    children
  });

  // Pre-evaluate footer content while open so closing animation preserves exact rendered footer
  const currentEvaluatedFooter = typeof footer === "function"
    ? footer({ close: handleClose })
    : footer;

  if (isOpen && !closing) {
    lastContentRef.current = {
      title: title || lastContentRef.current.title,
      subtitle: subtitle || lastContentRef.current.subtitle,
      icon: icon || lastContentRef.current.icon,
      actions: actions || lastContentRef.current.actions,
      footer: currentEvaluatedFooter !== undefined ? currentEvaluatedFooter : lastContentRef.current.footer,
      children: children !== undefined ? children : lastContentRef.current.children
    };
  }

  const activeTitle = (isOpen && !closing) ? title : (title || lastContentRef.current.title);
  const activeSubtitle = (isOpen && !closing) ? subtitle : (subtitle || lastContentRef.current.subtitle);
  const activeIcon = (isOpen && !closing) ? icon : (icon || lastContentRef.current.icon);
  const activeActions = (isOpen && !closing) ? actions : (actions || lastContentRef.current.actions);
  const activeFooter = (isOpen && !closing) ? currentEvaluatedFooter : lastContentRef.current.footer;
  const activeChildren = (isOpen && !closing) ? children : (children !== undefined && children !== null ? children : lastContentRef.current.children);

  const contentWrapperRef = useRef(null);
  const [animatedBodyHeight, setAnimatedBodyHeight] = useState(null);
  const prevHeightRef = useRef(null);
  const hasInitialRenderedRef = useRef(false);
  const heightTimerRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      setClosing(false);
      isClosingRef.current = false;
      hasInitialRenderedRef.current = false;
      const t = setTimeout(() => {
        hasInitialRenderedRef.current = true;
      }, 200);
      return () => clearTimeout(t);
    } else if (mounted && !isClosingRef.current) {
      setClosing(true);
      isClosingRef.current = true;
      const timer = setTimeout(() => {
        setMounted(false);
        setClosing(false);
        isClosingRef.current = false;
      }, 180);
      return () => clearTimeout(timer);
    }
  }, [isOpen, mounted]);

  // Smooth height transition when content size changes between steps/views
  useEffect(() => {
    if (!mounted || !isOpen) {
      setAnimatedBodyHeight(null);
      prevHeightRef.current = null;
      return;
    }

    const contentEl = contentWrapperRef.current;
    if (!contentEl) return;

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const measuredH = Math.ceil(entry.contentRect.height);
        if (measuredH <= 0) continue;

        if (hasInitialRenderedRef.current && prevHeightRef.current && Math.abs(measuredH - prevHeightRef.current) > 3) {
          setAnimatedBodyHeight(measuredH);
          if (heightTimerRef.current) clearTimeout(heightTimerRef.current);
          heightTimerRef.current = setTimeout(() => {
            setAnimatedBodyHeight(null);
          }, 330);
        }
        prevHeightRef.current = measuredH;
      }
    });

    observer.observe(contentEl);
    return () => {
      observer.disconnect();
      if (heightTimerRef.current) clearTimeout(heightTimerRef.current);
    };
  }, [mounted, isOpen]);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen || !closeOnEscape || closeButtonDisabled) return;

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEscape, closeButtonDisabled]);

  // Prevent background scrolling while open without breaking sticky headers, inner lists or portaled dropdowns
  useEffect(() => {
    if (!isOpen || !preventScroll) return;

    const findScrollable = (target) => {
      let el = target;
      while (el && el !== document.body && el !== document.documentElement) {
        if (el.matches?.(
          '.udt-select-options-list, .udt-select-dropdown, .custom-scrollbar, .modal-scroll-area, [role="listbox"], [role="menu"], [class*="overflow-y-auto"], [class*="overflow-auto"]'
        )) {
          return el;
        }
        if (el.scrollHeight > el.clientHeight && el.clientHeight > 0) {
          const style = window.getComputedStyle(el);
          const overflowY = style.overflowY;
          if (overflowY === 'auto' || overflowY === 'scroll') {
            return el;
          }
        }
        el = el.parentElement;
      }
      return target?.closest?.('.udt-modal-body') || null;
    };

    const preventWheelScroll = (e) => {
      const scrollable = findScrollable(e.target);
      if (!scrollable) {
        // Any wheel on backdrop, modal header, footer, or non-scrollable items: completely prevent
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      const isScrollable = scrollHeight > clientHeight;

      if (!isScrollable) {
        // If this element itself isn't scrollable, check its ancestors up to modal-body
        let parent = scrollable.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
          if (parent.scrollHeight > parent.clientHeight && parent.clientHeight > 0) {
            const pStyle = window.getComputedStyle(parent);
            if (pStyle.overflowY === 'auto' || pStyle.overflowY === 'scroll' || parent.matches?.('.udt-modal-body, .custom-scrollbar, .modal-scroll-area')) {
              const pTop = parent.scrollTop;
              const pHeight = parent.scrollHeight;
              const pClient = parent.clientHeight;
              const isAtTop = pTop <= 0 && e.deltaY < 0;
              const isAtBottom = pTop + pClient >= pHeight - 1 && e.deltaY > 0;
              if (isAtTop || isAtBottom) {
                e.preventDefault();
              }
              return;
            }
          }
          parent = parent.parentElement;
        }

        // Entire modal hierarchy fits without scrolling: prevent background page scroll
        e.preventDefault();
        return;
      }

      // If scrollable, prevent scroll chaining at top and bottom boundaries
      const isAtTop = scrollTop <= 0 && e.deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && e.deltaY > 0;

      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    let touchStartY = 0;
    const handleTouchStart = (e) => {
      touchStartY = e.touches[0]?.clientY || 0;
    };

    const preventTouchScroll = (e) => {
      const scrollable = findScrollable(e.target);
      if (!scrollable) {
        e.preventDefault();
        return;
      }

      const { scrollTop, scrollHeight, clientHeight } = scrollable;
      if (scrollHeight <= clientHeight) {
        let parent = scrollable.parentElement;
        while (parent && parent !== document.body && parent !== document.documentElement) {
          if (parent.scrollHeight > parent.clientHeight && parent.clientHeight > 0) {
            const pStyle = window.getComputedStyle(parent);
            if (pStyle.overflowY === 'auto' || pStyle.overflowY === 'scroll' || parent.matches?.('.udt-modal-body, .custom-scrollbar, .modal-scroll-area')) {
              const currentY = e.touches[0]?.clientY || 0;
              const deltaY = touchStartY - currentY;
              const pTop = parent.scrollTop;
              const pHeight = parent.scrollHeight;
              const pClient = parent.clientHeight;
              const isAtTop = pTop <= 0 && deltaY < 0;
              const isAtBottom = pTop + pClient >= pHeight - 1 && deltaY > 0;
              if (isAtTop || isAtBottom) {
                e.preventDefault();
              }
              return;
            }
          }
          parent = parent.parentElement;
        }

        e.preventDefault();
        return;
      }

      const currentY = e.touches[0]?.clientY || 0;
      const deltaY = touchStartY - currentY;
      const isAtTop = scrollTop <= 0 && deltaY < 0;
      const isAtBottom = scrollTop + clientHeight >= scrollHeight - 1 && deltaY > 0;

      if (isAtTop || isAtBottom) {
        e.preventDefault();
      }
    };

    const preventKeyScroll = (e) => {
      if (['ArrowUp', 'ArrowDown', 'PageUp', 'PageDown', 'Home', 'End', ' '].includes(e.key)) {
        if (
          e.target.tagName !== 'INPUT' &&
          e.target.tagName !== 'TEXTAREA' &&
          !findScrollable(e.target)
        ) {
          e.preventDefault();
        }
      }
    };

    document.addEventListener("wheel", preventWheelScroll, { passive: false });
    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchmove", preventTouchScroll, { passive: false });
    document.addEventListener("keydown", preventKeyScroll, { passive: false });

    return () => {
      document.removeEventListener("wheel", preventWheelScroll);
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchmove", preventTouchScroll);
      document.removeEventListener("keydown", preventKeyScroll);
    };
  }, [isOpen, preventScroll]);

  if (!isOpen && !mounted) return null;

  return createPortal(
    <ModalContext.Provider value={{ close: handleClose, isClosing: closing }}>
      <div
        className={`udt-modal-overlay${closing ? " closing" : ""}`}
        onClick={closeOnBackdrop && !closeButtonDisabled ? () => handleClose() : undefined}
        role="dialog"
        aria-modal="true"
      >
        <div
          className={`udt-modal-panel udt-modal--${size} ${className}${closing ? " closing" : ""}`}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          {(activeTitle || showCloseButton || activeActions) && (
            <div className="udt-modal-header">
              <div className="udt-modal-title-area">
                <div className="udt-modal-title-row">
                  {activeIcon && <span className="udt-modal-title-icon">{activeIcon}</span>}
                  {activeTitle && <h3 className="udt-modal-title">{activeTitle}</h3>}
                </div>
                {activeSubtitle && <p className="udt-modal-subtitle">{activeSubtitle}</p>}
              </div>

              <div className="udt-modal-header-actions">
                {typeof activeActions === "function" ? activeActions({ close: handleClose }) : activeActions}
                {showCloseButton && (
                  <button
                    type="button"
                    className="udt-modal-close-btn"
                    onClick={() => handleClose()}
                    disabled={closeButtonDisabled}
                    aria-disabled={closeButtonDisabled}
                    title={closeButtonDisabled ? "Please select an option to continue" : "Close modal"}
                    aria-label="Close modal"
                  >
                    <PokeballCloseIcon size={34} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Modal Body */}
          <div className="udt-modal-body">
            <div
              className="udt-modal-body-animator"
              style={animatedBodyHeight ? { height: `${animatedBodyHeight}px` } : undefined}
            >
              <div ref={contentWrapperRef} className="udt-modal-body-content">
                {typeof activeChildren === "function" ? activeChildren({ close: handleClose }) : activeChildren}
              </div>
            </div>
          </div>

          {/* Modal Footer */}
          {activeFooter ? (
            <div className="udt-modal-footer">
              {typeof activeFooter === "function" ? activeFooter({ close: handleClose }) : activeFooter}
            </div>
          ) : null}
        </div>
      </div>
    </ModalContext.Provider>,
    document.body
  );
}

// Subcomponents for flexible nested layouts
Modal.Header = function ModalHeader({ title, subtitle, icon, actions, onClose, showClose = true }) {
  return (
    <div className="udt-modal-header">
      <div className="udt-modal-title-area">
        <div className="udt-modal-title-row">
          {icon && <span className="udt-modal-title-icon">{icon}</span>}
          {title && <h3 className="udt-modal-title">{title}</h3>}
        </div>
        {subtitle && <p className="udt-modal-subtitle">{subtitle}</p>}
      </div>
      <div className="udt-modal-header-actions">
        {actions}
        {showClose && onClose && (
          <button type="button" className="udt-modal-close-btn" onClick={onClose} aria-label="Close modal">
            <PokeballCloseIcon size={34} />
          </button>
        )}
      </div>
    </div>
  );
};

Modal.Body = function ModalBody({ className = "", children }) {
  return <div className={`udt-modal-body ${className}`}>{children}</div>;
};

Modal.Footer = function ModalFooter({ className = "", children }) {
  return <div className={`udt-modal-footer ${className}`}>{children}</div>;
};

/**
 * Universal Confirmation & Alert Modal Component
 */
export function ConfirmModal({
  isOpen = false,
  onClose,
  onConfirm,
  title = "Confirm Action",
  subtitle,
  message,
  disclaimer = "These changes are not reversible and cannot be undone.",
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger", // 'danger' | 'warning' | 'info' | 'primary'
  loading = false,
  confirmDelayMs = 500, // Safety delay in ms for dangerous actions to prevent accidental clicks
  children
}) {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (confirmDelayMs > 0 && variant === "danger") {
        setIsReady(false);
        const timer = setTimeout(() => {
          setIsReady(true);
        }, confirmDelayMs);
        return () => clearTimeout(timer);
      } else {
        setIsReady(true);
      }
    } else {
      setIsReady(false);
    }
  }, [isOpen, confirmDelayMs, variant]);

  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <Trash2 size={22} />;
      case "warning":
        return <AlertTriangle size={22} />;
      case "info":
        return <Info size={22} />;
      default:
        return <CheckCircle2 size={22} />;
    }
  };

  const defaultSubtitle = subtitle !== undefined
    ? subtitle
    : (variant === "danger" ? "This action cannot be undone" : undefined);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={defaultSubtitle}
      size="sm"
      footer={({ close }) => (
        <>
          <Button variant="secondary" onClick={close} disabled={loading}>
            {cancelText}
          </Button>
          <Button
            variant={variant === "danger" ? "danger" : "primary"}
            onClick={() => {
              if (!isReady || loading) return;
              // Trigger smooth exit animation first
              close();
              setTimeout(() => {
                onConfirm?.();
              }, 280);
            }}
            disabled={loading || !isReady}
            loading={loading}
            title={!isReady && variant === "danger" ? "Please wait a moment..." : undefined}
          >
            {confirmText}
          </Button>
        </>
      )}
    >
      <div className="udt-confirm-dialog-content">
        <div className={`udt-confirm-icon-box ${variant}`}>{getIcon()}</div>
        <div className="udt-confirm-text-wrap">
          {message && <p className="udt-confirm-text">{message}</p>}
          {children}
        </div>
      </div>
    </Modal>
  );
}

export default Modal;
