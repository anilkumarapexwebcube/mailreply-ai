// User settings persisted in chrome.storage.local (shared across popup + content scripts).
// No conversation content is ever stored here — only preferences.

export type PlatformType = "gmail" | "whatsapp";

export interface PlatformDefaults {
  tone: string;
  length: string;
  language: string; // "auto" | "English" | "Hindi" | ...
  emoji: "auto" | "sparingly" | "never";
  objective: string; // "general" | "qualification" | ...
}

export interface MailReplySettings {
  /** Global kill switch — turns the assistant off everywhere (fail-safe). */
  enabled: boolean;
  /** Per-platform enable/disable. */
  platforms: Record<PlatformType, boolean>;
  gmailDefaults: PlatformDefaults;
  whatsappDefaults: PlatformDefaults;
  /** Reusable instructions the user has saved, newest first. */
  savedInstructions: string[];
  /** Auto-filled into the instruction box when a panel opens. */
  defaultInstruction: string;
}

const STORAGE_KEY = "mailreplySettings";

export const DEFAULT_SETTINGS: MailReplySettings = {
  enabled: true,
  platforms: { gmail: true, whatsapp: true },
  gmailDefaults: {
    tone: "professional",
    length: "medium",
    language: "auto",
    emoji: "auto",
    objective: "general",
  },
  whatsappDefaults: {
    tone: "friendly",
    length: "short",
    language: "auto",
    emoji: "auto",
    objective: "general",
  },
  savedInstructions: [],
  defaultInstruction: "",
};

function mergeDefaults(
  stored: Partial<MailReplySettings> | undefined,
): MailReplySettings {
  const s = stored ?? {};
  return {
    enabled: s.enabled ?? DEFAULT_SETTINGS.enabled,
    platforms: {
      gmail: s.platforms?.gmail ?? DEFAULT_SETTINGS.platforms.gmail,
      whatsapp: s.platforms?.whatsapp ?? DEFAULT_SETTINGS.platforms.whatsapp,
    },
    gmailDefaults: {
      ...DEFAULT_SETTINGS.gmailDefaults,
      ...(s.gmailDefaults ?? {}),
    },
    whatsappDefaults: {
      ...DEFAULT_SETTINGS.whatsappDefaults,
      ...(s.whatsappDefaults ?? {}),
    },
    savedInstructions: Array.isArray(s.savedInstructions)
      ? s.savedInstructions.slice(0, 20)
      : [],
    defaultInstruction:
      typeof s.defaultInstruction === "string"
        ? s.defaultInstruction
        : DEFAULT_SETTINGS.defaultInstruction,
  };
}

export async function loadSettings(): Promise<MailReplySettings> {
  try {
    const res = await chrome.storage.local.get(STORAGE_KEY);
    return mergeDefaults(res?.[STORAGE_KEY]);
  } catch {
    return { ...DEFAULT_SETTINGS };
  }
}

export async function saveSettings(settings: MailReplySettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: mergeDefaults(settings) });
}

export function getPlatformDefaults(
  settings: MailReplySettings,
  platform: PlatformType,
): PlatformDefaults {
  return platform === "whatsapp"
    ? settings.whatsappDefaults
    : settings.gmailDefaults;
}

/** Returns true when the assistant should run for the given platform. */
export function isPlatformEnabled(
  settings: MailReplySettings,
  platform: PlatformType,
): boolean {
  return settings.enabled && settings.platforms[platform];
}

/** Adds an instruction to the saved list (de-duplicated, newest first, capped). */
export function addSavedInstruction(
  list: string[],
  instruction: string,
): string[] {
  const trimmed = instruction.trim();
  if (!trimmed) return list;
  const deduped = list.filter((i) => i.trim() !== trimmed);
  return [trimmed, ...deduped].slice(0, 20);
}
