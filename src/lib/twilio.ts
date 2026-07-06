import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

function getClient() {
  if (!accountSid || !authToken || !verifyServiceSid) {
    throw new Error("Twilio no está configurado (faltan variables de entorno).");
  }
  return twilio(accountSid, authToken);
}

/** Sends an OTP via WhatsApp, falling back to SMS if WhatsApp delivery is rejected (e.g. template not approved). */
export async function sendPhoneOtp(phoneE164: string): Promise<{ channel: "whatsapp" | "sms" }> {
  const client = getClient();
  try {
    await client.verify.v2.services(verifyServiceSid!).verifications.create({
      to: phoneE164,
      channel: "whatsapp",
    });
    return { channel: "whatsapp" };
  } catch {
    await client.verify.v2.services(verifyServiceSid!).verifications.create({
      to: phoneE164,
      channel: "sms",
    });
    return { channel: "sms" };
  }
}

/** Returns true if the code is valid ("approved") for the given phone. */
export async function checkPhoneOtp(phoneE164: string, code: string): Promise<boolean> {
  const client = getClient();
  const check = await client.verify.v2
    .services(verifyServiceSid!)
    .verificationChecks.create({ to: phoneE164, code });
  return check.status === "approved";
}
