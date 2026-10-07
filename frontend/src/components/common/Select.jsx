import ValidationMessage from './ValidationMessage';

export default function Select({
  label,
  id,
  error,
  options = [],
  placeholder,
  className = '',
  ...props
}) {
  const selectId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={selectId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <select
        id={selectId}
        className={`input-field appearance-none bg-[length:1rem] bg-[right_0.75rem_center] bg-no-repeat pr-10 ${error ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : ''}`}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'/%3E%3C/svg%3E")`,
        }}
        aria-invalid={!!error}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map(({ value, label: optionLabel }) => (
          <option key={value} value={value}>
            {optionLabel}
          </option>
        ))}
      </select>
      <ValidationMessage id={`${selectId}-error`} message={error} />
    </div>
  );
}
