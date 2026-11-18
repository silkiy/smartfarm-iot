export type ProviderStatus =
  "NOT_CONFIGURED" | "INVALID_CONFIGURATION" | "CONFIGURED";

export interface ProviderConfiguration {
  status: ProviderStatus;
  missing: string[];
}

type Environment = Readonly<Record<string, string | undefined>>;

function isEnabled(value: string | undefined): boolean {
  return value?.trim().toLowerCase() === "true";
}

function getConfiguration(
  enabledVariable: string,
  requiredVariables: string[],
  environment: Environment,
): ProviderConfiguration {
  const enabled = isEnabled(environment[enabledVariable]);
  const missing = requiredVariables.filter(
    (variable) => !environment[variable]?.trim(),
  );

  if (!enabled) {
    return { status: "NOT_CONFIGURED", missing };
  }

  if (missing.length > 0) {
    return { status: "INVALID_CONFIGURATION", missing };
  }

  return { status: "CONFIGURED", missing: [] };
}

export function getWhatsAppConfiguration(
  environment: Environment = process.env,
): ProviderConfiguration {
  return getConfiguration(
    "WHATSAPP_ENABLED",
    [
      "WHATSAPP_ACCESS_TOKEN",
      "WHATSAPP_PHONE_NUMBER_ID",
      "WHATSAPP_TEST_RECIPIENT",
    ],
    environment,
  );
}

export function getWeatherConfiguration(
  environment: Environment = process.env,
): ProviderConfiguration {
  return {
    status:
      environment.WEATHER_ENABLED === "false" ? "NOT_CONFIGURED" : "CONFIGURED",
    missing: [],
  };
}
