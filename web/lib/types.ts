export type CategoryKey =
  | "excursions"
  | "croisieres"
  | "plongee"
  | "nautique"
  | "kitesurf"
  | "peche"
  | "spa"
  | "golf"
  | "loisirs"
  | "visites"
  | "restaurants"
  | "shopping";

export type Category = {
  key: CategoryKey;
  label: string;
  emoji: string;
  color: string;
};

export type Business = {
  id: string;
  name: string;
  category: CategoryKey;
  address: string;
  phone: string;
  website: string;
  googleMapsUrl: string;
  lat: number;
  lng: number;
  themes?: string[];
};
