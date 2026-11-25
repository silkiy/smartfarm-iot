import { collectionNames, type DeviceCommandDocument } from "@/domain/models";
import { deviceApi, deviceJson } from "@/server/http/device-api";
import { ObjectId } from "mongodb";

/**
 * GET /api/devices/commands
 * ESP32 polling endpoint — kembalikan perintah PENDING tertua untuk device ini.
 * Kalau tidak ada perintah, kembalikan null.
 */
export async function GET(request: Request) {
  return deviceApi(request, async (device, db) => {
    const command = await db
      .collection<DeviceCommandDocument>(collectionNames.deviceCommands)
      .findOne(
        { deviceId: { $exists: true }, status: "PENDING" },
        { sort: { createdAt: 1 } },
      );

    if (!command) return deviceJson({ command: null });

    // Tandai sebagai RECEIVED agar tidak dikirim ulang ke device lain
    await db.collection(collectionNames.deviceCommands).updateOne(
      { _id: command._id },
      {
        $set: {
          status: "RECEIVED",
          receivedAt: new Date(),
          updatedAt: new Date(),
        },
      },
    );

    return deviceJson({
      command: {
        id: command._id.toHexString(),
        actuator: command.actuator,
        action: command.action,
        durationSeconds: command.durationSeconds ?? null,
      },
    });
  });
}

/**
 * PATCH /api/devices/commands
 * ESP32 mengirim ACK setelah mengeksekusi perintah.
 * Body: { commandId, status: "EXECUTED" | "FAILED", reason?: string }
 */
export async function PATCH(request: Request) {
  return deviceApi(request, async (_device, db) => {
    const body = (await request.json()) as {
      commandId: string;
      status: "EXECUTED" | "FAILED";
      reason?: string;
    };

    if (!body.commandId || !["EXECUTED", "FAILED"].includes(body.status))
      return Response.json(
        { error: { code: "INVALID_ACK", message: "ACK tidak valid." } },
        { status: 422 },
      );

    const now = new Date();
    await db.collection(collectionNames.deviceCommands).updateOne(
      { _id: new ObjectId(body.commandId) },
      {
        $set: {
          status: body.status,
          executedAt: now,
          failureReason: body.reason ?? null,
          updatedAt: now,
        },
      },
    );

    return deviceJson({ acknowledged: true });
  });
}
