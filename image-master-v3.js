(function () {
  const WORLD = { width: 1536, height: 864 };
  const KIT = "./assets/image-master-v3/final";

  const stageFrame = document.getElementById("stageFrame");
  const stationsRoot = document.getElementById("stations");
  const rankingRoot = document.getElementById("ranking");
  const boss = document.getElementById("boss");
  const bossTalk = document.getElementById("bossTalk");
  const toast = document.getElementById("toast");
  const syncButton = document.getElementById("syncButton");
  const claimButton = document.getElementById("claimButton");
  const couponHint = document.getElementById("couponHint");
  const myRank = document.getElementById("myRank");
  const myTokenMini = document.getElementById("myTokenMini");
  const totalToken = document.getElementById("totalToken");
  const selfLine = document.getElementById("selfLine");
  const selectedUser = document.getElementById("selectedUser");
  const selectedToken = document.getElementById("selectedToken");
  const selectedState = document.getElementById("selectedState");
  const selectedReward = document.getElementById("selectedReward");

  const positions = [
    [118, 324, 0.84, "back"],
    [324, 324, 0.84, "back"],
    [530, 324, 0.84, "back"],
    [736, 324, 0.84, "back"],
    [942, 324, 0.84, "back"],
    [82, 522, 0.94, "front"],
    [306, 522, 0.94, "front"],
    [530, 522, 0.94, "front"],
    [754, 522, 0.94, "front"],
    [978, 522, 0.94, "front"],
  ];

  const players = [
    { rank: 1, name: "155***@qq.com", tokens: 3867.2, state: "爆肝跑 API", mode: "overdrive", screen: "screen-01-dashboard.gif" },
    { rank: 2, name: "ada***@gmail.com", tokens: 3012.8, state: "脚本巡检中", mode: "working", screen: "screen-02-api.gif" },
    { rank: 3, name: "wolf***@outlook.com", tokens: 2688.4, state: "LOL 摸鱼", mode: "gaming", screen: "screen-03-moba.gif" },
    { rank: 4, name: "cs2***@foxmail.com", tokens: 2214.1, state: "CS2 开黑", mode: "gaming", screen: "screen-04-shooter.gif" },
    { rank: 5, name: "video***@qq.com", tokens: 1960.6, state: "看番充电", mode: "gaming", screen: "screen-05-video.gif" },
    { rank: 6, name: "你自己", tokens: 1310.7, state: "工作中", mode: "working", screen: "screen-06-download.gif", self: true },
    { rank: 7, name: "rank***@qq.com", tokens: 1188.3, state: "盯排行榜", mode: "working", screen: "screen-07-rank.gif" },
    { rank: 8, name: "card***@gmail.com", tokens: 996.9, state: "纸牌摸鱼", mode: "gaming", screen: "screen-08-card.gif" },
    { rank: 9, name: "afk***@qq.com", tokens: 620.4, state: "睡着了", mode: "sleep", screen: "screen-09-afk.gif" },
    { rank: 10, name: "fish***@qq.com", tokens: 512.6, state: "钓鱼中", mode: "sleep", screen: "screen-10-fishing.gif" },
  ];

  const modeText = {
    overdrive: "爆肝",
    working: "工作",
    gaming: "摸鱼",
    sleep: "AFK",
  };

  const stationFx = {
    overdrive: "fx-overdrive-sheet-12.png",
    working: "fx-working-sheet-12.png",
    gaming: "fx-gaming-sheet-12.png",
    sleep: "fx-sleep-sheet-12.png",
  };

  const bossLines = [
    "前三有券，后面的继续加班。",
    "别摸鱼了，监控里全是游戏画面。",
    "SUB2API 要的是 token，不是借口。",
    "谁进前三谁下机，剩下的写报告。",
    "你再揍我，榜单也不会自己涨。",
  ];

  let selected = players.find((player) => player.self) || players[0];
  let toastTimer = 0;
  let bossHits = 0;

  function fitStage() {
    const scale = Math.min(window.innerWidth / WORLD.width, window.innerHeight / WORLD.height);
    const safeScale = Math.max(0.1, scale);
    document.documentElement.style.setProperty("--scale", String(safeScale));
    stageFrame.style.width = `${WORLD.width * safeScale}px`;
    stageFrame.style.height = `${WORLD.height * safeScale}px`;
  }

  function formatTokens(value) {
    return `${value.toFixed(1)}万`;
  }

  function updateSummary() {
    const total = players.reduce((sum, player) => sum + player.tokens, 0);
    const self = players.find((player) => player.self);
    totalToken.textContent = formatTokens(total);
    if (self) {
      myRank.textContent = `#${self.rank}`;
      myTokenMini.textContent = formatTokens(self.tokens);
      selfLine.textContent = `#${self.rank} ${self.name}`;
    }
  }

  function renderStations() {
    stationsRoot.innerHTML = "";
    players.forEach((player, index) => {
      const [x, y, scale, row] = positions[index];
      const station = document.createElement("button");
      station.type = "button";
      station.className = "station";
      station.dataset.rank = String(player.rank);
      station.dataset.mode = player.mode;
      station.dataset.row = row;
      station.style.left = `${x}px`;
      station.style.top = `${y}px`;
      station.style.transform = `scale(${scale})`;
      station.style.zIndex = String(20 + Math.round(y * scale));
      station.style.setProperty("--station-speed", player.mode === "sleep" ? "1220ms" : player.mode === "gaming" ? "620ms" : "760ms");
      station.setAttribute("aria-label", `${player.name}，今日第 ${player.rank} 名，${player.state}`);

      const shadow = document.createElement("span");
      shadow.className = "station-shadow";

      const screenSlot = document.createElement("span");
      screenSlot.className = "station-screen";
      const screen = document.createElement("img");
      screen.src = `${KIT}/screens/${player.screen}`;
      screen.alt = "";
      screenSlot.appendChild(screen);

      const sprite = document.createElement("span");
      sprite.className = "station-sprite";

      const fx = document.createElement("span");
      fx.className = "station-fx";
      fx.style.backgroundImage = `url("./assets/frame-animation/station-fx/${stationFx[player.mode]}")`;

      const label = document.createElement("span");
      label.className = "station-label";
      label.innerHTML = `<em>${player.rank}</em><span>${modeText[player.mode]}</span>`;

      const meter = document.createElement("span");
      meter.className = "token-meter";
      const meterFill = document.createElement("span");
      meterFill.style.width = `${Math.max(10, Math.min(100, (player.tokens / players[0].tokens) * 100))}%`;
      meter.appendChild(meterFill);

      station.append(shadow, screenSlot, sprite, fx, label, meter);
      station.addEventListener("click", () => selectPlayer(player));
      stationsRoot.appendChild(station);
    });
  }

  function renderRanking() {
    rankingRoot.innerHTML = "";
    players.slice(0, 3).forEach((player) => {
      const item = document.createElement("li");
      item.className = "rank-card";
      item.dataset.rank = String(player.rank);
      item.innerHTML = `
        <span class="rank-medal">${player.rank}</span>
        <span>
          <strong>${player.name}</strong>
          <span>${formatTokens(player.tokens)} token</span>
          <small>可领取兑换券</small>
        </span>
      `;
      item.addEventListener("click", () => selectPlayer(player));
      rankingRoot.appendChild(item);
    });
    updateSummary();
  }

  function voucherForRank(rank) {
    const today = new Date().toISOString().slice(0, 10);
    const config = window.SUB2API_VOUCHERS || {};
    const dated = config.dates && config.dates[today] && config.dates[today][`rank${rank}`];
    const fallback = Array.isArray(config.default) ? config.default[rank - 1] : null;
    return dated || fallback || { title: `TOP${rank} 兑换券`, code: `TOP${rank}-READY`, note: "请在 voucher-config.js 填入真实券码" };
  }

  function selectPlayer(player) {
    selected = player;
    document.querySelectorAll(".station").forEach((station) => {
      station.classList.toggle("is-selected", Number(station.dataset.rank) === player.rank);
    });
    document.querySelectorAll(".rank-card").forEach((card) => {
      card.classList.toggle("is-selected", Number(card.dataset.rank) === player.rank);
    });
    selectedUser.textContent = player.name;
    selectedToken.textContent = `${formatTokens(player.tokens)} token`;
    selectedState.textContent = player.state;

    if (player.rank <= 3) {
      const voucher = voucherForRank(player.rank);
      claimButton.disabled = false;
      claimButton.textContent = `领取 #${player.rank} 兑换券`;
      claimButton.dataset.code = voucher.code;
      claimButton.dataset.title = voucher.title || `TOP${player.rank} 兑换券`;
      couponHint.textContent = `${player.name} 已进入前三`;
      selectedReward.textContent = voucher.title || `TOP${player.rank} 兑换券`;
    } else {
      claimButton.disabled = true;
      claimButton.textContent = "未选中前三";
      couponHint.textContent = "选择前三名用户领取";
      selectedReward.textContent = "未进入前三";
      delete claimButton.dataset.code;
      delete claimButton.dataset.title;
    }
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-showing");
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-showing"), 2200);
  }

  function syncTokens() {
    players.forEach((player) => {
      const boost = player.mode === "overdrive" ? 42 : player.mode === "working" ? 20 : player.mode === "gaming" ? 5 : 1.8;
      player.tokens += Math.random() * boost;
    });
    players.sort((a, b) => b.tokens - a.tokens);
    players.forEach((player, index) => {
      player.rank = index + 1;
    });
    renderRanking();
    renderStations();
    selectPlayer(players.find((player) => player.self) || selected);
    showToast("榜单刷新了，牛老板又开始盯屏幕。");
  }

  boss.addEventListener("click", () => {
    bossHits += 1;
    boss.classList.remove("is-hit");
    void boss.offsetWidth;
    boss.classList.add("is-hit");
    bossTalk.textContent = bossLines[bossHits % bossLines.length];
    showToast(`你揍了牛老板 ${bossHits} 下，他嘴更硬了。`);
  });

  boss.addEventListener("animationend", (event) => {
    if (event.animationName === "hitFx") boss.classList.remove("is-hit");
  });

  claimButton.addEventListener("click", () => {
    if (claimButton.disabled || !selected || selected.rank > 3) return;
    const title = claimButton.dataset.title || `TOP${selected.rank} 兑换券`;
    const code = claimButton.dataset.code || `TOP${selected.rank}-READY`;
    showToast(`${title}：${code}`);
  });

  syncButton.addEventListener("click", syncTokens);
  window.addEventListener("resize", fitStage);

  fitStage();
  renderRanking();
  renderStations();
  selectPlayer(selected);
})();
