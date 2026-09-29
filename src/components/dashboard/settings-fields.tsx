"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/**
 * Field primitives shared by the dashboard surfaces that edit project settings.
 * `Switch` already handles both controlled and uncontrolled usage, so
 * `ToggleRow` works for a plain form (`name` + `defaultChecked`) and for a
 * state-driven panel (`checked` + `onCheckedChange`) without a dual API.
 */

export function Field({
  label,
  hint,
  htmlFor,
  children,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      {label && <Label htmlFor={htmlFor}>{label}</Label>}
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function ToggleRow({
  id,
  name,
  label,
  description,
  checked,
  defaultChecked,
  onCheckedChange,
  disabled,
}: {
  id: string;
  /** Only for plain forms: submits "off" when unchecked so the action can tell. */
  name?: string;
  label: string;
  description?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label htmlFor={id}>{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <div>
        <Switch
          id={id}
          name={name}
          checked={checked}
          defaultChecked={defaultChecked}
          onCheckedChange={onCheckedChange}
          disabled={disabled}
        />
        {name && <input type="hidden" name={name} value="off" disabled={disabled} />}
      </div>
    </div>
  );
}
