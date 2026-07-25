import { cn } from "@/lib/utils"

function Switch({
  className,
  defaultChecked,
  checked: controlledChecked,
  onCheckedChange,
  name,
  ...props
}: Omit<React.ComponentProps<"input">, "type"> & {
  onCheckedChange?: (checked: boolean) => void
}) {
  const isControlled = controlledChecked !== undefined

  return (
    <label className="relative inline-flex shrink-0 cursor-pointer items-center">
      <input
        type="checkbox"
        role="switch"
        name={name}
        defaultChecked={defaultChecked}
        checked={isControlled ? controlledChecked : undefined}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
        className="peer sr-only"
        {...props}
      />
      <span
        className={cn(
          "inline-flex h-[18.4px] w-[32px] shrink-0 items-center rounded-full border border-transparent transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 peer-focus-visible:border-ring peer-focus-visible:ring-3 peer-focus-visible:ring-ring/50 peer-checked:bg-primary peer-disabled:cursor-not-allowed peer-disabled:opacity-50 bg-input dark:bg-input/80",
          className,
        )}
      >
        <span className="pointer-events-none block size-4 rounded-full bg-background shadow-sm ring-0 transition-transform peer-checked:translate-x-[calc(100%-2px)] peer-checked:dark:bg-primary-foreground peer-disabled:dark:bg-foreground" />
      </span>
    </label>
  )
}

export { Switch }
