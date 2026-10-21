import {
  forwardRef,
  useId,
  type FocusEventHandler,
  type KeyboardEventHandler,
} from "react";
import "./controls.css";

type SearchFieldProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  ariaLabel?: string;
  className?: string;
  inputClassName?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
  onFocus?: FocusEventHandler<HTMLInputElement>;
  id?: string;
  autoComplete?: string;
  spellCheck?: boolean;
  autoFocus?: boolean;
  disabled?: boolean;
  clearLabel?: string;
};

const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(
  (
    {
      value,
      onValueChange,
      placeholder,
      ariaLabel,
      className = "",
      inputClassName = "",
      onKeyDown,
      onFocus,
      id,
      autoComplete = "off",
      spellCheck = false,
      autoFocus,
      disabled,
      clearLabel = "Clear search",
    },
    ref
  ) => {
    const generatedId = useId();

    return (
      <div className={`ks-search ${className}`.trim()}>
        <span className="ks-search-icon" aria-hidden>
          <svg viewBox="0 0 24 24">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16 L20 20" />
          </svg>
        </span>
        <input
          ref={ref}
          id={id ?? generatedId}
          type="text"
          className={`ks-search-input ${inputClassName}`.trim()}
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          aria-label={ariaLabel ?? placeholder}
          onKeyDown={onKeyDown}
          onFocus={onFocus}
          autoComplete={autoComplete}
          spellCheck={spellCheck}
          autoFocus={autoFocus}
          disabled={disabled}
        />
        {value.length > 0 && (
          <button
            type="button"
            className="ks-search-clear"
            aria-label={clearLabel}
            onClick={(event) => {
              onValueChange("");
              event.currentTarget.parentElement?.querySelector("input")?.focus();
            }}
          >
            <svg viewBox="0 0 24 24" aria-hidden>
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>
    );
  }
);

SearchField.displayName = "SearchField";

export default SearchField;
