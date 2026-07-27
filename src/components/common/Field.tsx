import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

interface BaseProps {
  label: string;
  error?: string | null;
  hint?: string;
  id: string;
}

export function TextField({
  label,
  error,
  hint,
  id,
  affix,
  ...rest
}: BaseProps & InputHTMLAttributes<HTMLInputElement> & { affix?: ReactNode }) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {affix ? (
        <div className="input-group">
          <span className="input-affix">{affix}</span>
          <input id={id} className={`input${error ? " input-error" : ""}`} {...rest} />
        </div>
      ) : (
        <input id={id} className={`input${error ? " input-error" : ""}`} {...rest} />
      )}
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function TextAreaField({
  label,
  error,
  hint,
  id,
  ...rest
}: BaseProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <textarea id={id} className={`textarea${error ? " input-error" : ""}`} {...rest} />
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}

export function SelectField({
  label,
  error,
  hint,
  id,
  children,
  ...rest
}: BaseProps & SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <select id={id} className={`input${error ? " input-error" : ""}`} {...rest}>
        {children}
      </select>
      {hint && !error ? <span className="field-hint">{hint}</span> : null}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
