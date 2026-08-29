import type { HorseMode } from "../types";
import { assetPath } from "./constants";

export type Point = [number, number];

export type CharacterAsset = {
  image: string;
  frameSize: [number, number];
  frames: number;
  fps: number;
};

export type StationManifest = {
  background: string;
  workstation: {
    image: string;
    size: [number, number];
    bounds: [number, number, number, number];
    screenQuad: [Point, Point, Point, Point];
  };
  horse: CharacterAsset;
  horses: Partial<Record<HorseMode, CharacterAsset>>;
  boss?: CharacterAsset;
};

function rebaseAsset(path: string): string {
  return path.startsWith("/assets/") ? assetPath(path.slice("/assets/".length)) : path;
}

export async function loadStationManifest(): Promise<StationManifest> {
  const response = await fetch(assetPath("station-master-v3/manifest.json?v=master-v3-20260711a"));
  if (!response.ok) throw new Error("分层工位资产加载失败");
  const manifest = (await response.json()) as StationManifest;
  manifest.background = rebaseAsset(manifest.background);
  manifest.workstation.image = rebaseAsset(manifest.workstation.image);
  manifest.horse.image = rebaseAsset(manifest.horse.image);
  Object.values(manifest.horses).forEach((horse) => {
    if (horse) horse.image = rebaseAsset(horse.image);
  });
  if (manifest.boss) manifest.boss.image = rebaseAsset(manifest.boss.image);
  return manifest;
}
