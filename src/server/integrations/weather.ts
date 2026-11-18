import { z } from "zod";
export const weatherResponseSchema = z.object({
  current: z.object({
    time: z.number().int(),
    temperature_2m: z.number().min(-100).max(70),
    relative_humidity_2m: z.number().min(0).max(100),
    wind_speed_10m: z.number().min(0).max(500),
    weather_code: z.number().int().min(0).max(99),
  }),
});
export async function fetchWeather(latitude: number, longitude: number) {
  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.search = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: "temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code",
    timeformat: "unixtime",
    timezone: "Asia/Jakarta",
  }).toString();
  const response = await fetch(url, {
    redirect: "error",
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  if (!response.ok) throw new Error("WEATHER_PROVIDER_UNAVAILABLE");
  const { current } = weatherResponseSchema.parse(await response.json());
  return {
    temperatureC: current.temperature_2m,
    humidityPercent: current.relative_humidity_2m,
    windSpeedKmh: current.wind_speed_10m,
    weatherCode: current.weather_code,
    observedAt: new Date(current.time * 1000),
    fetchedAt: new Date(),
    provider: "Open-Meteo",
  };
}
