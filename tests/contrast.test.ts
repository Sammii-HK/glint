import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const css = readFileSync(
  "src/app/globals.css",
  "utf8",
);
const themes = [...css.matchAll(/:root\s*\{([^}]+)\}/g)].map((match) =>
  Object.fromEntries(
    [...match[1].matchAll(/--([\w-]+)\s*:\s*(#[a-f\d]{6})/gi)].map((value) => [
      value[1],
      value[2],
    ]),
  ),
);
function luminance(hex: string) {
  const rgb = hex
    .slice(1)
    .match(/../g)!
    .map((channel) => parseInt(channel, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
function contrast(first: string, second: string) {
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

test("actual light and dark CSS tokens retain readable text and visible keyboard focus", () => {
  assert.equal(themes.length, 2);
  for (const theme of themes) {
    for (const background of ["background", "surface", "soft"]) {
      for (const foreground of ["foreground", "muted"])
        assert.ok(
          contrast(theme[foreground], theme[background]) >= 4.5,
          `${foreground} on ${background}`,
        );
      assert.ok(
        contrast(theme.focus, theme[background]) >= 3,
        `focus on ${background}`,
      );
    }
  }
});
