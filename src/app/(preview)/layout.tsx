import type { ReactNode } from "react";
import { DemoProvider } from "@/features/demo/demo-provider";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
