import { cn } from "@/lib/utils";

const baseClass =
  "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 text-sm transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22currentColor%22 stroke-width=%221.5%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:14px] bg-[right_0.5rem_center] bg-no-repeat pr-7";

function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select className={cn(baseClass, className)} {...props}>
      {children}
    </select>
  );
}

// ponytail: iOS Safari keeps native arrow on <select> (appearance: none
// breaks there). The data-URL chevron above is the cosmetic fallback for
// desktop and Android.

export { Select };
