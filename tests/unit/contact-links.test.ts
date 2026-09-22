import { describe, expect, it } from "vitest";
import {
  buildContactLink,
  normalizeContactValue,
  splitContactMethodsForUi,
  sortContactMethodsByPriority,
} from "@/lib/contact-links";

describe("normalizeContactValue", () => {
  it("normalizes whatsapp to E.164", () => {
    expect(normalizeContactValue("whatsapp", "9611234567")).toEqual({
      value: "+529611234567",
      label: null,
    });
  });

  it("strips @ from telegram", () => {
    expect(normalizeContactValue("telegram", "@mi_usuario").value).toBe("mi_usuario");
  });

  it("accepts signal.me links", () => {
    const v = normalizeContactValue("signal", "https://signal.me/#p/+529611234567");
    expect(v.value).toContain("signal.me");
  });

  it("normalizes mastodon acct to URL", () => {
    expect(normalizeContactValue("mastodon", "alice@example.social").value).toBe(
      "https://example.social/@alice"
    );
  });

  it("requires label for other", () => {
    expect(() => normalizeContactValue("other", "https://example.com")).toThrow();
    expect(normalizeContactValue("other", "https://example.com", "Mi blog")).toEqual({
      value: "https://example.com",
      label: "Mi blog",
    });
  });

  it("validates meet host", () => {
    expect(() => normalizeContactValue("meet", "https://evil.com/x")).toThrow();
    expect(normalizeContactValue("meet", "https://meet.google.com/abc-defg-hij").value).toContain(
      "meet.google.com"
    );
  });
});

describe("buildContactLink", () => {
  it("builds wa.me with text", () => {
    const a = buildContactLink("whatsapp", "+529611234567", { text: "Hola" });
    expect(a).toEqual({
      kind: "open",
      href: "https://wa.me/529611234567?text=Hola",
    });
  });

  it("builds tel and sms", () => {
    expect(buildContactLink("phone", "+529611234567")).toEqual({
      kind: "open",
      href: "tel:+529611234567",
    });
    expect(buildContactLink("sms", "+529611234567", { text: "Hola" }).kind).toBe("open");
  });

  it("builds instagram from handle", () => {
    expect(buildContactLink("instagram", "tumin_mx")).toEqual({
      kind: "open",
      href: "https://www.instagram.com/tumin_mx/",
    });
  });

  it("copies other without URL", () => {
    expect(buildContactLink("other", "radio comunitaria", {}, "Radio")).toEqual({
      kind: "copy",
      text: "Radio: radio comunitaria",
    });
  });
});

describe("splitContactMethodsForUi", () => {
  it("puts group A first", () => {
    const methods = [
      { channel: "signal" as const, id: "1" },
      { channel: "whatsapp" as const, id: "2" },
      { channel: "telegram" as const, id: "3" },
    ];
    const { primary, secondary } = splitContactMethodsForUi(methods);
    expect(primary.map((m) => m.channel)).toEqual(["whatsapp", "telegram"]);
    expect(secondary.map((m) => m.channel)).toEqual(["signal"]);
  });

  it("shows top 3 of B when no A", () => {
    const methods = sortContactMethodsByPriority([
      { channel: "jitsi" as const },
      { channel: "signal" as const },
      { channel: "meet" as const },
      { channel: "zoom" as const },
    ]);
    const { primary, secondary } = splitContactMethodsForUi(methods);
    expect(primary).toHaveLength(3);
    expect(secondary).toHaveLength(1);
  });
});
