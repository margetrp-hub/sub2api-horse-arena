(function () {
  const WORLD = { width: 1536, height: 1024 };
  const ASSETS = "./assets/image-split-assets/final";
  const GENERATED = "./assets/image-layered/generated";

  const stationsRoot = document.getElementById("stations");
  const rankingRoot = document.getElementById("ranking");
  const stageFrame = document.getElementById("stageFrame");
  const gameStage = document.getElementById("gameStage");
  const myRank = document.getElementById("myRank");
  const selectedUser = document.getElementById("selectedUser");
  const selectedToken = document.getElementById("selectedToken");
  const selectedState = document.getElementById("selectedState");
  const syncButton = document.getElementById("syncButton");
  const claimButton = document.getElementById("claimButton");
  const boss = document.getElementById("boss");
  const bossTalk = document.getElementById("bossTalk");
  const toast = document.getElementById("toast");

  const positions = [
    [115, 455],
    [390, 455],
    [665, 455],
    [940, 455],
    [1215, 455],
    [115, 655],
    [390, 655],
    [665, 655],
    [940, 655],
    [1215, 655],
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

  const bossLines = [
    "今天 token 不冲上去，谁都别下机。",
    "前三有券，后七名今晚复盘。",
    "别摸鱼了，我在监控里都看见了。",
    "这台机子怎么在打 CS2？报表呢？",
    "SUB2API 要的不是汗水，是 token！",
    "揍我也没用，排行榜会说话。",
  ];

  let selected = players.find((player) => player.self) || players[0];
  let bossHits = 0;
  let toastTimer = 0;

  function fitStage() {
    const scale = Math.min(window.innerWidth / WORLD.width, window.innerHeight / WORLD.height);
    document.documentElement.style.setProperty("--scale", String(Math.max(0.1, scale)));
    stageFrame.style.width = `${WORLD.width * scale}px`;
    stageFrame.style.height = `${WORLD.height * scale}px`;
  }

  function formatTokens(value) {
    return `${value.toFixed(1)}万`;
  }

  function horseSheet(mode) {
    if (mode === "gaming") return `${GENERATED}/horse-gaming-sheet.png`;
    if (mode === "sleep") return `${GENERATED}/horse-sleep-sheet.png`;
    return `${GENERATED}/horse-working-sheet.png`;
  }

  function renderStations() {
    stationsRoot.innerHTML = "";
    players.forEach((player, index) => {
      const [x, y] = positions[index];
      const station = document.createElement("button");
      station.type = "button";
      station.className = "station";
      station.dataset.mode = player.mode;
      station.dataset.rank = String(player.rank);
      station.style.left = `${x}px`;
      station.style.top = `${y}px`;
      station.style.zIndex = String(20 + y);
      station.style.setProperty("--horse-speed", player.mode === "sleep" ? "1100ms" : player.mode === "gaming" ? "520ms" : "620ms");
      station.setAttribute("aria-label", `${player.name}，今日第 ${player.rank} 名，${player.state}`);

      const screenSlot = document.createElement("span");
      screenSlot.className = "screen-slot";
      const screen = document.createElement("img");
      screen.src = `${GENERATED}/screens/${player.screen}`;
      screen.alt = "";
      screenSlot.appendChild(screen);

      const workstation = document.createElement("img");
      workstation.className = "workstation";
      workstation.src = `${ASSETS}/single-crt-workstation-hard-pixel.png`;
      workstation.alt = "";

      const horseWrap = document.createElement("span");
      horseWrap.className = "horse-wrap";
      const horse = document.createElement("span");
      horse.className = "horse-sprite";
      horse.style.backgroundImage = `url("${horseSheet(player.mode)}")`;
      horseWrap.appendChild(horse);

      const label = document.createElement("span");
      label.className = "station-label";
      label.innerHTML = `<em>${player.rank}</em><span>${player.mode === "sleep" ? "AFK" : player.mode === "gaming" ? "GAME" : "WORK"}</span>`;

      const meter = document.createElement("span");
      meter.className = "token-meter";
      const meterFill = document.createElement("span");
      meterFill.style.width = `${Math.max(12, Math.min(100, (player.tokens / players[0].tokens) * 100))}%`;
      meter.appendChild(meterFill);

      station.append(screenSlot, workstation, horseWrap, label, meter);
      station.addEventListener("click", () => selectPlayer(player));
      stationsRoot.appendChild(station);
    });
  }

  function renderRanking() {
    rankingRoot.innerHTML = "";
    players.slice(0, 3).forEach((player) => {
      const item = document.createElement("li");
      item.className = "rank-card";
      item.innerHTML = `
        <span class="rank-medal">${player.rank}</span>
        <strong>${player.name}</strong>
        <span>${formatTokens(player.tokens)} token · 可领券</span>
      `;
      item.addEventListener("click", () => selectPlayer(player));
      rankingRoot.appendChild(item);
    });

    const self = players.find((player) => player.self);
    if (self) myRank.textContent = `#${self.rank}`;
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
    selectedUser.textContent = player.rank === 6 ? "你自己" : player.name;
    selectedToken.textContent = `${formatTokens(player.tokens)} token`;
    selectedState.textContent = player.state;

    if (player.rank <= 3) {
      const voucher = voucherForRank(player.rank);
      claimButton.disabled = false;
      claimButton.textContent = `领取 #${player.rank} 兑换券`;
      claimButton.dataset.code = voucher.code;
      claimButton.dataset.title = voucher.title || `TOP${player.rank} 兑换券`;
    } else {
      claimButton.disabled = true;
      claimButton.textContent = "选择前三用户";
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
      const boost = player.mode === "overdrive" ? 38 : player.mode === "working" ? 18 : player.mode === "gaming" ? 4 : 1.5;
      player.tokens += Math.random() * boost;
    });
    players.sort((a, b) => b.tokens - a.tokens);
    players.forEach((player, index) => {
      player.rank = index + 1;
    });
    renderRanking();
    renderStations();
    selectPlayer(players.find((player) => player.self) || selected);
    showToast("排行榜已同步，牛老板又开始盯屏幕了。");
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
  gameStage.dataset.ready = "true";
})();
