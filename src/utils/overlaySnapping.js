/**
 * Simple, correct snapping engine.
 *
 * Guide lines are always drawn AFTER snap is applied, using
 * the final snapped position — so they always match where the
 * element actually sits.
 *
 * Guide coordinate space: canvas pixels (0,0) = top-left of overlay card.
 * Lines are clamped to the overlay bounds so they never escape the card.
 */

export const DEFAULT_SNAP_SETTINGS = {
  enabled: true,
  snapThreshold: 6,
  snapToCanvasCenter: true,
  snapToCanvasEdges: true,
  snapToElements: true,
  snapToGrid: false,
  gridSize: 8,
  showGuides: true,
};

/**
 * Main snap function.
 *
 * Call BEFORE applying snap to position:
 *   const { dx, dy } = snap(rawRect, others, canvas, settings, ctrlHeld)
 *   finalX = rawX + dx
 *   finalY = rawY + dy
 *
 * Then call buildGuides AFTER clamping and applying snap to get the
 * correct visual lines.
 */
export function snap(rect, others = [], canvas = { w: 665, h: 220 }, settings = DEFAULT_SNAP_SETTINGS, ctrlHeld = false) {
  if (ctrlHeld || !settings.enabled) return { dx: 0, dy: 0 };

  const T = settings.snapThreshold ?? 6;
  const W = canvas.w;
  const H = canvas.h;

  let dx = 0;
  let bestDistX = T + 1;

  let dy = 0;
  let bestDistY = T + 1;

  // ── X axis ───────────────────────────────────────────────────────────────

  const trySnapX = (delta) => {
    const d = Math.abs(delta);
    if (d <= T && d < bestDistX) {
      bestDistX = d;
      dx = delta;
    }
  };

  // Canvas center X (snap element center to canvas center)
  if (settings.snapToCanvasCenter) {
    trySnapX(W / 2 - rect.cx);   // center-to-center
  }

  // Canvas edges
  if (settings.snapToCanvasEdges) {
    trySnapX(0 - rect.left);              // left edge to canvas left
    trySnapX(W - rect.right);             // right edge to canvas right
  }

  // Other elements
  if (settings.snapToElements) {
    for (const o of others) {
      trySnapX(o.left   - rect.left);    // left to left
      trySnapX(o.right  - rect.right);   // right to right
      trySnapX(o.cx     - rect.cx);      // center to center
      trySnapX(o.right  - rect.left);    // left side butts against other's right
      trySnapX(o.left   - rect.right);   // right side butts against other's left
    }
  }

  // Grid
  if (settings.snapToGrid) {
    const g = settings.gridSize || 8;
    const mod = ((rect.left % g) + g) % g; // always positive mod
    const toGrid = mod <= T ? -mod : (g - mod <= T ? g - mod : 0);
    if (toGrid !== 0 && Math.abs(toGrid) < bestDistX) {
      bestDistX = Math.abs(toGrid);
      dx = toGrid;
    }
  }

  // ── Y axis ───────────────────────────────────────────────────────────────

  const trySnapY = (delta) => {
    const d = Math.abs(delta);
    if (d <= T && d < bestDistY) {
      bestDistY = d;
      dy = delta;
    }
  };

  if (settings.snapToCanvasCenter) {
    trySnapY(H / 2 - rect.cy);
  }

  if (settings.snapToCanvasEdges) {
    trySnapY(0 - rect.top);
    trySnapY(H - rect.bottom);
  }

  if (settings.snapToElements) {
    for (const o of others) {
      trySnapY(o.top    - rect.top);
      trySnapY(o.bottom - rect.bottom);
      trySnapY(o.cy     - rect.cy);
      trySnapY(o.bottom - rect.top);    // top side butts against other's bottom
      trySnapY(o.top    - rect.bottom); // bottom side butts against other's top
    }
  }

  if (settings.snapToGrid) {
    const g = settings.gridSize || 8;
    const mod = ((rect.top % g) + g) % g;
    const toGrid = mod <= T ? -mod : (g - mod <= T ? g - mod : 0);
    if (toGrid !== 0 && Math.abs(toGrid) < bestDistY) {
      dy = toGrid;
    }
  }

  return { dx, dy };
}

/**
 * Build visual guide lines AFTER snap delta has been applied to the rect.
 *
 * snappedRect: the final position after snap + clamp (not the raw dragged position).
 * others: same list of other element rects.
 * canvas: { w, h }
 * settings: snap settings
 *
 * Returns an array of guide descriptors:
 *   { axis: 'x'|'y', pos, from, to }
 *
 * 'x' = vertical line at x=pos spanning y from→to (inside canvas)
 * 'y' = horizontal line at y=pos spanning x from→to (inside canvas)
 */
export function buildGuides(snappedRect, others = [], canvas = { w: 665, h: 220 }, settings = DEFAULT_SNAP_SETTINGS) {
  if (!settings.enabled || !settings.showGuides) return [];

  const T = settings.snapThreshold ?? 6;
  const W = canvas.w;
  const H = canvas.h;
  const guides = [];

  // Helper: add a vertical guide line clamped to canvas
  const guideX = (x, yFrom, yTo) => {
    guides.push({ axis: 'x', pos: x, from: Math.max(0, yFrom), to: Math.min(H, yTo) });
  };

  // Helper: add a horizontal guide line clamped to canvas
  const guideY = (y, xFrom, xTo) => {
    guides.push({ axis: 'y', pos: y, from: Math.max(0, xFrom), to: Math.min(W, xTo) });
  };

  // ── Canvas center ─────────────────────────────────────────────────────────
  if (settings.snapToCanvasCenter) {
    if (Math.abs(snappedRect.cx - W / 2) <= T) {
      // Element center aligned to canvas center X — full-height line at canvas midpoint
      guideX(W / 2, 0, H);
    }
    if (Math.abs(snappedRect.cy - H / 2) <= T) {
      guideY(H / 2, 0, W);
    }
  }

  // ── Canvas edges ──────────────────────────────────────────────────────────
  if (settings.snapToCanvasEdges) {
    if (Math.abs(snappedRect.left) <= T)        guideX(0, 0, H);
    if (Math.abs(snappedRect.right - W) <= T)   guideX(W, 0, H);
    if (Math.abs(snappedRect.top) <= T)          guideY(0, 0, W);
    if (Math.abs(snappedRect.bottom - H) <= T)  guideY(H, 0, W);
  }

  // ── Other elements ────────────────────────────────────────────────────────
  if (settings.snapToElements) {
    for (const o of others) {
      // Left-to-left
      if (Math.abs(snappedRect.left - o.left) <= T) {
        const yFrom = Math.min(snappedRect.top, o.top);
        const yTo   = Math.max(snappedRect.bottom, o.bottom);
        guideX(o.left, yFrom, yTo);
      }
      // Right-to-right
      if (Math.abs(snappedRect.right - o.right) <= T) {
        const yFrom = Math.min(snappedRect.top, o.top);
        const yTo   = Math.max(snappedRect.bottom, o.bottom);
        guideX(o.right, yFrom, yTo);
      }
      // Center-X to center-X
      if (Math.abs(snappedRect.cx - o.cx) <= T) {
        const yFrom = Math.min(snappedRect.top, o.top);
        const yTo   = Math.max(snappedRect.bottom, o.bottom);
        guideX(o.cx, yFrom, yTo);
      }
      // Left butting other's right
      if (Math.abs(snappedRect.left - o.right) <= T) {
        const yFrom = Math.max(snappedRect.top, o.top);
        const yTo   = Math.min(snappedRect.bottom, o.bottom);
        if (yTo > yFrom) guideX(o.right, yFrom, yTo);
      }
      // Right butting other's left
      if (Math.abs(snappedRect.right - o.left) <= T) {
        const yFrom = Math.max(snappedRect.top, o.top);
        const yTo   = Math.min(snappedRect.bottom, o.bottom);
        if (yTo > yFrom) guideX(o.left, yFrom, yTo);
      }

      // Top-to-top
      if (Math.abs(snappedRect.top - o.top) <= T) {
        const xFrom = Math.min(snappedRect.left, o.left);
        const xTo   = Math.max(snappedRect.right, o.right);
        guideY(o.top, xFrom, xTo);
      }
      // Bottom-to-bottom
      if (Math.abs(snappedRect.bottom - o.bottom) <= T) {
        const xFrom = Math.min(snappedRect.left, o.left);
        const xTo   = Math.max(snappedRect.right, o.right);
        guideY(o.bottom, xFrom, xTo);
      }
      // Center-Y to center-Y
      if (Math.abs(snappedRect.cy - o.cy) <= T) {
        const xFrom = Math.min(snappedRect.left, o.left);
        const xTo   = Math.max(snappedRect.right, o.right);
        guideY(o.cy, xFrom, xTo);
      }
      // Top butting other's bottom
      if (Math.abs(snappedRect.top - o.bottom) <= T) {
        const xFrom = Math.max(snappedRect.left, o.left);
        const xTo   = Math.min(snappedRect.right, o.right);
        if (xTo > xFrom) guideY(o.bottom, xFrom, xTo);
      }
      // Bottom butting other's top
      if (Math.abs(snappedRect.bottom - o.top) <= T) {
        const xFrom = Math.max(snappedRect.left, o.left);
        const xTo   = Math.min(snappedRect.right, o.right);
        if (xTo > xFrom) guideY(o.top, xFrom, xTo);
      }
    }
  }

  // Deduplicate guides that are at the same position
  const seen = new Set();
  return guides.filter((g) => {
    const key = `${g.axis}_${Math.round(g.pos * 10)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Convert a DOM BoundingClientRect (already in canvas-local coords) to the snap rect format */
export function toSnapRect(left, top, width, height) {
  return {
    left,
    top,
    right: left + width,
    bottom: top + height,
    cx: left + width / 2,
    cy: top + height / 2,
    width,
    height,
  };
}

// ─── Alignment & Distribution helpers (unchanged, still needed for Properties panel) ──────────

export function alignElements(selectedIds, currentStyles = {}, alignType, elementRects = {}, canvasRect = { width: 665, height: 220 }) {
  const result = { ...currentStyles };
  const cardW = canvasRect.width || 665;
  const cardH = canvasRect.height || 220;
  if (!selectedIds || selectedIds.length === 0) return result;

  if (selectedIds.length === 1) {
    const id = selectedIds[0];
    const rect = elementRects[id];
    if (!rect) return result;
    const s = { ...(currentStyles[id] || {}) };
    if (alignType === 'left')      s.x = -rect.baseLeft;
    if (alignType === 'center-x')  s.x = Math.round(cardW / 2 - rect.baseLeft - rect.width / 2);
    if (alignType === 'right')     s.x = Math.round(cardW - rect.baseLeft - rect.width);
    if (alignType === 'top')       s.y = -rect.baseTop;
    if (alignType === 'center-y')  s.y = Math.round(cardH / 2 - rect.baseTop - rect.height / 2);
    if (alignType === 'bottom')    s.y = Math.round(cardH - rect.baseTop - rect.height);
    result[id] = s;
    return result;
  }

  const rects = selectedIds.map((id) => elementRects[id]).filter(Boolean);
  if (rects.length < 2) return result;

  const groupLeft    = Math.min(...rects.map((r) => r.left));
  const groupRight   = Math.max(...rects.map((r) => r.right));
  const groupCenterX = (groupLeft + groupRight) / 2;
  const groupTop     = Math.min(...rects.map((r) => r.top));
  const groupBottom  = Math.max(...rects.map((r) => r.bottom));
  const groupCenterY = (groupTop + groupBottom) / 2;

  selectedIds.forEach((id) => {
    const r = elementRects[id];
    if (!r) return;
    const s  = { ...(currentStyles[id] || {}) };
    const cx = Number(s.x || 0);
    const cy = Number(s.y || 0);
    if (alignType === 'left')      s.x = Math.round(cx + (groupLeft    - r.left));
    if (alignType === 'center-x')  s.x = Math.round(cx + (groupCenterX - r.centerX));
    if (alignType === 'right')     s.x = Math.round(cx + (groupRight   - r.right));
    if (alignType === 'top')       s.y = Math.round(cy + (groupTop     - r.top));
    if (alignType === 'center-y')  s.y = Math.round(cy + (groupCenterY - r.centerY));
    if (alignType === 'bottom')    s.y = Math.round(cy + (groupBottom  - r.bottom));
    result[id] = s;
  });

  return result;
}

export function distributeElements(selectedIds, currentStyles = {}, axis = 'horizontal', elementRects = {}) {
  const result = { ...currentStyles };
  if (!selectedIds || selectedIds.length < 3) return result;
  const items = selectedIds.map((id) => ({ id, rect: elementRects[id] })).filter((i) => i.rect);
  if (items.length < 3) return result;

  if (axis === 'horizontal') {
    items.sort((a, b) => a.rect.left - b.rect.left);
    const first = items[0].rect;
    const last  = items[items.length - 1].rect;
    const totalW   = items.reduce((s, i) => s + i.rect.width, 0);
    const equalGap = (last.right - first.left - totalW) / (items.length - 1);
    let cur = first.left;
    items.forEach((item) => {
      const s = { ...(currentStyles[item.id] || {}) };
      s.x = Math.round((s.x || 0) + (cur - item.rect.left));
      result[item.id] = s;
      cur += item.rect.width + equalGap;
    });
  } else {
    items.sort((a, b) => a.rect.top - b.rect.top);
    const first = items[0].rect;
    const last  = items[items.length - 1].rect;
    const totalH   = items.reduce((s, i) => s + i.rect.height, 0);
    const equalGap = (last.bottom - first.top - totalH) / (items.length - 1);
    let cur = first.top;
    items.forEach((item) => {
      const s = { ...(currentStyles[item.id] || {}) };
      s.y = Math.round((s.y || 0) + (cur - item.rect.top));
      result[item.id] = s;
      cur += item.rect.height + equalGap;
    });
  }

  return result;
}

// Legacy export alias so old import { calculateSmartSnaps } still works without breaking the build
export function calculateSmartSnaps() { return { deltaX: 0, deltaY: 0, guides: [] }; }
export function calculateAltMeasurements() { return []; }
