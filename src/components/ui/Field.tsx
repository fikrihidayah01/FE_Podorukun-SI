import { cloneElement, isValidElement, useId, type ReactElement, type ReactNode } from 'react';

interface FieldProps {
  label: ReactNode;
  required?: boolean;
  optional?: boolean;
  error?: string;
  hint?: ReactNode;
  className?: string;
  /** Satu elemen kontrol (input/select/textarea). id, aria-invalid, dan aria-describedby dipasang otomatis. */
  children: ReactElement<Record<string, unknown>>;
}

/** Label di atas kontrol, bantuan dan pesan galat di bawahnya. */
export default function Field({ label, required, optional, error, hint, className = '', children }: FieldProps) {
  const autoId = useId();
  const childProps = isValidElement(children) ? children.props : {};
  const id = (childProps.id as string | undefined) ?? autoId;
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={className}>
      <label htmlFor={id} className="field-label">
        {label}
        {required && (
          <span className="ml-0.5 text-danger" aria-hidden>
            *
          </span>
        )}
        {optional && <span className="ml-1 font-normal text-ink-3">(opsional)</span>}
      </label>
      {cloneElement(children, {
        id,
        'aria-invalid': error ? true : undefined,
        'aria-describedby': describedBy,
        'aria-required': required || undefined,
      })}
      {hint && !error && (
        <p id={hintId} className="mt-1.5 text-xs text-ink-3">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="mt-1.5 text-xs font-medium text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
