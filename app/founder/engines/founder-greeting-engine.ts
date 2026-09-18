import {
  buildFounderGreeting,
  type FounderGreeting,
} from "../types/founder-greeting";

export type FounderGreetingEngineInput = {
  founderName: string;
  now?: Date;
};

export function getFounderGreeting(
  input: FounderGreetingEngineInput
): FounderGreeting {
  return buildFounderGreeting(
    input.founderName,
    input.now ?? new Date()
  );
}