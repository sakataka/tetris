import type React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger";
  size?: "small" | "medium" | "large";
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "medium",
  className = "",
  children,
  ...props
}) => {
  const baseClasses =
    "font-semibold rounded-lg transition-all duration-200 focus:outline-none focus:ring-4";

  const variantClasses = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500/50",
    secondary: "bg-gray-700 hover:bg-gray-600 text-white focus:ring-gray-500/50",
    danger: "bg-red-600 hover:bg-red-700 text-white focus:ring-red-500/50",
  };

  const sizeClasses = {
    small: "px-3 py-1.5 text-sm",
    medium: "px-4 py-2 text-base",
    large: "px-6 py-3 text-lg",
  };

  return (
    <button
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
