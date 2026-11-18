import { DemoProvider } from "@/features/demo/demo-provider";
import type { ReactNode } from "react";

export default function PreviewLayout({ children }: { children: ReactNode }) {
  return <DemoProvider>{children}</DemoProvider>;
}
