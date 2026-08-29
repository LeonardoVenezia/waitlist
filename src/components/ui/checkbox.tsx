"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Custom checkbox. The real <input> is the source of truth for forms
// (so name/value/checked keep working), but it's visually replaced by a
// styled square + check icon. The check icon and filled background are
// driven by peer-checked: utilities on the input.

export interface CheckboxProps
  extends Omit<React.ComponentProps<"input">, "type"> {
  label?: React.ReactNode;
}

const inputClass =
  "peer size-4 shrink-0 cursor-pointer appearance-none rounded border border-input bg-background transition-colors checked:bg-primary checked:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

const checkSvg = (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
    className="pointer-events-none absolute left-0 size-4 text-primary-foreground opacity-0 peer-checked:opacity-100"
    aria-hidden="true"
  >
    <path d="M5 12l5 5 9-11" />
  </svg>
);

function Checkbox({ className, label, id, ...props }: CheckboxProps) {
  const generatedId = React.useId();
  const inputId = id ?? generatedId;
  if (!label) {
    return (
      <span className="relative inline-block">
        <input
          id={inputId}
          type="checkbox"
          className={cn(inputClass, className)}
          {...props}
        />
        {checkSvg}
      </span>
    );
  }
  return (
    <label
      htmlFor={inputId}
      className={cn(
        "relative inline-flex items-center gap-2 text-sm select-none cursor-pointer",
        props.disabled && "opacity-50 cursor-not-allowed",
      )}
    >
      <input
        id={inputId}
        type="checkbox"
        className={cn(inputClass, className)}
        {...props}
      />
      {checkSvg}
      <span>{label}</span>
    </label>
  );
}

export { Checkbox };
