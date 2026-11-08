import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

type Base = { label: string; name: string; hint?: ReactNode; className?: string };

export function Field({ label, name, hint, className, ...props }: Base & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={props.id ?? name}>{label}</label>
      <input id={props.id ?? name} name={name} className="input" {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function TextArea({ label, name, hint, className, ...props }: Base & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className={className}>
      <label className="label" htmlFor={props.id ?? name}>{label}</label>
      <textarea id={props.id ?? name} name={name} className="input" rows={3} {...props} />
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Select({
  label,
  name,
  hint,
  className,
  options,
  ...props
}: Base & SelectHTMLAttributes<HTMLSelectElement> & { options: Record<string, string> | [string, string][] }) {
  const entries = Array.isArray(options) ? options : Object.entries(options);
  return (
    <div className={className}>
      <label className="label" htmlFor={props.id ?? name}>{label}</label>
      <select id={props.id ?? name} name={name} className="input" {...props}>
        {entries.map(([value, text]) => (
          <option key={value} value={value}>{text}</option>
        ))}
      </select>
      {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
    </div>
  );
}
