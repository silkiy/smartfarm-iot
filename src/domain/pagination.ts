import { z } from "zod";
const pageSchema = z
  .string()
  .regex(/^[1-9]\d{0,5}$/)
  .transform(Number)
  .pipe(z.number().int().min(1).max(100_000));
export function parsePage(search: URLSearchParams): number {
  const pages = search.getAll("page");
  if (pages.length > 1) return pageSchema.parse("");
  return pageSchema.parse(pages[0] ?? "1");
}
