import { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useLoading } from './LoadingContext';
import { UserContext } from './UserContext';

export default function CustomScrollbar() {
  const location = useLocation();
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const thumbRef = useRef(null);
  const trackRef = useRef(null);
  const userContext = useContext(UserContext);

  const username = userContext?.username || userContext?.user?.username;
  const isLandingPage = location.pathname === '/' && !userContext?.loading && !username;

  const updateScrollbar = useCallback(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 769 || isLandingPage) return;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
    const rootEl = document.getElementById('root');
    const totalHeight = Math.max(
      document.documentElement.scrollHeight || 0,
      document.body.scrollHeight || 0,
      rootEl?.scrollHeight || 0
    );
    const clientHeight = window.innerHeight || document.documentElement.clientHeight || 0;

    setScrollPosition(prev => Math.abs(prev - scrollTop) > 0.5 ? scrollTop : prev);
    setScrollHeight(prev => Math.abs(prev - totalHeight) > 1 ? totalHeight : prev);
    setViewportHeight(prev => Math.abs(prev - clientHeight) > 1 ? clientHeight : prev);
  }, [isLandingPage]);

  // Continuous frame check & event listeners for 100% accurate real-time tracking
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.innerWidth < 769 || isLandingPage) {
      document.body.classList.remove('no-scrollbar');
      return;
    }

    // Immediate calculation
    updateScrollbar();

    // Event listeners
    window.addEventListener('scroll', updateScrollbar, { passive: true });
    document.addEventListener('scroll', updateScrollbar, { passive: true });
    window.addEventListener('resize', updateScrollbar, { passive: true });

    // Live animation frame loop for instantaneous updates when cards/filters/images load
    let animationFrameId;
    const loop = () => {
      updateScrollbar();
      animationFrameId = requestAnimationFrame(loop);
    };
    animationFrameId = requestAnimationFrame(loop);

    // MutationObserver to detect DOM mutations (filtering, accordions, tabs)
    const rootEl = document.getElementById('root');
    const mutationObserver = new MutationObserver(() => {
      updateScrollbar();
    });

    if (rootEl) {
      mutationObserver.observe(rootEl, { childList: true, subtree: true, attributes: true });
    }

    return () => {
      window.removeEventListener('scroll', updateScrollbar);
      document.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', updateScrollbar);
      cancelAnimationFrame(animationFrameId);
      mutationObserver.disconnect();
    };
  }, [location.pathname, isLandingPage, updateScrollbar]);

  // Calculate thumb position and size
  const scrollableHeight = Math.max(1, scrollHeight - viewportHeight);
  const thumbHeight = scrollHeight > 0 ? Math.max(60, Math.min(200, (viewportHeight / scrollHeight) * viewportHeight)) : 60;
  const maxThumbTop = viewportHeight > 0 ? Math.max(0, viewportHeight - thumbHeight - 16) : 0;
  const thumbTop = scrollableHeight > 0 && maxThumbTop > 0 ? Math.min(maxThumbTop, (scrollPosition / scrollableHeight) * maxThumbTop) : 0;

  // Handle mouse down on thumb
  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartScroll(scrollPosition);
  };

  // Handle click on track to jump scroll position
  const handleTrackClick = (e) => {
    if (isDragging) return;
    if (e.target === thumbRef.current) return;

    const trackRect = trackRef.current?.getBoundingClientRect();
    if (!trackRect) return;

    const clickY = e.clientY - trackRect.top;
    const currentScrollableHeight = Math.max(1, scrollHeight - viewportHeight);
    const availableTrackHeight = Math.max(1, viewportHeight - thumbHeight - 16);
    const targetScroll = ((clickY - thumbHeight / 2) / availableTrackHeight) * currentScrollableHeight;
    const clampedScroll = Math.max(0, Math.min(currentScrollableHeight, targetScroll));

    window.scrollTo({
      top: clampedScroll,
      behavior: 'smooth'
    });
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const currentScrollableHeight = Math.max(1, scrollHeight - viewportHeight);
      const trackHeight = Math.max(1, viewportHeight - thumbHeight - 16);
      const scrollRatio = deltaY / trackHeight;
      const newScrollPosition = Math.max(0, Math.min(currentScrollableHeight, dragStartScroll + (scrollRatio * currentScrollableHeight)));

      window.scrollTo(0, newScrollPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, dragStartY, dragStartScroll, scrollHeight, viewportHeight, thumbHeight]);

  // Handle main app loading state changes for CSS control
  useEffect(() => {
    const userLoading = userContext?.loading || false;

    if (userLoading) {
      document.body.classList.add('scrollbar-loading');
    } else {
      document.body.classList.remove('scrollbar-loading');
    }

    return () => {
      document.body.classList.remove('scrollbar-loading');
    };
  }, [userContext?.loading]);

  // Toggle no-scrollbar class based on whether scrolling is needed
  useEffect(() => {
    if (isLandingPage) {
      document.body.classList.remove('no-scrollbar');
      return;
    }
    const needsScrolling = scrollHeight > viewportHeight + 10;

    if (needsScrolling) {
      document.body.classList.remove('no-scrollbar');
    } else {
      document.body.classList.add('no-scrollbar');
    }

    return () => {
      document.body.classList.remove('no-scrollbar');
    };
  }, [scrollHeight, viewportHeight, isLandingPage]);

  // Don't render on mobile or on public landing page
  if ((typeof window !== 'undefined' && window.innerWidth < 769) || isLandingPage) {
    return null;
  }

  // Only hide during initial user loading
  if (userContext?.loading) {
    return null;
  }

  // Don't show scrollbar if content doesn't require scrolling
  const needsScrolling = scrollHeight > viewportHeight + 10;

  return (
    <div
      ref={trackRef}
      className="custom-scrollbar-click-track"
      onClick={handleTrackClick}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        width: '20px',
        height: '100vh',
        zIndex: 9999,
        cursor: 'pointer',
        pointerEvents: needsScrolling ? 'auto' : 'none',
        display: (scrollHeight > 0 && viewportHeight > 0 && needsScrolling) ? 'block' : 'none',
      }}
    >
      <div
        ref={thumbRef}
        className="custom-scrollbar-thumb"
        style={{
          top: `${thumbTop + 8}px`,
          height: `${thumbHeight}px`,
          cursor: isDragging ? 'grabbing' : 'grab'
        }}
        onMouseDown={handleMouseDown}
      />
    </div>
  );
}
