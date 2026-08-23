import React, { forwardRef } from "react";
import "../../css/Tooltip.css";

/**
 * Universal Tooltip Component
 * Matches the sleek dark styling of sidebar and app-wide tooltips.
 *
 * @param {Object} props
 * @param {React.ReactNode} props.content - Tooltip text or node content
 * @param {'top'|'bottom'|'left'|'right'} [props.position='top']
 * @param {'center'|'start'|'end'} [props.align='center']
 * @param {string|number} [props.maxWidth]
 * @param {string|number} [props.minWidth]
 * @param {boolean} [props.wrap=false]
 * @param {boolean} [props.disabled=false]
 * @param {string} [props.className='']
 * @param {string} [props.tooltipClassName='']
 * @param {React.ReactNode} props.children - Trigger element
 */
export const Tooltip = forwardRef(function Tooltip(
  {
    content,
    position = "top",
    align = "center",
    maxWidth,
    minWidth,
    wrap = false,
    disabled = false,
    className = "",
    tooltipClassName = "",
    children,
    ...rest
  },
  ref
) {
  if (!content || disabled) {
    return children;
  }

  const tooltipClasses = [
    "udt-tooltip",
    `udt-tooltip--${position}`,
    `udt-tooltip--${align}`,
    wrap ? "udt-tooltip--wrap" : "",
    tooltipClassName,
  ]
    .filter(Boolean)
    .join(" ");

  const tooltipStyle = {
    ...(maxWidth
      ? { maxWidth: typeof maxWidth === "number" ? `${maxWidth}px` : maxWidth }
      : {}),
    ...(minWidth
      ? { minWidth: typeof minWidth === "number" ? `${minWidth}px` : minWidth }
      : {}),
  };

  return (
    <span
      ref={ref}
      className={`udt-tooltip-wrapper ${className}`.trim()}
      {...rest}
    >
      {children}
      <span className={tooltipClasses} style={tooltipStyle} role="tooltip">
        {content}
      </span>
    </span>
  );
});

export default Tooltip;
