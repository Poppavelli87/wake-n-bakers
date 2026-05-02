import customersJson from "./customers.json";
import quipsJson from "./quips.json";
import reviewsJson from "./reviews.json";
import shiftsJson from "./shifts.json";

export const quips = quipsJson;
export const customers = customersJson;
export const shifts = shiftsJson;
export const reviews = reviewsJson;

export type QuipTone =
  | "polite"
  | "non_sequitur"
  | "wildcard"
  | "silent_beat";

export type QuipScore = Partial<{
  hospitality: number;
  vibes: number;
  disrupt_chris: number;
}>;

export interface Quip {
  id: string;
  text: string;
  tone: QuipTone;
  score?: QuipScore;
}

export interface CustomerArchetype {
  name: string;
  patience: number;
  orders: string[];
  tip_base: number;
  review_weight?: number;
}

export interface ShiftArrival {
  at: number;
  archetype: string;
}

export interface ShiftDef {
  name: string;
  duration_seconds: number;
  customer_arrivals: ShiftArrival[];
  herb_visit_window_seconds: [number, number];
}
