export default function ValidationMessage({ message, id }) {
  if (!message) return null;

  return (
    <p id={id} className="flex items-center gap-1 text-sm text-red-500 dark:text-red-400" role="alert">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
}
