import { getMongoDatabase } from "@/lib/mongodb";

export async function GET() {
  try {
    const database = await getMongoDatabase();
    await database.command({ ping: 1 });

    return Response.json({
      status: "ok",
      service: "mongodb",
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const isConfigurationError = message === "MONGODB_URI is not configured";

    return Response.json(
      {
        status: "error",
        error: {
          code: isConfigurationError
            ? "DATABASE_NOT_CONFIGURED"
            : "DATABASE_UNAVAILABLE",
          message: isConfigurationError
            ? "Database configuration is missing"
            : "Database is unavailable",
        },
      },
      { status: 503 },
    );
  }
}
