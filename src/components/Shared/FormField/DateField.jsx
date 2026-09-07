import React, { forwardRef, useState, useRef, useEffect, useCallback, useId } from "react";
import { createPortal } from "react-dom";
import { Calendar, X, ChevronLeft, ChevronRight } from "lucide-react";
import FormFieldWrapper from "./FormFieldWrapper";

/* ─── Helpers ───────────────────────────────────────────────────────────────── */

const MONTHS = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
];

const CURRENT_YEAR = new Date().getFullYear();

/** Parse "MM-DD-YYYY", "MM/DD/YYYY", or "YYYY-MM-DD" → { y, mo, d } | null */
function parseDate(raw) {
    if (!raw) return null;
    const s = String(raw).trim();

    // MM-DD-YYYY or MM/DD/YYYY
    let m = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/);
    if (m) return { y: +m[3], mo: +m[1], d: +m[2] };

    // YYYY-MM-DD or YYYY/MM/DD
    m = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})$/);
    if (m) return { y: +m[1], mo: +m[2], d: +m[3] };

    return null;
}

/** { y, mo, d } → "MM-DD-YYYY" */
function formatDate(y, mo, d) {
    return `${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}-${y}`;
}

/** Normalize any incoming date value (ISO YYYY-MM-DD, etc.) to standard "MM-DD-YYYY" */
function normalizeDateValue(val) {
    if (!val) return "";
    const p = parseDate(val);
    if (p) return formatDate(p.y, p.mo, p.d);
    return String(val);
}

function daysInMonth(y, mo) {
    return new Date(y, mo, 0).getDate();
}

function buildCalendarGrid(y, mo) {
    const first = new Date(y, mo - 1, 1).getDay();
    const total = daysInMonth(y, mo);
    const cells = [];
    for (let i = 0; i < first; i++) cells.push(null);
    for (let d = 1; d <= total; d++) cells.push(d);
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
}

/* ─── Auto-format helper ────────────────────────────────────────────────────── */

/**
 * Intelligently formats typed or pasted input into "MM-DD-YYYY":
 *  - Month: auto-pads when first digit > 1 (e.g. "3" → "03-"), clamped 1–12
 *  - Day:   auto-pads when first digit > 3 (e.g. "4" → "04-"), clamped 1–daysInMonth
 *  - Year:  clamped 1900–CURRENT_YEAR once 4 digits are completed
 *  - Respects Backspace (isDelete flag) so editing/deleting doesn't get trapped
 *  - Supports typing with separators ("-" or "/") or pure digits
 */
function autoFormatDate(raw, isDelete = false) {
    if (!raw) return "";
    if (isDelete) return raw;

    // Normalize multiple dashes/slashes
    const sanitized = raw.replace(/[/]+/g, "-").replace(/-+/g, "-");

    if (sanitized.includes("-")) {
        const parts = sanitized.split("-");
        let m = parts[0].replace(/\D/g, "");
        let d = parts[1] !== undefined ? parts[1].replace(/\D/g, "") : "";
        let y = parts.slice(2).join("").replace(/\D/g, "");

        // If d had more than 2 digits (e.g. user typed directly after day without a separator: '08-242')
        if (d.length > 2 && !y) {
            y = d.slice(2);
            d = d.slice(0, 2);
        }

        // Auto-pad single-digit month if separator typed or value > 1
        if (m.length === 1 && (parts.length > 1 || parseInt(m, 10) > 1)) {
            m = "0" + m;
        } else if (m.length >= 2) {
            let mv = parseInt(m.slice(0, 2), 10);
            if (mv < 1) mv = 1;
            if (mv > 12) mv = 12;
            m = String(mv).padStart(2, "0");
        }

        if (parts.length === 1) {
            return m.length === 2 ? m + "-" : m;
        }

        // Auto-pad single-digit day if separator typed or value > 3
        if (d.length === 1 && (parts.length > 2 || parseInt(d, 10) > 3)) {
            d = "0" + d;
        } else if (d.length >= 2) {
            let dv = parseInt(d.slice(0, 2), 10);
            if (dv < 1) dv = 1;
            if (dv > 31) dv = 31;
            d = String(dv).padStart(2, "0");
        }

        if (parts.length === 2 && !y) {
            return d.length === 2 ? m + "-" + d + "-" : (d ? m + "-" + d : m + "-");
        }

        y = y.slice(0, 4);
        if (y.length === 4) {
            let yv = parseInt(y, 10);
            if (yv < 1900) yv = 1900;
            if (yv > CURRENT_YEAR) yv = CURRENT_YEAR;
            y = String(yv);
        }

        return m + "-" + d + "-" + y;
    }

    // Pure continuous digits
    let digits = sanitized.replace(/\D/g, "").slice(0, 8);
    if (!digits) return "";

    let m = digits.slice(0, 2);
    if (digits.length === 1 && parseInt(digits[0], 10) > 1) {
        return "0" + digits[0] + "-";
    }
    if (digits.length >= 2) {
        let mv = parseInt(m, 10);
        if (mv < 1) mv = 1;
        if (mv > 12) mv = 12;
        m = String(mv).padStart(2, "0");
    }
    if (digits.length <= 2) {
        return digits.length === 2 ? m + "-" : m;
    }

    let rest = digits.slice(2);
    let d = rest.slice(0, 2);
    if (rest.length === 1 && parseInt(rest[0], 10) > 3) {
        return m + "-0" + rest[0] + "-";
    }
    if (rest.length >= 2) {
        let dv = parseInt(d, 10);
        if (dv < 1) dv = 1;
        if (dv > 31) dv = 31;
        d = String(dv).padStart(2, "0");
    }
    if (rest.length <= 2) {
        return rest.length === 2 ? m + "-" + d + "-" : m + "-" + d;
    }

    let y = rest.slice(2, 6);
    if (y.length === 4) {
        let yv = parseInt(y, 10);
        if (yv < 1900) yv = 1900;
        if (yv > CURRENT_YEAR) yv = CURRENT_YEAR;
        y = String(yv);
    }
    return m + "-" + d + "-" + y;
}

/* ─── Calendar Popover (portaled to document.body) ──────────────────────────── */

function CalendarPopover({ value, onSelect, onClose, anchorEl }) {
    const parsed = parseDate(value);
    const today = new Date();

    const [view, setView] = useState(() => ({
        y: parsed?.y || today.getFullYear(),
        mo: parsed?.mo || today.getMonth() + 1,
    }));
    const [mode, setMode] = useState("days");
    const [yearPage, setYearPage] = useState(() =>
        Math.floor((parsed?.y || today.getFullYear()) / 12) * 12
    );
    const [pos, setPos] = useState({ top: 0, left: 0, width: 0 });
    const popRef = useRef(null);

    // Calculate position below the anchor element using viewport coords (fixed positioning)
    // and clamp inside viewport so it doesn't clip offscreen in sidebars or modals
    const updatePosition = useCallback(() => {
        if (!anchorEl) return;
        const rect = anchorEl.getBoundingClientRect();
        const popWidth = 280;
        const popHeight = 350;

        let left = rect.left;
        if (left + popWidth > window.innerWidth - 12) {
            left = Math.max(12, window.innerWidth - popWidth - 12);
        }

        let top = rect.bottom + 6;
        if (top + popHeight > window.innerHeight - 12) {
            const topAbove = rect.top - popHeight - 6;
            if (topAbove >= 12) {
                top = topAbove;
            }
        }

        setPos({ top, left, width: rect.width });
    }, [anchorEl]);

    useEffect(() => {
        updatePosition();
    }, [updatePosition]);

    // Reposition on scroll/resize
    useEffect(() => {
        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);
        return () => {
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [updatePosition]);

    // Close on outside click
    useEffect(() => {
        function handler(e) {
            if (
                popRef.current && !popRef.current.contains(e.target) &&
                anchorEl && !anchorEl.contains(e.target)
            ) {
                onClose();
            }
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, [onClose, anchorEl]);

    // Close on Escape
    useEffect(() => {
        function handler(e) {
            if (e.key === "Escape") onClose();
        }
        document.addEventListener("keydown", handler);
        return () => document.removeEventListener("keydown", handler);
    }, [onClose]);

    const selectDay = (d) => {
        onSelect(formatDate(view.y, view.mo, d));
        onClose();
    };

    const handleSelectToday = () => {
        const now = new Date();
        const todayStr = formatDate(now.getFullYear(), now.getMonth() + 1, now.getDate());
        onSelect(todayStr);
        onClose();
    };

    const prevMonth = () => setView(v => v.mo === 1 ? { y: v.y - 1, mo: 12 } : { ...v, mo: v.mo - 1 });
    const nextMonth = () => setView(v => v.mo === 12 ? { y: v.y + 1, mo: 1 } : { ...v, mo: v.mo + 1 });

    const cells = buildCalendarGrid(view.y, view.mo);
    const sel = parseDate(value);

    return createPortal(
        <div
            ref={popRef}
            role="dialog"
            aria-modal="true"
            aria-label="Date picker calendar"
            className="udt-datepicker-pop"
            style={{ top: pos.top, left: pos.left }}
        >
            {/* Header */}
            <div className="udt-datepicker-header">
                <button
                    type="button"
                    className="udt-datepicker-nav"
                    onClick={mode === "days" ? prevMonth : () => setYearPage(p => p - 12)}
                    aria-label={mode === "days" ? "Previous month" : "Previous years"}
                >
                    <ChevronLeft size={16} />
                </button>

                <div className="udt-datepicker-title">
                    <button
                        type="button"
                        className="udt-datepicker-title-btn"
                        onClick={() => setMode(m => m === "months" ? "days" : "months")}
                    >
                        {MONTHS[view.mo - 1]}
                    </button>
                    <button
                        type="button"
                        className="udt-datepicker-title-btn"
                        onClick={() => setMode(m => m === "years" ? "days" : "years")}
                    >
                        {view.y}
                    </button>
                </div>

                <button
                    type="button"
                    className="udt-datepicker-nav"
                    onClick={mode === "days" ? nextMonth : () => setYearPage(p => p + 12)}
                    aria-label={mode === "days" ? "Next month" : "Next years"}
                >
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Day grid */}
            {mode === "days" && (
                <div className="udt-datepicker-grid">
                    {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map(d => (
                        <div key={d} className="udt-datepicker-weekday">{d}</div>
                    ))}
                    {cells.map((d, i) => {
                        if (!d) return <div key={`e-${i}`} />;
                        const isSelected = sel && sel.y === view.y && sel.mo === view.mo && sel.d === d;
                        const isToday = today.getFullYear() === view.y && today.getMonth() + 1 === view.mo && today.getDate() === d;
                        return (
                            <button
                                key={d}
                                type="button"
                                className={`udt-datepicker-day${isSelected ? " selected" : ""}${isToday && !isSelected ? " today" : ""}`}
                                onClick={() => selectDay(d)}
                                aria-label={`${MONTHS[view.mo - 1]} ${d}, ${view.y}`}
                                aria-pressed={isSelected}
                            >
                                {d}
                            </button>
                        );
                    })}
                </div>
            )}

            {/* Month picker */}
            {mode === "months" && (
                <div className="udt-datepicker-month-grid">
                    {MONTHS.map((name, idx) => (
                        <button
                            key={name}
                            type="button"
                            className={`udt-datepicker-month-btn${view.mo === idx + 1 ? " selected" : ""}`}
                            onClick={() => { setView(v => ({ ...v, mo: idx + 1 })); setMode("days"); }}
                        >
                            {name.slice(0, 3)}
                        </button>
                    ))}
                </div>
            )}

            {/* Year picker */}
            {mode === "years" && (
                <div className="udt-datepicker-year-grid">
                    {Array.from({ length: 12 }, (_, i) => yearPage + i).map(yr => (
                        <button
                            key={yr}
                            type="button"
                            className={`udt-datepicker-year-btn${view.y === yr ? " selected" : ""}`}
                            onClick={() => { setView(v => ({ ...v, y: yr })); setMode("days"); }}
                        >
                            {yr}
                        </button>
                    ))}
                </div>
            )}

            {/* Today Button */}
            <div className="udt-datepicker-footer">
                <button
                    type="button"
                    className="udt-datepicker-today-btn"
                    onClick={handleSelectToday}
                >
                    Today
                </button>
            </div>
        </div>,
        document.body
    );
}

/* ─── DateField ────────────────────────────────────────────────────────────── */

/**
 * DateField
 *
 * Universal date input built on FormFieldWrapper (identical structure to TextField).
 * - Local displayValue state allows free typing (MM-DD-YYYY) without being wiped
 *   by parent re-renders.
 * - Auto-formats dates, clamps ranges (month 1-12, days in month, year 1900-current).
 * - Delimiters ("-" or "/") can be typed directly or auto-inserted.
 * - Calendar popover is portaled to document.body (escapes all overflow containers).
 * - Calendar features Day, Month, Year navigation and a dedicated "Today" button.
 * - Opens only when clicking the calendar icon button.
 */
const DateField = forwardRef(function DateField(
    {
        id,
        name,
        label,
        subLabel,
        value,
        defaultValue,
        onChange,
        onClear,
        placeholder = "MM-DD-YYYY",
        required = false,
        optional = false,
        disabled = false,
        readOnly = false,
        error,
        helperText,
        size = "md",
        fullWidth = false,
        startIcon = null,
        clearable = true,
        className = "",
        inputClassName = "",
        onFocus,
        onBlur,
        ...restProps
    },
    ref
) {
    const [isFocused, setIsFocused] = useState(false);
    const [open, setOpen] = useState(false);

    // Local display state — normalized to MM-DD-YYYY
    const [displayValue, setDisplayValue] = useState(() => normalizeDateValue(value !== undefined ? value : (defaultValue || "")));
    const suppressSyncRef = useRef(false);

    const fieldWrapRef = useRef(null);

    // Sync from parent `value` only when changed externally
    useEffect(() => {
        if (!suppressSyncRef.current) {
            setDisplayValue(normalizeDateValue(value !== undefined ? value : ""));
        }
        suppressSyncRef.current = false;
    }, [value]);

    const emitChange = useCallback((val) => {
        onChange?.({ target: { name, value: val, id } });
    }, [onChange, name, id]);

    const handleFocus = (e) => {
        setIsFocused(true);
        onFocus?.(e);
    };

    const handleBlur = (e) => {
        setIsFocused(false);
        onBlur?.(e);
    };

    const handleInputChange = (e) => {
        const isDelete = e.nativeEvent?.inputType?.startsWith("delete");
        const formatted = autoFormatDate(e.target.value, isDelete);
        suppressSyncRef.current = true;
        setDisplayValue(formatted);
        emitChange(formatted);
    };

    const handleClear = (e) => {
        e.stopPropagation();
        suppressSyncRef.current = false;
        setDisplayValue("");
        if (onClear) {
            onClear();
        } else {
            emitChange("");
        }
    };

    const handleCalendarSelect = (dateStr) => {
        suppressSyncRef.current = true;
        setDisplayValue(dateStr);
        emitChange(dateStr);
    };

    const hasValue = displayValue !== "" && displayValue !== null && displayValue !== undefined;

    const endIcon = (
        <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            {clearable && hasValue && !disabled && !readOnly && (
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
            )}
            <button
                type="button"
                className="udt-field-icon-btn"
                onClick={(e) => {
                    e.stopPropagation();
                    if (!disabled && !readOnly) setOpen(o => !o);
                }}
                tabIndex={-1}
                aria-label="Open calendar"
                title="Choose date"
                aria-expanded={open}
                aria-haspopup="dialog"
                disabled={disabled}
            >
                <Calendar size={15} />
            </button>
        </div>
    );

    return (
        <>
            <div ref={fieldWrapRef} style={{ width: fullWidth ? "100%" : "auto", display: fullWidth ? "flex" : "inline-flex", flexDirection: "column" }}>
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
                    isFocused={isFocused || open}
                    hasValue={hasValue}
                    startIcon={startIcon}
                    endIcon={endIcon}
                    className={className}
                >
                    {(accessibleProps) => (
                        <input
                            ref={ref}
                            type="text"
                            inputMode="numeric"
                            value={displayValue}
                            onChange={handleInputChange}
                            onFocus={handleFocus}
                            onBlur={handleBlur}
                            placeholder={placeholder}
                            className={`udt-field-input ${inputClassName}`.trim()}
                            autoComplete="off"
                            {...accessibleProps}
                            {...restProps}
                            name={name}
                            id={id}
                        />
                    )}
                </FormFieldWrapper>
            </div>

            {open && (
                <CalendarPopover
                    value={displayValue}
                    onSelect={handleCalendarSelect}
                    onClose={() => setOpen(false)}
                    anchorEl={fieldWrapRef.current}
                />
            )}
        </>
    );
});

export default DateField;
