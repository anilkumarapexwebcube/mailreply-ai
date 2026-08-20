import { describe, it, expect } from "vitest";
import {
  DEFAULT_SETTINGS,
  addSavedInstruction,
  getPlatformDefaults,
  isPlatformEnabled,
} from "./settings";

describe("settings helpers", () => {
  describe("addSavedInstruction", () => {
    it("adds a trimmed instruction to the front", () => {
      expect(addSavedInstruction([], "  hello  ")).toEqual(["hello"]);
    });
    it("de-duplicates, moving an existing entry to the front", () => {
      expect(addSavedInstruction(["a", "b"], "b")).toEqual(["b", "a"]);
    });
    it("ignores blank instructions", () => {
      expect(addSavedInstruction(["a"], "   ")).toEqual(["a"]);
    });
    it("caps the list at 20 entries", () => {
      const list = Array.from({ length: 20 }, (_, i) => `i${i}`);
      const out = addSavedInstruction(list, "new");
      expect(out).toHaveLength(20);
      expect(out[0]).toBe("new");
    });
  });

  describe("isPlatformEnabled", () => {
    it("is false when the global switch is off", () => {
      const s = { ...DEFAULT_SETTINGS, enabled: false };
      expect(isPlatformEnabled(s, "gmail")).toBe(false);
    });
    it("respects the per-platform toggle", () => {
      const s = {
        ...DEFAULT_SETTINGS,
        platforms: { gmail: true, whatsapp: false },
      };
      expect(isPlatformEnabled(s, "gmail")).toBe(true);
      expect(isPlatformEnabled(s, "whatsapp")).toBe(false);
    });
  });

  describe("getPlatformDefaults", () => {
    it("returns whatsapp defaults for whatsapp", () => {
      expect(getPlatformDefaults(DEFAULT_SETTINGS, "whatsapp").length).toBe(
        "short",
      );
    });
    it("returns gmail defaults for gmail", () => {
      expect(getPlatformDefaults(DEFAULT_SETTINGS, "gmail").tone).toBe(
        "professional",
      );
    });
  });
});
