import type { ReactNode } from "react";

export function Badge({
  children,
  tone = "green",
}: {
  children: ReactNode;
  tone?: "green" | "amber" | "neutral" | "red";
}) {
  return (
    <span className={`badge badge-${tone}`}>
      <span className="status-dot" />
      {children}
    </span>
  );
}
