import React, { useId } from "react";
import { AlertCircle } from "lucide-react";
import "../../../css/FormField.css";

/**
 * FormFieldWrapper
 * 
 * Foundational wrapper component providing a unified layout, label,
 * icon slots, error handling, helper text, and character counter
 * across all universal form controls.
 */
export default function FormFieldWrapper({
    id: explicitId,
    label,
    subLabel,
    required = false,
    optional = false,
    error,
    helperText,
    size = "md", // 'sm' | 'md' | 'lg'
    fullWidth = false,
    disabled = false,
    readOnly = false,
    isFocused = false,
    hasValue = false,
    startIcon = null,
    endIcon = null,
    charCount = null,
    maxLength = null,
    charCountInHeader = false, // When true, renders "X / Y" inline with the label instead of the footer
    className = "",
    controlClassName = "",
    headerExtra = null,
    isTextArea = false,
    children,
    onClick,
}) {
    const generatedId = useId();
    const fieldId = explicitId || generatedId;
    const errorId = error ? `${fieldId}-error` : undefined;
    const helperId = helperText ? `${fieldId}-helper` : undefined;

    const hasError = Boolean(error);
    const hasStartIcon = Boolean(startIcon);
    const hasEndIcon = Boolean(endIcon);

    const isCharLimitReached = maxLength && charCount >= maxLength;

    return (
        <div
            className={`udt-form-field udt-form-field--${size} ${fullWidth ? "udt-form-field--full-width" : ""} ${className}`.trim()}
            onClick={onClick}
        >
            {/* Field Header (Label, Required star, Optional tag, Sublabel, Extra) */}
            {(label || subLabel || headerExtra || (charCountInHeader && maxLength !== null)) && (
                <div className="udt-field-header">
                    <div className="udt-field-label-group">
                        {label && (
                            <label htmlFor={fieldId} className="udt-field-label">
                                {label}
                                {required && <span className="udt-field-required-star" aria-hidden="true"> *</span>}
                                {optional && !required && <span className="udt-field-optional-badge">(optional)</span>}
                            </label>
                        )}
                        {subLabel && <span className="udt-field-sublabel">{subLabel}</span>}
                    </div>
                    {/* Right-side of header: extra content OR inline char count */}
                    {(headerExtra || (charCountInHeader && maxLength !== null)) && (
                        <div className="udt-field-header-extra">
                            {headerExtra}
                            {charCountInHeader && maxLength !== null && (
                                <span
                                    className={`udt-field-char-count ${isCharLimitReached ? "udt-field-char-count--limit" : ""}`}
                                    aria-live="polite"
                                >
                                    {charCount ?? 0} / {maxLength}
                                </span>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Field Control Box (Border, Focus Glow, Background, Start/End Icon Slots) */}
            <div
                className={`udt-field-control ${isFocused ? "udt-field-control--focused" : ""} ${
                    hasError ? "udt-field-control--error" : ""
                } ${disabled ? "udt-field-control--disabled" : ""} ${
                    readOnly ? "udt-field-control--readonly" : ""
                } ${hasStartIcon ? "has-start-icon" : ""} ${hasEndIcon ? "has-end-icon" : ""} ${
                    isTextArea ? "udt-field-control--textarea" : ""
                } ${controlClassName}`.trim()}
            >
                {startIcon && <div className="udt-field-icon-start">{startIcon}</div>}

                {/* Primary Field Input / Control Slot */}
                {typeof children === "function"
                    ? children({
                          id: fieldId,
                          disabled,
                          readOnly,
                          "aria-invalid": hasError ? "true" : "false",
                          "aria-describedby": [errorId, helperId].filter(Boolean).join(" ") || undefined,
                          "aria-required": required ? "true" : undefined,
                      })
                    : children}

                {endIcon && <div className="udt-field-icon-end">{endIcon}</div>}
            </div>

            {/* Field Footer (Error message, Helper text, Character counter — only when not in header) */}
            {(hasError || helperText || (maxLength !== null && !charCountInHeader)) && (
                <div className="udt-field-footer">
                    <div className="udt-field-message-wrap">
                        {hasError ? (
                            <div id={errorId} className="udt-field-error" role="alert">
                                <span className="udt-field-error-icon">
                                    <AlertCircle size={14} />
                                </span>
                                <span>{error}</span>
                            </div>
                        ) : helperText ? (
                            <div id={helperId} className="udt-field-helper">
                                {helperText}
                            </div>
                        ) : null}
                    </div>

                    {maxLength !== null && !charCountInHeader && (
                        <div
                            className={`udt-field-char-count ${
                                isCharLimitReached ? "udt-field-char-count--limit" : ""
                            }`}
                            aria-live="polite"
                        >
                            {charCount ?? 0} / {maxLength}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
