import { cn } from "@medilink/ui";

/**
 * Textarea component styled to match the design system.
 *
 * WHY: Consistent textarea styling across all forms in the application.
 * Matches the Input component styling for visual coherence.
 *
 * vi: "Vùng nhập văn bản" / en: "Text area input"
 */
export function Textarea({
  className,
  ...props
}: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "placeholder:text-muted-foreground border-input w-full min-w-0 rounded-md border bg-transparent px-3 py-2 text-base shadow-xs transition-[color,box-shadow] outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        "focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]",
        "aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive",
        "resize-y",
        className,
      )}
      {...props}
    />
  );
}
