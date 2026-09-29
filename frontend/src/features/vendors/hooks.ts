// vendors — the data layer of the directory.
//
// One request for the whole directory: the list is every ACTIVE delivery
// partner, which is tens, and the filters run over it in the browser
// (filters.ts). Five minutes of staleness is right for it — a partner's record
// changes when a contract completes, not while a buyer is reading a card.

import { useQuery } from "@tanstack/react-query";
import { get } from "@api/client";
import type { Vendor, VendorList } from "@api/types";

const STALE = 5 * 60 * 1000;

export const vendorKeys = {
  list: ["vendors"] as const,
  one: (id: string) => ["vendor", id] as const,
};

// Stable, so react-query hands back the same array until the data changes.
// Page tests answer unknown GETs with null.
const pickItems = (d: VendorList | null): Vendor[] => d?.items ?? [];

export function useVendors() {
  return useQuery({
    queryKey: vendorKeys.list,
    queryFn: () => get<VendorList | null>("/vendors"),
    select: pickItems,
    staleTime: STALE,
  });
}

export function useVendor(id: string | undefined) {
  return useQuery({
    queryKey: vendorKeys.one(id ?? ""),
    queryFn: () => get<Vendor>(`/vendors/${id}`),
    enabled: !!id,
    staleTime: STALE,
    // A 404 is an answer ("not listed"), not a fault to try again.
    retry: false,
  });
}
