import type { Category } from "@/lib/types";

export default function CategoryPill({ category }: { category: Category | undefined }) {
  if (!category) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium"
      style={{ borderColor: category.color + "55", color: category.color }}
    >
      <span
        className="h-1.5 w-1.5 rounded-full"
        style={{ backgroundColor: category.color }}
      />
      {category.name}
    </span>
  );
}
