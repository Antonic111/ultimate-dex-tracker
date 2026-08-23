import React, { forwardRef, useState, useEffect, useRef } from "react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * TextArea
 * 
 * Multi-line textarea input with support for auto-grow resizing,
 * character counting, min/max rows, and unified field styling.
 */
const TextArea = forwardRef(function TextArea(
    {
        id,
        label,
        subLabel,
        value,
        defaultValue,
        onChange,
        placeholder,
        rows = 3,
        minRows = 2,
        maxRows,
        autoGrow = false,
        resize = "vertical", // 'vertical' | 'none' | 'horizontal' | 'both'
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        error,
        helperText,
        size = "md",
        fullWidth = false,
        maxLength,
        showCharCount = false,
        showCount,          // alias for showCharCount, consumed here
        charCountInHeader = false,
        className = "",
        inputClassName = "",
        onFocus,
        onBlur,
        ...restProps
    },
    ref
) {
    // Support showCount as an alias for showCharCount
    const effectiveShowCharCount = showCount !== undefined ? Boolean(showCount) : showCharCount;
    const [isFocused, setIsFocused] = useState(false);
    const internalRef = useRef(null);
    const resolvedRef = ref || internalRef;

    const currentVal = value !== undefined ? value : defaultValue || "";
    const hasValue = currentVal !== "" && currentVal !== null && currentVal !== undefined;
    const charCount = typeof currentVal === "string" ? currentVal.length : 0;

    // Handle auto-grow
    useEffect(() => {
        if (autoGrow && resolvedRef.current) {
            const textarea = resolvedRef.current;
            textarea.style.height = "auto";
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [currentVal, autoGrow, resolvedRef]);

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleChange = (e) => {
        if (autoGrow && resolvedRef.current) {
            const textarea = resolvedRef.current;
            textarea.style.height = "auto";
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
        onChange?.(e);
    };

    const resizeClass = resize === "none" || autoGrow ? "udt-field-textarea--no-resize" : "";

    return (
        <FormFieldWrapper
            id={id}
            label={label}
            subLabel={subLabel}
            required={required}
            optional={optional}
            error={error}
            helperText={helperText}
            size={size}
            fullWidth={fullWidth}
            disabled={disabled}
            readOnly={readOnly}
            isFocused={isFocused}
            hasValue={hasValue}
            charCount={effectiveShowCharCount ? charCount : null}
            maxLength={effectiveShowCharCount && maxLength ? maxLength : null}
            charCountInHeader={charCountInHeader}
            isTextArea={true}
            className={className}
        >
            {(accessibleProps) => (
                <textarea
                    ref={resolvedRef}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    rows={rows}
                    maxLength={maxLength}
                    style={{ resize: autoGrow ? "none" : resize }}
                    className={`udt-field-input udt-field-textarea ${resizeClass} ${inputClassName}`.trim()}
                    {...accessibleProps}
                    {...restProps}
                />
            )}
        </FormFieldWrapper>
    );
});

export default TextArea;
