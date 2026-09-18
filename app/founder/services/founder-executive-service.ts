import type {
  FounderBusinessSnapshot,
  FounderIntelligenceSnapshot,
} from "../models";

import {
  getFounderBusinessSnapshot,
  getFounderSystemSnapshot,
} from "./";

export type FounderExecutiveSnapshot = {
  generatedAt: string;
  business: FounderBusinessSnapshot;
  intelligence: FounderIntelligenceSnapshot;
};

export async function getFounderExecutiveSnapshot(): Promise<FounderExecutiveSnapshot> {
  const [business, intelligence] = await Promise.all([
    getFounderBusinessSnapshot(),
    getFounderSystemSnapshot(),
  ]);

  return {
    generatedAt: new Date().toISOString(),
    business,
    intelligence,
  };
}