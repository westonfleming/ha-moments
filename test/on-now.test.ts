import { describe, expect, it } from "vitest";
import "../src/cards/moments-on-now";
import type { MomentsOnNow } from "../src/cards/moments-on-now";
import { fakeHass } from "./fake-hass";

describe("moments-on-now", () => {
  it("shows an open blind's position with a Close button", async () => {
    const hass = fakeHass({
      "cover.office_blind": ["open", { friendly_name: "Office blind", current_position: 60 }],
      "light.desk": ["on", { friendly_name: "Desk" }],
    });
    const card = document.createElement("moments-on-now") as MomentsOnNow;
    card.setConfig({ type: "custom:moments-on-now" });
    card.hass = hass;
    document.body.append(card);
    await card.updateComplete;
    const root = card.shadowRoot!;
    expect(root.textContent).toContain("60%");
    expect(root.querySelectorAll(".tog")).toHaveLength(1);
    const close = root.querySelector(".close") as HTMLElement;
    expect(close.getAttribute("aria-label")).toBe("Close Office blind");
    close.click();
    await Promise.resolve();
    expect(hass.calls).toEqual([["cover", "close_cover", { entity_id: "cover.office_blind" }]]);
    card.remove();
  });
});
