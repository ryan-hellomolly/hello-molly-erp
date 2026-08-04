export function buildReferenceTree<T extends { id: string; parentId: string | null }>(
  rows: T[],
): (T & { depth: number })[] {
  const byParent = new Map<string | null, T[]>();
  for (const row of rows) {
    const siblings = byParent.get(row.parentId) ?? [];
    siblings.push(row);
    byParent.set(row.parentId, siblings);
  }
  const visited = new Set<string>();
  const result: (T & { depth: number })[] = [];
  function walk(parentId: string | null, depth: number) {
    for (const row of byParent.get(parentId) ?? []) {
      visited.add(row.id);
      result.push({ ...row, depth });
      walk(row.id, depth + 1);
    }
  }
  walk(null, 0);
  for (const row of rows) {
    if (!visited.has(row.id)) {
      result.push({ ...row, depth: 0 });
    }
  }
  return result;
}
