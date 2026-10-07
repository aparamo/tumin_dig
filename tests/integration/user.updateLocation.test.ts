import { describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users } from "@/db/schema";
import { createTestCaller } from "../helpers/caller";
import { makeUser } from "../helpers/factories";

describe("user.updateLocation region change", () => {
  it("lets a socio with a known adscripción switch region immediately", async () => {
    const user = await makeUser({
      role: "SOCIO",
      region: "Túmin Totonacapan",
      residenceCountry: "México",
      residenceState: "Veracruz",
    });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    const result = await caller.user.updateLocation({
      region: "Túmin Oaxaca",
      enrollmentMethod: "REGION",
      enrollmentMethodOther: null,
    });

    expect(result.success).toBe(true);
    expect(result.region).toBe("Túmin Oaxaca");

    const [row] = await db
      .select({ region: users.region, enrollmentMethod: users.enrollmentMethod })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    expect(row?.region).toBe("Túmin Oaxaca");
    expect(row?.enrollmentMethod).toBe("REGION");
  });

  it("persists listed residence country outside México", async () => {
    const user = await makeUser({
      role: "SOCIO",
      region: "Túmin Chiapas",
      residenceCountry: "México",
      residenceState: "Chiapas",
    });
    const caller = createTestCaller({
      id: user.id,
      role: "SOCIO",
      region: user.region,
      isVerified: true,
    });

    const result = await caller.user.updateLocation({
      residenceCountry: "Colombia",
      residenceState: null,
      residenceCity: "Bogotá",
      residencePostalCode: null,
    });

    expect(result.residenceCountry).toBe("Colombia");
    expect(result.residenceState).toBeNull();

    const [row] = await db
      .select({
        residenceCountry: users.residenceCountry,
        residenceState: users.residenceState,
        residenceCity: users.residenceCity,
      })
      .from(users)
      .where(eq(users.id, user.id))
      .limit(1);

    expect(row?.residenceCountry).toBe("Colombia");
    expect(row?.residenceState).toBeNull();
    expect(row?.residenceCity).toBe("Bogotá");
  });
});
