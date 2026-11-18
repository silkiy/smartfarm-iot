import {
  getWeatherConfiguration,
  getWhatsAppConfiguration,
  type ProviderConfiguration,
} from "@/server/integrations/config";

export interface ProviderReadiness {
  whatsapp: ProviderConfiguration;
  weather: ProviderConfiguration;
}

export function getProviderReadiness(
  environment: Readonly<Record<string, string | undefined>> = process.env,
): ProviderReadiness {
  return {
    whatsapp: getWhatsAppConfiguration(environment),
    weather: getWeatherConfiguration(environment),
  };
}
