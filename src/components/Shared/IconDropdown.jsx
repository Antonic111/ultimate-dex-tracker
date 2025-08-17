import { useEffect, useRef, useState } from "react";

export function IconDropdown({ options, value, onChange, placeholder = "Select...", id }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef();

    useEffect(() => {
        function handler(e) {
            if (ref.current && !ref.current.contains(e.target)) setOpen(false);
        }
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    const selected = options.find(option => option.value === value);

    return (
        <div className="icon-dropdown" ref={ref}>
            <button
                type="button"
                className="icon-dropdown-selected"
                id={id}
                tabIndex={0}
                onClick={() => {
                    setOpen(o => !o);
                    setSearch("");
                }}
                onKeyDown={e => {
                    if (e.key === " " || e.key === "Enter") {
                        e.preventDefault();
                        setOpen(o => !o);
                        setSearch("");
                    }
                }}
            >
                {selected?.icon
                    ? <span className="icon-wrapper">{selected.icon}</span>
                    : selected?.image && <img src={selected.image} alt="" />
                }
                <span>
                    <span className={value === "" ? "placeholder" : "selected-value"}>
                        {value === "" ? placeholder : selected?.name}
                    </span>
                </span>
            </button>

            {open && (
                <div className="icon-dropdown-list">
                    <input
                        type="text"
                        className="icon-dropdown-search"
                        placeholder="Type to filter..."
                        autoFocus
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                    {options
                        .filter(option =>
                            option.name.toLowerCase().includes(search.toLowerCase())
                        )
                        .map(option => (
                            <button
                                key={option.value}
                                type="button"
                                className={`icon-dropdown-option${value === option.value ? " selected" : ""}`}
                                onClick={() => {
                                    setOpen(false);
                                    onChange(option.value);
                                }}
                            >
                                {option.icon
                                    ? <span className="icon-wrapper">{option.icon}</span>
                                    : option.image && <img src={option.image} alt="" />
                                }
                                <span>{option.name}</span>
                            </button>
                        ))}
                </div>
            )}
        </div>
    );
}
