function unavailable(message = "抽奖与积分兑换暂未开放", code = "lottery_not_open") {
  return Object.assign(new Error(message), { status: 503, code });
}

export function createPointsLotteryService(config, fetchImpl = fetch) {
  return {
    async getState(userId) {
      if (!config.pointsBaseUrl || !config.pointsReadToken) {
        throw unavailable("积分服务尚未接通", "points_not_configured");
      }
      const base = new URL(config.pointsBaseUrl);
      if (base.protocol !== "https:" && !(base.protocol === "http:" && ["127.0.0.1", "localhost", "erdai-core"].includes(base.hostname))) {
        throw unavailable("积分服务地址配置无效", "points_not_configured");
      }
      const endpoint = new URL("/points-bridge/v1/account", base);
      const sourceUrl = config.source === "sub2api" ? config.sub2ApiBaseUrl : config.baseUrl;
      endpoint.search = new URLSearchParams({
        transport: config.source,
        transportInstance: config.pointsIdentityInstance || new URL(sourceUrl).origin,
        senderRef: String(userId),
      }).toString();
      const response = await fetchImpl(endpoint, {
        headers: { Accept: "application/json", "X-ErDai-Points-Token": config.pointsReadToken },
        redirect: "error",
        signal: AbortSignal.timeout(8000),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409 && payload?.error?.code === "points_identity_unverified") {
          throw Object.assign(new Error("站点账号尚未核验关联积分账户"), { status: 409, code: "points_identity_unverified" });
        }
        throw unavailable("积分服务暂时不可用", "points_unavailable");
      }
      if (!Number.isSafeInteger(payload?.data?.balance)) throw unavailable("积分服务返回数据无效", "points_invalid_response");
      return {
        points: payload.data.balance,
        accountId: payload.data.accountId,
        paidAmount: 0, threshold: 50, starterTokens: 0, starterDraws: 0,
        lotteryTokens: 0, remainingDraws: 0, tokenExchangeCost: 0, missStreak: 0,
        available: false, reason: "抽奖与积分兑换暂未开放",
        animation: { key: "pixi-runtime", src: "runtime" },
      };
    },
    async draw() { throw unavailable(); },
    async exchangePoints() { throw unavailable(); },
  };
}
