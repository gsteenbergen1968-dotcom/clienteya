export type FounderGreetingPeriod =
  | "morning"
  | "afternoon"
  | "evening";

export type FounderGreeting = {
  greeting: string;
  question: string;
};

function getFounderGreetingPeriod(date: Date): FounderGreetingPeriod {
  const hour = date.getHours();

  if (hour < 12) {
    return "morning";
  }

  if (hour < 18) {
    return "afternoon";
  }

  return "evening";
}

export function buildFounderGreeting(
  founderName: string,
  now: Date = new Date()
): FounderGreeting {
  const period = getFounderGreetingPeriod(now);

  switch (period) {
    case "morning":
      return {
        greeting: `Good morning, ${founderName}.`,
        question:
          "What is the single most important thing you need to know today?",
      };

    case "afternoon":
      return {
        greeting: `Good afternoon, ${founderName}.`,
        question:
          "What is the single most important thing you need to know today?",
      };

    default:
      return {
        greeting: `Good evening, ${founderName}.`,
        question:
          "What is the single most important thing you need to know today?",
      };
  }
}