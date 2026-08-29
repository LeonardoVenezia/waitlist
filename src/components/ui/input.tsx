import * as React from "react";
import { cn } from "@/lib/utils";

const inputClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40";

export interface InputProps extends React.ComponentProps<"input"> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, type, leftIcon, rightIcon, ...props },
  ref,
) {
  if (!leftIcon && !rightIcon) {
    return (
      <input
        ref={ref}
        type={type}
        className={cn(inputClass, className)}
        {...props}
      />
    );
  }
  return (
    <div className="relative">
      {leftIcon && (
        <span className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-3.5">
          {leftIcon}
        </span>
      )}
      <input
        ref={ref}
        type={type}
        className={cn(
          inputClass,
          leftIcon && "pl-8",
          rightIcon && "pr-8",
          className,
        )}
        {...props}
      />
      {rightIcon && (
        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground [&_svg]:size-3.5">
          {rightIcon}
        </span>
      )}
    </div>
  );
});

export { Input };
