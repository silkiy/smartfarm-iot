import { describe, expect, it } from "vitest";

/**
 * Task 1 acceptance check: the Vitest runner must execute TypeScript unit
 * tests. Business-logic tests arrive with their own tasks.
 */
describe("test runner", () => {
  it("executes TypeScript test files", () => {
    const add = (a: number, b: number): number => a + b;

    expect(add(2, 3)).toBe(5);
  });
});
