import type { Voucher } from "../types";

export function voucherForRank(rank: number): Voucher {
  const today = new Date().toISOString().slice(0, 10);
  const config = window.OH_HAOLEMA_VOUCHERS ?? window.SUB2API_VOUCHERS ?? {};
  const dated = config.dates?.[today]?.[`rank${rank}`];
  const fallback = Array.isArray(config.default) ? config.default[rank - 1] : undefined;
  return dated ?? fallback ?? { title: `TOP${rank} 兑换券`, code: `TOP${rank}-READY` };
}
