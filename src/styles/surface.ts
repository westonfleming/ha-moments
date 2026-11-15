import { css } from "lit";

export type Surface = "solid" | "frosted" | "glass";
export const SURFACES: Surface[] = ["solid", "frosted", "glass"];

export interface SurfaceConfig {
  /** solid | frosted | glass. Default: the theme's moments-tile-surface, else solid. */
  surface?: Surface;
  /** 0–1, how much card colour shows. Ignored by solid. Default: theme's moments-tile-opacity, else 0.72 frosted / 0.4 glass. */
  opacity?: number;
  /** Background blur in px. Default 18 frosted / 26 glass. */
  blur?: number;
}

export const validateSurface = (card: string, c: SurfaceConfig) => {
  if (c.surface !== undefined && !SURFACES.includes(c.surface)) throw new Error(`${card}: surface must be one of ${SURFACES.join(", ")}`);
  if (c.opacity !== undefined && (typeof c.opacity !== "number" || c.opacity < 0 || c.opacity > 1))
    throw new Error(`${card}: opacity must be a number from 0 to 1`);
  if (c.blur !== undefined && (typeof c.blur !== "number" || c.blur < 0)) throw new Error(`${card}: blur must be 0 or more`);
};

const themeVar = (el: HTMLElement, name: string) => {
  try {
    return getComputedStyle(el).getPropertyValue(name).trim().replace(/^["']|["']$/g, "");
  } catch {
    return "";
  }
};

/** Resolves card config over theme defaults into a surface name and inline CSS variables. */
export const resolveSurface = (el: HTMLElement, c: SurfaceConfig) => {
  const fromTheme = themeVar(el, "--moments-tile-surface") as Surface;
  const surface: Surface = c.surface ?? (SURFACES.includes(fromTheme) ? fromTheme : "solid");
  const themeOpacity = parseFloat(themeVar(el, "--moments-tile-opacity"));
  const themeBlur = parseFloat(themeVar(el, "--moments-tile-blur"));
  const opacity = surface === "solid" ? 1 : c.opacity ?? (Number.isFinite(themeOpacity) ? themeOpacity : surface === "glass" ? 0.4 : 0.72);
  const blur = surface === "solid" ? 0 : c.blur ?? (Number.isFinite(themeBlur) ? themeBlur : surface === "glass" ? 26 : 18);
  return { surface, style: `--moments-surface-opacity:${opacity * 100}%;--moments-surface-blur:${blur}px` };
};

/** Styles for an ha-card carrying class "solid" | "frosted" | "glass" (plus "dark" in dark mode). */
export const surfaceStyles = css`
  ha-card.frosted,
  ha-card.glass {
    background: color-mix(in srgb, var(--moments-tile) var(--moments-surface-opacity, 72%), transparent);
    -webkit-backdrop-filter: blur(var(--moments-surface-blur, 18px)) saturate(1.4);
    backdrop-filter: blur(var(--moments-surface-blur, 18px)) saturate(1.4);
  }
  ha-card.glass {
    -webkit-backdrop-filter: blur(var(--moments-surface-blur, 26px)) saturate(1.9);
    backdrop-filter: blur(var(--moments-surface-blur, 26px)) saturate(1.9);
    border: 1px solid rgb(255 255 255 / 0.55);
    background-image: linear-gradient(140deg, rgb(255 255 255 / 0.38), rgb(255 255 255 / 0.06) 42%, rgb(255 255 255 / 0) 60%, rgb(255 255 255 / 0.1));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.55), 0 10px 28px rgb(10 20 40 / 0.1);
  }
  ha-card.glass.dark {
    border-color: rgb(255 255 255 / 0.16);
    background-image: linear-gradient(140deg, rgb(255 255 255 / 0.14), rgb(255 255 255 / 0.03) 42%, rgb(255 255 255 / 0) 60%, rgb(255 255 255 / 0.05));
    box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.18), 0 10px 28px rgb(0 0 0 / 0.3);
  }
`;
