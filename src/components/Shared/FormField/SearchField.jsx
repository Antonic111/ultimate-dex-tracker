import React, { forwardRef, useState, useEffect, useRef } from "react";
import { Search, X, Loader2 } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * SearchField
 * 
 * Specialized search input with search icon, instant clear button (with red hover),
 * loading spinner support, escape key to clear, and optional debouncing.
 */
const SearchField = forwardRef(function SearchField(
    {
        id,
        label,
        subLabel,
        value,
        defaultValue,
        onChange,
        onSearch,
        onClear,
        placeholder = "Search...",
        disabled = false,
        readOnly = false,
        loading = false,
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon = <Search size={16} />,
        endIcon = null,
        clearable = true,
        debounceMs = 0,
        className = "",
        inputClassName = "",
        onKeyDown,
        onFocus,
        onBlur,
        ...restProps
    },
    ref
) {
    const [isFocused, setIsFocused] = useState(false);
    const [internalValue, setInternalValue] = useState(value !== undefined ? value : defaultValue || "");
    const debounceTimerRef = useRef(null);

    // Keep internal state aligned if controlled
    useEffect(() => {
        if (value !== undefined) {
            setInternalValue(value);
        }
    }, [value]);

    const hasValue = internalValue !== "" && internalValue !== null && internalValue !== undefined;

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleChange = (e) => {
        const nextVal = e.target.value;
        setInternalValue(nextVal);

        if (debounceMs > 0) {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                onChange?.(e);
                onSearch?.(nextVal);
            }, debounceMs);
        } else {
            onChange?.(e);
        }
    };

    const handleClear = (e) => {
        e?.stopPropagation?.();
        setInternalValue("");
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        if (onClear) {
            onClear();
        } else if (onChange) {
            onChange({ target: { value: "", name: restProps.name } });
        }
        onSearch?.("");
    };

    const handleKeyDown = (e) => {
        if (e.key === "Escape" && hasValue && clearable) {
            e.preventDefault();
            handleClear(e);
        } else if (e.key === "Enter") {
            onSearch?.(internalValue);
        }
        onKeyDown?.(e);
    };

    // Construct endIcon slot: loading spinner or clear button or custom endIcon
    let resolvedEndIcon = endIcon;

    if (loading) {
        resolvedEndIcon = (
            <div className="udt-field-icon-btn animate-spin opacity-80" aria-label="Loading...">
                <Loader2 size={16} />
            </div>
        );
    } else if (clearable && hasValue && !disabled && !readOnly) {
        resolvedEndIcon = (
            <button
                type="button"
                className="udt-field-clear-btn"
                onClick={handleClear}
                tabIndex={-1}
                aria-label="Clear search"
                title="Clear search"
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
                    type="text"
                    value={value !== undefined ? value : internalValue}
                    defaultValue={value !== undefined ? undefined : defaultValue}
                    onChange={handleChange}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    placeholder={placeholder}
                    className={`udt-field-input ${inputClassName}`.trim()}
                    {...accessibleProps}
                    {...restProps}
                />
            )}
        </FormFieldWrapper>
    );
});

export default SearchField;
