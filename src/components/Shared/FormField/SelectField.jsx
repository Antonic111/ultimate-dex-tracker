import React, { forwardRef, useState, useEffect, useLayoutEffect, useCallback, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Check, Search, X } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/**
 * SelectField
 * 
 * Dedicated universal dropdown component matching the field system design.
 * Features custom dropdown overlay with search filtering, keyboard navigation,
 * icons/images inside options, and full accessibility.
 */
const SelectField = forwardRef(function SelectField(
    {
        id: explicitId,
        label,
        subLabel,
        options = [],
        value,
        defaultValue,
        onChange,
        placeholder = "Select an option...",
        multiple = false,
        closeOnSelect = undefined,
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        searchable = false,
        searchPlaceholder = "Filter options...",
        clearable = false,
        native = false, // When true, renders native <select> styled to match universal system
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon = null,
        className = "",
        triggerClassName = "",
        dropdownClassName = "",
        renderOption,
        renderSelected,
        placement = "bottom", // 'bottom' | 'top'
        onFocus,
        onBlur,
        ...restProps
    },
    ref
) {
    const generatedId = useId();
    const fieldId = explicitId || generatedId;

    const [isOpen, setIsOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [focusedIndex, setFocusedIndex] = useState(-1);
    const [selectedValue, setSelectedValue] = useState(
        value !== undefined ? value : defaultValue !== undefined ? defaultValue : (multiple ? [] : "")
    );

    const containerRef = useRef(null);
    const triggerRef = useRef(null);
    const searchInputRef = useRef(null);
    const optionsListRef = useRef(null);
    const dropdownRef = useRef(null);
    const [dropdownStyle, setDropdownStyle] = useState({});

    // Calculate dropdown position using fixed coords from the trigger's bounding rect
    const updateDropdownPosition = useCallback(() => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const dropdownMaxH = 280;
        const spaceBelow = window.innerHeight - rect.bottom;
        const placeAbove = placement === "top" || (spaceBelow < dropdownMaxH && rect.top > spaceBelow);
        setDropdownStyle({
            position: "fixed",
            left: rect.left,
            width: rect.width,
            zIndex: 99999,
            ...(placeAbove
                ? { bottom: window.innerHeight - rect.top + 6, top: "auto" }
                : { top: rect.bottom + 6, bottom: "auto" }
            ),
        });
    }, [placement]);

    const shouldCloseOnSelect = closeOnSelect !== undefined ? closeOnSelect : !multiple;

    // Keep internal selected value aligned with prop
    useEffect(() => {
        if (value !== undefined) {
            setSelectedValue(value);
        }
    }, [value]);

    // Normalize options to object format
    const normalizedOptions = options.map((opt) => {
        if (typeof opt === "object" && opt !== null) {
            return {
                value: opt.value !== undefined ? opt.value : opt.name || opt.label,
                label: opt.label || opt.name || String(opt.value),
                icon: opt.icon || null,
                image: opt.image || null,
                description: opt.description || null,
                disabled: Boolean(opt.disabled),
                group: opt.group || null,
                isType: opt.isType || false,
            };
        }
        return {
            value: opt,
            label: String(opt),
            icon: null,
            image: null,
            description: null,
            disabled: false,
            group: null,
            isType: false,
        };
    });

    // Check if value is selected
    const isValueSelected = (val) => {
        if (multiple) {
            return Array.isArray(selectedValue) && selectedValue.includes(val);
        }
        return selectedValue === val;
    };

    // Find currently selected option(s)
    const selectedOption = !multiple ? normalizedOptions.find((opt) => opt.value === selectedValue) : null;
    const selectedOptionsList = multiple && Array.isArray(selectedValue)
        ? normalizedOptions.filter((opt) => selectedValue.includes(opt.value))
        : [];

    const hasValue = multiple
        ? Array.isArray(selectedValue) && selectedValue.length > 0
        : selectedOption !== undefined && selectedValue !== "" && selectedValue !== null && selectedValue !== undefined;

    // Filter options when searchable
    const filteredOptions = normalizedOptions.filter((opt) => {
        if (!searchTerm.trim()) return true;
        const q = searchTerm.toLowerCase();
        return (
            opt.label.toLowerCase().includes(q) ||
            (opt.description && opt.description.toLowerCase().includes(q))
        );
    });

    // Calculate position when dropdown opens
    useLayoutEffect(() => {
        if (isOpen) updateDropdownPosition();
    }, [isOpen, updateDropdownPosition]);

    // Keep position current on scroll/resize while open
    useEffect(() => {
        if (!isOpen) return;
        const update = () => updateDropdownPosition();
        window.addEventListener("scroll", update, { passive: true, capture: true });
        window.addEventListener("resize", update, { passive: true });
        return () => {
            window.removeEventListener("scroll", update, { capture: true });
            window.removeEventListener("resize", update);
        };
    }, [isOpen, updateDropdownPosition]);

    // Close on click outside (check both trigger container and portal dropdown)
    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (e) => {
            const inContainer = containerRef.current?.contains(e.target);
            const inDropdown = dropdownRef.current?.contains(e.target);
            if (!inContainer && !inDropdown) {
                setIsOpen(false);
                setSearchTerm("");
                setFocusedIndex(-1);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [isOpen]);

    // Auto-focus search input when opened
    useEffect(() => {
        if (isOpen && searchable && searchInputRef.current) {
            setTimeout(() => searchInputRef.current?.focus(), 50);
        }
    }, [isOpen, searchable]);

    const handleToggle = (e) => {
        if (disabled || readOnly) return;
        if (e?.target?.closest?.('.udt-field-clear-btn')) return;
        setIsOpen((prev) => !prev);
        setSearchTerm("");
        setFocusedIndex(-1);
    };

    const handleSelect = (option) => {
        if (option.disabled) return;

        if (multiple) {
            const currentArr = Array.isArray(selectedValue) ? selectedValue : [];
            const nextArr = currentArr.includes(option.value)
                ? currentArr.filter((v) => v !== option.value)
                : [...currentArr, option.value];

            setSelectedValue(nextArr);
            onChange?.(nextArr);

            if (shouldCloseOnSelect) {
                setIsOpen(false);
                setSearchTerm("");
                setFocusedIndex(-1);
            }
        } else {
            setSelectedValue(option.value);
            setIsOpen(false);
            setSearchTerm("");
            setFocusedIndex(-1);

            if (onChange) {
                // Support both standard custom onChange(value, option) and synthetic event
                onChange(option.value, option);
            }
            triggerRef.current?.focus();
        }
    };

    const handleClear = (e) => {
        e.stopPropagation();
        if (multiple) {
            setSelectedValue([]);
            onChange?.([]);
        } else {
            setSelectedValue("");
            onChange?.("", null);
        }
    };

    const handleKeyDown = (e) => {
        if (disabled || readOnly) return;

        if (!isOpen) {
            if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setIsOpen(true);
            }
            return;
        }

        // Dropdown is OPEN:
        if (e.key === "Escape" || e.key === "Tab") {
            setIsOpen(false);
            setSearchTerm("");
            setFocusedIndex(-1);
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            setFocusedIndex((prev) => {
                const next = prev < filteredOptions.length - 1 ? prev + 1 : 0;
                scrollOptionIntoView(next);
                return next;
            });
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setFocusedIndex((prev) => {
                const next = prev > 0 ? prev - 1 : filteredOptions.length - 1;
                scrollOptionIntoView(next);
                return next;
            });
        } else if (e.key === "Enter") {
            e.preventDefault();
            if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
                handleSelect(filteredOptions[focusedIndex]);
            }
        }
    };

    const scrollOptionIntoView = (index) => {
        if (!optionsListRef.current) return;
        const items = optionsListRef.current.querySelectorAll(".udt-select-option");
        if (items[index]) {
            items[index].scrollIntoView({ block: "nearest" });
        }
    };

    // Native Select Mode
    if (native) {
        return (
            <FormFieldWrapper
                id={fieldId}
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
                hasValue={hasValue}
                startIcon={startIcon}
                endIcon={<ChevronDown size={16} className="udt-select-chevron" />}
                className={className}
            >
                {(accessibleProps) => (
                    <select
                        ref={ref}
                        id={fieldId}
                        value={selectedValue || ""}
                        onChange={(e) => {
                            setSelectedValue(e.target.value);
                            onChange?.(e.target.value);
                        }}
                        disabled={disabled}
                        className={`udt-field-input udt-select-trigger cursor-pointer ${triggerClassName}`.trim()}
                        {...accessibleProps}
                        {...restProps}
                    >
                        {placeholder && <option value="" disabled>{placeholder}</option>}
                        {normalizedOptions.map((opt) => (
                            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                )}
            </FormFieldWrapper>
        );
    }

    // Custom Styled Select Mode
    return (
        <div
            ref={containerRef}
            className={`udt-select-container ${isOpen ? "udt-select-container--open" : ""} ${fullWidth ? "udt-select-container--full-width" : ""} ${className}`.trim()}
        >
            <FormFieldWrapper
                id={fieldId}
                label={label}
                subLabel={subLabel}
                required={required}
                optional={optional}
                error={error}
                helperText={helperText}
                size={size}
                fullWidth={true}
                disabled={disabled}
                readOnly={readOnly}
                isFocused={isOpen}
                hasValue={hasValue}
                startIcon={startIcon}
                controlClassName="udt-select-control-box cursor-pointer"
                endIcon={
                    <div className="flex items-center gap-1">
                        {/* Search clear button when open and typing */}
                        {isOpen && searchTerm && (
                            <button
                                type="button"
                                className="udt-field-clear-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSearchTerm("");
                                    searchInputRef.current?.focus();
                                }}
                                tabIndex={-1}
                                aria-label="Clear search"
                            >
                                <X size={15} />
                            </button>
                        )}
                        {/* Selection clear button when closed */}
                        {!isOpen && clearable && hasValue && !disabled && !readOnly && (
                            <button
                                type="button"
                                className="udt-field-clear-btn"
                                onClick={handleClear}
                                tabIndex={-1}
                                aria-label="Clear selection"
                            >
                                <X size={15} />
                            </button>
                        )}
                        <span className={`udt-select-chevron pointer-events-none ${isOpen ? "rotate-180" : ""}`}>
                            <ChevronDown size={16} />
                        </span>
                    </div>
                }
                onClick={handleToggle}
            >
                {() => (
                    searchable && isOpen ? (
                        <input
                            ref={searchInputRef}
                            type="text"
                            value={searchTerm}
                            onChange={(e) => {
                                setSearchTerm(e.target.value);
                                setFocusedIndex(0);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={
                                hasValue
                                    ? multiple
                                        ? selectedOptionsList.length === 1
                                            ? selectedOptionsList[0].label
                                            : `${selectedOptionsList.length} selected`
                                        : selectedOption.label
                                    : (searchPlaceholder || placeholder)
                            }
                            className={`udt-field-input udt-select-search-inline ${triggerClassName}`.trim()}
                            autoComplete="off"
                            onClick={(e) => e.stopPropagation()}
                        />
                    ) : (
                        <button
                            ref={triggerRef}
                            type="button"
                            id={fieldId}
                            disabled={disabled}
                            onKeyDown={handleKeyDown}
                            aria-haspopup="listbox"
                            aria-expanded={isOpen}
                            aria-labelledby={label ? `${fieldId}-label` : undefined}
                            className={`udt-select-trigger ${triggerClassName}`.trim()}
                            {...restProps}
                        >
                            <span className="udt-select-value-wrap">
                                {hasValue ? (
                                    renderSelected ? (
                                        renderSelected(multiple ? selectedOptionsList : selectedOption)
                                    ) : multiple ? (
                                        selectedOptionsList.length === 1 ? (
                                            <>
                                                {selectedOptionsList[0].icon && !startIcon && (
                                                    <span className="udt-select-value-icon">
                                                        {selectedOptionsList[0].icon}
                                                    </span>
                                                )}
                                                {selectedOptionsList[0].image && !startIcon && (
                                                    <img
                                                        src={selectedOptionsList[0].image}
                                                        alt=""
                                                        className={`udt-select-option-img ${selectedOptionsList[0].isType ? "udt-select-option-img--type" : ""}`}
                                                    />
                                                )}
                                                <span className="udt-select-value-text">
                                                    {selectedOptionsList[0].label}
                                                </span>
                                            </>
                                        ) : (
                                            <span className="udt-select-value-text">
                                                {selectedOptionsList.length} selected
                                            </span>
                                        )
                                    ) : (
                                        <>
                                            {selectedOption?.icon && !startIcon && (
                                                <span className="udt-select-value-icon">{selectedOption.icon}</span>
                                            )}
                                            {selectedOption?.image && !startIcon && (
                                                <img
                                                    src={selectedOption.image}
                                                    alt=""
                                                    className={`udt-select-option-img ${selectedOption.isType ? "udt-select-option-img--type" : ""}`}
                                                />
                                            )}
                                            <span className="udt-select-value-text">{selectedOption?.label}</span>
                                        </>
                                    )
                                ) : (
                                    <span className="udt-select-placeholder">{placeholder}</span>
                                )}
                            </span>
                        </button>
                    )
                )}
            </FormFieldWrapper>

            {/* Custom Dropdown Popup Menu — rendered in document.body via portal to escape overflow clipping */}
            {createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <motion.div
                            ref={dropdownRef}
                            className={`udt-select-dropdown ${dropdownClassName}`.trim()}
                            style={dropdownStyle}
                            role="listbox"
                            aria-label={label || "Options"}
                            initial={{ opacity: 0, scale: 0.96, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.96, y: -4 }}
                            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] }}
                        >
                            {/* Options List */}
                            <div ref={optionsListRef} className="udt-select-options-list">
                                {filteredOptions.length === 0 ? (
                                    <div className="udt-select-empty">No matching options found</div>
                                ) : (
                                    filteredOptions.map((option, index) => {
                                        const isSelected = isValueSelected(option.value);
                                        const isKeyboardFocused = index === focusedIndex;

                                        return (
                                            <button
                                                key={option.value || index}
                                                type="button"
                                                role="option"
                                                aria-selected={isSelected}
                                                disabled={option.disabled}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSelect(option);
                                                }}
                                                className={`udt-select-option ${
                                                    isSelected ? "udt-select-option--selected" : ""
                                                } ${isKeyboardFocused ? "udt-select-option--focused" : ""} ${
                                                    option.disabled ? "udt-select-option--disabled" : ""
                                                }`.trim()}
                                            >
                                                {renderOption ? (
                                                    renderOption(option, { isSelected, isKeyboardFocused })
                                                ) : (
                                                    <>
                                                        <div className="udt-select-option-content">
                                                            {multiple && (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={isSelected}
                                                                    onChange={() => {}}
                                                                    tabIndex={-1}
                                                                    className="udt-select-checkbox mr-2.5"
                                                                    style={{ accentColor: "var(--accent)" }}
                                                                />
                                                            )}
                                                            {option.icon && (
                                                                <span className="udt-select-option-icon">
                                                                    {option.icon}
                                                                </span>
                                                            )}
                                                            {option.image && (
                                                                <img
                                                                    src={option.image}
                                                                    alt=""
                                                                    className={`udt-select-option-img ${option.isType ? "udt-select-option-img--type" : ""}`}
                                                                />
                                                            )}
                                                            <div className="udt-select-option-text-group">
                                                                <span className="udt-select-option-label">
                                                                    {option.label}
                                                                </span>
                                                                {option.description && (
                                                                    <span className="udt-select-option-desc">
                                                                        {option.description}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>

                                                        {!multiple && isSelected && (
                                                            <span className="udt-select-option-check">
                                                                <Check size={15} strokeWidth={2.5} />
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </button>
                                        );
                                    })
                                )}
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </div>
    );
});

export default SelectField;
