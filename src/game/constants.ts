export const WORLD = {
  width: 1280,
  height: 960,
};

export const FRAME = {
  station: { width: 268, height: 220 },
  screen: { x: 106, y: 38, width: 66, height: 38 },
  screenSheet: { width: 66, height: 38, frames: 8 },
  horse: { x: 88, y: 80, width: 178, height: 178, frames: 12 },
  boss: { x: 1176, y: 286, width: 168, height: 156, frames: 12 },
  bossFx: { width: 72, height: 72, frames: 12 },
  ambient: {
    signGlint: { width: 520, height: 112, frames: 12 },
    fanMotion: { width: 176, height: 176, frames: 12 },
    roomDust: { width: 512, height: 288, frames: 12 },
  },
};

export function assetPath(path: string): string {
  return `${import.meta.env.BASE_URL}assets/${path.replace(/^\/+/, "")}`;
}

const ASSET_VERSION = "v=oh-haolema-20260818-top10";

export const ASSETS = {
  background: assetPath(`api-game-kit-v2/final/oh-haolema-master-fixed-top-row.png?${ASSET_VERSION}`),
  boss: assetPath("api-layered-scene/cow-boss-sheet.png"),
  bossHit: assetPath("frame-animation/boss/boss-hit-fx-sheet-12.png"),
  workstationBases: Array.from({ length: 10 }, (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    return assetPath(`api-layered-scene/workstation-${id}-base.png`);
  }),
  workstationFrames: Array.from({ length: 10 }, (_, index) => {
    const id = String(index + 1).padStart(2, "0");
    return assetPath(`api-layered-scene/workstation-${id}-screen-frame.png`);
  }),
  horses: {
    working: assetPath("api-layered-scene/horse-working-sheet.png"),
    gaming: assetPath("api-layered-scene/horse-gaming-sheet.png"),
    sleep: assetPath("api-layered-scene/horse-sleep-sheet.png"),
    overdrive: assetPath("api-layered-scene/horse-overdrive-sheet.png"),
  },
  screenSheets: {
    dashboard: assetPath("api-layered-scene/screen-sheets/screen-01-dashboard-sheet.png"),
    api: assetPath("api-layered-scene/screen-sheets/screen-02-api-sheet.png"),
    moba: assetPath("api-layered-scene/screen-sheets/screen-03-moba-sheet.png"),
    shooter: assetPath("api-layered-scene/screen-sheets/screen-04-shooter-sheet.png"),
    video: assetPath("api-layered-scene/screen-sheets/screen-05-video-sheet.png"),
    download: assetPath("api-layered-scene/screen-sheets/screen-06-download-sheet.png"),
    rank: assetPath("api-layered-scene/screen-sheets/screen-07-rank-sheet.png"),
    card: assetPath("api-layered-scene/screen-sheets/screen-08-card-sheet.png"),
    afk: assetPath("api-layered-scene/screen-sheets/screen-09-afk-sheet.png"),
    fishing: assetPath("api-layered-scene/screen-sheets/screen-10-fishing-sheet.png"),
  },
  ambient: {
    signGlint: assetPath(`frame-animation/environment/sign-glint-sheet-12.png?${ASSET_VERSION}`),
    fanMotion: assetPath(`frame-animation/environment/fan-motion-sheet-12.png?${ASSET_VERSION}`),
    roomDust: assetPath(`frame-animation/environment/room-dust-sheet-12.png?${ASSET_VERSION}`),
  },
};

export const ASSET_LIST = [
  ...Object.values(ASSETS.ambient),
];
