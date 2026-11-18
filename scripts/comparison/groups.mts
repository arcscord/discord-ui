export type PairResult<T extends string> = { pair: readonly [T, T]; equal: boolean };
export type VariantGroups<T extends string> = {
  status: "identical" | "outlier" | "all-different" | "grouped" | "mixed";
  groups: T[][];
  outliers: T[];
};

/** Classify a complete pairwise matrix without choosing an authoritative renderer. */
export function classifyVariants<T extends string>(variants: readonly T[], pairs: readonly PairResult<T>[]): VariantGroups<T> {
  if (variants.length < 2 || new Set(variants).size !== variants.length)
    throw new Error("Expected at least two distinct variants.");
  const neighbors = new Map(variants.map(variant => [
    variant,
    new Set<T>([variant]),
  ]));
  const seenPairs = new Set<string>();
  for (const { pair: [left, right], equal } of pairs) {
    const leftIndex = variants.indexOf(left);
    const rightIndex = variants.indexOf(right);
    const key = [leftIndex, rightIndex].sort((a, b) => a - b).join(":");
    if (leftIndex < 0 || rightIndex < 0 || left === right || seenPairs.has(key))
      throw new Error("Invalid or duplicate variant pair.");
    seenPairs.add(key);
    if (equal) {
      neighbors.get(left)!.add(right);
      neighbors.get(right)!.add(left);
    }
  }
  if (seenPairs.size !== variants.length * (variants.length - 1) / 2)
    throw new Error("Incomplete pairwise matrix.");

  const groups: T[][] = [];
  const assigned = new Set<T>();
  for (const variant of variants) {
    if (assigned.has(variant))
      continue;
    const related = neighbors.get(variant)!;
    // Pixel thresholds can produce non-transitive similarities. Keep those explicit.
    if ([...related].some(member => neighbors.get(member)!.size !== related.size || [...related].some(other => !neighbors.get(member)!.has(other))))
      return { status: "mixed", groups: [], outliers: [] };
    const group = variants.filter(member => related.has(member));
    groups.push(group);
    group.forEach(member => assigned.add(member));
  }
  groups.sort((left, right) => right.length - left.length);
  if (groups.length === 1)
    return { status: "identical", groups, outliers: [] };
  if (groups.every(group => group.length === 1))
    return { status: "all-different", groups, outliers: [] };
  if (groups.length === 2 && groups[0]!.length === variants.length - 1)
    return { status: "outlier", groups, outliers: groups[1]! };
  return { status: "grouped", groups, outliers: [] };
}
