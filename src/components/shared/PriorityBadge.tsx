import { ChevronsUp, ChevronUp, Minus, ChevronDown } from "lucide-react";
import type { Priority } from "@/lib/types";
import { classNames } from "@/lib/utils";

const CONFIG: Record<
  Priority,
  { label: string; icon: typeof ChevronUp; className: string }
> = {
  urgent: { label: "Urgent", icon: ChevronsUp, className: "text-urgent bg-urgent-soft" },
  high: { label: "High", icon: ChevronUp, className: "text-high bg-[#faf1de]" },
  medium: { label: "Medium", icon: Minus, className: "text-ink-soft bg-[#eeece4]" },
  low: { label: "Low", icon: ChevronDown, className: "text-ink-faint bg-[#eeece4]" },
};

export default function PriorityBadge({ priority }: { priority: Priority }) {
  const { label, icon: Icon, className } = CONFIG[priority];
  return (
    <span
      className={classNames(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        className
      )}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}
