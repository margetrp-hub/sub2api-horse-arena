(function () {
  const WORLD = { width: 2048, height: 1152 };
  const STATION_ROOT = "./assets/generated-stations-v2-blank";
  const SCREEN_ROOT = "./assets/generated-screen-gifs-fit";
  const FRAME_ROOT = "./assets/generated-screen-frames";
  const OCCLUDER_ROOT = "./assets/generated-station-occluders";
  const HORSE_FOREGROUND_ROOT = "./assets/generated-horse-foregrounds-full";
  const SCREEN_FOREGROUND_ROOT = "./assets/generated-screen-foreground-masks";
  const HORSE_ROOT = "./assets/horse-motion-parts";
  const FX_ROOT = "./assets/frame-animation/station-fx";

  const stageFrame = document.getElementById("stageFrame");
  const gameStage = document.getElementById("gameStage");
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

  const slots = [
    { x: 88, y: 385, w: 335, h: 385, screen: { x: 51, y: 37, w: 142, h: 102 }, row: "back" },
    { x: 462, y: 385, w: 340, h: 385, screen: { x: 58, y: 39, w: 138, h: 101 }, row: "back" },
    { x: 832, y: 395, w: 340, h: 385, screen: { x: 66, y: 33, w: 132, h: 96 }, row: "back" },
    { x: 1204, y: 389, w: 345, h: 385, screen: { x: 71, y: 39, w: 136, h: 96 }, row: "back" },
    { x: 1588, y: 388, w: 375, h: 385, screen: { x: 65, y: 41, w: 128, h: 96 }, row: "back" },
    { x: 88, y: 735, w: 360, h: 460, screen: { x: 18, y: 19, w: 142, h: 106 }, row: "front" },
    { x: 462, y: 735, w: 375, h: 460, screen: { x: 51, y: 19, w: 136, h: 104 }, row: "front" },
    { x: 832, y: 735, w: 375, h: 460, screen: { x: 71, y: 19, w: 128, h: 102 }, row: "front" },
    { x: 1204, y: 735, w: 385, h: 460, screen: { x: 64, y: 20, w: 124, h: 102 }, row: "front" },
    { x: 1588, y: 735, w: 490, h: 460, screen: { x: 62, y: 21, w: 154, h: 102 }, row: "front" },
  ];

  const screens = [
    "station-screen-01-dashboard.gif",
    "station-screen-02-api.gif",
    "station-screen-03-moba.gif",
    "station-screen-04-shooter.gif",
    "station-screen-05-video.gif",
    "station-screen-06-download.gif",
    "station-screen-07-rank.gif",
    "station-screen-08-card.gif",
    "station-screen-09-afk.gif",
    "station-screen-10-fishing.gif",
  ];

  const players = [
    { rank: 1, name: "155***@qq.com", tokens: 3867.2, state: "爆肝跑 API", mode: "overdrive" },
    { rank: 2, name: "ada***@gmail.com", tokens: 3012.8, state: "脚本巡检中", mode: "working" },
    { rank: 3, name: "wolf***@outlook.com", tokens: 2688.4, state: "LOL 摸鱼", mode: "gaming" },
    { rank: 4, name: "cs2***@foxmail.com", tokens: 2214.1, state: "CS2 开黑", mode: "gaming" },
    { rank: 5, name: "video***@qq.com", tokens: 1960.6, state: "看番充电", mode: "gaming" },
    { rank: 6, name: "你自己", tokens: 1310.7, state: "工作中", mode: "working", self: true },
    { rank: 7, name: "rank***@qq.com", tokens: 1188.3, state: "盯排行榜", mode: "working" },
    { rank: 8, name: "card***@gmail.com", tokens: 996.9, state: "纸牌摸鱼", mode: "gaming" },
    { rank: 9, name: "afk***@qq.com", tokens: 620.4, state: "睡着了", mode: "sleep" },
    { rank: 10, name: "fish***@qq.com", tokens: 512.6, state: "钓鱼中", mode: "sleep" },
  ];

  const modeText = {
    overdrive: "爆肝",
    working: "工作",
    gaming: "摸鱼",
    sleep: "AFK",
  };

  const fxByMode = {
    overdrive: "fx-overdrive-sheet-12.png",
    working: "fx-working-sheet-12.png",
    gaming: "fx-gaming-sheet-12.png",
    sleep: "fx-sleep-sheet-12.png",
  };

  const bossLines = [
    "前三有券，后面的继续卷。",
    "谁在打游戏？我都看见屏幕了。",
    "SUB2API 要的是 token，不是借口。",
    "榜单不涨，会议就涨。",
    "别揍了，需求我改还不行吗？",
    "今天谁进前三，谁下机最早。",
  ];

  let selected = players.find((player) => player.self) || players[0];
  let toastTimer = 0;
  let bossHits = 0;

  function fitStage() {
    const safeW = Math.max(320, stageFrame.clientWidth);
    const safeH = Math.max(240, stageFrame.clientHeight);
    const scale = Math.min(safeW / WORLD.width, safeH / WORLD.height);
    const safeScale = Math.max(0.1, scale);
    document.documentElement.style.setProperty("--scale", String(safeScale));
    document.documentElement.style.setProperty("--stage-x", `${Math.round((safeW - WORLD.width * safeScale) / 2)}px`);
    document.documentElement.style.setProperty("--stage-y", `${Math.round((safeH - WORLD.height * safeScale) / 2)}px`);
  }

  function formatTokens(value) {
    return `${value.toFixed(1)}万`;
  }

  function stationPath(index, suffix) {
    return `${suffix}/station-${String(index + 1).padStart(2, "0")}`;
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
      const slot = slots[index];
      const station = document.createElement("div");
      station.className = "station";
      station.dataset.rank = String(player.rank);
      station.dataset.mode = player.mode;
      station.dataset.row = slot.row;
      station.style.left = `${slot.x}px`;
      station.style.top = `${slot.y}px`;
      station.style.width = `${slot.w}px`;
      station.style.height = `${slot.h}px`;
      station.style.zIndex = String(20 + Math.round(slot.y / 10));
      station.style.setProperty("--horse-speed", player.mode === "sleep" ? "1500ms" : player.mode === "gaming" ? "680ms" : "860ms");

      const blank = document.createElement("img");
      blank.className = "station-blank";
      blank.src = `${stationPath(index, STATION_ROOT)}-blank-screen.png`;
      blank.alt = "";

      const screenSlot = document.createElement("span");
      screenSlot.className = "screen-slot";
      screenSlot.style.left = `${slot.screen.x}px`;
      screenSlot.style.top = `${slot.screen.y}px`;
      screenSlot.style.width = `${slot.screen.w}px`;
      screenSlot.style.height = `${slot.screen.h}px`;
      const screen = document.createElement("img");
      screen.src = `${SCREEN_ROOT}/${screens[index]}`;
      screen.alt = "";
      screenSlot.appendChild(screen);

      const frame = document.createElement("img");
      frame.className = "screen-frame";
      frame.src = `${stationPath(index, FRAME_ROOT)}-screen-frame.png`;
      frame.alt = "";

      const occluder = document.createElement("img");
      occluder.className = "screen-occluder";
      occluder.src = `${stationPath(index, OCCLUDER_ROOT)}-screen-occluder.png`;
      occluder.alt = "";

      const screenForeground = document.createElement("img");
      screenForeground.className = "screen-foreground";
      screenForeground.src = `${stationPath(index, SCREEN_FOREGROUND_ROOT)}-screen-foreground.png`;
      screenForeground.alt = "";

      const horseForeground = document.createElement("img");
      horseForeground.className = "horse-foreground";
      horseForeground.src = `${stationPath(index, HORSE_FOREGROUND_ROOT)}-horse-full.png`;
      horseForeground.alt = "";

      const horse = document.createElement("img");
      horse.className = "horse-motion";
      horse.src = `${stationPath(index, HORSE_ROOT)}-horse-motion.png`;
      horse.alt = "";

      const fx = document.createElement("span");
      fx.className = "station-fx";
      fx.style.left = `${slot.screen.x + slot.screen.w * 0.22}px`;
      fx.style.top = `${slot.screen.y + slot.screen.h * 0.62}px`;
      fx.style.backgroundImage = `url("${FX_ROOT}/${fxByMode[player.mode]}")`;

      const label = document.createElement("span");
      label.className = "station-label";
      label.style.left = `${Math.min(slot.w - 118, slot.screen.x + slot.screen.w * 0.35)}px`;
      label.style.top = `${slot.row === "front" ? slot.h - 92 : slot.h - 76}px`;
      label.innerHTML = `<b>${player.rank}</b><span>${modeText[player.mode]}</span>`;

      const meter = document.createElement("span");
      meter.className = "token-meter";
      meter.style.left = `${Math.min(slot.w - 126, slot.screen.x + slot.screen.w * 0.28)}px`;
      meter.style.top = `${slot.row === "front" ? slot.h - 50 : slot.h - 36}px`;
      const meterFill = document.createElement("span");
      meterFill.style.width = `${Math.max(10, Math.min(100, (player.tokens / players[0].tokens) * 100))}%`;
      meter.appendChild(meterFill);

      const hit = document.createElement("button");
      hit.type = "button";
      hit.className = "station-hit";
      hit.setAttribute("aria-label", `${player.name}，今日第 ${player.rank} 名，${player.state}`);
      hit.addEventListener("click", () => selectPlayer(player));

      station.append(blank, screenSlot, frame, occluder, screenForeground, horseForeground, horse, fx, label, meter, hit);
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
    showToast("榜单刷新了，屏幕继续动，牛老板继续盯。");
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
    showToast(`${title}: ${code}`);
  });

  syncButton.addEventListener("click", syncTokens);
  window.addEventListener("resize", fitStage);

  gameStage.classList.add("is-video-mode");
  fitStage();
  renderRanking();
  renderStations();
  selectPlayer(selected);
})();
