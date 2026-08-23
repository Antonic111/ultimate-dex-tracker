import React, { forwardRef, useState } from "react";
import { Eye, EyeOff, X } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * TextField
 * 
 * Universal text input supporting standard text, email, url, and password
 * with built-in toggle, clear actions, and custom start/end icon slots.
 */
const TextField = forwardRef(function TextField(
    {
        id,
        label,
        subLabel,
        type = "text",
        value,
        defaultValue,
        onChange,
        onClear,
        placeholder,
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon = null,
        endIcon = null,
        startAdornment = null,
        endAdornment = null,
        clearable = false,
        alignWithActionFields = false,
        showPasswordToggle = true,
        maxLength,
        showCharCount = false,
        charCountInHeader = false,
        className = "",
        inputClassName = "",
        onFocus,
        onBlur,
        autoComplete,
        ...restProps
    },
    ref
) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = type === "password";
    const computedType = isPassword ? (showPassword ? "text" : "password") : type;

    const currentVal = value !== undefined ? value : defaultValue || "";
    const hasValue = currentVal !== "" && currentVal !== null && currentVal !== undefined;
    const charCount = typeof currentVal === "string" ? currentVal.length : 0;

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onClear) {
            onClear();
        } else if (onChange) {
            // Emulate an empty change event
            onChange({ target: { value: "", name: restProps.name } });
        }
    };

    // Construct start & end icon slots
    const resolvedStartIcon = startIcon || startAdornment;
    let resolvedEndIcon = endIcon || endAdornment;

    if (isPassword && showPasswordToggle) {
        resolvedEndIcon = (
            <button
                type="button"
                className="udt-field-icon-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
                title={showPassword ? "Hide password" : "Show password"}
            >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
        );
    } else if (clearable && hasValue && !disabled && !readOnly) {
        resolvedEndIcon = (
            <button
                type="button"
                className="udt-field-clear-btn"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear field"
                title="Clear"
            >
                <X size={15} />
            </button>
        );
    }

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
            startIcon={resolvedStartIcon}
            endIcon={resolvedEndIcon}
            charCount={showCharCount ? charCount : null}
            maxLength={showCharCount && maxLength ? maxLength : null}
            charCountInHeader={charCountInHeader}
            className={className}
        >
            {(accessibleProps) => (
                <input
                    ref={ref}
                    type={computedType}
                    value={value}
                    defaultValue={defaultValue}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    maxLength={maxLength}
                    autoComplete={autoComplete}
                    className={`udt-field-input ${inputClassName}`.trim()}
                    {...accessibleProps}
                    {...restProps}
                />
            )}
        </FormFieldWrapper>
    );
});

export default TextField;
