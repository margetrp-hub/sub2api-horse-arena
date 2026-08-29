window.OH_HAOLEMA_VOUCHERS = {
  // 每天开榜前，把你准备好的真实兑换券码填在这里。
  // TOP1-READY / TOP2-READY / TOP3-READY 是占位符，不会真的发给用户。
  // 如果长期使用同一批券，直接改 default；如果每天不同，打开下面 dates 示例。
  default: [
    { title: "冠军兑换券", code: "TOP1-READY", note: "每日第 1 名" },
    { title: "亚军兑换券", code: "TOP2-READY", note: "每日第 2 名" },
    { title: "季军兑换券", code: "TOP3-READY", note: "每日第 3 名" },
  ],
  // 可选: 按当天日期指定不同券码。当天前三会分别领取 rank1/rank2/rank3。
  // dates: {
  //   "2026-06-27": {
  //     rank1: { title: "冠军兑换券", code: "<你的冠军券码>", note: "当天冠军专属" },
  //     rank2: { title: "亚军兑换券", code: "<你的亚军券码>", note: "当天亚军专属" },
  //     rank3: { title: "季军兑换券", code: "<你的季军券码>", note: "当天季军专属" },
  //   },
  // },
};
window.OH_HAOLEMA_VOUCHERS_READY = true;
window.SUB2API_VOUCHERS = window.OH_HAOLEMA_VOUCHERS;
window.SUB2API_VOUCHERS_READY = window.OH_HAOLEMA_VOUCHERS_READY;
document.documentElement.dataset.voucherConfig = "ready";
