import { useEffect, useState, useRef } from 'react';

export default function CustomScrollbar() {
  const [scrollPosition, setScrollPosition] = useState(0);
  const [scrollHeight, setScrollHeight] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartY, setDragStartY] = useState(0);
  const [dragStartScroll, setDragStartScroll] = useState(0);
  const thumbRef = useRef(null);

  useEffect(() => {
    // Only run on desktop
    if (window.innerWidth < 769) return;

    const updateScrollbar = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const totalHeight = document.documentElement.scrollHeight;
      const clientHeight = document.documentElement.clientHeight;
      
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
    window.addEventListener('scroll', updateScrollbar);
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('scroll', updateScrollbar);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Calculate thumb position and size
  const scrollableHeight = scrollHeight - viewportHeight;
  const thumbHeight = Math.max(60, Math.min(200, (viewportHeight / scrollHeight) * viewportHeight));
  const maxThumbTop = viewportHeight - thumbHeight - 16; // Account for top and bottom margins
  const thumbTop = scrollableHeight > 0 ? Math.min(maxThumbTop, (scrollPosition / scrollableHeight) * maxThumbTop) : 0;

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

  // Don't render on mobile
  if (typeof window !== 'undefined' && window.innerWidth < 769) {
    return null;
  }

  return (
    <div 
      ref={thumbRef}
      className="custom-scrollbar-thumb"
      style={{
        top: `${thumbTop + 8}px`,
        height: `${thumbHeight}px`,
        display: scrollHeight > viewportHeight ? 'block' : 'none',
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
