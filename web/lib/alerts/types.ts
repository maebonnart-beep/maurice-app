import type { ListingCategoryKey, ListingZone } from "@/lib/marketplace/types";

export type SavedSearchType = "listing" | "event";

export type ListingSearchCriteria = {
  category?: ListingCategoryKey;
  zone?: ListingZone;
  maxPrice?: number;
  keyword?: string;
};

export type EventSearchCriteria = {
  themes?: string[];
  filters?: string[];
  keyword?: string;
};

export type SavedSearchCriteria = ListingSearchCriteria | EventSearchCriteria;

export type SavedSearch = {
  id: number;
  userId: string;
  type: SavedSearchType;
  label: string;
  criteria: SavedSearchCriteria;
  createdAt: string;
};
