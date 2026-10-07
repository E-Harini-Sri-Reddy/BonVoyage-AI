import { INTERESTS } from '../../constants/interests';
import Badge from '../common/Badge';
import ValidationMessage from '../common/ValidationMessage';

export default function InterestPicker({ selected = [], onToggle, error }) {
  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Interests</p>
        <p className="text-xs text-slate-400 mt-0.5">Select all that apply — we&apos;ll personalize your plan</p>
      </div>
      <div className="flex flex-wrap gap-2" role="group" aria-label="Trip interests">
        {INTERESTS.map(({ value, label, icon }) => (
          <Badge key={value} active={selected.includes(value)} onClick={() => onToggle(value)}>
            <span aria-hidden="true">{icon}</span>
            {label}
          </Badge>
        ))}
      </div>
      <ValidationMessage message={error} />
    </div>
  );
}
