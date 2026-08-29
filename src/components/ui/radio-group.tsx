"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

// Radio group built on native radio inputs styled with the same
// peer-checked: pattern as Checkbox. The filled dot is generated from a
// box-shadow on the input so no extra DOM is required.

export interface RadioOption {
  value: string;
  label: React.ReactNode;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: RadioOption[];
  className?: string;
  orientation?: "horizontal" | "vertical";
}

const radioInputClass =
  "peer size-4 shrink-0 cursor-pointer appearance-none rounded-full border border-input bg-background transition-colors checked:border-primary focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50";

function RadioGroup({
  name,
  value,
  defaultValue,
  onChange,
  options,
  className,
  orientation = "vertical",
}: RadioGroupProps) {
  const isControlled = value !== undefined;
  const [internal, setInternal] = React.useState(defaultValue ?? "");
  const current = isControlled ? value : internal;

  return (
    <div
      className={cn(
        "flex gap-3",
        orientation === "vertical" ? "flex-col" : "flex-row flex-wrap",
        className,
      )}
      role="radiogroup"
    >
      {options.map((opt) => {
        const id = React.useId();
        const checked = current === opt.value;
        return (
          <label
            key={opt.value}
            htmlFor={id}
            className={cn(
              "inline-flex items-center gap-2 text-sm select-none cursor-pointer",
              opt.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <input
              id={id}
              type="radio"
              name={name}
              value={opt.value}
              checked={checked}
              disabled={opt.disabled}
              onChange={(e) => {
                if (!isControlled) setInternal(e.target.value);
                onChange?.(e.target.value);
              }}
              className={radioInputClass}
              style={{
                backgroundImage: checked
                  ? "radial-gradient(circle, var(--primary) 40%, transparent 42%)"
                  : "none",
              }}
            />
            <span>{opt.label}</span>
          </label>
        );
      })}
    </div>
  );
}

export { RadioGroup };
