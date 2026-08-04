import { describe, expect, it } from "vitest";
import { filterNavigation, labelFor, navigation } from "./navigation";
describe("ERP navigation", () => {
  it("contains the fifteen evidenced top-level modules", () => expect(navigation).toHaveLength(15));
  it("returns bilingual labels", () => {
    expect(labelFor(navigation[1], "zh-CN")).toBe("基础资料");
    expect(labelFor(navigation[1], "en-AU")).toBe("Master Data");
  });
  it("shows all modules to administrators and filters other roles", () => {
    expect(filterNavigation(navigation, ["SYSTEM_ADMIN"])).toHaveLength(15);
    expect(filterNavigation(navigation, ["planning.read"]).map((x) => x.id)).toEqual(["planning"]);
  });
});
