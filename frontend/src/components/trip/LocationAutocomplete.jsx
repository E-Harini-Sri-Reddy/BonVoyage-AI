import { useEffect, useRef, useState } from 'react';
import Input from '../common/Input';
import { useLocationAutocomplete } from '../../services/geocodeApi';

export default function LocationAutocomplete({
  label,
  name,
  value,
  onChange,
  onBlur,
  error,
  hint,
  placeholder,
}) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const containerRef = useRef(null);
  const { results, loading, search, clear } = useLocationAutocomplete(inputValue, open);

  useEffect(() => {
    setInputValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClick = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleChange = (e) => {
    const val = e.target.value;
    setInputValue(val);
    onChange(val);
    setOpen(true);
    search(val);
  };

  const handleSelect = (item) => {
    const label = item.label || item.name || item.formatted;
    setInputValue(label);
    onChange(label);
    setOpen(false);
    clear();
  };

  return (
    <div ref={containerRef} className="relative">
      <Input
        label={label}
        name={name}
        placeholder={placeholder}
        value={inputValue}
        onChange={handleChange}
        onBlur={() => {
          setTimeout(() => setOpen(false), 150);
          onBlur?.();
        }}
        onFocus={() => {
          setOpen(true);
          if (inputValue.length >= 2) search(inputValue);
        }}
        error={error}
        hint={hint}
        autoComplete="off"
      />

      {open && (loading || results.length > 0) && (
        <ul
          className="absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-lg"
          role="listbox"
        >
          {loading && (
            <li className="px-4 py-2 text-sm text-slate-400">Searching...</li>
          )}
          {results.map((item) => (
            <li key={item.placeId || item.label}>
              <button
                type="button"
                role="option"
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
              >
                <span className="font-medium text-slate-800 dark:text-slate-200">{item.label}</span>
                {item.subtitle && (
                  <span className="block text-xs text-slate-400 truncate">{item.subtitle}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
