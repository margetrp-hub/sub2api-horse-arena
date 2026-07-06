(function () {
  const WORLD = { w: 1280, h: 720 };
  const ROOT = "./assets/game-kit";
  const canvas = document.getElementById("gameCanvas");
  const ctx = canvas.getContext("2d");
  const rankingRoot = document.getElementById("ranking");
  const toast = document.getElementById("toast");
  const claimButton = document.getElementById("claimButton");
  const couponHint = document.getElementById("couponHint");
  const selfLine = document.getElementById("selfLine");
  const selectedUser = document.getElementById("selectedUser");
  const selectedToken = document.getElementById("selectedToken");
  const selectedState = document.getElementById("selectedState");

  ctx.imageSmoothingEnabled = false;

  const players = [
    { rank: 1, name: "155***@qq.com", tokens: 3867.2, state: "API 冲刺中", mode: "working", screen: "dashboard" },
    { rank: 2, name: "ada***@gmail.com", tokens: 3012.8, state: "脚本巡检中", mode: "working", screen: "api" },
    { rank: 3, name: "wolf***@outlook.com", tokens: 2688.4, state: "LOL 摸鱼中", mode: "gaming", screen: "moba" },
    { rank: 4, name: "cs2***@foxmail.com", tokens: 2214.1, state: "CS2 开黑中", mode: "gaming", screen: "shooter" },
    { rank: 5, name: "video***@qq.com", tokens: 1960.6, state: "看番充电", mode: "gaming", screen: "video" },
    { rank: 6, name: "你自己", tokens: 1310.7, state: "工作中", mode: "working", screen: "download", self: true },
    { rank: 7, name: "rank***@qq.com", tokens: 1188.3, state: "盯排行榜", mode: "working", screen: "rank" },
    { rank: 8, name: "card***@gmail.com", tokens: 996.9, state: "纸牌摸鱼", mode: "gaming", screen: "card" },
    { rank: 9, name: "afk***@qq.com", tokens: 620.4, state: "睡着了", mode: "sleep", screen: "afk" },
    { rank: 10, name: "fish***@qq.com", tokens: 512.6, state: "钓鱼中", mode: "sleep", screen: "fishing" },
  ];

  const stations = [
    { x: 60, y: 270 },
    { x: 305, y: 270 },
    { x: 550, y: 270 },
    { x: 795, y: 270 },
    { x: 1040, y: 270 },
    { x: 60, y: 470 },
    { x: 305, y: 470 },
    { x: 550, y: 470 },
    { x: 795, y: 470 },
    { x: 1040, y: 470 },
  ];

  const frameSize = {
    station: { w: 220, h: 180 },
    screen: { x: 50, y: 36, w: 78, h: 46 },
    horse: { w: 150, h: 150 },
    boss: { w: 96, h: 112 },
    fx: { w: 64, h: 64 },
  };

  const boss = { x: 586, y: 112, w: 112, h: 132 };
  const bossPhrases = ["今天 token 冲起来!", "别摸鱼, 前三有券!", "报告呢? 日榜呢?", "牛马也要有梦想!"];
  const popups = [];

  let selected = players.find((player) => player.self) || players[0];
  let hoveredRank = 0;
  let toastTimer = 0;
  let bossHits = 0;
  let bossHitUntil = 0;
  let lastTime = 0;

  const assets = {
    background: image(`${ROOT}/netbar-background-empty.png`),
    station: image(`${ROOT}/workstation-crt-empty.png`),
    boss: image(`${ROOT}/cow-boss-sheet.png`),
    bossHit: image(`${ROOT}/boss-hit-fx-sheet.png`),
    horses: {
      working: image(`${ROOT}/horse-working-sheet.png`),
      gaming: image(`${ROOT}/horse-gaming-sheet.png`),
      sleep: image(`${ROOT}/horse-sleep-sheet.png`),
      overdrive: image(`${ROOT}/horse-working-sheet.png`),
    },
  };

  function image(src) {
    const img = new Image();
    img.src = src;
    return img;
  }

  function whenImagesReady() {
    const all = [assets.background, assets.station, assets.boss, assets.bossHit, ...Object.values(assets.horses)];
    return Promise.all(
      all.map((img) => {
        if (img.complete && img.naturalWidth) return Promise.resolve();
        return new Promise((resolve, reject) => {
          img.addEventListener("load", resolve, { once: true });
          img.addEventListener("error", () => reject(new Error(`Failed to load ${img.src}`)), { once: true });
        });
      }),
    );
  }

  function formatTokens(value) {
    return `${value.toFixed(1)}万`;
  }

  function voucherForRank(rank) {
    const today = new Date().toISOString().slice(0, 10);
    const config = window.SUB2API_VOUCHERS || {};
    const dated = config.dates && config.dates[today] && config.dates[today][`rank${rank}`];
    const fallback = Array.isArray(config.default) ? config.default[rank - 1] : null;
    return dated || fallback || { title: `TOP${rank} 兑换券`, code: `TOP${rank}-READY` };
  }

  function drawFrame(img, frameIndex, frameW, frameH, x, y, w = frameW, h = frameH) {
    const frameCount = Math.max(1, Math.floor(img.naturalWidth / frameW));
    const frame = frameIndex % frameCount;
    ctx.drawImage(img, frame * frameW, 0, frameW, frameH, Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function drawScene(time) {
    lastTime = time;
    ctx.clearRect(0, 0, WORLD.w, WORLD.h);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(assets.background, 0, 0, WORLD.w, WORLD.h);
    drawBoss(time);
    drawBossSpeech(time);
    stations.forEach((slot, index) => drawStation(slot, players[index], index, time));
    drawPopups(time);
    drawHud(time);
    requestAnimationFrame(drawScene);
  }

  function drawStation(slot, player, index, time) {
    const selectedStation = selected.rank === player.rank;
    const hoverStation = hoveredRank === player.rank;
    const screen = screenRect(slot);
    const bob = player.mode === "sleep" ? 0 : Math.round(Math.sin(time / 180 + index) * 2);

    ctx.drawImage(assets.station, slot.x, slot.y, frameSize.station.w, frameSize.station.h);
    drawScreenContent(player.screen, screen, time, index);
    drawScreenGlass(screen, time);

    const sheet = assets.horses[player.mode] || assets.horses.working;
    const speed = player.mode === "sleep" ? 360 : player.mode === "gaming" ? 95 : player.mode === "overdrive" ? 72 : 130;
    const frame = Math.floor((time + index * 79) / speed) % 4;
    const horsePose =
      player.mode === "sleep"
        ? { x: slot.x + 126, y: slot.y + 70, w: 128, h: 128 }
        : { x: slot.x + 120, y: slot.y + 50 + bob, w: 136, h: 136 };
    drawFrame(sheet, frame, frameSize.horse.w, frameSize.horse.h, horsePose.x, horsePose.y, horsePose.w, horsePose.h);

    drawStationShadow(slot);
    drawRankPlate(player, slot, selectedStation, hoverStation);
    drawTokenMeter(player, slot);
  }

  function screenRect(slot) {
    return {
      x: slot.x + frameSize.screen.x,
      y: slot.y + frameSize.screen.y,
      w: frameSize.screen.w,
      h: frameSize.screen.h,
    };
  }

  function drawScreenContent(theme, rect, time, index) {
    ctx.save();
    ctx.beginPath();
    ctx.rect(rect.x, rect.y, rect.w, rect.h);
    ctx.clip();
    ctx.fillStyle = "#07110f";
    ctx.fillRect(rect.x, rect.y, rect.w, rect.h);
    drawScanlines(rect);

    const tick = Math.floor(time / 120);
    if (theme === "dashboard") drawDashboard(rect, time);
    if (theme === "api") drawApiLog(rect, tick);
    if (theme === "moba") drawMoba(rect, time);
    if (theme === "shooter") drawShooter(rect, time);
    if (theme === "video") drawVideo(rect, time);
    if (theme === "download") drawDownload(rect, time);
    if (theme === "rank") drawRankScreen(rect, time);
    if (theme === "card") drawCardScreen(rect, time);
    if (theme === "afk") drawAfk(rect, time);
    if (theme === "fishing") drawFishing(rect, time, index);
    ctx.restore();
  }

  function drawScanlines(rect) {
    ctx.fillStyle = "rgba(91, 200, 255, 0.11)";
    for (let y = rect.y + 2; y < rect.y + rect.h; y += 5) {
      ctx.fillRect(rect.x + 2, y, rect.w - 4, 1);
    }
    ctx.strokeStyle = "#47dca0";
    ctx.lineWidth = 1;
    ctx.strokeRect(rect.x + 1, rect.y + 1, rect.w - 2, rect.h - 2);
  }

  function drawDashboard(rect, time) {
    pixelText("TOKENS", rect.x + 5, rect.y + 10, "#63e990", 8);
    for (let i = 0; i < 6; i += 1) {
      const h = 8 + ((i * 5 + Math.floor(time / 130)) % 24);
      ctx.fillStyle = i % 2 ? "#5bc8ff" : "#63e990";
      ctx.fillRect(rect.x + 8 + i * 10, rect.y + rect.h - h - 4, 7, h);
    }
    ctx.fillStyle = "#f3b43f";
    ctx.beginPath();
    ctx.moveTo(rect.x + 55, rect.y + 14);
    ctx.lineTo(rect.x + 70, rect.y + 23);
    ctx.lineTo(rect.x + 59, rect.y + 27);
    ctx.closePath();
    ctx.fill();
  }

  function drawApiLog(rect, tick) {
    pixelText("API", rect.x + 5, rect.y + 10, "#5bc8ff", 8);
    for (let i = 0; i < 4; i += 1) {
      const y = rect.y + 16 + i * 7;
      ctx.fillStyle = (tick + i) % 3 === 0 ? "#63e990" : "#d7ffe2";
      ctx.fillRect(rect.x + 6, y, 18 + ((tick + i * 3) % 26), 2);
      ctx.fillStyle = "#f3b43f";
      ctx.fillRect(rect.x + 58, y, 8, 2);
    }
  }

  function drawMoba(rect, time) {
    pixelText("LOL", rect.x + 5, rect.y + 10, "#ffe086", 8);
    ctx.strokeStyle = "#63e990";
    ctx.strokeRect(rect.x + 7, rect.y + 15, 30, 25);
    ctx.strokeStyle = "#ef5d45";
    ctx.beginPath();
    ctx.moveTo(rect.x + 9, rect.y + 38);
    ctx.lineTo(rect.x + 35, rect.y + 17);
    ctx.stroke();
    ctx.fillStyle = "#5bc8ff";
    ctx.fillRect(rect.x + 12 + (Math.floor(time / 180) % 14), rect.y + 28, 4, 4);
    ctx.fillStyle = "#ef5d45";
    ctx.fillRect(rect.x + 54, rect.y + 16, 14, 4);
    ctx.fillRect(rect.x + 48, rect.y + 26, 20, 4);
  }

  function drawShooter(rect, time) {
    pixelText("CS2", rect.x + 5, rect.y + 10, "#ffe086", 8);
    const cx = rect.x + 40 + Math.round(Math.sin(time / 260) * 8);
    const cy = rect.y + 25 + Math.round(Math.cos(time / 320) * 6);
    ctx.strokeStyle = "#63e990";
    ctx.beginPath();
    ctx.moveTo(cx - 12, cy);
    ctx.lineTo(cx - 4, cy);
    ctx.moveTo(cx + 4, cy);
    ctx.lineTo(cx + 12, cy);
    ctx.moveTo(cx, cy - 10);
    ctx.lineTo(cx, cy - 3);
    ctx.moveTo(cx, cy + 3);
    ctx.lineTo(cx, cy + 10);
    ctx.stroke();
    ctx.fillStyle = "#ef5d45";
    ctx.fillRect(rect.x + 54, rect.y + 14, 16, 5);
  }

  function drawVideo(rect, time) {
    ctx.fillStyle = "#12334a";
    ctx.fillRect(rect.x + 2, rect.y + 2, rect.w - 4, rect.h - 4);
    ctx.fillStyle = "#f1cf89";
    ctx.beginPath();
    ctx.moveTo(rect.x + 31, rect.y + 14);
    ctx.lineTo(rect.x + 31, rect.y + 34);
    ctx.lineTo(rect.x + 50, rect.y + 24);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#63e990";
    ctx.fillRect(rect.x + 9, rect.y + 39, 12 + (Math.floor(time / 120) % 42), 2);
  }

  function drawDownload(rect, time) {
    pixelText("DL", rect.x + 5, rect.y + 10, "#5bc8ff", 8);
    const progress = (Math.sin(time / 700) + 1) / 2;
    ctx.strokeStyle = "#63e990";
    ctx.strokeRect(rect.x + 8, rect.y + 19, 60, 9);
    ctx.fillStyle = "#63e990";
    ctx.fillRect(rect.x + 10, rect.y + 21, Math.floor(56 * progress), 5);
    ctx.fillStyle = "#d7ffe2";
    ctx.fillRect(rect.x + 12, rect.y + 36, 44, 3);
  }

  function drawRankScreen(rect, time) {
    pixelText("TOP3", rect.x + 5, rect.y + 10, "#ffe086", 8);
    ["#f3b43f", "#d7ffe2", "#ef5d45"].forEach((color, i) => {
      ctx.fillStyle = color;
      ctx.fillRect(rect.x + 9, rect.y + 16 + i * 8, 10, 6);
      ctx.fillStyle = "#63e990";
      ctx.fillRect(rect.x + 24, rect.y + 17 + i * 8, 36 - i * 8 + (Math.floor(time / 220) % 4), 3);
    });
  }

  function drawCardScreen(rect, time) {
    pixelText("CARD", rect.x + 5, rect.y + 10, "#ffe086", 8);
    for (let i = 0; i < 3; i += 1) {
      const lift = i === Math.floor(time / 360) % 3 ? -3 : 0;
      ctx.fillStyle = "#f1cf89";
      ctx.fillRect(rect.x + 12 + i * 16, rect.y + 18 + lift, 12, 17);
      ctx.strokeStyle = "#0b0805";
      ctx.strokeRect(rect.x + 12 + i * 16, rect.y + 18 + lift, 12, 17);
      ctx.fillStyle = i === 1 ? "#ef5d45" : "#5bc8ff";
      ctx.fillRect(rect.x + 16 + i * 16, rect.y + 23 + lift, 4, 4);
    }
  }

  function drawAfk(rect, time) {
    pixelText("AFK", rect.x + 22, rect.y + 24, "#c69cff", 14);
    if (Math.floor(time / 420) % 2 === 0) pixelText("Z", rect.x + 58, rect.y + 15, "#ffe086", 9);
  }

  function drawFishing(rect, time, index) {
    pixelText("FISH", rect.x + 46, rect.y + 10, "#63e990", 8);
    ctx.strokeStyle = "#5bc8ff";
    ctx.beginPath();
    ctx.moveTo(rect.x + 7, rect.y + 33);
    ctx.lineTo(rect.x + 65, rect.y + 24 + Math.sin(time / 200 + index) * 5);
    ctx.stroke();
    ctx.fillStyle = "#ef5d45";
    ctx.fillRect(rect.x + 60, rect.y + 24 + Math.sin(time / 200 + index) * 5, 4, 4);
  }

  function drawScreenGlass(rect, time) {
    const pulse = 0.08 + Math.sin(time / 300) * 0.025;
    ctx.fillStyle = `rgba(155, 255, 215, ${pulse})`;
    ctx.fillRect(rect.x + 3, rect.y + 3, rect.w - 6, 3);
    ctx.strokeStyle = "rgba(255, 238, 134, 0.35)";
    ctx.strokeRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
  }

  function drawStationShadow(slot) {
    ctx.fillStyle = "rgba(0, 0, 0, 0.24)";
    ctx.fillRect(slot.x + 28, slot.y + 143, 166, 8);
  }

  function drawRankPlate(player, slot, selectedStation, hoverStation) {
    const x = slot.x + 18;
    const y = slot.y - 18;
    ctx.fillStyle = selectedStation ? "#5bc8ff" : player.rank <= 3 ? "#f3b43f" : "#ffe086";
    ctx.fillRect(x, y, 40, 23);
    ctx.strokeStyle = "#0b0805";
    ctx.lineWidth = 3;
    ctx.strokeRect(x, y, 40, 23);
    pixelText(String(player.rank).padStart(2, "0"), x + 9, y + 15, "#0b0805", 9);
    if (hoverStation || selectedStation) {
      ctx.strokeStyle = selectedStation ? "#5bc8ff" : "#ffe086";
      ctx.lineWidth = 4;
      ctx.strokeRect(slot.x + 4, slot.y + 4, frameSize.station.w - 8, frameSize.station.h - 10);
    }
  }

  function drawTokenMeter(player, slot) {
    const x = slot.x + 42;
    const y = slot.y + 154;
    ctx.fillStyle = "rgba(7, 17, 15, 0.92)";
    ctx.fillRect(x, y, 96, 14);
    ctx.strokeStyle = "#0b0805";
    ctx.strokeRect(x, y, 96, 14);
    ctx.fillStyle = player.rank <= 3 ? "#f3b43f" : "#63e990";
    ctx.fillRect(x + 3, y + 4, Math.max(7, Math.floor((player.tokens / players[0].tokens) * 88)), 5);
    pixelText(`#${player.rank}`, x + 5, y - 3, "#ffe086", 8);
  }

  function drawBoss(time) {
    const frame = Math.floor(time / 180) % 4;
    const shake = bossHitUntil > time ? Math.round(Math.sin(time / 18) * 8) : 0;
    drawFrame(assets.boss, frame, frameSize.boss.w, frameSize.boss.h, boss.x + shake, boss.y, boss.w, boss.h);
    if (bossHitUntil > time) {
      const hitFrame = Math.floor(time / 70) % 4;
      drawFrame(assets.bossHit, hitFrame, frameSize.fx.w, frameSize.fx.h, boss.x + 70 + shake, boss.y - 12, 64, 64);
    }
  }

  function drawBossSpeech(time) {
    const phraseIndex = bossHitUntil > time ? bossHits % bossPhrases.length : Math.floor(time / 2600) % bossPhrases.length;
    const x = 552;
    const y = 88 + Math.round(Math.sin(time / 420) * 2);
    drawPixelBubble(x, y, 184, 42);
    pixelText(bossPhrases[phraseIndex], x + 14, y + 25, "#0b0805", 12);
  }

  function drawHud(time) {
    const self = players.find((player) => player.self);
    const total = players.reduce((sum, player) => sum + player.tokens, 0);
    drawPixelPanel(18, 18, 160, 44);
    pixelText("今日马力", 34, 42, "#63e990", 12);
    pixelText(`#${self?.rank || "-"}`, 124, 42, "#ffe086", 16);
    drawPixelPanel(WORLD.w - 190, 18, 168, 44);
    pixelText("在线牛马", WORLD.w - 172, 42, "#63e990", 12);
    pixelText("10", WORLD.w - 78, 42, "#ffe086", 16);
    ctx.fillStyle = "#f3b43f";
    ctx.fillRect(WORLD.w - 48, 34, Math.min(24, total / 540), 8);
    drawPixelPanel(WORLD.w / 2 - 92, 18 + Math.sin(time / 460) * 1, 184, 42);
    pixelText("SUB2API", WORLD.w / 2 - 50, 45, "#fff094", 18);
  }

  function drawPixelPanel(x, y, w, h) {
    ctx.fillStyle = "rgba(13, 10, 6, 0.84)";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#0b0805";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.strokeStyle = "rgba(243, 180, 63, 0.5)";
    ctx.lineWidth = 2;
    ctx.strokeRect(x + 5, y + 5, w - 10, h - 10);
  }

  function drawPixelBubble(x, y, w, h) {
    ctx.fillStyle = "#ffe086";
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = "#0b0805";
    ctx.lineWidth = 4;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = "#ffe086";
    ctx.fillRect(x + 70, y + h - 2, 14, 10);
    ctx.strokeStyle = "#0b0805";
    ctx.beginPath();
    ctx.moveTo(x + 70, y + h - 2);
    ctx.lineTo(x + 84, y + h - 2);
    ctx.lineTo(x + 76, y + h + 10);
    ctx.closePath();
    ctx.stroke();
  }

  function drawPopups(time) {
    for (let i = popups.length - 1; i >= 0; i -= 1) {
      const popup = popups[i];
      const age = time - popup.start;
      if (age > 900) {
        popups.splice(i, 1);
        continue;
      }
      ctx.globalAlpha = 1 - age / 900;
      pixelText(popup.text, popup.x, popup.y - age / 18, popup.color, 11);
      ctx.globalAlpha = 1;
    }
  }

  function pixelText(text, x, y, color, size) {
    ctx.fillStyle = color;
    ctx.font = `bold ${size}px "Microsoft YaHei", "SimSun", monospace`;
    ctx.textBaseline = "alphabetic";
    ctx.fillText(text, Math.round(x), Math.round(y));
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
      item.addEventListener("click", () => selectPlayer(player, true));
      rankingRoot.appendChild(item);
    });
    const self = players.find((player) => player.self);
    if (self) selfLine.textContent = `#${self.rank} ${self.name}`;
  }

  function selectPlayer(player, fromPanel = false) {
    selected = player;
    document.querySelectorAll(".rank-card").forEach((card) => {
      card.classList.toggle("is-selected", Number(card.dataset.rank) === player.rank);
    });
    selectedUser.textContent = player.name;
    selectedToken.textContent = `${formatTokens(player.tokens)} token`;
    selectedState.textContent = player.state;
    if (fromPanel) addPopupForPlayer(player, `#${player.rank} ${formatTokens(player.tokens)}`, "#ffe086");
    if (player.rank <= 3) {
      const voucher = voucherForRank(player.rank);
      claimButton.disabled = false;
      claimButton.textContent = `领取 #${player.rank} 兑换券`;
      claimButton.dataset.code = voucher.code;
      claimButton.dataset.title = voucher.title || `TOP${player.rank} 兑换券`;
      couponHint.textContent = `${player.name} 已进入前三`;
    } else {
      claimButton.disabled = true;
      claimButton.textContent = "未选中前三";
      couponHint.textContent = "选择前三名用户领取";
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

  function canvasToWorld(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (WORLD.w / rect.width),
      y: (event.clientY - rect.top) * (WORLD.h / rect.height),
    };
  }

  function stationAt(point) {
    for (let i = stations.length - 1; i >= 0; i -= 1) {
      const slot = stations[i];
      const inX = point.x >= slot.x && point.x <= slot.x + frameSize.station.w;
      const inY = point.y >= slot.y - 24 && point.y <= slot.y + frameSize.station.h;
      if (inX && inY) return players[i];
    }
    return null;
  }

  function addPopupForPlayer(player, text, color = "#63e990") {
    const index = players.findIndex((item) => item.rank === player.rank);
    const slot = stations[index];
    if (!slot) return;
    popups.push({ text, color, x: slot.x + 54, y: slot.y + 18, start: lastTime });
  }

  function isBossPoint(point) {
    return point.x >= boss.x && point.x <= boss.x + boss.w && point.y >= boss.y && point.y <= boss.y + boss.h;
  }

  canvas.addEventListener("mousemove", (event) => {
    const point = canvasToWorld(event);
    const player = stationAt(point);
    hoveredRank = player ? player.rank : 0;
    canvas.style.cursor = player || isBossPoint(point) ? "pointer" : "default";
  });

  canvas.addEventListener("mouseleave", () => {
    hoveredRank = 0;
    canvas.style.cursor = "default";
  });

  canvas.addEventListener("click", (event) => {
    const point = canvasToWorld(event);
    if (isBossPoint(point)) {
      bossHits += 1;
      bossHitUntil = lastTime + 720;
      showToast(`你揍了牛老板 ${bossHits} 下`);
      return;
    }
    const player = stationAt(point);
    if (player) {
      selectPlayer(player);
      addPopupForPlayer(player, `+${Math.round(player.tokens / 20)} token`, player.rank <= 3 ? "#f3b43f" : "#63e990");
    }
  });

  claimButton.addEventListener("click", () => {
    if (claimButton.disabled || !selected || selected.rank > 3) return;
    const title = claimButton.dataset.title || `TOP${selected.rank} 兑换券`;
    const code = claimButton.dataset.code || `TOP${selected.rank}-READY`;
    showToast(`${title}: ${code}`);
  });

  whenImagesReady()
    .then(() => {
      renderRanking();
      selectPlayer(selected);
      requestAnimationFrame(drawScene);
    })
    .catch((error) => {
      showToast(error.message);
    });
})();
