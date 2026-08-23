import React, { forwardRef } from "react";
import "../../css/Button.css";

/**
 * Universal Button Component
 *
 * @param {Object} props
 * @param {'primary'|'secondary'|'danger'|'danger-soft'|'success'|'ghost'|'icon'} [props.variant='primary']
 * @param {'sm'|'md'|'lg'} [props.size='md']
 * @param {boolean} [props.loading=false]
 * @param {boolean} [props.disabled=false]
 * @param {boolean} [props.active=false] (for icon buttons)
 * @param {boolean} [props.block=false] (full width)
 * @param {React.ReactNode} [props.icon] (Leading SVG / icon)
 * @param {React.ReactNode} [props.iconRight] (Trailing SVG / icon)
 * @param {React.ElementType} [props.as='button']
 * @param {string} [props.className='']
 * @param {React.ReactNode} props.children
 */
export const Button = forwardRef(function Button(
  {
    as: Component = "button",
    variant = "primary",
    size = "md",
    loading = false,
    disabled = false,
    active = false,
    block = false,
    fullWidth = false,
    icon,
    iconRight,
    iconPosition = "left",
    className = "",
    children,
    type = "button",
    ...rest
  },
  ref
) {
  const isBlock = Boolean(block || fullWidth);
  const leadingIcon = iconPosition === "left" ? icon : null;
  const trailingIcon = iconRight || (iconPosition === "right" ? icon : null);

  const classes = [
    "udt-btn",
    `udt-btn--${variant}`,
    `udt-btn--${size}`,
    isBlock ? "udt-btn--block" : "",
    loading ? "is-loading" : "",
    disabled ? "is-disabled" : "",
    active ? "is-active" : "",
    className
  ]
    .filter(Boolean)
    .join(" ");

  const isNativeButton = Component === "button";
  const componentProps = {
    ref,
    className: classes,
    ...(isNativeButton ? { type, disabled: disabled || loading } : {}),
    ...(disabled || loading ? { "aria-disabled": "true", tabIndex: -1 } : {}),
    ...rest
  };

  return (
    <Component {...componentProps}>
      {loading ? (
        <span className="udt-btn-spinner" aria-hidden="true" />
      ) : leadingIcon ? (
        <span className="udt-btn-icon leading-icon">{leadingIcon}</span>
      ) : null}

      {children && <span className="udt-btn-label">{children}</span>}

      {!loading && trailingIcon && (
        <span className="udt-btn-icon trailing-icon">{trailingIcon}</span>
      )}
    </Component>
  );
});

export default Button;
