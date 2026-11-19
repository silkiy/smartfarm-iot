import { z } from "zod";
import { AuthorizationError } from "@/server/auth/policy";
import { api, ApiError, input, json } from "@/server/http/api";
import {
  sendTestTemplate,
  whatsappSettings,
} from "@/server/integrations/whatsapp";
export async function POST(request: Request) {
  return api(request, async (user, db) => {
    if (user.role !== "ADMIN") throw new AuthorizationError();
    if (!whatsappSettings().success)
      throw new ApiError(
        503,
        "WHATSAPP_NOT_CONFIGURED",
        "Konfigurasi WhatsApp resmi belum lengkap.",
      );
    const { requestId } = await input(
      request,
      z.object({ requestId: z.string().uuid() }).strict(),
    );
    // A persistent unique key prevents a retry from sending the same test twice.
    const logs = db.collection<{
      _id: string;
      requestedBy: string;
      status: string;
      createdAt: Date;
      providerMessageId?: string;
      failureReason?: string;
    }>("whatsapp_test_logs");
    const previous = await logs.findOneAndUpdate(
      { _id: requestId },
      {
        $setOnInsert: {
          requestedBy: user.id,
          status: "PENDING",
          createdAt: new Date(),
        },
      },
      { upsert: true, returnDocument: "before" },
    );
    if (previous) return json({ status: previous.status });
    const recent = await logs.countDocuments({
      requestedBy: user.id,
      createdAt: { $gte: new Date(Date.now() - 60_000) },
    });
    if (recent > 1) {
      await logs.updateOne(
        { _id: requestId },
        { $set: { status: "FAILED", failureReason: "RATE_LIMITED" } },
      );
      throw new ApiError(
        429,
        "RATE_LIMITED",
        "Tunggu satu menit sebelum mengirim pesan uji lagi.",
      );
    }
    try {
      const id = await sendTestTemplate();
      await logs.updateOne(
        { _id: requestId },
        { $set: { status: "ACCEPTED", providerMessageId: id } },
      );
      return json({ status: "ACCEPTED" });
    } catch {
      await logs.updateOne(
        { _id: requestId },
        {
          $set: {
            status: "UNKNOWN",
            failureReason: "PROVIDER_REJECTED_OR_TIMEOUT",
          },
        },
      );
      throw new ApiError(
        502,
        "PROVIDER_UNAVAILABLE",
        "Permintaan WhatsApp gagal atau belum terkonfirmasi. Periksa log di Meta sebelum mencoba lagi.",
      );
    }
  });
}
