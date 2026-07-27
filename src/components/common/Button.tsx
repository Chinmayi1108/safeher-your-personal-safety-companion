import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  block?: boolean;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<Variant, string> = {
  primary: "",
  secondary: "btn-secondary",
  outline: "btn-outline",
  ghost: "btn-ghost",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  size = "md",
  block,
  loading,
  icon,
  children,
  className = "",
  disabled,
  ...rest
}: ButtonProps) {
  const classes = [
    "btn",
    variantClass[variant],
    size === "sm" ? "btn-sm" : size === "lg" ? "btn-lg" : "",
    block ? "btn-block" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} disabled={disabled || loading} {...rest}>
      {loading ? <span className="spinner" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
