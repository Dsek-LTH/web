import { describe, expect, it } from "vitest";
import { documentShortcut, shortcutKeys } from "./shortcuts.svelte";

describe("documentShortcut", () => {
  it("maps Ctrl/Cmd+S to save", () => {
    expect(documentShortcut(k({ ctrlKey: true, key: "s" }))).toBe("save");
    expect(documentShortcut(k({ metaKey: true, key: "s" }))).toBe("save");
  });

  it("maps Ctrl/Cmd+Shift+S to the PDF download — and never to save", () => {
    expect(
      documentShortcut(k({ ctrlKey: true, shiftKey: true, key: "s" })),
    ).toBe("download-pdf");
    expect(
      documentShortcut(k({ metaKey: true, shiftKey: true, key: "s" })),
    ).toBe("download-pdf");
  });

  it("maps Ctrl/Cmd+Enter to a manual compile", () => {
    expect(documentShortcut(k({ ctrlKey: true, key: "Enter" }))).toBe(
      "compile",
    );
    expect(documentShortcut(k({ metaKey: true, key: "Enter" }))).toBe(
      "compile",
    );
    // Plain Enter must never compile (it's typing in the editor).
    expect(documentShortcut(k({ key: "Enter" }))).toBeNull();
  });

  it("ignores everything else", () => {
    // Shift alone must not save (it would clobber the download shortcut).
    expect(documentShortcut(k({ shiftKey: true, key: "s" }))).toBeNull();
    expect(documentShortcut(k({ key: "s" }))).toBeNull();
    expect(
      documentShortcut(k({ ctrlKey: true, shiftKey: true, key: "a" })),
    ).toBeNull();
  });
});

describe("shortcutKeys", () => {
  it("splits a CodeMirror-style shortcut into kbd chips for tooltips", () => {
    expect(symbols(shortcutKeys("Mod-Shift-F", true))).toEqual(["⌘", "⇧", "F"]);
    expect(symbols(shortcutKeys("Mod-Shift-F", false))).toEqual([
      "Ctrl",
      "Shift",
      "F",
    ]);
    expect(symbols(shortcutKeys("Mod-S", true))).toEqual(["⌘", "S"]);
    expect(symbols(shortcutKeys("F", false))).toEqual(["F"]);
    // Named keys keep their proper casing in the chip.
    expect(symbols(shortcutKeys("Mod-Enter", false))).toEqual([
      "Ctrl",
      "Enter",
    ]);
  });

  it("carries the DOM keys so the chips highlight as they're pressed", () => {
    expect(triggers(shortcutKeys("Mod-Shift-S", true))).toEqual([
      "Meta",
      "Shift",
      "S",
    ]);
    expect(triggers(shortcutKeys("Mod-Shift-S", false))).toEqual([
      "Control",
      "Shift",
      "S",
    ]);
  });
});

function symbols(keys: Array<{ symbol: string }>): string[] {
  return keys.map((key) => key.symbol);
}

function triggers(keys: Array<{ trigger: string }>): string[] {
  return keys.map((key) => key.trigger);
}

function k(
  init: Partial<KeyboardEvent> & { key: string },
): Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "key"> {
  return {
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    ...init,
  } as Pick<KeyboardEvent, "ctrlKey" | "metaKey" | "shiftKey" | "key">;
}
