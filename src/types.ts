export type HorseMode = "working" | "gaming" | "sleep" | "overdrive";

export type RankingSource = "sub2api" | "newapi";

export type ScreenTheme =
  | "dashboard"
  | "api"
  | "moba"
  | "shooter"
  | "video"
  | "download"
  | "rank"
  | "card"
  | "afk"
  | "fishing";

export type Player = {
  rank: number;
  userId?: number | string;
  name: string;
  tokens: number;
  state: string;
  mode: HorseMode;
  screen: ScreenTheme;
  title?: string;
  self?: boolean;
  rankDelta?: number;
  tokenDelta?: number;
};

export type StationSlot = {
  x: number;
  y: number;
  row: "back" | "front";
};

export type Voucher = {
  title: string;
  code: string;
  note?: string;
};

export type VoucherConfig = {
  default?: Voucher[];
  dates?: Record<string, Record<string, Voucher>>;
};

declare global {
  interface Window {
    OH_HAOLEMA_VOUCHERS?: VoucherConfig;
    SUB2API_VOUCHERS?: VoucherConfig;
    OH_HAOLEMA_RUNTIME?: {
      apiBase?: string;
      rankingPath?: string;
      pollMs?: number;
      selfUserId?: number | string;
      source?: RankingSource;
    };
  }
}
