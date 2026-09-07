function failure(code, message, status = 503) {
  return Object.assign(new Error(message), { code, status });
}

export function createSitePointsService(config, fetchImpl = fetch) {
  return {
    async request(userId, action = "account", method = "GET", { limit = 20, offset = 0 } = {}) {
      if (!Number.isSafeInteger(Number(userId)) || Number(userId) < 1 || String(Number(userId)) !== String(userId)) {
        throw failure("unauthorized", "请先登录", 401);
      }
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 50 || !Number.isSafeInteger(offset) || offset < 0 || offset > 1000000) {
        throw failure("invalid_page", "积分流水分页无效", 400);
      }
      if (!config.pointsBaseUrl || config.pointsSiteToken?.length < 32 || !config.pointsSiteToken) {
        throw failure("points_not_configured", "积分服务尚未接通");
      }
      const base = new URL(config.pointsBaseUrl);
      if (base.protocol !== "https:" && !(base.protocol === "http:" && ["127.0.0.1", "localhost", "erdai-core"].includes(base.hostname))) {
        throw failure("points_not_configured", "积分服务地址配置无效");
      }
      if (!(action === "account" && ["GET", "POST"].includes(method)) && !(action === "checkin" && method === "POST")) {
        throw failure("not_found", "积分接口不存在", 404);
      }
      const endpoint = new URL(`/points-bridge/v1/site/${action}`, base);
      endpoint.search = new URLSearchParams({ limit, offset, ...(method === "GET" ? { senderRef: userId } : {}) });
      let response;
      try {
        response = await fetchImpl(endpoint, {
          method, redirect: "error", signal: AbortSignal.timeout(8000),
          headers: { Accept: "application/json", "Content-Type": "application/json", "X-ErDai-Points-Token": config.pointsSiteToken },
          ...(method === "POST" ? { body: JSON.stringify({ senderRef: String(userId) }) } : {}),
        });
      } catch { throw failure("points_unavailable", "积分服务暂时不可用，请稍后重试"); }
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        if (response.status === 409 && payload?.error?.code === "points_account_required") {
          throw failure("points_account_required", "请先开通积分账户", 409);
        }
        if (response.status === 409 && payload?.error?.code === "checkin_disabled") {
          throw failure("checkin_disabled", "签到暂未开放", 409);
        }
        throw failure("points_unavailable", "积分服务暂时不可用，请稍后重试");
      }
      const data = payload?.data;
      if (!data || typeof data.accountId !== "string" || !Number.isSafeInteger(data.balance) || !Number.isSafeInteger(data.checkInPoints) ||
          typeof data.checkedIn !== "boolean" || typeof data.checkInEnabled !== "boolean" || typeof data.linked !== "boolean" ||
          !/^\d{4}-\d{2}-\d{2}$/.test(data.day) || typeof data.hasMore !== "boolean" ||
          !Number.isSafeInteger(data.offset) || data.limit !== limit || !Array.isArray(data.entries) || data.entries.length > limit ||
          data.entries.some((entry) => typeof entry.id !== "string" || typeof entry.type !== "string" || !Number.isSafeInteger(entry.points) || typeof entry.createdAt !== "string")) {
        throw failure("points_invalid_response", "积分数据暂时无法确认，请稍后重试");
      }
      return { data: {
        accountId: data.accountId, balance: data.balance, day: data.day, checkedIn: data.checkedIn,
        checkInPoints: data.checkInPoints, checkInEnabled: data.checkInEnabled, linked: data.linked,
        entries: data.entries.map(({ id, type, points, createdAt }) => ({ id, type, points, createdAt })),
        hasMore: data.hasMore, offset: data.offset, limit: data.limit,
      }, awarded: payload.awarded === true };
    },
  };
}
