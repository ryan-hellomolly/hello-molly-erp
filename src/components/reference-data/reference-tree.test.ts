import { describe, expect, it } from "vitest";
import { buildReferenceTree } from "./reference-tree";

describe("buildReferenceTree", () => {
  it("orders multi-level nodes depth-first with correct depths", () => {
    const rows = [
      { id: "tops", parentId: null },
      { id: "womens", parentId: "tops" },
      { id: "tshirt", parentId: "womens" },
      { id: "round-neck", parentId: "tshirt" },
      { id: "business", parentId: "round-neck" },
      { id: "streetwear", parentId: "round-neck" },
      { id: "v-neck", parentId: "tshirt" },
      { id: "pants", parentId: null },
    ];
    const tree = buildReferenceTree(rows);
    expect(tree.map(({ id, depth }) => ({ id, depth }))).toEqual([
      { id: "tops", depth: 0 },
      { id: "womens", depth: 1 },
      { id: "tshirt", depth: 2 },
      { id: "round-neck", depth: 3 },
      { id: "business", depth: 4 },
      { id: "streetwear", depth: 4 },
      { id: "v-neck", depth: 3 },
      { id: "pants", depth: 0 },
    ]);
  });

  it("preserves multiple roots and empty input", () => {
    expect(buildReferenceTree([])).toEqual([]);
    const rows = [
      { id: "a", parentId: null },
      { id: "b", parentId: null },
    ];
    expect(buildReferenceTree(rows).map(({ id }) => id)).toEqual(["a", "b"]);
  });

  it("still surfaces orphaned rows whose parent is missing from the input", () => {
    const rows = [
      { id: "child", parentId: "missing-parent" },
      { id: "root", parentId: null },
    ];
    const tree = buildReferenceTree(rows);
    expect(tree.map(({ id, depth }) => ({ id, depth }))).toEqual([
      { id: "root", depth: 0 },
      { id: "child", depth: 0 },
    ]);
  });
});
