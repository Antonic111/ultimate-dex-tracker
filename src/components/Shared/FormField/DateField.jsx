import React, { forwardRef, useRef, useImperativeHandle, useState } from "react";
import { Calendar, X } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * DateField
 *
 * Universal date input with Calendar start-icon on the left (clickable to open picker),
 * clean native segment typing (mm/dd/yyyy), and right-aligned clear (X) button.
 */
const DateField = forwardRef(function DateField(
    {
        id,
        label,
        subLabel,
        value,
        defaultValue,
        onChange,
        onClear,
        min,
        max,
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon,
        endIcon,
        clearable = true,
        alignWithActionFields = true,
        className = "",
        inputClassName = "",
        onFocus,
        onBlur,
        ...restProps
    },
    ref
) {
    const [isFocused, setIsFocused] = useState(false);
    const internalInputRef = useRef(null);

    useImperativeHandle(ref, () => internalInputRef.current);

    const currentVal = value !== undefined ? value : defaultValue || "";
    const hasValue = currentVal !== "" && currentVal !== null && currentVal !== undefined;

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
            onChange({ target: { value: "", name: restProps.name } });
        }
    };

    const handleOpenCalendar = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (disabled || readOnly) return;
        try {
            internalInputRef.current?.showPicker?.();
        } catch {
            internalInputRef.current?.focus();
        }
    };

    // Calendar icon on the left (startIcon)
    const resolvedStartIcon = startIcon !== undefined ? startIcon : (
        <button
            type="button"
            className="udt-field-icon-btn cursor-pointer"
            onClick={handleOpenCalendar}
            tabIndex={-1}
            aria-label="Open calendar"
            title="Select date"
            disabled={disabled || readOnly}
        >
            <Calendar size={16} />
        </button>
    );

    // Clear button on the right (endIcon)
    let resolvedEndIcon = endIcon;
    if (!resolvedEndIcon && clearable && hasValue && !disabled && !readOnly) {
        resolvedEndIcon = (
            <button
                type="button"
                className="udt-field-clear-btn"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear date"
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
            className={className}
        >
            {(accessibleProps) => (
                <input
                    ref={internalInputRef}
                    type="date"
                    value={value || ""}
                    defaultValue={defaultValue}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    min={min}
                    max={max}
                    disabled={disabled}
                    readOnly={readOnly}
                    className={`udt-field-input udt-field-input--date ${!hasValue ? "udt-field-input--date-empty" : ""} ${inputClassName}`.trim()}
                    {...accessibleProps}
                    {...restProps}
                />
            )}
        </FormFieldWrapper>
    );
});

export default DateField;
