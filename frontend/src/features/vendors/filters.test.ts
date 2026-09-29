// The directory's filters and order, without a browser. What is pinned here is
// what a buyer relies on: a vendor shown matches EVERYTHING chosen, a vendor
// nobody has rated is never passed off as rated, and a filtered view survives
// being copied into an address bar.

import { describe, expect, it } from "vitest";
import {
  applyFilters, chipsOf, cleared, countLine, isFiltered, matches, NO_FILTERS, readFilters,
  sortVendors, writeFilters, type VendorFilters,
} from "./filters";
import { ALL, HELIX, NORTHSTAR, vendor } from "./fixtures";

const f = (over: Partial<VendorFilters>): VendorFilters => ({ ...NO_FILTERS, ...over });
const names = (list: { name: string }[]) => list.map((v) => v.name.split(" ")[0]);

describe("matching", () => {
  it("shows everyone when nothing is chosen", () => {
    expect(applyFilters(ALL, NO_FILTERS)).toHaveLength(3);
  });

  it.each([
    ["data_types", ["video"], ["NorthStar"]],
    ["data_types", ["image"], ["NorthStar", "Helix"]],
    ["domains", ["telecom"], ["Meridian"]],
    ["regions", ["IN"], ["NorthStar"]],
    ["languages", ["eng"], ["NorthStar", "Meridian"]],
    ["certifications", ["soc_2"], ["NorthStar"]],
  ] as const)("narrows by %s %j", (list, values, expected) => {
    expect(names(applyFilters(ALL, f({ [list]: [...values] })))).toEqual(expected);
  });

  it("needs a vendor to cover everything chosen in a list, not any of it", () => {
    // Meridian does audio and text; nobody does audio and video
    expect(names(applyFilters(ALL, f({ data_types: ["audio", "text"] })))).toEqual(["Meridian"]);
    expect(applyFilters(ALL, f({ data_types: ["audio", "video"] }))).toEqual([]);
    expect(names(applyFilters(ALL, f({ regions: ["IN", "US"] })))).toEqual(["NorthStar"]);
  });

  it("needs every list to be satisfied at once", () => {
    expect(names(applyFilters(ALL, f({ data_types: ["image"], regions: ["KE"] })))).toEqual(["Helix"]);
    expect(applyFilters(ALL, f({ data_types: ["image"], regions: ["SG"] }))).toEqual([]);
  });

  it("searches the name, the description and the place, every word", () => {
    expect(names(applyFilters(ALL, f({ q: "meridian" })))).toEqual(["Meridian"]);
    expect(names(applyFilters(ALL, f({ q: "SPEECH" })))).toEqual(["Meridian"]);
    expect(names(applyFilters(ALL, f({ q: "nairobi" })))).toEqual(["Helix"]);
    expect(names(applyFilters(ALL, f({ q: "field india" })))).toEqual(["NorthStar"]);
    expect(applyFilters(ALL, f({ q: "field nairobi" }))).toEqual([]);
    expect(names(applyFilters(ALL, f({ q: "TN-03" })))).toEqual(["Helix"]);
  });

  it("does not pass an unrated vendor off as rated", () => {
    expect(names(applyFilters(ALL, f({ min_rating: 3 })))).toEqual(["NorthStar", "Meridian"]);
    expect(names(applyFilters(ALL, f({ min_rating: 4 })))).toEqual(["NorthStar"]);
    expect(applyFilters(ALL, f({ min_rating: 4.5 }))).toEqual([NORTHSTAR]);
    // the boundary is inclusive: "4 and above" includes 4.0
    const four = vendor({ id: "x", name: "Four", performance: { ...NORTHSTAR.performance, rating_avg: 4 } });
    expect(matches(four, f({ min_rating: 4 }))).toBe(true);
    expect(matches(HELIX, f({ min_rating: 3 }))).toBe(false);
    expect(matches(HELIX, NO_FILTERS)).toBe(true);
  });

  it("survives a vendor whose expertise is missing a list", () => {
    const bare = vendor({ id: "b", name: "Bare", expertise: {} as never });
    expect(matches(bare, NO_FILTERS)).toBe(true);
    expect(matches(bare, f({ data_types: ["video"] }))).toBe(false);
  });
});

describe("order", () => {
  it("puts the best rated first and the unrated last", () => {
    expect(names(sortVendors(ALL, "rating"))).toEqual(["NorthStar", "Meridian", "Helix"]);
  });

  it("breaks a tie in rating by how many gave it", () => {
    const few = vendor({ id: "a", name: "Aardvark", performance: { ...NORTHSTAR.performance, rating_count: 1 } });
    expect(names(sortVendors([few, NORTHSTAR], "rating"))).toEqual(["NorthStar", "Aardvark"]);
  });

  it("orders by completed projects", () => {
    expect(names(sortVendors(ALL, "projects"))).toEqual(["Meridian", "NorthStar", "Helix"]);
  });

  it("orders by name", () => {
    expect(names(sortVendors(ALL, "name"))).toEqual(["Helix", "Meridian", "NorthStar"]);
  });

  it("orders by who joined last, with the undated after the dated", () => {
    const undated = vendor({ id: "u", name: "Undated" });
    expect(names(sortVendors([...ALL, undated], "newest"))).toEqual(["Helix", "Meridian", "NorthStar", "Undated"]);
  });

  it("does not reorder the list it was given", () => {
    const given = [...ALL];
    sortVendors(given, "name");
    expect(given).toEqual(ALL);
  });
});

describe("the address bar", () => {
  it("is plain /vendors when nothing is chosen", () => {
    expect(writeFilters(NO_FILTERS).toString()).toBe("");
  });

  it("round-trips every filter", () => {
    const chosen = f({
      q: "field ops", data_types: ["video", "image"], domains: ["retail"], regions: ["IN", "US"],
      languages: ["eng"], certifications: ["iso_27001"], min_rating: 4.5, sort: "projects",
    });
    const url = writeFilters(chosen);
    expect(readFilters(new URLSearchParams(url.toString()))).toEqual(chosen);
    expect(url.get("type")).toBe("video,image");
    expect(url.get("rating")).toBe("4.5");
  });

  it("drops what it does not recognise instead of matching nobody", () => {
    const read = readFilters(new URLSearchParams("type=video,hologram&region=IN,ZZ&rating=9&sort=price&cert="));
    expect(read.data_types).toEqual(["video"]);
    expect(read.regions).toEqual(["IN"]);
    expect(read.min_rating).toBe(0);
    expect(read.sort).toBe("rating");
    expect(read.certifications).toEqual([]);
  });

  it("reads a value once however often the link repeats it", () => {
    expect(readFilters(new URLSearchParams("type=video,video,image")).data_types).toEqual(["video", "image"]);
  });

  it("keeps the search trimmed", () => {
    expect(writeFilters(f({ q: "  video  " })).get("q")).toBe("video");
    expect(writeFilters(f({ q: "   " })).has("q")).toBe(false);
  });
});

describe("what the bar says", () => {
  it("counts sorting as a preference, not a filter", () => {
    expect(isFiltered(f({ sort: "name" }))).toBe(false);
    expect(isFiltered(f({ q: "x" }))).toBe(true);
    expect(isFiltered(f({ min_rating: 3 }))).toBe(true);
    expect(isFiltered(f({ languages: ["eng"] }))).toBe(true);
  });

  it("names each active filter, and removing one leaves the rest", () => {
    const chosen = f({ q: "field", data_types: ["video", "image"], regions: ["IN"], min_rating: 4 });
    const chips = chipsOf(chosen);
    expect(chips.map((c) => c.label)).toEqual(['"field"', "Video", "Image", "India", "★ 4+"]);
    expect(new Set(chips.map((c) => c.id)).size).toBe(chips.length);
    const video = chips.find((c) => c.label === "Video")!;
    expect(video.without).toEqual({ ...chosen, data_types: ["image"] });
    expect(chips.find((c) => c.id === "rating")!.without.min_rating).toBe(0);
    expect(chips.find((c) => c.id === "q")!.without.q).toBe("");
  });

  it("clears the filters and keeps the order", () => {
    expect(cleared(f({ q: "x", regions: ["IN"], min_rating: 4, sort: "projects" }))).toEqual(f({ sort: "projects" }));
  });

  it("counts what is shown against what there is", () => {
    expect(countLine(12, 12, false)).toBe("12 vendors");
    expect(countLine(3, 12, true)).toBe("3 of 12 vendors");
    expect(countLine(0, 1, true)).toBe("0 of 1 vendor");
    expect(countLine(1, 1, false)).toBe("1 vendor");
  });
});
