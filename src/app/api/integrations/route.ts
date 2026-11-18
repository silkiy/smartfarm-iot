import { api, json } from "@/server/http/api";
import { whatsappSettings } from "@/server/integrations/whatsapp";
export async function GET(request: Request) {
  return api(request, async (user) =>
    json({
      whatsappReady: whatsappSettings().success,
      canSendTest: user.role === "ADMIN",
      weatherProvider: "Open-Meteo",
    }),
  );
}
