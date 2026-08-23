import React, { forwardRef, useState } from "react";
import { ChevronUp, ChevronDown, X } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * NumberField
 * 
 * Numeric input field with optional tactile up/down stepper buttons,
 * boundary clamping (min, max, step), and keyboard arrow navigation.
 */
const NumberField = forwardRef(function NumberField(
    {
        id,
        label,
        subLabel,
        value,
        defaultValue,
        onChange,
        min,
        max,
        step = 1,
        precision,
        placeholder,
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        showSteppers = true,
        clearable = false, // consumed here, not passed to DOM
        stepper,           // alias for showSteppers, consumed here
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon = null,
        endIcon = null,
        className = "",
        inputClassName = "",
        onFocus,
        onBlur,
        onKeyDown,
        ...restProps
    },
    ref
) {
    // Allow `stepper` prop as an alias for showSteppers
    const effectiveShowSteppers = stepper !== undefined ? Boolean(stepper) : showSteppers;
    const [isFocused, setIsFocused] = useState(false);

    const currentVal = value !== undefined ? value : defaultValue;
    const numVal = currentVal === "" || currentVal === null || currentVal === undefined ? null : Number(currentVal);
    const hasValue = currentVal !== "" && currentVal !== null && currentVal !== undefined;

    const clamp = (val) => {
        if (val === null || isNaN(val)) return "";
        let clamped = val;
        if (min !== undefined && clamped < min) clamped = min;
        if (max !== undefined && clamped > max) clamped = max;
        if (precision !== undefined) {
            clamped = Number(clamped.toFixed(precision));
        }
        return clamped;
    };

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        if (numVal !== null && (min !== undefined || max !== undefined)) {
            const clamped = clamp(numVal);
            if (clamped !== numVal && onChange) {
                onChange({ target: { value: clamped, name: restProps.name } });
            }
        }
        onBlur?.(e);
    };

    const stepChange = (delta) => {
        if (disabled || readOnly) return;
        const current = numVal !== null ? numVal : (min !== undefined ? min : 0);
        const next = clamp(current + delta);
        if (onChange) {
            onChange({ target: { value: next, name: restProps.name } });
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === "ArrowUp") {
            e.preventDefault();
            const multiplier = e.shiftKey ? 10 : 1;
            stepChange(Number(step) * multiplier);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const multiplier = e.shiftKey ? 10 : 1;
            stepChange(-Number(step) * multiplier);
        }
        onKeyDown?.(e);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (onChange) {
            onChange({ target: { value: "", name: restProps.name } });
        }
    };

    const canIncrement = max === undefined || numVal === null || numVal < max;
    const canDecrement = min === undefined || numVal === null || numVal > min;

    let resolvedEndIcon = endIcon;

    if (!disabled && !readOnly) {
        const stepperButtons = effectiveShowSteppers ? (
            <div className="udt-number-stepper-wrap">
                <button
                    type="button"
                    className="udt-number-stepper-btn"
                    onClick={() => stepChange(Number(step))}
                    disabled={!canIncrement}
                    tabIndex={-1}
                    aria-label="Increment"
                >
                    <ChevronUp size={12} strokeWidth={3} />
                </button>
                <button
                    type="button"
                    className="udt-number-stepper-btn"
                    onClick={() => stepChange(-Number(step))}
                    disabled={!canDecrement}
                    tabIndex={-1}
                    aria-label="Decrement"
                >
                    <ChevronDown size={12} strokeWidth={3} />
                </button>
            </div>
        ) : null;

        const clearButton = clearable && hasValue ? (
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
        ) : null;

        if (clearButton || stepperButtons) {
            resolvedEndIcon = (
                <div className="flex items-center gap-1">
                    {clearButton}
                    {stepperButtons}
                </div>
            );
        }
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
            startIcon={startIcon}
            endIcon={resolvedEndIcon}
            className={className}
        >
            {(accessibleProps) => (
                <input
                    ref={ref}
                    type="number"
                    value={value}
                    defaultValue={defaultValue}
                    onChange={onChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    min={min}
                    max={max}
                    step={step}
                    placeholder={placeholder}
                    className={`udt-field-input ${inputClassName}`.trim()}
                    {...accessibleProps}
                    {...restProps}
                />
            )}
        </FormFieldWrapper>
    );
});

export default NumberField;
