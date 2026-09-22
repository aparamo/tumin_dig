import { z } from "zod";
import { phoneDigits, toE164 } from "./phone";
import type { ContactChannel } from "@/db/schema";

export const CONTACT_CHANNELS = [
  "whatsapp",
  "phone",
  "sms",
  "telegram",
  "signal",
  "mastodon",
  "facebook",
  "instagram",
  "meet",
  "zoom",
  "jitsi",
  "other",
] as const satisfies readonly ContactChannel[];

export type ContactChannelId = (typeof CONTACT_CHANNELS)[number];

/** Frequent channels shown first in Communicate / manage dialogs */
export const CONTACT_GROUP_A: readonly ContactChannelId[] = [
  "whatsapp",
  "phone",
  "sms",
  "telegram",
];

/** Shown after “Mostrar más” */
export const CONTACT_GROUP_B: readonly ContactChannelId[] = [
  "signal",
  "instagram",
  "facebook",
  "mastodon",
  "meet",
  "zoom",
  "jitsi",
  "other",
];

export const CHANNEL_PRIORITY: Record<ContactChannelId, number> = {
  whatsapp: 1,
  phone: 2,
  sms: 3,
  telegram: 4,
  signal: 5,
  instagram: 6,
  facebook: 7,
  mastodon: 8,
  meet: 9,
  zoom: 10,
  jitsi: 11,
  other: 12,
};

export const CHANNEL_LABELS: Record<ContactChannelId, string> = {
  whatsapp: "WhatsApp",
  phone: "Llamar",
  sms: "SMS",
  telegram: "Telegram",
  signal: "Signal",
  mastodon: "Mastodon",
  facebook: "Facebook",
  instagram: "Instagram",
  meet: "Google Meet",
  zoom: "Zoom",
  jitsi: "Jitsi",
  other: "Otro",
};

export const contactChannelSchema = z.enum(CONTACT_CHANNELS);

const phoneValueSchema = z
  .string()
  .trim()
  .min(10, "Ingresa un teléfono válido")
  .refine((v) => phoneDigits(v).length >= 10, "Ingresa un teléfono válido");

const telegramSchema = z
  .string()
  .trim()
  .min(3)
  .max(64)
  .transform((v) => v.replace(/^@/, ""))
  .refine((v) => /^[a-zA-Z][a-zA-Z0-9_]{4,31}$/.test(v) || /^[a-zA-Z0-9_]{5,32}$/.test(v), {
    message: "Usuario de Telegram inválido",
  });

const instagramSchema = z
  .string()
  .trim()
  .transform((v) => v.replace(/^@/, "").replace(/\/$/, ""))
  .refine((v) => /^[a-zA-Z0-9._]{1,30}$/.test(v), "Usuario de Instagram inválido");

function isHttpsUrl(raw: string, allowedHosts?: (host: string) => boolean): boolean {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== "https:") return false;
    if (allowedHosts && !allowedHosts(u.hostname.toLowerCase())) return false;
    return true;
  } catch {
    return false;
  }
}

const signalSchema = z
  .string()
  .trim()
  .refine((v) => {
    try {
      const u = new URL(v);
      if (u.protocol !== "https:" && u.protocol !== "sgnl:") return false;
      const host = u.hostname.toLowerCase();
      if (u.protocol === "https:" && host !== "signal.me") return false;
      const hash = u.hash || "";
      return /^#(p|eu|ue)\//i.test(hash);
    } catch {
      return false;
    }
  }, "Pega tu enlace de Signal (signal.me/#p/… o #eu/…)");

const mastodonSchema = z
  .string()
  .trim()
  .refine((v) => {
    if (v.includes("@") && !v.startsWith("http")) {
      const m = /^@?([^@\s]+)@([^@\s]+)$/.exec(v);
      return Boolean(m);
    }
    return isHttpsUrl(v);
  }, "URL de perfil o usuario@instancia");

const facebookSchema = z
  .string()
  .trim()
  .refine(
    (v) =>
      isHttpsUrl(v, (h) =>
        h === "facebook.com" ||
        h === "www.facebook.com" ||
        h === "m.facebook.com" ||
        h === "fb.com" ||
        h === "www.fb.com" ||
        h === "m.me"
      ),
    "URL de Facebook o m.me inválida"
  );

const meetSchema = z
  .string()
  .trim()
  .refine(
    (v) => isHttpsUrl(v, (h) => h === "meet.google.com"),
    "URL de Google Meet inválida"
  );

const zoomSchema = z
  .string()
  .trim()
  .refine(
    (v) =>
      isHttpsUrl(
        v,
        (h) =>
          h === "zoom.us" ||
          h.endsWith(".zoom.us") ||
          h === "www.zoom.com" ||
          h === "zoom.com"
      ),
    "URL de Zoom inválida"
  );

const jitsiSchema = z
  .string()
  .trim()
  .refine((v) => isHttpsUrl(v), "URL de Jitsi inválida (https)");

export interface ContactMethodInput {
  channel: ContactChannelId;
  value: string;
  label?: string | null;
}

export function normalizeContactValue(
  channel: ContactChannelId,
  rawValue: string,
  label?: string | null
): { value: string; label: string | null } {
  const trimmed = rawValue.trim();

  switch (channel) {
    case "whatsapp":
    case "phone":
    case "sms": {
      const parsed = phoneValueSchema.parse(trimmed);
      return { value: toE164(parsed), label: null };
    }
    case "telegram": {
      const user = telegramSchema.parse(trimmed);
      return { value: user, label: null };
    }
    case "instagram": {
      const user = instagramSchema.parse(trimmed);
      return { value: user, label: null };
    }
    case "signal": {
      const link = signalSchema.parse(trimmed);
      return { value: link.replace(/^sgnl:/i, "https:"), label: null };
    }
    case "mastodon": {
      const v = mastodonSchema.parse(trimmed);
      if (v.includes("@") && !v.startsWith("http")) {
        const m = /^@?([^@\s]+)@([^@\s]+)$/.exec(v);
        if (!m) throw new z.ZodError([]);
        const [, user, host] = m;
        return { value: `https://${host}/@${user}`, label: null };
      }
      return { value: new URL(v).toString(), label: null };
    }
    case "facebook": {
      const url = facebookSchema.parse(trimmed);
      return { value: new URL(url).toString(), label: null };
    }
    case "meet": {
      const url = meetSchema.parse(trimmed);
      return { value: new URL(url).toString(), label: null };
    }
    case "zoom": {
      const url = zoomSchema.parse(trimmed);
      return { value: new URL(url).toString(), label: null };
    }
    case "jitsi": {
      const url = jitsiSchema.parse(trimmed);
      return { value: new URL(url).toString(), label: null };
    }
    case "other": {
      const lab = (label ?? "").trim();
      if (!lab) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Indica un nombre para este medio",
            path: ["label"],
          },
        ]);
      }
      if (trimmed && !isHttpsUrl(trimmed)) {
        throw new z.ZodError([
          {
            code: "custom",
            message: "Si agregas URL, debe ser https",
            path: ["value"],
          },
        ]);
      }
      return { value: trimmed || lab, label: lab };
    }
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}

export const contactMethodUpsertSchema = z
  .object({
    id: z.string().uuid().optional(),
    channel: contactChannelSchema,
    value: z.string().min(1),
    label: z.string().max(80).optional().nullable(),
    isEnabled: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    sortOrder: z.number().int().min(0).max(999).optional(),
  })
  .superRefine((data, ctx) => {
    try {
      normalizeContactValue(data.channel, data.value, data.label);
    } catch (e) {
      if (e instanceof z.ZodError) {
        for (const issue of e.issues) {
          ctx.addIssue({
            code: "custom",
            message: issue.message,
            path: issue.path.length ? [...issue.path] : ["value"],
          });
        }
      } else {
        ctx.addIssue({ code: "custom", message: "Valor inválido", path: ["value"] });
      }
    }
  });

export interface BuildLinkOptions {
  /** Prefill text for channels that support draft messages */
  text?: string;
}

export type ContactLinkAction =
  | { kind: "open"; href: string }
  | { kind: "copy"; text: string };

/** Build a deep link / action for a stored contact method value */
export function buildContactLink(
  channel: ContactChannelId,
  value: string,
  options: BuildLinkOptions = {},
  label?: string | null
): ContactLinkAction {
  const text = options.text;

  switch (channel) {
    case "whatsapp": {
      const digits = phoneDigits(value);
      const q = text ? `?text=${encodeURIComponent(text)}` : "";
      return { kind: "open", href: `https://wa.me/${digits}${q}` };
    }
    case "phone":
      return { kind: "open", href: `tel:${toE164(value)}` };
    case "sms": {
      const e164 = toE164(value);
      const body = text ? `?body=${encodeURIComponent(text)}` : "";
      return { kind: "open", href: `sms:${e164}${body}` };
    }
    case "telegram": {
      const user = value.replace(/^@/, "");
      const q = text ? `?text=${encodeURIComponent(text)}` : "";
      return { kind: "open", href: `https://t.me/${user}${q}` };
    }
    case "signal":
    case "mastodon":
    case "facebook":
    case "instagram":
    case "meet":
    case "zoom":
    case "jitsi": {
      if (channel === "instagram" && !value.startsWith("http")) {
        return { kind: "open", href: `https://www.instagram.com/${value.replace(/^@/, "")}/` };
      }
      return { kind: "open", href: value };
    }
    case "other": {
      if (value.startsWith("https://")) {
        return { kind: "open", href: value };
      }
      return { kind: "copy", text: label ? `${label}: ${value}` : value };
    }
    default: {
      const _exhaustive: never = channel;
      return _exhaustive;
    }
  }
}

export interface PublicContactMethod {
  id: string;
  channel: ContactChannelId;
  value: string;
  label: string | null;
  sortOrder: number;
}

export function sortContactMethodsByPriority<T extends { channel: ContactChannelId; sortOrder?: number }>(
  methods: T[]
): T[] {
  return [...methods].sort((a, b) => {
    const pa = CHANNEL_PRIORITY[a.channel] ?? 99;
    const pb = CHANNEL_PRIORITY[b.channel] ?? 99;
    if (pa !== pb) return pa - pb;
    return (a.sortOrder ?? 0) - (b.sortOrder ?? 0);
  });
}

export function splitContactMethodsForUi<T extends { channel: ContactChannelId }>(
  methods: T[]
): { primary: T[]; secondary: T[] } {
  const sorted = sortContactMethodsByPriority(methods);
  const primary = sorted.filter((m) => (CONTACT_GROUP_A as readonly string[]).includes(m.channel));
  const secondary = sorted.filter((m) => !(CONTACT_GROUP_A as readonly string[]).includes(m.channel));

  if (primary.length === 0 && secondary.length > 0) {
    return {
      primary: secondary.slice(0, 3),
      secondary: secondary.slice(3),
    };
  }
  return { primary, secondary };
}

export function channelPlaceholder(channel: ContactChannelId): string {
  switch (channel) {
    case "whatsapp":
    case "phone":
    case "sms":
      return "Número a 10 dígitos o con +52";
    case "telegram":
      return "@usuario";
    case "signal":
      return "https://signal.me/#p/+52...";
    case "mastodon":
      return "usuario@instancia o URL";
    case "facebook":
      return "https://facebook.com/... o https://m.me/...";
    case "instagram":
      return "@usuario";
    case "meet":
      return "https://meet.google.com/...";
    case "zoom":
      return "https://zoom.us/j/...";
    case "jitsi":
      return "https://meet.jit.si/...";
    case "other":
      return "URL https (opcional)";
    default:
      return "";
  }
}
