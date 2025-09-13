import { useEffect, useState, useRef, useContext } from 'react';
import { useLoading } from './LoadingContext';
import { UserContext } from './UserContext';

export default function CustomScrollbar() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const thumbRef = useRef(null);
  const { isAnyLoading } = useLoading();
  const userContext = useContext(UserContext);

  useEffect(() => {
    // Only run on desktop
    if (window.innerWidth < 769) return;

    const updateScrollbar = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const totalHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight || 0;
      
      
      setScrollPosition(scrollTop);
      setScrollHeight(totalHeight);
      setViewportHeight(clientHeight);
    };

    const handleResize = () => {
      updateScrollbar();
    };

    // Initial setup
    updateScrollbar();

    // Add scroll and resize listeners
    window.addEventListener('scroll', updateScrollbar, { passive: true });
    document.addEventListener('scroll', updateScrollbar, { passive: true });
    window.addEventListener('resize', handleResize);

    // Use ResizeObserver to detect content changes
    const resizeObserver = new ResizeObserver(() => {
      // Small delay to ensure DOM has updated
      setTimeout(updateScrollbar, 10);
    });

    // Observe the document body for content changes
    resizeObserver.observe(document.body);
    resizeObserver.observe(document.documentElement);

    // Also observe the main content area if it exists
    const mainContent = document.querySelector('main');
    if (mainContent) {
      resizeObserver.observe(mainContent);
    }

    return () => {
      window.removeEventListener('scroll', updateScrollbar);
      document.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  // Calculate thumb position and size
  const scrollableHeight = Math.max(1, scrollHeight - viewportHeight); // Ensure minimum of 1 to avoid division by zero
  const thumbHeight = scrollHeight > 0 ? Math.max(60, Math.min(200, (viewportHeight / scrollHeight) * viewportHeight)) : 60;
  const maxThumbTop = viewportHeight > 0 ? viewportHeight - thumbHeight - 16 : 0; // Account for top and bottom margins
  const thumbTop = scrollableHeight > 0 && maxThumbTop > 0 ? Math.min(maxThumbTop, (scrollPosition / scrollableHeight) * maxThumbTop) : 0;

  // Handle mouse down on thumb
  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartY(e.clientY);
    setDragStartScroll(scrollPosition);
  };

  // Handle mouse move for dragging
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e) => {
      const deltaY = e.clientY - dragStartY;
      const scrollableHeight = scrollHeight - viewportHeight;
      const trackHeight = viewportHeight - thumbHeight - 16;
      const scrollRatio = deltaY / trackHeight;
      const newScrollPosition = Math.max(0, Math.min(scrollableHeight, dragStartScroll + (scrollRatio * scrollableHeight)));
      
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

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('scrollbar-loading');
    };
  }, [userContext?.loading]);

  // Update scrollbar when component re-renders (page changes)
  useEffect(() => {
    if (window.innerWidth < 769) return;
    
    const updateScrollbar = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const totalHeight = document.documentElement.scrollHeight || document.body.scrollHeight || 0;
      const clientHeight = document.documentElement.clientHeight || window.innerHeight || 0;
      
      setScrollPosition(scrollTop);
      setScrollHeight(totalHeight);
      setViewportHeight(clientHeight);
    };

    // Update immediately when component re-renders
    updateScrollbar();
    
    // Also update after a short delay to catch any delayed content changes
    const timeoutId = setTimeout(updateScrollbar, 100);
    
    return () => clearTimeout(timeoutId);
  }, [scrollHeight, viewportHeight]); // Re-run when these values change

  // Toggle no-scrollbar class based on whether scrolling is needed
  useEffect(() => {
    const needsScrolling = scrollHeight > viewportHeight;
    
    if (needsScrolling) {
      document.body.classList.remove('no-scrollbar');
    } else {
      document.body.classList.add('no-scrollbar');
    }

    // Cleanup on unmount
    return () => {
      document.body.classList.remove('no-scrollbar');
    };
  }, [scrollHeight, viewportHeight]);

  // Don't render on mobile
  if (typeof window !== 'undefined' && window.innerWidth < 769) {
    return null;
  }

  // Only hide during main app loading, not component-specific loading
  const userLoading = userContext?.loading || false;
  
  // Debug logging to see what's causing the scrollbar to be hidden
  if (userLoading) {
    console.log('Scrollbar hidden due to main app loading:', { 
      userLoading,
      userContext: userContext?.loading
    });
  }
  
  if (userLoading) {
    return null;
  }

  // Don't show scrollbar if content doesn't require scrolling
  const needsScrolling = scrollHeight > viewportHeight;
  
  return (
    <div 
      ref={thumbRef}
      className="custom-scrollbar-thumb"
      style={{
        top: `${thumbTop + 8}px`,
        height: `${thumbHeight}px`,
        display: (scrollHeight > 0 && viewportHeight > 0 && needsScrolling) ? 'block' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
