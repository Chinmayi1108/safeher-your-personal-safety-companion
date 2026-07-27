export type Validator = (value: string) => string | null;

export const required =
  (label: string): Validator =>
  (value) =>
    value.trim().length === 0 ? `${label} is required` : null;

export const email: Validator = (value) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value.trim()) ? null : "Enter a valid email address";

export const password: Validator = (value) =>
  value.length < 8 ? "Password must be at least 8 characters" : null;

export const phone: Validator = (value) =>
  /^[+]?[\d\s()-]{7,18}$/.test(value.trim()) ? null : "Enter a valid phone number";

export const maxLength =
  (limit: number, label: string): Validator =>
  (value) =>
    value.length > limit ? `${label} must be under ${limit} characters` : null;

export function runValidators(value: string, validators: Validator[]): string | null {
  for (const validate of validators) {
    const message = validate(value);
    if (message) return message;
  }
  return null;
}

export type FieldRules<T extends string> = Partial<Record<T, Validator[]>>;

export function validateForm<T extends string>(
  values: Record<T, string>,
  rules: FieldRules<T>,
): Partial<Record<T, string>> {
  const errors: Partial<Record<T, string>> = {};
  (Object.keys(rules) as T[]).forEach((key) => {
    const message = runValidators(values[key] ?? "", rules[key] ?? []);
    if (message) errors[key] = message;
  });
  return errors;
}
