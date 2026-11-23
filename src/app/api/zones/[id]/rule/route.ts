import { ruleInputSchema } from "@/domain/workspace";
import { api, input, json } from "@/server/http/api";
import { zoneAccess } from "@/server/workspace/access";
export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  return api(request, async (user, db) => {
    const { id } = await context.params;
    const { zone } = await zoneAccess(db, user, id);
    const rule = await input(request, ruleInputSchema);
    await db.collection("irrigation_rules").updateOne(
      { zoneId: zone._id },
      {
        $set: {
          farmId: zone.farmId,
          isEnabled: rule.enabled,
          minimumSoilMoisture: rule.threshold,
          maximumWaterLevelCm: rule.target,
          schedule: rule.schedule,
          growthPhase: rule.phase,
          maximumDurationSeconds: 15,
          executionStatus: "AWAITING_HARDWARE",
          updatedAt: new Date(),
        },
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true },
    );
    return json({ id, executionStatus: "AWAITING_HARDWARE" });
  });
}
