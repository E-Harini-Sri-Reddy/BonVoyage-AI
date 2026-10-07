import ValidationMessage from './ValidationMessage';

export default function Input({
  label,
  id,
  error,
  hint,
  className = '',
  ...props
}) {
  const inputId = id || props.name;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
          {label}
        </label>
      )}
      <input id={inputId} className={`input-field ${error ? 'border-red-400 focus:ring-red-400/40 focus:border-red-400' : ''}`} aria-invalid={!!error} aria-describedby={error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined} {...props} />
      {hint && !error && (
        <p id={`${inputId}-hint`} className="text-xs text-slate-400">
          {hint}
        </p>
      )}
      <ValidationMessage id={`${inputId}-error`} message={error} />
    </div>
  );
}
