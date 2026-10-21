"use client";

import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function Button({
  children,
  variant = "primary",
  size = "md",
  isLoading = false,
  leftIcon,
  rightIcon,
  className = "",
  disabled,
  ...props
}: ButtonProps) {
  const baseClasses =
    "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-1 focus:ring-[#52664F] disabled:opacity-50 disabled:cursor-not-allowed select-none rounded-[4px]";

  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs gap-1.5",
    md: "px-3.5 py-1.5 text-xs sm:text-sm gap-2",
    lg: "px-5 py-2.5 text-sm gap-2.5",
  }[size];

  const variantClasses = {
    primary:
      "bg-[#52664F] text-white hover:bg-[#41523F] active:bg-[#344232] shadow-sm",
    secondary:
      "bg-[#FAF9F6] text-[#20211F] border border-[#E8E6E0] hover:bg-[#F0EEE7] active:bg-[#E8E6E0]",
    outline:
      "bg-transparent text-[#52664F] border border-[#52664F]/30 hover:border-[#52664F] hover:bg-[#EDF1EC]/60",
    danger:
      "bg-[#FDF2F1] text-[#B9382F] border border-[#F5C7C3] hover:bg-[#F9DFDC]",
    ghost:
      "bg-transparent text-[#777872] hover:text-[#20211F] hover:bg-[#F5F4EF]",
  }[variant];

  return (
    <button
      className={`${baseClasses} ${sizeClasses} ${variantClasses} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <svg
          className="animate-spin h-3.5 w-3.5 text-current"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="3"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      ) : (
        leftIcon
      )}
      <span>{children}</span>
      {!isLoading && rightIcon}
    </button>
  );
}
