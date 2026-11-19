import { describe, expect, it } from "vitest";
import { classifyVariants } from "./groups.mts";

const variants = ["react", "vue", "svelte"] as const;
function pair(left: string, right: string, equal: boolean) {
  return {
    pair: [left, right] as const,
    equal,
  };
}

describe("variant comparison groups", () => {
  it("reports three identical variants", () => {
    expect(classifyVariants(variants, [
      pair("react", "vue", true),
      pair("react", "svelte", true),
      pair("vue", "svelte", true),
    ]))
      .toEqual({
        status: "identical",
        groups: [
          ["react", "vue", "svelte"],
        ],
        outliers: [],
      });
  });
  it("identifies Vue as the divergent variant", () => {
    expect(classifyVariants(variants, [
      pair("react", "vue", false),
      pair("react", "svelte", true),
      pair("vue", "svelte", false),
    ]))
      .toEqual({
        status: "outlier",
        groups: [
          ["react", "svelte"],
          ["vue"],
        ],
        outliers: ["vue"],
      });
  });
  it("reports all different variants", () => {
    expect(classifyVariants(variants, [
      pair("react", "vue", false),
      pair("react", "svelte", false),
      pair("vue", "svelte", false),
    ]).status).toBe("all-different");
  });
  it("supports three identical variants and a fourth outlier", () => {
    const four = ["react", "vue", "svelte", "other"];
    const pairs = four.flatMap((left, index) => four.slice(index + 1).map(right => pair(left, right, right !== "other")));
    expect(classifyVariants(four, pairs)).toEqual({
      status: "outlier",
      groups: [
        ["react", "vue", "svelte"],
        ["other"],
      ],
      outliers: ["other"],
    });
  });
  it("keeps non-transitive similarities explicit", () => {
    expect(classifyVariants(variants, [
      pair("react", "vue", true),
      pair("react", "svelte", false),
      pair("vue", "svelte", true),
    ]))
      .toEqual({ status: "mixed", groups: [], outliers: [] });
  });
  it("supports multiple groups of matching variants", () => {
    const four = ["a", "b", "c", "d"];
    const pairs = four.flatMap((left, index) => four.slice(index + 1).map(right => pair(left, right, `${left}${right}` === "ab" || `${left}${right}` === "cd")));
    expect(classifyVariants(four, pairs)).toEqual({
      status: "grouped",
      groups: [
        ["a", "b"],
        ["c", "d"],
      ],
      outliers: [],
    });
  });
  it("rejects incomplete or invalid matrices", () => {
    expect(() => classifyVariants(variants, [])).toThrow("Incomplete");
    expect(() => classifyVariants(variants, [
      pair("react", "vue", true),
      pair("vue", "react", true),
    ])).toThrow("duplicate");
    expect(() => classifyVariants(variants, [
      pair("react", "other", true),
    ])).toThrow("Invalid");
    expect(() => classifyVariants(["react", "react"], [])).toThrow("distinct");
  });
});
