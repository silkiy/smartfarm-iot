import { z } from "zod";
const settingsSchema = z.object({
  WHATSAPP_ENABLED: z.literal("true"),
  WHATSAPP_ACCESS_TOKEN: z.string().min(1),
  WHATSAPP_PHONE_NUMBER_ID: z.string().regex(/^\d+$/),
  WHATSAPP_TEST_RECIPIENT: z.string().regex(/^\d{8,15}$/),
  WHATSAPP_API_VERSION: z.string().regex(/^v\d+\.\d+$/),
  WHATSAPP_TEST_TEMPLATE: z
    .string()
    .regex(/^[a-z0-9_]+$/)
    .default("hello_world"),
  WHATSAPP_TEMPLATE_LANGUAGE: z
    .string()
    .regex(/^[a-z]{2}(?:_[A-Z]{2})?$/)
    .default("en_US"),
});
export function whatsappSettings(
  environment: Readonly<Record<string, string | undefined>> = process.env,
) {
  return settingsSchema.safeParse(environment);
}
export async function sendTestTemplate() {
  const parsed = whatsappSettings();
  if (!parsed.success) throw new Error("WHATSAPP_NOT_CONFIGURED");
  const s = parsed.data;
  const response = await fetch(
    `https://graph.facebook.com/${s.WHATSAPP_API_VERSION}/${s.WHATSAPP_PHONE_NUMBER_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${s.WHATSAPP_ACCESS_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: s.WHATSAPP_TEST_RECIPIENT,
        type: "template",
        template: {
          name: s.WHATSAPP_TEST_TEMPLATE,
          language: { code: s.WHATSAPP_TEMPLATE_LANGUAGE },
        },
      }),
      redirect: "error",
      signal: AbortSignal.timeout(15_000),
    },
  );
  if (!response.ok) throw new Error("WHATSAPP_PROVIDER_REJECTED");
  const result = z
    .object({ messages: z.array(z.object({ id: z.string().min(1) })).min(1) })
    .parse(await response.json());
  return result.messages[0].id;
}
