const ANIMATION_ROOT = "./assets/frame-animation";
const LAYERED_STATION_ROOT = "./assets/generated-stations-v2-blank";
const SCREEN_FRAME_ROOT = "./assets/generated-screen-frames";
const FIT_SCREEN_ROOT = "./assets/generated-screen-gifs-fit";
const API_LAYER_ROOT = "./assets/api-layered-scene";

const params = new URLSearchParams(window.location.search);
const configuredBaseUrl =
  params.get("base") || (typeof window.SUB2API_BASE_URL === "string" ? window.SUB2API_BASE_URL : "");
const sameOriginBaseUrl = window.location.protocol.startsWith("http") ? window.location.origin : "";
const storedToken = localStorage.getItem("auth_token") || localStorage.getItem("token") || "";
const configuredMyUserId = Number(
  params.get("uid") || window.SUB2API_MY_USER_ID || localStorage.getItem("sub2api_my_user_id") || 0
);

const API_CONFIG = {
  baseUrl: configuredBaseUrl || sameOriginBaseUrl,
  token: params.get("token") || window.SUB2API_ADMIN_TOKEN || storedToken,
  rankingPath: "/api/v1/admin/dashboard/users-ranking",
  limit: 10
};

const usingLiveApi = Boolean(configuredBaseUrl && API_CONFIG.token);

const demoRows = [
  { user_id: 155, email: "155***4@qq.com", tokens: 38671700, requests: 231, actual_cost: 28.43, input_tokens: 31811000, output_tokens: 6860700 },
  { user_id: 188, email: "188***4@qq.com", tokens: 33349700, requests: 198, actual_cost: 23.16, input_tokens: 28006000, output_tokens: 5343700 },
  { user_id: 336, email: "xhp***@gmail.com", tokens: 28131700, requests: 167, actual_cost: 18.92, input_tokens: 23012000, output_tokens: 5119700 },
  { user_id: 42, email: "stable***@qq.com", tokens: 16890500, requests: 89, actual_cost: 9.21 },
  { user_id: 77, email: "ops***@gmail.com", tokens: 12044100, requests: 73, actual_cost: 7.8 },
  { user_id: 5, email: "pony***@163.com", tokens: 2300100, requests: 12, actual_cost: 1.2 },
  { user_id: 9, email: "sleepy***@qq.com", tokens: 0, requests: 0, actual_cost: 0 },
  { user_id: 14, email: "fish***@gmail.com", tokens: 0, requests: 0, actual_cost: 0 },
  { user_id: 23, email: "movie***@qq.com", tokens: 0, requests: 0, actual_cost: 0 },
  { user_id: 64, email: "game***@gmail.com", tokens: 0, requests: 0, actual_cost: 0 }
];

const WORLD = { width: 2048, height: 1152 };
const BOSS_ORDER_ANCHOR = { x: 1260, y: 345 };

const stations = [
  { x: 90, y: 470, w: 268, h: 220, base: { x: 90, y: 470, w: 268, h: 220 }, screen: { x: 196, y: 508, w: 66, h: 38 }, horse: { x: 178, y: 550, w: 178, h: 178 }, label: { x: 178, y: 658 }, meter: { x: 156, y: 688 }, row: "back" },
  { x: 465, y: 470, w: 268, h: 220, base: { x: 465, y: 470, w: 268, h: 220 }, screen: { x: 571, y: 508, w: 66, h: 38 }, horse: { x: 553, y: 550, w: 178, h: 178 }, label: { x: 553, y: 658 }, meter: { x: 531, y: 688 }, row: "back" },
  { x: 840, y: 470, w: 268, h: 220, base: { x: 840, y: 470, w: 268, h: 220 }, screen: { x: 946, y: 508, w: 66, h: 38 }, horse: { x: 928, y: 550, w: 178, h: 178 }, label: { x: 928, y: 658 }, meter: { x: 906, y: 688 }, row: "back" },
  { x: 1215, y: 470, w: 268, h: 220, base: { x: 1215, y: 470, w: 268, h: 220 }, screen: { x: 1321, y: 508, w: 66, h: 38 }, horse: { x: 1303, y: 550, w: 178, h: 178 }, label: { x: 1303, y: 658 }, meter: { x: 1281, y: 688 }, row: "back" },
  { x: 1590, y: 470, w: 268, h: 220, base: { x: 1590, y: 470, w: 268, h: 220 }, screen: { x: 1696, y: 508, w: 66, h: 38 }, horse: { x: 1678, y: 550, w: 178, h: 178 }, label: { x: 1678, y: 658 }, meter: { x: 1656, y: 688 }, row: "back" },
  { x: 90, y: 755, w: 268, h: 220, base: { x: 90, y: 755, w: 268, h: 220 }, screen: { x: 196, y: 793, w: 66, h: 38 }, horse: { x: 178, y: 835, w: 178, h: 178 }, label: { x: 178, y: 943 }, meter: { x: 156, y: 973 }, row: "front" },
  { x: 465, y: 755, w: 268, h: 220, base: { x: 465, y: 755, w: 268, h: 220 }, screen: { x: 571, y: 793, w: 66, h: 38 }, horse: { x: 553, y: 835, w: 178, h: 178 }, label: { x: 553, y: 943 }, meter: { x: 531, y: 973 }, row: "front" },
  { x: 840, y: 755, w: 268, h: 220, base: { x: 840, y: 755, w: 268, h: 220 }, screen: { x: 946, y: 793, w: 66, h: 38 }, horse: { x: 928, y: 835, w: 178, h: 178 }, label: { x: 928, y: 943 }, meter: { x: 906, y: 973 }, row: "front" },
  { x: 1215, y: 755, w: 268, h: 220, base: { x: 1215, y: 755, w: 268, h: 220 }, screen: { x: 1321, y: 793, w: 66, h: 38 }, horse: { x: 1303, y: 835, w: 178, h: 178 }, label: { x: 1303, y: 943 }, meter: { x: 1281, y: 973 }, row: "front" },
  { x: 1590, y: 755, w: 268, h: 220, base: { x: 1590, y: 755, w: 268, h: 220 }, screen: { x: 1696, y: 793, w: 66, h: 38 }, horse: { x: 1678, y: 835, w: 178, h: 178 }, label: { x: 1678, y: 943 }, meter: { x: 1656, y: 973 }, row: "front" }
];

const screenThemes = ["dashboard", "api", "moba", "shooter", "video", "download", "rank", "card", "afk", "fishing"];
const modeLabels = ["CODE", "API", "LOL", "CS2", "VIDEO", "DL", "RANK", "CARD", "AFK", "FISH"];
const screenPrograms = [
  { tag: "OPS", title: "TOKEN", rows: ["QUEUE", "REQ", "COST"] },
  { tag: "API", title: "200 OK", rows: ["POST", "AUTH", "BILL"] },
  { tag: "LOL", title: "RIFT", rows: ["KDA", "PING", "ALT"] },
  { tag: "CS2", title: "DUST2", rows: ["AIM", "ECO", "TAB"] },
  { tag: "TV", title: "VIDEO", rows: ["PLAY", "DANMU", "BOSS"] },
  { tag: "DL", title: "BT TASK", rows: ["SPEED", "SEED", "DISK"] },
  { tag: "TOP", title: "RANK", rows: ["TOP1", "GAP", "券"] },
  { tag: "CARD", title: "SOL", rows: ["MOVE", "ACE", "HIDE"] },
  { tag: "AFK", title: "IDLE", rows: ["AWAY", "MOUSE", "Z"] },
  { tag: "FISH", title: "FISH", rows: ["BAIT", "LOG", "TAB"] }
];

const bossLines = [
  "今天 token 没冲上去，谁都别下机。",
  "前三留下，后面的继续补需求。",
  "别摸鱼，我看得见屏幕。",
  "日报先别写，先把接口跑满。",
  "谁在打游戏？马上切回工作。",
  "干得好也别骄傲，下个版本今晚要。"
];

const bossHitLines = [
  "哎哟，绩效先别打我。",
  "我马上少开一个会。",
  "奖金这就走流程。",
  "别打了，我改需求还不行吗。",
  "牛马也是有脾气的。"
];

const horseActionPool = {
  working: [
    { key: "typing", text: "键盘冒烟", mood: "工作中", screen: "fast", emote: "⌨" },
    { key: "coffee", text: "偷偷续杯", mood: "回血", screen: "calm", emote: "咖" },
    { key: "debug", text: "抓到一个 bug", mood: "排障", screen: "glitch", emote: "!" },
    { key: "panic", text: "老板来了", mood: "加速", screen: "panic", emote: "!!" },
    { key: "repair", text: "重启服务", mood: "运维", screen: "glitch", emote: "RST" },
    { key: "idea", text: "灵光一闪", mood: "想通了", screen: "fast", emote: "IDEA" }
  ],
  overdrive: [
    { key: "typing", text: "手速拉满", mood: "爆肝", screen: "fast", emote: "HOT" },
    { key: "panic", text: "需求暴击", mood: "硬顶", screen: "panic", emote: "!!" },
    { key: "spark", text: "token 冲刺", mood: "冲榜", screen: "fast", emote: "↑" },
    { key: "rage", text: "连点上线", mood: "爆发", screen: "panic", emote: "!!!" },
    { key: "idea", text: "秒出方案", mood: "灵感", screen: "fast", emote: "OK" }
  ],
  gaming: [
    { key: "altTab", text: "Alt+Tab!", mood: "摸鱼", screen: "panic", emote: "TAB" },
    { key: "laugh", text: "赢一把就干活", mood: "开黑", screen: "game", emote: "GG" },
    { key: "combo", text: "五杀差一点", mood: "上头", screen: "game", emote: "PVP" },
    { key: "panic", text: "秒切工作台", mood: "心虚", screen: "panic", emote: "!" },
    { key: "loot", text: "捡到装备", mood: "偷乐", screen: "game", emote: "LOOT" },
    { key: "hide", text: "窗口缩小", mood: "假忙", screen: "panic", emote: "HIDE" }
  ],
  sleep: [
    { key: "nap", text: "梦里写接口", mood: "睡眠", screen: "calm", emote: "Z" },
    { key: "snore", text: "Zzz...", mood: "挂机", screen: "calm", emote: "ZZ" },
    { key: "fish", text: "假装看日志", mood: "摸鱼", screen: "game", emote: "鱼" },
    { key: "panic", text: "被吓醒了", mood: "复活", screen: "panic", emote: "!" },
    { key: "stretch", text: "伸个懒腰", mood: "缓一口气", screen: "calm", emote: "伸" },
    { key: "hide", text: "假装在线", mood: "离席", screen: "calm", emote: "AFK" }
  ]
};

const manualReactions = [
  { key: "wave", text: "收到，马上卷！", mood: "回应", screen: "fast", emote: "OK" },
  { key: "altTab", text: "别点，我在认真工作。", mood: "心虚", screen: "panic", emote: "TAB" },
  { key: "typing", text: "咔哒咔哒咔哒。", mood: "加班", screen: "fast", emote: "⌨" },
  { key: "debug", text: "我在救线上。", mood: "排障", screen: "glitch", emote: "!" },
  { key: "panic", text: "老板别看我屏幕。", mood: "惊慌", screen: "panic", emote: "!!" }
];

const horsePersonalities = [
  { name: "卷王马", bias: "overdrive", delay: 0.82, chaos: 0.08, patience: 0.72, favorite: "spark", quirk: "冲榜上头" },
  { name: "接口马", bias: "working", delay: 0.94, chaos: 0.12, patience: 0.66, favorite: "debug", quirk: "爱抓日志" },
  { name: "峡谷马", bias: "gaming", delay: 1.08, chaos: 0.44, patience: 0.38, favorite: "combo", quirk: "随时开黑" },
  { name: "枪法马", bias: "gaming", delay: 1.02, chaos: 0.38, patience: 0.42, favorite: "loot", quirk: "听脚步声" },
  { name: "追剧马", bias: "gaming", delay: 1.2, chaos: 0.5, patience: 0.34, favorite: "hide", quirk: "一键小窗" },
  { name: "下载马", bias: "working", delay: 1.0, chaos: 0.18, patience: 0.6, favorite: "repair", quirk: "网速敏感" },
  { name: "榜单马", bias: "overdrive", delay: 0.88, chaos: 0.1, patience: 0.7, favorite: "idea", quirk: "盯着前三" },
  { name: "纸牌马", bias: "gaming", delay: 1.16, chaos: 0.42, patience: 0.44, favorite: "laugh", quirk: "偷偷接龙" },
  { name: "瞌睡马", bias: "sleep", delay: 1.32, chaos: 0.22, patience: 0.24, favorite: "snore", quirk: "低电运行" },
  { name: "钓鱼马", bias: "sleep", delay: 1.24, chaos: 0.3, patience: 0.3, favorite: "fish", quirk: "日志钓鱼" }
];

const STORE_KEY = "sub2api_arena_v3";

const questDeck = [
  { key: "nudge", title: "催活任意 3 台电脑", target: 3, reward: 12 },
  { key: "inspect", title: "查岗 2 次，让摸鱼窗口消失", target: 2, reward: 14 },
  { key: "snack", title: "给 2 匹马发糖回血", target: 2, reward: 10 },
  { key: "praise", title: "表扬 2 匹马，保持心流", target: 2, reward: 12 },
  { key: "break", title: "放风 1 匹马，降低压力", target: 1, reward: 8 },
  { key: "boss", title: "揍牛老板 3 下", target: 3, reward: 16 },
  { key: "voucher", title: "见证一次前三领券", target: 1, reward: 20 }
];

const commandConfig = {
  nudge: { label: "催活", cooldown: 1800 },
  inspect: { label: "查岗", cooldown: 3200 },
  snack: { label: "发糖", cooldown: 2400 },
  praise: { label: "表扬", cooldown: 2600 },
  break: { label: "放风", cooldown: 5200 }
};

const bossOrderConfig = {
  nudge: {
    label: "催活",
    marker: "拍醒",
    boss: (station) => `${station} 号机别发呆，拍一下。`,
    action: { key: "panic", text: "被老板点名!", mood: "点名中", screen: "panic", emote: "名" }
  },
  inspect: {
    label: "查岗",
    marker: "查屏",
    boss: (station) => `${station} 号机屏幕不对，去查岗。`,
    action: { key: "altTab", text: "被点名查屏!", mood: "心虚", screen: "panic", emote: "TAB" }
  },
  snack: {
    label: "发糖",
    marker: "补给",
    boss: (station) => `${station} 号机快没电了，给点补给。`,
    action: { key: "snore", text: "低电点名", mood: "撑不住", screen: "calm", emote: "低" }
  },
  praise: {
    label: "表扬",
    marker: "夸它",
    boss: (station) => `${station} 号机刚刚干得不错，夸一句。`,
    action: { key: "idea", text: "等一句夸", mood: "等反馈", screen: "fast", emote: "赞" }
  },
  break: {
    label: "放风",
    marker: "放风",
    boss: (station) => `${station} 号机压力太高，放它喘口气。`,
    action: { key: "stretch", text: "快爆了", mood: "高压", screen: "panic", emote: "压" }
  }
};

const intentCopy = {
  typing: { label: "赶单", hint: "键盘冒烟", tone: "work" },
  coffee: { label: "续命", hint: "杯子见底", tone: "heal" },
  debug: { label: "救火", hint: "屏幕冒绿光", tone: "work" },
  panic: { label: "被逮", hint: "手忙脚乱", tone: "danger" },
  repair: { label: "重启", hint: "网线别断", tone: "work" },
  idea: { label: "心流", hint: "突然会了", tone: "bonus" },
  spark: { label: "冲榜", hint: "token 起飞", tone: "bonus" },
  rage: { label: "暴走", hint: "压力爆表", tone: "danger" },
  altTab: { label: "切屏", hint: "老板别看", tone: "sneak" },
  laugh: { label: "偷乐", hint: "赢一把", tone: "game" },
  combo: { label: "开黑", hint: "差个五杀", tone: "game" },
  loot: { label: "捡装", hint: "马上干活", tone: "game" },
  hide: { label: "藏窗", hint: "假装忙", tone: "sneak" },
  nap: { label: "低电", hint: "梦里上线", tone: "sleep" },
  snore: { label: "挂机", hint: "Zzz", tone: "sleep" },
  fish: { label: "摸鱼", hint: "假看日志", tone: "sneak" },
  stretch: { label: "回血", hint: "放松一下", tone: "heal" },
  wave: { label: "回应", hint: "收到", tone: "bonus" }
};

const idleIntentByStatus = {
  working: { label: "在线", hint: "等任务", tone: "work" },
  overdrive: { label: "爆肝", hint: "冲前三", tone: "bonus" },
  gaming: { label: "摸鱼", hint: "可查岗", tone: "game" },
  sleep: { label: "离席", hint: "点马会醒", tone: "sleep" }
};

const habitActions = [
  { key: "spark", text: "偷看榜一", mood: "盯榜", screen: "fast", emote: "TOP" },
  { key: "repair", text: "补一行日志", mood: "运维洁癖", screen: "glitch", emote: "LOG" },
  { key: "combo", text: "喊人开黑", mood: "组队中", screen: "game", emote: "5V5" },
  { key: "loot", text: "调准星", mood: "热手", screen: "game", emote: "AIM" },
  { key: "hide", text: "小窗追剧", mood: "假忙", screen: "panic", emote: "TV" },
  { key: "repair", text: "看下载进度", mood: "守任务", screen: "glitch", emote: "DL" },
  { key: "idea", text: "算前三差距", mood: "算分", screen: "fast", emote: "TOP" },
  { key: "laugh", text: "纸牌接龙", mood: "偷乐", screen: "game", emote: "ACE" },
  { key: "snore", text: "头一点一点", mood: "低电", screen: "calm", emote: "Z" },
  { key: "fish", text: "钓一条日志", mood: "摸鱼", screen: "game", emote: "鱼" }
];

const signatureActions = [
  [
    { key: "spark", text: "榜一别睡", mood: "冲榜上头", screen: "fast", emote: "NO.1" },
    { key: "typing", text: "再卷一轮", mood: "加速冲刺", screen: "fast", emote: "卷" }
  ],
  [
    { key: "debug", text: "接口 200 了", mood: "接口稳定", screen: "glitch", emote: "200" },
    { key: "repair", text: "补鉴权日志", mood: "查日志", screen: "glitch", emote: "JWT" }
  ],
  [
    { key: "combo", text: "中路集合", mood: "峡谷开黑", screen: "game", emote: "5V5" },
    { key: "altTab", text: "老板来了切!", mood: "秒切", screen: "panic", emote: "TAB" }
  ],
  [
    { key: "loot", text: "听脚步", mood: "架枪", screen: "game", emote: "A点" },
    { key: "panic", text: "烟雾弹救我", mood: "战术撤退", screen: "panic", emote: "烟" }
  ],
  [
    { key: "hide", text: "小窗第 8 集", mood: "追剧假忙", screen: "panic", emote: "TV" },
    { key: "laugh", text: "弹幕笑疯了", mood: "偷乐", screen: "game", emote: "哈" }
  ],
  [
    { key: "repair", text: "下载别断种", mood: "守下载", screen: "glitch", emote: "DL" },
    { key: "coffee", text: "网速回血", mood: "守夜", screen: "calm", emote: "MB/s" }
  ],
  [
    { key: "idea", text: "差前三 2 万", mood: "算分", screen: "fast", emote: "GAP" },
    { key: "spark", text: "再刷一波", mood: "盯榜", screen: "fast", emote: "UP" }
  ],
  [
    { key: "laugh", text: "红桃 A 到手", mood: "纸牌接龙", screen: "game", emote: "ACE" },
    { key: "hide", text: "鼠标一遮", mood: "藏牌", screen: "panic", emote: "藏" }
  ],
  [
    { key: "snore", text: "头点三下", mood: "低电运行", screen: "calm", emote: "Z" },
    { key: "nap", text: "梦里上线", mood: "半睡半工", screen: "calm", emote: "梦" }
  ],
  [
    { key: "fish", text: "日志咬钩了", mood: "日志钓鱼", screen: "game", emote: "鱼" },
    { key: "hide", text: "鱼竿收一下", mood: "假装在线", screen: "panic", emote: "收" }
  ]
];

const personalMicroActions = [
  [
    { key: "typing", text: "键帽快飞了", mood: "极限手速", screen: "fast", emote: "啪啪" },
    { key: "spark", text: "我守榜一", mood: "护榜", screen: "fast", emote: "王" }
  ],
  [
    { key: "debug", text: "日志对上了", mood: "排障上头", screen: "glitch", emote: "栈" },
    { key: "repair", text: "重试三次", mood: "接口洁癖", screen: "glitch", emote: "API" }
  ],
  [
    { key: "combo", text: "野区有眼", mood: "战术摸鱼", screen: "game", emote: "眼" },
    { key: "altTab", text: "我在看需求", mood: "装正经", screen: "panic", emote: "TAB" }
  ],
  [
    { key: "loot", text: "A 门有人", mood: "听脚步", screen: "game", emote: "A" },
    { key: "panic", text: "老板像闪光弹", mood: "被白了", screen: "panic", emote: "白" }
  ],
  [
    { key: "hide", text: "小窗藏右下", mood: "追剧熟练工", screen: "panic", emote: "窗" },
    { key: "laugh", text: "这弹幕有毒", mood: "憋笑", screen: "game", emote: "哈" }
  ],
  [
    { key: "repair", text: "BT 还在跑", mood: "守下载", screen: "glitch", emote: "种" },
    { key: "coffee", text: "网速回来了", mood: "回血", screen: "calm", emote: "速" }
  ],
  [
    { key: "idea", text: "前三差距缩小", mood: "算分专注", screen: "fast", emote: "差" },
    { key: "spark", text: "再压一波", mood: "榜单冲刺", screen: "fast", emote: "榜" }
  ],
  [
    { key: "laugh", text: "接龙又赢了", mood: "纸牌大师", screen: "game", emote: "A" },
    { key: "hide", text: "鼠标一盖", mood: "藏牌", screen: "panic", emote: "盖" }
  ],
  [
    { key: "snore", text: "工位在呼吸", mood: "低电漂移", screen: "calm", emote: "Z" },
    { key: "stretch", text: "脖子响了", mood: "缓一口气", screen: "calm", emote: "咔" }
  ],
  [
    { key: "fish", text: "钓到异常日志", mood: "日志钓鱼", screen: "game", emote: "钩" },
    { key: "hide", text: "鱼竿收线", mood: "假装上线", screen: "panic", emote: "收" }
  ]
];

const personalityEvents = [
  { key: "sig-rank-guard", label: "护榜", text: "卷王马突然护榜，旁边榜单马也被带着冲。", relation: "hype", target: 6, action: { key: "spark", text: "护住前三!", mood: "护榜冲刺", screen: "fast", emote: "王" }, follow: { key: "typing", text: "我也追!", mood: "被带冲榜", screen: "fast", emote: "UP" } },
  { key: "sig-api-alarm", label: "接口警", text: "接口马报出一串日志，下载马立刻凑过来看。", relation: "help", target: 5, action: { key: "debug", text: "接口告警!", mood: "报警排障", screen: "glitch", emote: "500" }, follow: { key: "repair", text: "我查下载", mood: "协同排障", screen: "glitch", emote: "DL" } },
  { key: "sig-lan-call", label: "开黑号", text: "峡谷马喊了一声集合，枪法马开始装作没听见。", relation: "tease", target: 3, action: { key: "combo", text: "中路集合!", mood: "开黑号令", screen: "game", emote: "5V5" }, follow: { key: "altTab", text: "我在工作!", mood: "心虚", screen: "panic", emote: "TAB" } },
  { key: "sig-aim-check", label: "听脚步", text: "枪法马说听到脚步，峡谷马也跟着切屏。", relation: "tease", target: 2, action: { key: "loot", text: "A 点有人!", mood: "架枪", screen: "game", emote: "A点" }, follow: { key: "combo", text: "我去支援", mood: "被拉开黑", screen: "game", emote: "5V5" } },
  { key: "sig-drama-window", label: "小窗", text: "追剧马小窗弹出来，纸牌马也偷瞄了一眼。", relation: "tease", target: 7, action: { key: "hide", text: "小窗别漏!", mood: "追剧假忙", screen: "panic", emote: "TV" }, follow: { key: "laugh", text: "看到弹幕了", mood: "偷笑", screen: "game", emote: "哈" } },
  { key: "sig-download-watch", label: "守种", text: "下载马盯着进度条，接口马来确认日志。", relation: "help", target: 1, action: { key: "repair", text: "下载别断!", mood: "守下载", screen: "glitch", emote: "DL" }, follow: { key: "debug", text: "日志正常", mood: "接口确认", screen: "glitch", emote: "200" } },
  { key: "sig-gap-calc", label: "算分", text: "榜单马开始算前三差距，卷王马键盘声突然变密。", relation: "hype", target: 0, action: { key: "idea", text: "差距变小!", mood: "算分", screen: "fast", emote: "GAP" }, follow: { key: "typing", text: "马上追!", mood: "被刺激", screen: "fast", emote: "UP" } },
  { key: "sig-card-chain", label: "接龙", text: "纸牌马摸到红桃 A，追剧马跟着笑出声。", relation: "tease", target: 4, action: { key: "laugh", text: "红桃 A!", mood: "纸牌接龙", screen: "game", emote: "ACE" }, follow: { key: "hide", text: "别笑出声", mood: "一起藏窗", screen: "panic", emote: "藏" } },
  { key: "sig-low-power", label: "低电", text: "瞌睡马头点三下，钓鱼马也开始慢动作。", relation: "sleepy", target: 9, action: { key: "snore", text: "低电闪烁", mood: "低电运行", screen: "calm", emote: "Z" }, follow: { key: "fish", text: "我也慢了", mood: "低电摸鱼", screen: "calm", emote: "困" } },
  { key: "sig-log-fishing", label: "钓日志", text: "钓鱼马说日志咬钩了，瞌睡马被它晃醒。", relation: "sleepy", target: 8, action: { key: "fish", text: "日志咬钩!", mood: "日志钓鱼", screen: "game", emote: "鱼" }, follow: { key: "panic", text: "鱼竿收一下", mood: "被吓醒", screen: "panic", emote: "!" } }
];

const horseBehaviorProfiles = [
  [
    { key: "rank-guard", label: "护榜巡航", chip: "护榜", tone: "bonus", screen: "fast", pattern: "rank", rows: ["TOP1", "GAP", "券"], command: "praise", actionKeys: ["spark", "typing", "idea"], actions: [
      { key: "spark", text: "券别被抢", mood: "护榜巡航", screen: "fast", emote: "券" },
      { key: "typing", text: "键盘连发", mood: "手速拉满", screen: "fast", emote: "RUN" },
      { key: "idea", text: "差距重算", mood: "盯榜算分", screen: "fast", emote: "GAP" }
    ] },
    { key: "deadline", label: "临门赶工", chip: "赶工", tone: "work", screen: "panic", pattern: "code", rows: ["REQ", "PATCH", "SHIP"], command: "snack", actionKeys: ["typing", "panic", "coffee"], actions: [
      { key: "typing", text: "最后一版", mood: "赶工", screen: "fast", emote: "码" },
      { key: "panic", text: "需求又变", mood: "临门一脚", screen: "panic", emote: "!!" },
      { key: "coffee", text: "续命一下", mood: "回血赶工", screen: "calm", emote: "咖" }
    ] }
  ],
  [
    { key: "api-watch", label: "接口巡检", chip: "巡检", tone: "work", screen: "glitch", pattern: "api", rows: ["AUTH", "POST", "BILL"], command: "inspect", actionKeys: ["debug", "repair", "typing"], actions: [
      { key: "debug", text: "500 追踪", mood: "接口巡检", screen: "glitch", emote: "500" },
      { key: "repair", text: "鉴权重试", mood: "修接口", screen: "glitch", emote: "JWT" },
      { key: "typing", text: "补回调", mood: "接口工作", screen: "fast", emote: "API" }
    ] },
    { key: "log-dive", label: "日志深潜", chip: "查栈", tone: "work", screen: "glitch", pattern: "code", rows: ["TRACE", "STACK", "FIX"], command: "inspect", actionKeys: ["debug", "idea", "repair"], actions: [
      { key: "debug", text: "栈里有线索", mood: "日志深潜", screen: "glitch", emote: "栈" },
      { key: "idea", text: "定位到了", mood: "找到根因", screen: "fast", emote: "OK" },
      { key: "repair", text: "热修一下", mood: "热修", screen: "glitch", emote: "FIX" }
    ] }
  ],
  [
    { key: "lan-party", label: "峡谷开黑", chip: "开黑", tone: "game", screen: "game", pattern: "moba", rows: ["KDA", "PING", "ALT"], command: "inspect", actionKeys: ["combo", "altTab", "laugh"], actions: [
      { key: "combo", text: "中路集合", mood: "峡谷开黑", screen: "game", emote: "5V5" },
      { key: "altTab", text: "老板来了切", mood: "秒切", screen: "panic", emote: "TAB" },
      { key: "laugh", text: "赢一把就干", mood: "偷乐", screen: "game", emote: "GG" }
    ] },
    { key: "fake-ticket", label: "假装工单", chip: "装忙", tone: "sneak", screen: "panic", pattern: "code", rows: ["TODO", "ALT", "HIDE"], command: "inspect", actionKeys: ["altTab", "hide", "typing"], actions: [
      { key: "altTab", text: "我在看需求", mood: "装正经", screen: "panic", emote: "TAB" },
      { key: "hide", text: "窗口藏好", mood: "藏窗口", screen: "panic", emote: "藏" },
      { key: "typing", text: "敲两下装忙", mood: "假装忙", screen: "fast", emote: "敲" }
    ] }
  ],
  [
    { key: "aim-warmup", label: "枪法热手", chip: "架枪", tone: "game", screen: "game", pattern: "crosshair", rows: ["AIM", "ECO", "TAB"], command: "inspect", actionKeys: ["loot", "panic", "altTab"], actions: [
      { key: "loot", text: "A 门有人", mood: "枪法热手", screen: "game", emote: "A" },
      { key: "panic", text: "闪光弹老板", mood: "被白了", screen: "panic", emote: "白" },
      { key: "altTab", text: "切回工单", mood: "收枪", screen: "panic", emote: "TAB" }
    ] },
    { key: "tactical-work", label: "战术工单", chip: "战术", tone: "work", screen: "fast", pattern: "crosshair", rows: ["TASK", "AIM", "DONE"], command: "praise", actionKeys: ["typing", "idea", "loot"], actions: [
      { key: "typing", text: "工单点射", mood: "战术工单", screen: "fast", emote: "点" },
      { key: "idea", text: "路线清了", mood: "路线规划", screen: "fast", emote: "图" },
      { key: "loot", text: "顺手捡需求", mood: "收尾", screen: "game", emote: "箱" }
    ] }
  ],
  [
    { key: "drama-binge", label: "小窗追剧", chip: "追剧", tone: "sneak", screen: "panic", pattern: "video", rows: ["PLAY", "DANMU", "BOSS"], command: "inspect", actionKeys: ["hide", "laugh", "altTab"], actions: [
      { key: "hide", text: "小窗别漏", mood: "小窗追剧", screen: "panic", emote: "TV" },
      { key: "laugh", text: "弹幕笑疯", mood: "憋笑", screen: "game", emote: "哈" },
      { key: "altTab", text: "刚在写需求", mood: "秒切", screen: "panic", emote: "TAB" }
    ] },
    { key: "subtitle-work", label: "字幕假忙", chip: "字幕", tone: "sneak", screen: "panic", pattern: "video", rows: ["SUB", "PAUSE", "HIDE"], command: "inspect", actionKeys: ["hide", "typing", "panic"], actions: [
      { key: "hide", text: "字幕藏右下", mood: "字幕假忙", screen: "panic", emote: "幕" },
      { key: "typing", text: "边看边敲", mood: "半工半看", screen: "fast", emote: "敲" },
      { key: "panic", text: "暂停暂停", mood: "险些露馅", screen: "panic", emote: "!!" }
    ] }
  ],
  [
    { key: "download-guard", label: "下载守夜", chip: "守种", tone: "work", screen: "glitch", pattern: "download", rows: ["SPEED", "SEED", "DISK"], command: "nudge", actionKeys: ["repair", "coffee", "debug"], actions: [
      { key: "repair", text: "进度条别停", mood: "下载守夜", screen: "glitch", emote: "DL" },
      { key: "coffee", text: "带宽回血", mood: "网速回血", screen: "calm", emote: "MB/s" },
      { key: "debug", text: "连接抖了", mood: "查连接", screen: "glitch", emote: "NET" }
    ] },
    { key: "disk-clean", label: "磁盘清理", chip: "清盘", tone: "work", screen: "glitch", pattern: "download", rows: ["DISK", "TEMP", "OK"], command: "nudge", actionKeys: ["repair", "idea", "typing"], actions: [
      { key: "repair", text: "清一下缓存", mood: "磁盘清理", screen: "glitch", emote: "盘" },
      { key: "idea", text: "空间够了", mood: "清理完成", screen: "fast", emote: "OK" },
      { key: "typing", text: "任务续跑", mood: "恢复下载", screen: "fast", emote: "RUN" }
    ] }
  ],
  [
    { key: "gap-watch", label: "前三算分", chip: "算分", tone: "bonus", screen: "fast", pattern: "rank", rows: ["TOP1", "GAP", "券"], command: "praise", actionKeys: ["idea", "spark", "typing"], actions: [
      { key: "idea", text: "差距缩小", mood: "前三算分", screen: "fast", emote: "GAP" },
      { key: "spark", text: "再压一波", mood: "冲券", screen: "fast", emote: "券" },
      { key: "typing", text: "榜单刷新", mood: "盯榜", screen: "fast", emote: "榜" }
    ] },
    { key: "coupon-alarm", label: "奖券警报", chip: "奖券", tone: "bonus", screen: "fast", pattern: "rank", rows: ["券", "READY", "TOP3"], command: "praise", actionKeys: ["spark", "panic", "idea"], actions: [
      { key: "spark", text: "柜台有券", mood: "奖券警报", screen: "fast", emote: "券" },
      { key: "panic", text: "别掉出前三", mood: "护券紧张", screen: "panic", emote: "!!" },
      { key: "idea", text: "路线算好", mood: "冲券路线", screen: "fast", emote: "图" }
    ] }
  ],
  [
    { key: "solitaire-run", label: "纸牌接龙", chip: "纸牌", tone: "game", screen: "game", pattern: "cards", rows: ["MOVE", "ACE", "HIDE"], command: "inspect", actionKeys: ["laugh", "hide", "altTab"], actions: [
      { key: "laugh", text: "红桃 A 到手", mood: "纸牌接龙", screen: "game", emote: "A" },
      { key: "hide", text: "鼠标盖住牌", mood: "藏牌", screen: "panic", emote: "盖" },
      { key: "altTab", text: "我在排版", mood: "装忙", screen: "panic", emote: "TAB" }
    ] },
    { key: "card-count", label: "算牌摸鱼", chip: "算牌", tone: "game", screen: "game", pattern: "cards", rows: ["A", "K", "MOVE"], command: "inspect", actionKeys: ["laugh", "idea", "hide"], actions: [
      { key: "laugh", text: "这一手稳", mood: "算牌摸鱼", screen: "game", emote: "K" },
      { key: "idea", text: "牌路通了", mood: "摸鱼灵感", screen: "fast", emote: "A" },
      { key: "hide", text: "老板别看", mood: "藏牌", screen: "panic", emote: "藏" }
    ] }
  ],
  [
    { key: "low-power", label: "低电运行", chip: "低电", tone: "sleep", screen: "calm", pattern: "idle", rows: ["AWAY", "MOUSE", "Z"], command: "snack", actionKeys: ["snore", "nap", "stretch"], actions: [
      { key: "snore", text: "头点三下", mood: "低电运行", screen: "calm", emote: "Z" },
      { key: "nap", text: "梦里上线", mood: "半睡半工", screen: "calm", emote: "梦" },
      { key: "stretch", text: "脖子响了", mood: "回血", screen: "calm", emote: "咔" }
    ] },
    { key: "sugar-needed", label: "补糖等待", chip: "补糖", tone: "heal", screen: "calm", pattern: "idle", rows: ["HP", "SUGAR", "WAIT"], command: "snack", actionKeys: ["snore", "coffee", "wave"], actions: [
      { key: "snore", text: "电量见底", mood: "等补糖", screen: "calm", emote: "低" },
      { key: "coffee", text: "糖到了吗", mood: "想回血", screen: "calm", emote: "糖" },
      { key: "wave", text: "醒一点了", mood: "回神", screen: "fast", emote: "OK" }
    ] }
  ],
  [
    { key: "log-fishing", label: "日志钓鱼", chip: "钓鱼", tone: "sneak", screen: "game", pattern: "fish", rows: ["BAIT", "LOG", "TAB"], command: "inspect", actionKeys: ["fish", "hide", "snore"], actions: [
      { key: "fish", text: "日志咬钩", mood: "日志钓鱼", screen: "game", emote: "鱼" },
      { key: "hide", text: "鱼竿收线", mood: "假装在线", screen: "panic", emote: "收" },
      { key: "snore", text: "钓困了", mood: "摸鱼犯困", screen: "calm", emote: "Z" }
    ] },
    { key: "quiet-afk", label: "安静离席", chip: "离席", tone: "sleep", screen: "calm", pattern: "idle", rows: ["AFK", "LOG", "WAIT"], command: "nudge", actionKeys: ["nap", "fish", "panic"], actions: [
      { key: "nap", text: "假装在线", mood: "安静离席", screen: "calm", emote: "AFK" },
      { key: "fish", text: "看日志池", mood: "慢速摸鱼", screen: "game", emote: "池" },
      { key: "panic", text: "回来了回来了", mood: "回神", screen: "panic", emote: "!" }
    ] }
  ]
];

const stationIncidentDeck = [
  { key: "rank-sprint", label: "护榜冲刺", command: "praise", tone: "bonus", button: "夸它", text: "卷王马手速拉满，给一句反馈能冲出暴击。", action: { key: "spark", text: "榜别掉!", mood: "护榜冲刺", screen: "fast", emote: "王" }, reward: 5, focus: 10, stamina: -5, stress: -3, trust: 5 },
  { key: "api-fire", label: "接口冒烟", command: "inspect", tone: "danger", button: "查屏", text: "接口马屏幕冒绿字，点掉 BUG 才不会扩散。", action: { key: "debug", text: "500 冒烟!", mood: "接口告警", screen: "glitch", emote: "500" }, reward: 4, focus: 8, stamina: -4, stress: -8, trust: 4 },
  { key: "lan-party", label: "峡谷开黑", command: "inspect", tone: "danger", button: "查岗", text: "峡谷马正在喊五排，快把窗口切回工作。", action: { key: "combo", text: "五排差一!", mood: "开黑", screen: "game", emote: "5V5" }, reward: 4, focus: 9, stamina: -2, stress: 1, trust: -1 },
  { key: "aim-duel", label: "A点有人", command: "inspect", tone: "danger", button: "收枪", text: "枪法马准星黏住屏幕，点它会切回工单。", action: { key: "loot", text: "A 点有人!", mood: "听脚步", screen: "game", emote: "A" }, reward: 4, focus: 8, stamina: -2, stress: 1, trust: -1 },
  { key: "drama-window", label: "小窗露馅", command: "inspect", tone: "danger", button: "关窗", text: "追剧马右下角弹出小窗，点掉别让老板看见。", action: { key: "hide", text: "小窗漏了!", mood: "追剧假忙", screen: "panic", emote: "TV" }, reward: 4, focus: 7, stamina: 0, stress: -2, trust: -1 },
  { key: "download-stall", label: "下载卡住", command: "nudge", tone: "work", button: "重拨", text: "下载马进度条卡住，拍一下让它重新跑。", action: { key: "repair", text: "进度卡住!", mood: "守下载", screen: "glitch", emote: "DL" }, reward: 4, focus: 7, stamina: -3, stress: -4, trust: 3 },
  { key: "gap-calc", label: "差距计算", command: "praise", tone: "bonus", button: "加油", text: "榜单马算出前三差距，鼓励它继续追。", action: { key: "idea", text: "差距缩小!", mood: "算分", screen: "fast", emote: "GAP" }, reward: 5, focus: 9, stamina: -4, stress: -3, trust: 5 },
  { key: "card-chain", label: "纸牌接龙", command: "inspect", tone: "danger", button: "收牌", text: "纸牌马摸到红桃 A，快把牌桌收掉。", action: { key: "laugh", text: "红桃 A!", mood: "接龙", screen: "game", emote: "ACE" }, reward: 4, focus: 8, stamina: 0, stress: 0, trust: -1 },
  { key: "low-power", label: "低电打盹", command: "snack", tone: "sleep", button: "补糖", text: "瞌睡马头点三下，给糖比拍桌子更有用。", action: { key: "snore", text: "低电闪烁", mood: "低电", screen: "calm", emote: "Z" }, reward: 4, focus: 6, stamina: 12, stress: -4, trust: 4 },
  { key: "log-fishing", label: "日志摸鱼", command: "inspect", tone: "danger", button: "收竿", text: "钓鱼马拿日志当鱼塘，点屏幕把鱼竿收了。", action: { key: "fish", text: "日志咬钩!", mood: "摸鱼", screen: "game", emote: "鱼" }, reward: 4, focus: 8, stamina: 1, stress: -1, trust: -1 }
];

const relationshipLines = {
  help: ["我来搭把手", "看我这行日志", "先别慌，我顶一下"],
  tease: ["你又摸鱼?", "老板快来了", "小窗藏好点"],
  hype: ["跟上节奏", "一起冲一波", "键盘别停"],
  sleepy: ["你也困了?", "别睡太香", "醒醒看屏幕"],
  panic: ["快切屏!", "老板看过来了", "别露馅"]
};

const pairBeats = [
  {
    key: "pair-rank",
    title: "榜单搭子",
    label: "搭子",
    text: "卷王马和榜单马开始互相报差距，前三压力上来了。",
    boss: "你俩别光算，算完就冲。",
    pair: [0, 6],
    relation: "hype",
    first: { key: "spark", text: "我守榜一!", mood: "护榜", screen: "fast", emote: "王" },
    second: { key: "idea", text: "差距缩小!", mood: "算分", screen: "fast", emote: "差" },
    pressure: 5,
    order: 3,
    trust: 2
  },
  {
    key: "pair-api",
    title: "接口救火",
    label: "救火",
    text: "接口马喊下载马看日志，两个屏幕一起冒绿光。",
    boss: "这组可以，线上先救回来。",
    pair: [1, 5],
    relation: "help",
    first: { key: "debug", text: "接口抖了!", mood: "定位问题", screen: "glitch", emote: "LOG" },
    second: { key: "repair", text: "我看连接", mood: "协同排障", screen: "glitch", emote: "FIX" },
    pressure: -3,
    order: 4,
    stress: -4,
    trust: 4
  },
  {
    key: "pair-lan",
    title: "双排暗号",
    label: "双排",
    text: "峡谷马给枪法马递暗号，两台屏幕同时心虚。",
    boss: "我听见双排了，谁喊的 A 点？",
    pair: [2, 3],
    relation: "tease",
    first: { key: "combo", text: "中路集合!", mood: "双排", screen: "game", emote: "5V5" },
    second: { key: "loot", text: "A 门有人!", mood: "听脚步", screen: "game", emote: "A" },
    pressure: -2,
    order: -7,
    trust: -4
  },
  {
    key: "pair-slack",
    title: "摸鱼同盟",
    label: "同盟",
    text: "追剧马和纸牌马开始交流藏窗口技巧。",
    boss: "右下角那个小窗，当我看不见？",
    pair: [4, 7],
    relation: "tease",
    first: { key: "hide", text: "小窗藏右下", mood: "藏窗", screen: "panic", emote: "窗" },
    second: { key: "hide", text: "鼠标盖住牌", mood: "藏牌", screen: "panic", emote: "盖" },
    pressure: 4,
    order: -8,
    trust: -5
  },
  {
    key: "pair-sleep",
    title: "低电互传",
    label: "传染",
    text: "瞌睡马一打哈欠，钓鱼马也开始收线摸鱼。",
    boss: "你俩别在梦里上线。",
    pair: [8, 9],
    relation: "sleepy",
    first: { key: "snore", text: "头点三下", mood: "低电", screen: "calm", emote: "Z" },
    second: { key: "fish", text: "鱼竿收线", mood: "假装在线", screen: "game", emote: "收" },
    pressure: -5,
    order: -5,
    stress: -3,
    trust: -2
  }
];

const shiftPhases = [
  { key: "open", label: "开机", boss: "刚开机就别摸鱼。", pressure: 24, order: 72 },
  { key: "rush", label: "冲榜", boss: "前三有券，后面加速。", pressure: 58, order: 62 },
  { key: "midnight", label: "夜深", boss: "夜越深，需求越急。", pressure: 72, order: 48 },
  { key: "settle", label: "结算", boss: "最后一轮，谁掉队谁加班。", pressure: 86, order: 56 }
];

function loadStore() {
  try {
    return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
  } catch (error) {
    return {};
  }
}

const store = loadStore();

function saveStore() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(store));
  } catch (error) {
    // Storage can be unavailable in private contexts.
  }
}

const state = {
  rows: [],
  source: "demo",
  selectedIndex: 0,
  bossLineIndex: 0,
  bossLockedUntil: 0,
  combo: 0,
  lastPunch: 0,
  gameCombo: 0,
  lastGameAction: 0,
  lastInteractionKind: "",
  interactionStreak: 0,
  lastInteractionAt: 0,
  coins: Number(store.coins || 0),
  questIndex: Number(store.questIndex || 0),
  questProgress: Number(store.questProgress || 0),
  pressure: Number(store.pressure || 32),
  order: Number(store.order || 68),
  phaseIndex: Number(store.phaseIndex || 0),
  tickerLockedUntil: 0,
  eventTitle: "网吧平静中",
  eventText: "下一次突发事件正在路上。",
  eventUntil: 0,
  eventStartedAt: 0,
  bossOrder: null,
  bossOrderNextAt: Date.now() + 9000,
  hype: 0,
  lastHypeAt: 0,
  radarChain: 0,
  radarChainUntil: 0,
  feverUntil: 0,
  feverReason: "",
  commandCooldowns: {},
  sceneNextAt: Date.now() + 3600,
  sceneCooldown: {},
  introGraceUntil: Date.now() + 9000,
  patrolWave: null,
  patrolClearUntil: 0,
  patrolClearText: "",
  nextPatrolWaveAt: Date.now() + 12000,
  introChallengeStarted: false,
  horseActions: Array.from({ length: 10 }, () => ({ key: "", text: "", until: 0 })),
  horseMoods: Array.from({ length: 10 }, (_, index) => ({
    mood: horsePersonalities[index]?.name || "牛马",
    emote: "",
    screen: "",
    energy: 0,
    focus: clampStat(58 + (index % 5) * 6 - (index >= 7 ? 18 : 0)),
    stamina: clampStat(76 - index * 3 + (index < 3 ? 10 : 0)),
    nextAt: 0,
    lastKey: "",
    streak: 0,
    actionCount: 0,
    nextChainAt: 0,
    lastIntentAt: 0,
    nextRoutineAt: Date.now() + 4200 + index * 860,
    behaviorKey: "",
    behaviorLabel: "",
    behaviorChip: "",
    behaviorTone: "",
    behaviorUntil: 0,
    behaviorStep: 0,
    nextBehaviorAt: Date.now() + 1800 + index * 920,
    talkSeed: index * 37,
    lastQuip: "",
    quipUntil: 0,
    stress: clampStat(26 + index * 4),
    trust: clampStat(54 - index * 2 + (index < 3 ? 10 : 0))
  })),
  propClaims: Array.from({ length: 10 }, () => ({ key: "", until: 0 })),
  screenClaims: Array.from({ length: 10 }, () => ({ key: "", until: 0 })),
  stationPulse: Array.from({ length: 10 }, () => 0),
  screenGlitch: Array.from({ length: 10 }, () => 0),
  stationStories: Array.from({ length: 10 }, () => ({ key: "", label: "", until: 0 })),
  stationIncidents: Array.from({ length: 10 }, () => null),
  stationPrompts: Array.from({ length: 10 }, () => null),
  nextPromptAt: Date.now() + 5200,
  chainChallenge: null,
  nextChainChallengeAt: Date.now() + 26000,
  nextRelationshipPromptAt: 0,
  coachHint: { index: 0, kind: "screen", text: "点屏幕处理状态", tone: "work", until: 0 }
};

let prevById = {};
let prevTop1Id = null;
let firstRenderDone = false;
let watchedDay = "";

const el = {
  stationsLayer: document.getElementById("stationsLayer"),
  selectionHud: document.getElementById("selectionHud"),
  ambientLayer: document.querySelector(".ambient-layer"),
  topRanking: document.getElementById("topRanking"),
  voucherList: document.getElementById("voucherList"),
  voucherClaimButton: document.getElementById("voucherClaimButton"),
  voucherNote: document.getElementById("voucherNote"),
  voucherReadyCount: document.getElementById("voucherReadyCount"),
  voucherBooth: document.getElementById("voucherBooth"),
  voucherBoothStatus: document.getElementById("voucherBoothStatus"),
  countdown: document.getElementById("countdown"),
  hoursLeft: document.getElementById("hoursLeft"),
  tickerText: document.getElementById("tickerText"),
  totalTokens: document.getElementById("totalTokens"),
  targetRadar: document.getElementById("targetRadar"),
  targetRadarTitle: document.getElementById("targetRadarTitle"),
  targetRadarAction: document.getElementById("targetRadarAction"),
  targetRadarHint: document.getElementById("targetRadarHint"),
  sourceLabel: document.getElementById("sourceLabel"),
  refreshButton: document.getElementById("refreshButton"),
  muteButton: document.getElementById("muteButton"),
  dayNumber: document.getElementById("dayNumber"),
  bossScoreValue: document.getElementById("bossScoreValue"),
  fxLayer: document.getElementById("fxLayer"),
  toastLayer: document.getElementById("toastLayer"),
  settlementOverlay: document.getElementById("settlementOverlay"),
  settlementDay: document.getElementById("settlementDay"),
  settlementChampion: document.getElementById("settlementChampion"),
  settlementClose: document.getElementById("settlementClose"),
  myStatus: document.getElementById("myStatus"),
  myDelta: document.getElementById("myDelta"),
  selectedTitle: document.getElementById("selectedTitle"),
  selectedMeter: document.getElementById("selectedMeter"),
  selectedUser: document.getElementById("selectedUser"),
  selectedTokens: document.getElementById("selectedTokens"),
  selectedState: document.getElementById("selectedState"),
  selectedRequests: document.getElementById("selectedRequests"),
  selectedFocus: document.getElementById("selectedFocus"),
  selectedEnergy: document.getElementById("selectedEnergy"),
  selectedTrait: document.getElementById("selectedTrait"),
  selectedMood: document.getElementById("selectedMood"),
  selectedStress: document.getElementById("selectedStress"),
  selectedTrust: document.getElementById("selectedTrust"),
  bossCow: document.getElementById("bossCow"),
  bossSpeech: document.getElementById("bossSpeech"),
  quickActions: document.querySelector(".quick-actions"),
  coinValue: document.getElementById("coinValue"),
  comboValue: document.getElementById("comboValue"),
  questText: document.getElementById("questText"),
  questMeter: document.getElementById("questMeter"),
  questPanel: document.querySelector(".quest-panel"),
  eventCard: document.getElementById("eventCard"),
  eventTitle: document.getElementById("eventTitle"),
  eventText: document.getElementById("eventText"),
  eventMeter: document.getElementById("eventMeter"),
  shiftPhase: document.getElementById("shiftPhase"),
  shiftPressure: document.getElementById("shiftPressure")
};

function pct(value, axis) {
  return `${(value / axis * 100).toFixed(4)}%`;
}

function chinaNowParts() {
  const formatter = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false
  });
  const parts = Object.fromEntries(formatter.formatToParts(new Date()).map((part) => [part.type, part.value]));
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second)
  };
}

function shanghaiDateString() {
  const now = chinaNowParts();
  const pad = (value) => String(value).padStart(2, "0");
  return `${now.year}-${pad(now.month)}-${pad(now.day)}`;
}

function dayNumber() {
  const today = shanghaiDateString();
  if (!store.firstDay) {
    store.firstDay = today;
    saveStore();
  }
  const diff = Math.round((Date.parse(`${today}T00:00:00Z`) - Date.parse(`${store.firstDay}T00:00:00Z`)) / 86400000);
  return Math.max(1, diff + 1);
}

function todayBucket() {
  const today = shanghaiDateString();
  if (store.dayKey !== today) {
    store.dayKey = today;
    store.today = { hits: 0, score: 0 };
    saveStore();
  }
  if (!store.today) store.today = { hits: 0, score: 0 };
  return store.today;
}

function todayRangeForApi() {
  const day = shanghaiDateString();
  return { start_date: day, end_date: day };
}

function secondsUntilShanghaiMidnight() {
  const now = chinaNowParts();
  return (23 - now.hour) * 3600 + (59 - now.minute) * 60 + (60 - now.second);
}

const audio = {
  ctx: null,
  muted: Boolean(store.muted),
  ensure() {
    if (this.muted) return;
    if (!this.ctx) {
      const Ctor = window.AudioContext || window.webkitAudioContext;
      if (!Ctor) return;
      this.ctx = new Ctor();
    }
    if (this.ctx.state === "suspended") this.ctx.resume();
  },
  blip(freq, dur, type = "square", gain = 0.06, delay = 0) {
    if (this.muted) return;
    this.ensure();
    if (!this.ctx) return;
    const t = this.ctx.currentTime + delay;
    const osc = this.ctx.createOscillator();
    const env = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    env.gain.setValueAtTime(gain, t);
    env.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(env).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  },
  punch() {
    this.blip(140, 0.16, "sawtooth", 0.12);
    this.blip(70, 0.2, "square", 0.1);
  },
  select() {
    this.blip(680, 0.05, "square", 0.04);
  },
  reward() {
    [523, 659, 784, 1047].forEach((f, i) => this.blip(f, 0.16, "triangle", 0.06, i * 0.08));
  },
  rankup() {
    [523, 659, 784].forEach((f, i) => this.blip(f, 0.12, "square", 0.05, i * 0.07));
  }
};

function arenaTokens(row) {
  const input = Number(row.input_tokens || row.total_input_tokens || 0);
  const output = Number(row.output_tokens || row.total_output_tokens || 0);
  if (input || output) return input + output;
  return Number(row.tokens || row.total_tokens || 0);
}

function normalizeRows(payload) {
  const sourceRows = Array.isArray(payload) ? payload : payload?.ranking || payload?.items || [];
  return sourceRows
    .map((row, index) => ({
      id: Number(row.user_id || row.id || index + 1),
      email: String(row.email || row.username || row.name || `user-${index + 1}`),
      tokens: arenaTokens(row),
      requests: Number(row.requests || row.total_requests || 0),
      cost: Number(row.actual_cost || row.total_actual_cost || row.cost || 0),
      raw: row
    }))
    .sort((a, b) => b.tokens - a.tokens || b.requests - a.requests || a.id - b.id)
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

async function loadRanking() {
  if (!usingLiveApi) {
    state.source = "demo";
    if (!state.rows.length) state.rows = normalizeRows(demoRows);
    seedHorseBehaviors();
    render();
    return;
  }

  const range = todayRangeForApi();
  const url = new URL(API_CONFIG.rankingPath, API_CONFIG.baseUrl);
  url.searchParams.set("start_date", range.start_date);
  url.searchParams.set("end_date", range.end_date);
  url.searchParams.set("limit", String(API_CONFIG.limit));

  try {
    el.sourceLabel.textContent = "SYNC";
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${API_CONFIG.token}` }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const payload = await response.json();
    state.source = "api";
    state.rows = normalizeRows(payload?.data || payload);
    seedHorseBehaviors();
    render();
  } catch (error) {
    console.warn("Failed to load SUB2API ranking, falling back to demo data:", error);
    state.source = "demo";
    el.sourceLabel.textContent = "DEMO";
    if (!state.rows.length) state.rows = normalizeRows(demoRows);
    seedHorseBehaviors();
    toast("接口连不上，先用试玩数据跑网吧。");
    render();
  }
}

function formatTokens(value) {
  const num = Number(value || 0);
  if (num >= 100000000) return `${(num / 100000000).toFixed(2)}亿`;
  if (num >= 10000) return `${(num / 10000).toFixed(1)}万`;
  return num.toLocaleString("zh-CN");
}

function maskEmail(email) {
  const [name, domain = ""] = String(email).split("@");
  if (!domain) return email;
  const safeName = name.length <= 3 ? `${name.slice(0, 1)}**` : `${name.slice(0, 3)}***`;
  return `${safeName}@${domain}`;
}

function statusFor(row, maxTokens, index) {
  const mode = modeLabels[index] || "CODE";
  if (!row || row.tokens <= 0) {
    return {
      key: "sleep",
      label: mode,
      title: mode === "FISH" ? "摸鱼钓鱼" : "离线摸鱼",
      caption: "电脑开着，人已经飘了"
    };
  }
  if (["LOL", "CS2", "VIDEO", "CARD", "FISH"].includes(mode)) {
    return {
      key: "gaming",
      label: mode,
      title: mode === "LOL" ? "峡谷摸鱼" : mode === "CS2" ? "开黑摸鱼" : "假装忙碌",
      caption: "老板来了就 Alt+Tab"
    };
  }
  if (index === 0 || row.tokens >= maxTokens * 0.82) {
    return {
      key: "overdrive",
      label: "HOT",
      title: "爆肝工作",
      caption: "键盘已经冒烟"
    };
  }
  return {
    key: "working",
    label: mode,
    title: mode === "API" ? "接口工作" : "电脑工作",
    caption: "认真敲键盘中"
  };
}

function screenSrc(index) {
  const theme = screenThemes[index] || screenThemes[0];
  return `${API_LAYER_ROOT}/screens/screen-${String(index + 1).padStart(2, "0")}-${theme}.gif`;
}

function horseSrc(index, statusKey = "working") {
  const key = ["working", "overdrive", "gaming", "sleep"].includes(statusKey) ? statusKey : "working";
  return `${API_LAYER_ROOT}/horse-${key}-sheet.png`;
}

function stationBaseSrc(index) {
  return `${API_LAYER_ROOT}/workstation-${String(index + 1).padStart(2, "0")}-base.png`;
}

function screenFrameSrc(index) {
  return `${API_LAYER_ROOT}/workstation-${String(index + 1).padStart(2, "0")}-screen-frame.png`;
}

function stationFxSrc(statusKey) {
  const fxName = ["working", "overdrive", "gaming", "sleep"].includes(statusKey) ? statusKey : "working";
  return `${ANIMATION_ROOT}/station-fx/fx-${fxName}-sheet-12.png`;
}

function currentRows() {
  const rows = state.rows.slice(0, 10);
  while (rows.length < 10) {
    rows.push({
      id: 9000 + rows.length,
      email: `empty-${rows.length + 1}@netbar.local`,
      tokens: 0,
      requests: 0,
      cost: 0,
      rank: rows.length + 1
    });
  }
  return rows;
}

const DEFAULT_VOUCHERS = [
  { title: "冠军兑换券", code: "TOP1-READY", note: "每日第 1 名" },
  { title: "亚军兑换券", code: "TOP2-READY", note: "每日第 2 名" },
  { title: "季军兑换券", code: "TOP3-READY", note: "每日第 3 名" }
];

function normalizeVoucher(item, index) {
  if (typeof item === "string") {
    return { title: `兑换券 ${index + 1}`, code: item, note: "" };
  }
  return {
    title: item?.title || DEFAULT_VOUCHERS[index]?.title || `兑换券 ${index + 1}`,
    code: item?.code || item?.value || DEFAULT_VOUCHERS[index]?.code || `COUPON-${index + 1}`,
    note: item?.note || DEFAULT_VOUCHERS[index]?.note || ""
  };
}

function voucherEntry(source, index) {
  if (Array.isArray(source)) return source[index];
  if (!source || typeof source !== "object") return null;
  const rank = index + 1;
  return source[index] || source[rank] || source[`rank${rank}`] || source[`top${rank}`] || source[`#${rank}`] || null;
}

function voucherCodes(day = shanghaiDateString()) {
  const provided = window.SUB2API_VOUCHERS;
  let source = [];
  if (Array.isArray(provided)) {
    source = provided;
  } else if (provided && typeof provided === "object") {
    source =
      provided[day] ||
      provided.dates?.[day] ||
      provided.daily?.[day] ||
      provided.default ||
      provided.items ||
      [];
  }
  return Array.from({ length: 3 }, (_, index) => normalizeVoucher(voucherEntry(source, index) || DEFAULT_VOUCHERS[index], index));
}

function isVoucherPlaceholder(code) {
  const value = String(code?.code || "").trim().toUpperCase();
  return !value || /^TOP[1-3]-READY$/.test(value) || /^COUPON-[1-3]$/.test(value);
}

function voucherPreparedCount(day = shanghaiDateString()) {
  return voucherCodes(day).filter((code) => !isVoucherPlaceholder(code)).length;
}

function voucherClaimedCount(day = shanghaiDateString(), claimed = claimedVoucherMap(day)) {
  return [1, 2, 3].filter((rank) => activeVoucherClaimForRank(rank, claimed.ranks?.[rank], day)).length;
}

function activeVoucherClaimForRank(rank, claim, day = shanghaiDateString()) {
  const rankNo = Number(rank);
  if (!claim || !rankNo || rankNo < 1 || rankNo > 3) return null;
  if (claim.rank && Number(claim.rank) !== rankNo) return null;
  const code = voucherCodes(day)[rankNo - 1] || normalizeVoucher(null, rankNo - 1);
  if (!code || isVoucherPlaceholder(code)) return null;
  return claim.code === code.code ? claim : null;
}

function activeVoucherClaimForUser(claim, day = shanghaiDateString()) {
  if (!claim) return null;
  const claimedCode = String(claim.code || "");
  const validCodes = voucherCodes(day)
    .filter((code) => !isVoucherPlaceholder(code))
    .map((code) => String(code.code || ""));
  return validCodes.includes(claimedCode) ? claim : null;
}

function voucherClaimKey(day = shanghaiDateString()) {
  return `voucherClaims:${day}`;
}

function claimedVoucherMap(day = shanghaiDateString()) {
  const key = voucherClaimKey(day);
  const existing = store[key];
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) {
    store[key] = { users: {}, ranks: {} };
  } else if (!existing.users || !existing.ranks) {
    const users = {};
    const ranks = {};
    Object.entries(existing).forEach(([userId, claim]) => {
      if (!claim || typeof claim !== "object") return;
      users[userId] = claim;
      if (claim.rank) ranks[claim.rank] = { ...claim, userId };
    });
    store[key] = { users, ranks };
  }
  return store[key];
}

function userClaimKey(row) {
  return String(row?.id ?? "");
}

function claimTimeLabel(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString("zh-CN", {
    timeZone: "Asia/Shanghai",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function canClaimVoucher(row) {
  return Boolean(row && row.rank <= 3 && row.tokens > 0);
}

function canIssueVoucher(row, day = shanghaiDateString()) {
  if (!canClaimVoucher(row)) return false;
  const code = voucherCodes(day)[row.rank - 1];
  return Boolean(code && !isVoucherPlaceholder(code));
}

function voucherClaimFor(row, claimed = claimedVoucherMap()) {
  if (!row) return null;
  return (
    activeVoucherClaimForUser(claimed.users?.[userClaimKey(row)]) ||
    activeVoucherClaimForRank(row.rank, claimed.ranks?.[row.rank]) ||
    null
  );
}

function voucherStateFor(row, claimed = claimedVoucherMap()) {
  const claim = voucherClaimFor(row, claimed);
  if (claim) return { key: "claimed", label: "已领", claim };
  if (!canClaimVoucher(row)) return { key: "empty", label: "" };
  if (canIssueVoucher(row)) return { key: "ready", label: "领券" };
  return { key: "missing", label: "待券" };
}

function voucherStateTitle(row, stateInfo = voucherStateFor(row)) {
  if (!row || !canClaimVoucher(row)) return "今日前三才有兑奖票";
  if (stateInfo.key === "ready") return `#${row.rank} 已上榜，可到柜台领取兑换券`;
  if (stateInfo.key === "claimed") return `#${row.rank} 兑换券今天已领取`;
  if (stateInfo.key === "missing") return `#${row.rank} 等待放入真实券码`;
  return "每日前三奖票";
}

function firstPendingVoucherIndex(rows = currentRows()) {
  const claimed = claimedVoucherMap();
  const pendingIndex = (needsReady) => rows.slice(0, 3).findIndex((row) => {
    if (!canClaimVoucher(row)) return false;
    const userDone = activeVoucherClaimForUser(claimed.users?.[userClaimKey(row)]);
    const rankDone = activeVoucherClaimForRank(row.rank, claimed.ranks?.[row.rank]);
    if (userDone || rankDone) return false;
    return !needsReady || canIssueVoucher(row);
  });
  const readyIndex = pendingIndex(true);
  return readyIndex >= 0 ? readyIndex : pendingIndex(false);
}

function selectedVoucherHint(row) {
  const stateInfo = voucherStateFor(row);
  if (!canClaimVoucher(row)) return "点前三工位或柜台兑换口领券";
  if (stateInfo.key === "ready") return `#${row.rank} 兑换券已在柜台`;
  if (stateInfo.key === "claimed") return `#${row.rank} 今天已经领走`;
  return `#${row.rank} 券码还没放柜台`;
}

function stationPriorityInfo(row, index, maxTokens = 0) {
  const status = statusFor(row, maxTokens, index);
  const mood = state.horseMoods[index] || {};
  const action = state.horseActions[index] || {};
  const active = action.until > Date.now();
  const key = active ? action.key : "";
  const need = recommendedCommandFor(index, status);
  let score = 0;
  let label = need.label;
  let tone = need.tone || "work";
  let command = need.command || "nudge";
  const chainTask = activeChainTaskFor(index);
  if (chainTask) {
    score += 112;
    label = chainTask.button || "连锁";
    tone = chainTask.tone || "bonus";
    command = `chain:${chainTask.action}`;
  }
  const bossOrder = state.bossOrder?.index === index && state.bossOrder.until > Date.now() ? state.bossOrder : null;
  if (bossOrder) {
    score += 120;
    label = bossOrderConfig[bossOrder.command]?.label || "点名";
    tone = "danger";
    command = bossOrder.command;
  }
  const incident = activeIncidentFor(index);
  if (incident) {
    score += 96;
    label = incident.button || "处理";
    tone = incident.tone || "danger";
    command = "incident";
  }
  const prompt = activePromptFor(index);
  if (prompt) {
    const relationPrompt = isRelationPrompt(prompt);
    score += relationPrompt ? 118 : 72;
    label = relationPrompt ? `PAIR ${prompt.button || prompt.label || "接力"}` : prompt.button || "小任务";
    tone = prompt.tone || "bonus";
    command = `prompt:${prompt.action}:${prompt.command || ""}`;
  }
  const directedTask = Boolean(chainTask || bossOrder || incident || prompt);
  if (screenTargetFor(action, status)) score += 26;
  if (horsePropFor(action)) score += 18;
  if (!directedTask && (["altTab", "hide", "fish", "laugh", "combo", "loot"].includes(key) || status.key === "gaming")) {
    score += 30;
    label = "查屏";
    tone = "danger";
    command = "inspect";
  }
  if (!directedTask && (["nap", "snore"].includes(key) || status.key === "sleep" || mood.stamina <= 22)) {
    score += 24;
    label = "叫醒";
    tone = "sleep";
    command = "nudge";
  }
  if (!directedTask && (mood.stress >= 78 || ["panic", "rage"].includes(key))) {
    score += 24;
    label = "安抚";
    tone = "heal";
    command = "snack";
  }
  if (!directedTask && row?.rank <= 3 && canIssueVoucher(row) && !voucherClaimFor(row)) {
    score += 44;
    label = "领券";
    tone = "bonus";
    command = "voucher";
  }
  if (index === state.selectedIndex) score += 4;
  return { score, label, tone, command };
}

function priorityIndexes(rows = currentRows(), maxTokens = 0) {
  return rows
    .map((row, index) => ({ index, ...stationPriorityInfo(row, index, maxTokens) }))
    .filter((item) => item.score >= 30)
    .sort((a, b) => b.score - a.score || a.index - b.index)
    .slice(0, 3);
}

function currentTargetInfo(rows = currentRows(), maxTokens = 0) {
  const priorities = priorityIndexes(rows, maxTokens);
  const target = priorities[0];
  if (!target) return null;
  const row = rows[target.index];
  const prompt = activePromptFor(target.index);
  const incident = activeIncidentFor(target.index);
  const order = activeBossOrderFor(target.index);
  const chainTask = activeChainTaskFor(target.index);
  const kind =
    chainTask ? "chain" :
    incident ? "incident" :
    prompt ? "prompt" :
    order ? "order" :
    target.command === "voucher" ? "voucher" :
    "action";
  const detail =
    chainTask?.label ||
    incident?.label ||
    prompt?.label ||
    (order ? "老板点名" : "") ||
    (target.command === "voucher" ? "前三领券" : "") ||
    target.label;
  const hint =
    chainTask ? chainTask.text :
    incident ? incident.text :
    prompt ? prompt.text :
    order ? "老板点名倒计时，点这里直接处理。" :
    target.command === "voucher" ? "前三已备券，点这里到柜台发券。" :
    `建议执行：${target.label}`;
  return {
    ...target,
    row,
    kind,
    detail,
    hint,
    stationNo: String(target.index + 1).padStart(2, "0"),
    name: horsePersonalities[target.index]?.name || "牛马"
  };
}

function setTicker(text, lockMs = 0) {
  if (!el.tickerText) return;
  el.tickerText.textContent = text;
  if (lockMs) state.tickerLockedUntil = Date.now() + lockMs;
}

function setTickerIfFree(text, lockMs = 0) {
  if (Date.now() < state.tickerLockedUntil) return false;
  setTicker(text, lockMs);
  return true;
}

function currentQuest() {
  return questDeck[state.questIndex % questDeck.length];
}

function saveGameProgress() {
  store.coins = state.coins;
  store.questIndex = state.questIndex;
  store.questProgress = state.questProgress;
  store.pressure = state.pressure;
  store.order = state.order;
  store.phaseIndex = state.phaseIndex;
  saveStore();
}

function clampStat(value) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function currentPhase() {
  return shiftPhases[state.phaseIndex % shiftPhases.length];
}

function pressureLabel() {
  if (state.pressure >= 78) return "炸";
  if (state.pressure >= 55) return "忙";
  if (state.pressure <= 28) return "闲";
  return "稳";
}

function renderShift() {
  const phase = currentPhase();
  const stage = document.getElementById("gameStage");
  if (el.shiftPhase) el.shiftPhase.textContent = phase.label;
  if (el.shiftPressure) el.shiftPressure.textContent = pressureLabel();
  document.querySelector(".hud-tile.mood")?.classList.toggle("hot", state.pressure >= 55);
  document.querySelector(".hud-tile.mood")?.classList.toggle("calm", state.pressure < 35);
  if (stage) {
    stage.dataset.phase = phase.key;
    stage.dataset.pressure = state.pressure >= 78 ? "high" : state.pressure >= 55 ? "mid" : "low";
    stage.style.setProperty("--pressure", `${state.pressure}%`);
    stage.style.setProperty("--order", `${state.order}%`);
  }
  renderFever();
}

function adjustArenaStats(deltaPressure = 0, deltaOrder = 0) {
  state.pressure = clampStat(state.pressure + deltaPressure);
  state.order = clampStat(state.order + deltaOrder);
  saveGameProgress();
  renderShift();
}

function advanceShiftPhase(manual = false) {
  state.phaseIndex = (state.phaseIndex + 1) % shiftPhases.length;
  const phase = currentPhase();
  state.pressure = clampStat((state.pressure + phase.pressure) / 2);
  state.order = clampStat((state.order + phase.order) / 2);
  saveGameProgress();
  renderShift();
  bossSay(phase.boss);
  setTicker(`${manual ? "你切换了网吧阶段" : "网吧阶段变化"}：${phase.label}`, 3200);
}

function renderQuest() {
  const quest = currentQuest();
  const progress = Math.min(state.questProgress, quest.target);
  if (el.coinValue) el.coinValue.textContent = String(state.coins);
  if (el.comboValue) el.comboValue.textContent = `x${state.gameCombo}`;
  if (el.questText) el.questText.textContent = `${quest.title} ${progress}/${quest.target}`;
  if (el.questMeter) el.questMeter.style.width = `${Math.round(progress / quest.target * 100)}%`;
}

function renderEventCard() {
  if (!el.eventCard) return;
  const now = Date.now();
  if (state.patrolClearUntil > now) {
    el.eventCard.classList.add("active", "patrol-clear");
    el.eventCard.classList.remove("patrol-wave");
    if (el.eventTitle) el.eventTitle.textContent = "巡场完成";
    if (el.eventText) el.eventText.textContent = state.patrolClearText || "三台问题机已处理，全场奖励中。";
    if (el.eventMeter) el.eventMeter.style.width = `${Math.max(0, Math.round((state.patrolClearUntil - now) / 50))}%`;
    return;
  }
  const wave = state.patrolWave && state.patrolWave.until > now ? state.patrolWave : null;
  if (wave) {
    const total = Math.max(1, wave.target || 1);
    const progress = Math.max(0, Math.min(total, wave.done || 0));
    const timeTotal = Math.max(1, wave.until - wave.startedAt);
    const timeLeft = Math.max(0, wave.until - now);
    const pctLeft = Math.round(timeLeft / timeTotal * 100);
    el.eventCard.classList.add("active", "patrol-wave");
    el.eventCard.classList.remove("patrol-clear");
    if (el.eventTitle) el.eventTitle.textContent = `巡场 ${progress}/${total}`;
    if (el.eventText) el.eventText.textContent = wave.misses ? `还有 ${total - progress} 台要处理，已漏 ${wave.misses} 台。` : `点掉发光事件牌，稳住这一轮网吧。`;
    if (el.eventMeter) el.eventMeter.style.width = `${pctLeft}%`;
    return;
  }
  const challenge = activeChainChallenge();
  if (challenge) {
    const total = Math.max(1, challenge.tasks.length);
    const progress = Math.max(0, challenge.tasks.filter((task) => task.done).length);
    const nextTasks = challenge.tasks
      .filter((task) => !task.done)
      .slice(0, 3)
      .map((task) => `${task.action === "screen" ? "点屏" : task.action === "horse" ? "点马" : "揍老板"}:${task.label}`)
      .join("  ");
    const timeTotal = Math.max(1, challenge.until - challenge.startedAt);
    const timeLeft = Math.max(0, challenge.until - now);
    const pctLeft = Math.round(timeLeft / timeTotal * 100);
    el.eventCard.classList.add("active", "chain-wave");
    el.eventCard.classList.remove("patrol-wave", "patrol-clear");
    if (el.eventTitle) el.eventTitle.textContent = `${challenge.title} ${progress}/${total}`;
    if (el.eventText) el.eventText.textContent = challenge.misses ? `连锁漏了 ${challenge.misses} 台，剩下 ${total - progress} 台。` : nextTasks || challenge.text;
    if (el.eventMeter) el.eventMeter.style.width = `${pctLeft}%`;
    return;
  }
  const active = state.eventUntil > now;
  const total = Math.max(1, state.eventUntil - state.eventStartedAt);
  const left = active ? Math.max(0, state.eventUntil - now) : 0;
  const pctLeft = active ? Math.round(left / total * 100) : 0;
  el.eventCard.classList.toggle("active", active);
  el.eventCard.classList.remove("patrol-wave", "patrol-clear", "chain-wave");
  if (el.eventTitle) el.eventTitle.textContent = active ? state.eventTitle : "网吧平静中";
  if (el.eventText) el.eventText.textContent = active ? state.eventText : "下一次突发事件正在路上。";
  if (el.eventMeter) el.eventMeter.style.width = `${pctLeft}%`;
}

function renderTargetRadar(rows = currentRows(), maxTokens = 0) {
  if (!el.targetRadar) return null;
  const now = Date.now();
  if (state.radarChainUntil <= now) state.radarChain = 0;
  const target = currentTargetInfo(rows, maxTokens);
  if (!target) {
    el.targetRadar.dataset.state = "idle";
    delete el.targetRadar.dataset.index;
    el.targetRadar.style.setProperty("--radar-chain", "0%");
    if (el.targetRadarTitle) el.targetRadarTitle.textContent = "暂无急事";
    if (el.targetRadarAction) el.targetRadarAction.textContent = "继续巡场";
    if (el.targetRadarHint) el.targetRadarHint.textContent = "有事件或小任务会自动锁定";
    return null;
  }
  const chainPct = Math.max(0, Math.min(100, Math.round(state.radarChain / 5 * 100)));
  el.targetRadar.dataset.state = target.tone || "work";
  el.targetRadar.dataset.kind = target.kind;
  el.targetRadar.dataset.index = String(target.index);
  el.targetRadar.dataset.command = target.command || "";
  el.targetRadar.dataset.chain = String(state.radarChain || 0);
  el.targetRadar.style.setProperty("--radar-chain", `${chainPct}%`);
  if (el.targetRadarTitle) el.targetRadarTitle.textContent = `${target.stationNo} ${target.name}`;
  if (el.targetRadarAction) el.targetRadarAction.textContent = `${target.detail} · ${target.label}${state.radarChain ? ` · CHAIN ${state.radarChain}` : ""}`;
  if (el.targetRadarHint) el.targetRadarHint.textContent = target.hint;
  return target;
}

function coachTargetFromInfo(target) {
  if (!target) return null;
  const command = String(target.command || "");
  const chainTask = activeChainTaskFor(target.index);
  const prompt = activePromptFor(target.index);
  const incident = activeIncidentFor(target.index);
  let kind = "screen";
  if (chainTask) kind = chainTask.action === "horse" ? "horse" : chainTask.action === "boss" ? "boss" : "screen";
  else if (prompt) kind = prompt.action === "horse" ? "horse" : prompt.action === "command" ? "button" : "screen";
  else if (incident) kind = "screen";
  else if (command === "voucher") kind = "voucher";
  else if (command === "snack" || command === "praise" || command === "break") kind = "horse";
  else if (command === "inspect" || command === "nudge") kind = "screen";
  return {
    index: target.index,
    kind,
    tone: target.tone || "work",
    text:
      chainTask ? `${chainTask.label}` :
      prompt ? `${prompt.label}` :
      incident ? `${incident.label}` :
      target.command === "voucher" ? "领每日券" :
      `${target.label} · ${target.name}`
  };
}

function rememberCoachHint(target, lockMs = 1800) {
  if (!target) return;
  state.coachHint = {
    ...target,
    until: Date.now() + lockMs
  };
}

function cleanCoachText(text, actionLabel, fallback = "当前目标") {
  const raw = String(text || "").trim();
  if (!raw) return fallback;
  const compact = raw.replace(/\s+/g, "");
  const action = String(actionLabel || "").replace(/\s+/g, "");
  if (!action) return raw;
  if (compact === action || compact === `${action}·${action}` || compact === `${action}${action}`) return fallback;
  if (compact.startsWith(action) && compact.slice(action.length) === action) return fallback;
  return raw;
}

function coachPointFor(target) {
  if (!target) return null;
  if (target.kind === "boss") return BOSS_ORDER_ANCHOR;
  if (target.kind === "voucher") {
    const booth = stagePointForElement(el.voucherBooth);
    if (booth) return { x: booth.x / 100 * WORLD.width, y: booth.y / 100 * WORLD.height };
  }
  const slot = stations[target.index];
  if (!slot) return null;
  const marker = stationMarkerPoint(target.index, target.kind === "horse" ? 0.5 : 0);
  if (marker) return marker;
  if (target.kind === "horse") {
    return { x: slot.horse.x + slot.horse.w * 0.62, y: slot.horse.y + slot.horse.h * 0.34 };
  }
  if (target.kind === "button") {
    return { x: slot.label.x + 42, y: slot.label.y + 20 };
  }
  return { x: slot.screen.x + slot.screen.w * 0.5, y: slot.screen.y + slot.screen.h * 0.48 };
}

function stationMarkerPoint(index, step = 0) {
  const slot = stations[index];
  if (!slot) return null;
  const side = index % 2 === 0 ? -1 : 1;
  const rawX = side < 0 ? slot.x - 34 : slot.x + slot.w + 34;
  const rawY = slot.screen.y + slot.screen.h * 0.5 + step * 34;
  return {
    x: Math.max(58, Math.min(WORLD.width - 58, rawX)),
    y: Math.max(76, Math.min(WORLD.height - 112, rawY))
  };
}

function renderCoachHint(targetInfo = null) {
  if (!el.fxLayer) return;
  el.fxLayer.querySelector(".coach-hint")?.remove();
  const now = Date.now();
  const liveTarget = coachTargetFromInfo(targetInfo || currentTargetInfo());
  const locked = state.coachHint?.until > now ? state.coachHint : null;
  const target = liveTarget || locked;
  if (!target) return;
  const point = coachPointFor(target);
  if (!point) return;
  const node = document.createElement("span");
  node.className = `coach-hint ${target.tone || "work"} ${target.kind || "screen"}`;
  node.style.left = `${point.x / WORLD.width * 100}%`;
  node.style.top = `${point.y / WORLD.height * 100}%`;
  const actionLabel = target.kind === "horse" ? "点马" : target.kind === "boss" ? "揍老板" : target.kind === "voucher" ? "领奖" : target.kind === "button" ? "按键" : "点屏";
  const text = cleanCoachText(target.text, actionLabel, target.kind === "boss" ? "牛老板" : target.kind === "voucher" ? "每日前三" : "当前目标");
  node.innerHTML = `<b>${actionLabel}</b><i>${text}</i>`;
  el.fxLayer.appendChild(node);
  if (liveTarget) rememberCoachHint(liveTarget, 2100);
}

function radarChainSuccess(index, label = "目标处理") {
  const now = Date.now();
  state.radarChain = now < state.radarChainUntil ? Math.min(9, state.radarChain + 1) : 1;
  state.radarChainUntil = now + 9000;
  rememberCoachHint({ index, kind: "screen", text: state.radarChain >= 2 ? `NEXT 连击 ${state.radarChain}` : "NEXT 找下一个目标", tone: state.radarChain >= 3 ? "bonus" : "work" }, 1500);
  if (state.radarChain >= 2) {
    comboPop(`TARGET x${state.radarChain}`);
    commandPop(index, `雷达 x${state.radarChain}`, state.radarChain >= 3 ? "bonus" : "work");
  }
  if (state.radarChain === 3) {
    addCoins(5, "雷达三连", index);
    addHype(14, "雷达三连");
    rewardTicket("雷达三连", ["奖励 +5 币", "节奏加速"], "bonus", index);
    setTicker(`雷达三连：连续处理目标，网吧节奏开始加速。`, 3200);
  }
  if (state.radarChain === 5) {
    addCoins(8, "雷达五连", index);
    triggerFever("雷达五连", index, 7200);
    rewardTicket("雷达五连", ["FEVER 启动", "全场提速"], "fever", index);
    rippleHorseReaction(index, { key: "spark", text: "雷达五连!", mood: "全场提速", screen: "fast", emote: "5X" }, 2);
  }
  if (state.radarChain > 5 && state.radarChain % 2 === 1) {
    addCoins(3, "雷达连锁", index);
  }
}

function runRadarTarget() {
  if (!el.targetRadar) return false;
  const index = Number(el.targetRadar.dataset.index);
  if (!Number.isInteger(index)) {
    toast("当前没有紧急目标。");
    const fallback = firstPendingVoucherIndex();
    if (fallback >= 0) {
      rememberCoachHint({ index: fallback, kind: "voucher", text: "前三可去柜台领奖", tone: "bonus" }, 2600);
    } else {
      rememberCoachHint({ index: state.selectedIndex, kind: "screen", text: "点发光屏幕或拍牛老板", tone: "work" }, 2600);
    }
    renderCoachHint();
    return false;
  }
  const beforeIncident = Boolean(activeIncidentFor(index));
  const beforePrompt = Boolean(activePromptFor(index));
  const beforeOrder = Boolean(activeBossOrderFor(index));
  const command = el.targetRadar.dataset.command || "";
  runPriorityCommand(index, command);
  const success =
    beforeIncident ? !activeIncidentFor(index) :
    beforePrompt ? !activePromptFor(index) :
    beforeOrder ? !activeBossOrderFor(index) :
    true;
  if (success) radarChainSuccess(index, command);
  renderTargetRadar();
  return success;
}

function renderCommandButtons() {
  if (!el.quickActions) return;
  const now = Date.now();
  const mood = state.horseMoods[state.selectedIndex] || {};
  el.quickActions.dataset.intent =
    mood.stamina <= 24 ? "tired" :
    mood.stress >= 78 ? "panic" :
    mood.focus <= 34 ? "slack" :
    mood.focus >= 78 ? "focus" :
    "normal";
  el.quickActions.querySelectorAll("button[data-command]").forEach((button) => {
    const command = button.dataset.command;
    const config = commandConfig[command] || { label: button.textContent, cooldown: 0 };
    const until = state.commandCooldowns[command] || 0;
    const cooling = until > now;
    const ordered = state.bossOrder?.index === state.selectedIndex && state.bossOrder?.command === command && state.bossOrder.until > now;
    button.disabled = cooling;
    button.classList.toggle("cooling", cooling);
    button.classList.toggle("ordered", ordered);
    button.style.setProperty("--cool", cooling ? `${Math.round((until - now) / config.cooldown * 100)}%` : "0%");
    button.textContent = cooling ? `${Math.ceil((until - now) / 1000)}s` : config.label;
  });
}

function renderSelectionHud(rows = currentRows(), maxTokens = 0) {
  if (!el.selectionHud) return;
  const index = state.selectedIndex;
  const row = rows[index];
  const slot = stations[index];
  if (!row || !slot) {
    el.selectionHud.innerHTML = "";
    return;
  }
  const mood = state.horseMoods[index] || {};
  const action = state.horseActions[index] || {};
  const status = statusFor(row, maxTokens, index);
  const intent = intentFor(index, status, action);
  const focus = mood.focus ?? 0;
  const stamina = mood.stamina ?? 0;
  const stress = mood.stress ?? 0;
  const left = Math.min(WORLD.width - 170, slot.label.x + 86);
  const top = Math.min(WORLD.height - 48, slot.meter.y + (slot.row === "front" ? 10 : 8));
  const now = Date.now();
  const voucherHint = canClaimVoucher(row) ? `<em class="selection-voucher">${selectedVoucherHint(row)}</em>` : "";
  const buttons = Object.entries(commandConfig).map(([command, config]) => {
    const until = state.commandCooldowns[command] || 0;
    const cooling = until > now;
    const ordered = state.bossOrder?.index === index && state.bossOrder?.command === command && state.bossOrder.until > now;
    return `<button type="button" data-command="${command}" class="${cooling ? "cooling" : ""} ${ordered ? "ordered" : ""}" ${cooling ? "disabled" : ""}>${cooling ? `${Math.ceil((until - now) / 1000)}s` : config.label}</button>`;
  }).join("");
  el.selectionHud.style.left = `${pct(left, WORLD.width)}`;
  el.selectionHud.style.top = `${pct(top, WORLD.height)}`;
  el.selectionHud.style.transform = "translate(-50%, 0)";
  el.selectionHud.dataset.tone = intent.tone;
  el.selectionHud.innerHTML = `
    <div class="selection-card ${intent.tone}">
      <div class="selection-head">
        <b>${String(index + 1).padStart(2, "0")} ${horsePersonalities[index]?.name || "牛马"}</b>
        <span>${intent.label}</span>
      </div>
      <div class="selection-bars" aria-hidden="true">
        <i style="--bar:${focus}%"></i>
        <i style="--bar:${stamina}%"></i>
        <i style="--bar:${stress}%"></i>
      </div>
      ${voucherHint}
      <div class="selection-actions">${buttons}</div>
    </div>
  `;
}

function bumpQuestPanel() {
  if (!el.questPanel) return;
  el.questPanel.classList.remove("bump");
  void el.questPanel.offsetWidth;
  el.questPanel.classList.add("bump");
}

function renderFever() {
  const active = state.feverUntil > Date.now();
  const stage = document.getElementById("gameStage");
  if (stage) {
    stage.dataset.fever = active ? "on" : "off";
    stage.style.setProperty("--fever-left", active ? `${Math.max(0, Math.round((state.feverUntil - Date.now()) / 60))}%` : "0%");
  }
  if (el.comboValue) {
    el.comboValue.textContent = active ? `FEVER x${state.gameCombo}` : `x${state.gameCombo}`;
  }
  if (el.questPanel) {
    el.questPanel.classList.toggle("fever", active);
  }
}

function triggerFever(reason = "连击", index = state.selectedIndex, duration = 5200) {
  const now = Date.now();
  state.feverUntil = Math.max(state.feverUntil, now + duration);
  state.feverReason = reason;
  comboPop(`FEVER ${reason}`);
  commandPop(index, "FEVER", "bonus");
  setTicker(`FEVER：${reason} 点燃网吧，短时间连击奖励更高。`, 3200);
  rippleHorseReaction(index, { key: "spark", text: "FEVER!", mood: "热潮", screen: "fast", emote: "HOT" }, 1);
  renderFever();
}

function interactionBeat(kind, index, reason) {
  const now = Date.now();
  const sameWindow = now - state.lastInteractionAt < 4200;
  const sameKind = state.lastInteractionKind === kind;
  state.interactionStreak = sameWindow ? Math.min(12, state.interactionStreak + (sameKind ? 1 : 1)) : 1;
  state.lastInteractionKind = kind;
  state.lastInteractionAt = now;
  if (state.interactionStreak >= 3) {
    comboPop(`${reason} x${state.interactionStreak}`);
    commandPop(index, `连击 x${state.interactionStreak}`, state.interactionStreak >= 5 ? "bonus" : "work");
  }
  if (state.interactionStreak === 3) {
    setTicker(`连续操作 x3：网吧节奏起来了，继续点对状态会触发全场反应。`, 2600);
  }
  if (state.interactionStreak === 5) {
    triggerFever(reason || "连击", index, 5200);
    addHype(18, `${reason}连击`);
    rippleHorseReaction(index, { key: "wave", text: "跟上节奏!", mood: "被带动", screen: "fast", emote: "GO" }, 1);
  }
  if (state.interactionStreak >= 8 && state.interactionStreak % 2 === 0) {
    triggerFever(`${reason} x${state.interactionStreak}`, index, 6200);
    addHype(24, `${reason}高连击`);
    markStationStory(index, "sprint", "连击", 2200);
  }
}

function addCoins(amount, reason, index = state.selectedIndex) {
  const now = Date.now();
  state.gameCombo = now - state.lastGameAction < 3600 ? Math.min(9, state.gameCombo + 1) : 1;
  state.lastGameAction = now;
  const feverBonus = state.feverUntil > now ? 2 : 0;
  const earned = amount + Math.max(0, state.gameCombo - 1) + feverBonus;
  state.coins += earned;
  saveGameProgress();
  renderQuest();
  bumpQuestPanel();
  if (Number.isInteger(index)) spawnPop(index, `+${earned}币`, 1700, -28);
  if (Number.isInteger(index)) interactionBeat(reason || "互动", index, reason || "互动");
  if (reason) toast(`+${earned} 牛马币 · ${reason}`);
  renderFever();
}

function addHype(amount, source = "互动") {
  const now = Date.now();
  state.hype = now - state.lastHypeAt > 6500 ? amount : Math.min(100, state.hype + amount);
  state.lastHypeAt = now;
  if (state.hype < 30) return;
  const burst = state.hype;
  state.hype = 0;
  triggerFever(source, state.selectedIndex, burst >= 58 ? 7200 : 4800);
  if (state.patrolWave?.until > now || state.patrolClearUntil > now) return;
  triggerArenaEvent({
    title: burst >= 58 ? "全场起哄" : "网吧躁动",
    text: burst >= 58 ? `${source} 把全场点燃了，十台机子同时冒泡。` : `${source} 引起邻座围观，几匹马开始互相影响。`,
    boss: burst >= 58 ? "都别起哄，屏幕给我切回工作台。" : "声音小点，我在柜台都听见了。",
    action: burst >= 58
      ? { key: "panic", text: "全场切屏!", mood: "集体装忙", screen: "panic", emote: "TAB" }
      : { key: "wave", text: "围观一下", mood: "凑热闹", screen: "game", emote: "看" },
    duration: burst >= 58 ? 6200 : 4200,
    pressure: burst >= 58 ? 10 : 4,
    order: burst >= 58 ? 8 : -3,
    stress: burst >= 58 ? 6 : 1,
    trust: burst >= 58 ? -2 : 0
  });
}

function canRunCommand(command) {
  const until = state.commandCooldowns[command] || 0;
  if (until <= Date.now()) return true;
  toast(`${commandConfig[command]?.label || "技能"} 冷却中`);
  renderCommandButtons();
  return false;
}

function startCommandCooldown(command) {
  const config = commandConfig[command];
  if (!config) return;
  state.commandCooldowns[command] = Date.now() + config.cooldown;
  renderCommandButtons();
}

function maybeStartBossOrder(force = false) {
  const now = Date.now();
  if (state.bossOrder && state.bossOrder.until > now) return;
  if (!force && now < state.bossOrderNextAt) return;
  const rows = currentRows();
  const candidates = rows
    .map((row, index) => ({ row, index, mood: state.horseMoods[index] || {} }))
    .filter(({ row }) => row && row.tokens > 0);
  if (!candidates.length) return;
  const weighted = candidates.flatMap((item) => {
    const status = statusFor(item.row, Math.max(...rows.map((row) => row.tokens), 0), item.index);
    const weight =
      status.key === "gaming" ? 4 :
      status.key === "sleep" ? 3 :
      item.mood.stress >= 70 ? 2 :
      item.index < 3 ? 2 :
      1;
    return Array.from({ length: weight }, () => item);
  });
  const picked = weighted[Math.floor(Math.random() * weighted.length)] || candidates[0];
  const command =
    picked.mood.stamina <= 26 ? "snack" :
    picked.mood.stress >= 76 ? "break" :
    picked.mood.focus >= 78 && Math.random() < 0.4 ? "praise" :
    statusFor(picked.row, Math.max(...rows.map((row) => row.tokens), 0), picked.index).key === "gaming" ? "inspect" :
    "nudge";
  const config = bossOrderConfig[command] || bossOrderConfig.nudge;
  const stationNo = String(picked.index + 1).padStart(2, "0");
  state.bossOrder = {
    id: `${now}-${picked.index}-${command}`,
    index: picked.index,
    command,
    until: now + 9000,
    startedAt: now
  };
  state.bossOrderNextAt = now + 19000 + Math.floor(Math.random() * 7000);
  bossSay(config.boss(stationNo));
  setTicker(`老板点名 ${stationNo} 号机：${config.label}，点它或用小按钮完成。`, 4200);
  triggerHorseAction(picked.index, config.action, 2500);
}

function completeBossOrder(command, index) {
  const order = state.bossOrder;
  if (!order || order.until <= Date.now()) return false;
  if (order.index !== index || order.command !== command) return false;
  state.bossOrder = null;
  state.bossOrderNextAt = Date.now() + 15000 + Math.floor(Math.random() * 6000);
  addCoins(5, "完成点名", index);
  adjustHorseMood(index, { stress: -8, trust: 5 });
  spawnPop(index, "点名完成", 1500, -34);
  commandPop(index, "DONE", "bonus");
  markStationStory(index, "support", "DONE", 1800);
  bossSay("这次反应还行，继续盯着。");
  setTicker(`${String(index + 1).padStart(2, "0")} 号机完成老板点名，场面稳住了。`, 3200);
  return true;
}

function tickBossOrder() {
  const order = state.bossOrder;
  const now = Date.now();
  if (order && order.until <= now) {
    const index = order.index;
    const config = bossOrderConfig[order.command] || bossOrderConfig.nudge;
    state.bossOrder = null;
    state.bossOrderNextAt = now + 12000 + Math.floor(Math.random() * 7000);
    adjustHorseMood(index, { stress: 12, trust: -5 });
    adjustHorseStats(index, -6, -7);
    triggerHorseAction(index, { key: "panic", text: `${config.marker}超时!`, mood: "挨骂", screen: "panic", emote: "!!" }, 2200);
    commandPop(index, "超时", "danger");
    markStationStory(index, "patrol", "超时", 2200);
    bossSay(`${String(index + 1).padStart(2, "0")} 号机点名超时，扣一杯奶茶。`);
    setTicker(`老板点名超时：${String(index + 1).padStart(2, "0")} 号机压力上升。`, 3200);
    return;
  }
  maybeStartBossOrder(false);
}

function advanceQuest(kind, amount = 1) {
  const quest = currentQuest();
  if (quest.key !== kind) return false;
  state.questProgress = Math.min(quest.target, state.questProgress + amount);
  let completed = false;
  if (state.questProgress >= quest.target) {
    completed = true;
    state.coins += quest.reward;
    state.questIndex = (state.questIndex + 1) % questDeck.length;
    state.questProgress = 0;
    audio.reward();
    triggerHorseAction(state.selectedIndex, { key: "spark", text: "任务完成!", mood: "领奖", screen: "fast", emote: "奖" }, 2200);
    bossSay("任务做完了？那再来一个。");
    toast(`任务完成 +${quest.reward} 牛马币`);
    setTicker(`任务完成：${quest.title}。下一项：${currentQuest().title}`, 3600);
  }
  saveGameProgress();
  renderQuest();
  bumpQuestPanel();
  return completed;
}

function activeHorseMood(index) {
  const mood = state.horseMoods[index] || {};
  const action = state.horseActions[index];
  const active = action?.until > Date.now();
  return {
    mood: active ? action.mood || mood.mood : mood.mood,
    emote: active ? action.emote || mood.emote : mood.emote,
    screen: active ? action.screen || mood.screen : mood.screen,
    active
  };
}

const personalityQuips = [
  {
    typing: ["别催，键盘快冒烟了", "我在冲榜，别掉线"],
    spark: ["榜一别睡", "券在柜台发光"],
    idea: ["差距算出来了", "这波能追"]
  },
  {
    debug: ["日志对上了", "500 我来抓"],
    repair: ["重试三次再说", "鉴权别又炸"],
    typing: ["接口先跑起来"]
  },
  {
    combo: ["中路集合一下", "五排就一局"],
    altTab: ["我在看需求，真的", "老板刚走吧"],
    laugh: ["赢一把就干活"]
  },
  {
    loot: ["A 点有人", "听脚步，别说话"],
    panic: ["闪光弹来了", "老板像白了一下"],
    combo: ["这一把打完"]
  },
  {
    hide: ["小窗藏右下", "弹幕别刷了"],
    laugh: ["这集有意思", "马上切回去"],
    altTab: ["我刚刚没看剧"]
  },
  {
    repair: ["下载别断线", "进度条动一下"],
    coffee: ["网速回来了", "带宽稳住"],
    debug: ["连接我查"]
  },
  {
    idea: ["前三差距缩小", "我盯着榜呢"],
    spark: ["再压一波", "券别被抢"],
    typing: ["榜单在跳"]
  },
  {
    laugh: ["红桃 A 到手", "接龙赢了"],
    hide: ["鼠标别抖", "牌藏起来"],
    altTab: ["我在排版"]
  },
  {
    snore: ["低电模式", "头点三下"],
    nap: ["梦里写接口", "眯十秒"],
    stretch: ["脖子响了"]
  },
  {
    fish: ["钓到异常日志", "鱼竿收一下"],
    hide: ["收线收线", "老板看不见"],
    snore: ["钓困了"]
  }
];

function quipForAction(index, action, status) {
  const pool = personalityQuips[index] || {};
  const key = action?.key || status?.key || "typing";
  const lines = pool[key] || pool[status?.key] || pool.typing || pool.debug || pool.fish || [];
  if (!lines.length) return "";
  const mood = state.horseMoods[index] || {};
  const pick = lines[(mood.actionCount || 0) % lines.length];
  return pick === mood.lastQuip && lines.length > 1 ? lines[(lines.indexOf(pick) + 1) % lines.length] : pick;
}

function behaviorProfilesFor(index) {
  return horseBehaviorProfiles[index] || horseBehaviorProfiles[0] || [];
}

function behaviorByKey(index, key) {
  return behaviorProfilesFor(index).find((item) => item.key === key) || null;
}

function activeBehaviorFor(index) {
  const mood = state.horseMoods[index] || {};
  if (!mood.behaviorKey || mood.behaviorUntil <= Date.now()) return null;
  return behaviorByKey(index, mood.behaviorKey);
}

function behaviorWeight(profile, index, row, status) {
  const mood = state.horseMoods[index] || {};
  let weight = 1;
  if (row?.rank <= 3 && ["bonus", "work"].includes(profile.tone)) weight += 2;
  if (status.key === "gaming" && ["game", "sneak"].includes(profile.tone)) weight += 3;
  if (status.key === "sleep" && ["sleep", "heal"].includes(profile.tone)) weight += 3;
  if (status.key === "working" && ["work", "bonus"].includes(profile.tone)) weight += 2;
  if ((mood.focus ?? 50) <= 36 && ["game", "sneak", "sleep"].includes(profile.tone)) weight += 2;
  if ((mood.stamina ?? 60) <= 28 && ["sleep", "heal"].includes(profile.tone)) weight += 3;
  if ((mood.stress ?? 40) >= 74 && ["heal", "work"].includes(profile.tone)) weight += 1;
  if (profile.key === mood.behaviorKey) weight -= 2;
  return Math.max(0.3, weight);
}

function chooseBehaviorProfile(index, status) {
  const rows = currentRows();
  const row = rows[index];
  const profiles = behaviorProfilesFor(index);
  if (!profiles.length) return null;
  const weighted = profiles.map((profile) => ({
    profile,
    weight: behaviorWeight(profile, index, row, status)
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  let pick = Math.random() * Math.max(0.1, total);
  for (const item of weighted) {
    pick -= item.weight;
    if (pick <= 0) return item.profile;
  }
  return weighted[0]?.profile || null;
}

function activateBehavior(index, status, force = false) {
  const mood = state.horseMoods[index];
  if (!mood) return null;
  const now = Date.now();
  if (!force && mood.behaviorUntil > now && mood.nextBehaviorAt > now) return activeBehaviorFor(index);
  const profile = chooseBehaviorProfile(index, status);
  if (!profile) return null;
  const personality = horsePersonalities[index] || {};
  const duration = Math.round((9000 + Math.random() * 8400) * (personality.delay || 1));
  mood.behaviorKey = profile.key;
  mood.behaviorLabel = profile.label;
  mood.behaviorChip = profile.chip;
  mood.behaviorTone = profile.tone;
  mood.behaviorUntil = now + duration;
  mood.behaviorStep = 0;
  mood.nextBehaviorAt = now + duration + 2200 + Math.floor(Math.random() * 4200);
  markStationStory(index, `behavior-${profile.key}`, profile.chip || profile.label, Math.min(duration, 5200));
  return profile;
}

function behaviorActionFor(index, status) {
  const mood = state.horseMoods[index] || {};
  const behavior = activeBehaviorFor(index) || activateBehavior(index, status);
  if (!behavior?.actions?.length) return null;
  const step = mood.behaviorStep || 0;
  const action = behavior.actions[step % behavior.actions.length];
  mood.behaviorStep = step + 1;
  return {
    ...action,
    behaviorKey: behavior.key,
    behaviorLabel: behavior.label,
    behaviorTone: behavior.tone
  };
}

function seedHorseBehaviors() {
  const rows = currentRows();
  if (!rows.length) return;
  const maxTokens = Math.max(...rows.map((row) => row.tokens), 0);
  rows.forEach((row, index) => {
    const mood = state.horseMoods[index];
    if (!mood || activeBehaviorFor(index)) return;
    const status = statusFor(row, maxTokens, index);
    const profile = activateBehavior(index, status, true);
    if (!profile) return;
    const action = profile.actions?.[index % Math.max(1, profile.actions.length)];
    if (action) {
      const now = Date.now();
      mood.mood = action.mood || profile.label;
      mood.emote = action.emote || profile.chip;
      mood.screen = action.screen || profile.screen || "";
      mood.lastQuip = action.text || profile.label;
      mood.quipUntil = now + 2600 + index * 90;
      state.horseActions[index] = {
        ...action,
        behaviorKey: profile.key,
        behaviorLabel: profile.label,
        behaviorTone: profile.tone,
        until: now + 1800 + index * 110
      };
      state.stationPulse[index] = now + 260 + index * 50;
      scheduleHorse(index, 1400 + index * 310);
    }
  });
}

function screenClassFor(mood) {
  if (!mood?.screen) return "";
  return `screen-${mood.screen}`;
}

function screenProgram(index, action, status, pctValue) {
  const base = screenPrograms[index] || screenPrograms[0];
  const behavior = activeBehaviorFor(index);
  const actionKey = action?.until > Date.now() ? action.key : "";
  const patterns = ["code", "api", "moba", "crosshair", "video", "download", "rank", "cards", "idle", "fish"];
  const behaviorPattern = behavior?.pattern || "";
  const title =
    actionKey === "altTab" || actionKey === "hide" ? "ALT TAB" :
    actionKey === "panic" ? "BOSS!" :
    actionKey === "debug" || actionKey === "repair" ? "LOG FIX" :
    actionKey === "coffee" || actionKey === "stretch" ? "RESTORE" :
    actionKey === "spark" || actionKey === "rage" || actionKey === "idea" ? "BOOST" :
    actionKey === "nap" || actionKey === "snore" ? "SLEEP" :
    actionKey === "fish" ? "FISHING" :
    actionKey === "laugh" || actionKey === "combo" || actionKey === "loot" ? "GAME" :
    behavior?.label ? behavior.label :
    base.title;
  const line = action?.until > Date.now() ? action.text : status.caption;
  return {
    ...base,
    rows: behavior?.rows || base.rows,
    title,
    line,
    pattern: behaviorPattern || patterns[index] || "code",
    alert: ["panic", "altTab", "hide", "rage"].includes(actionKey),
    game: ["laugh", "combo", "loot", "fish"].includes(actionKey) || status.key === "gaming" || ["game", "sneak"].includes(behavior?.tone),
    power: Math.max(5, Math.min(100, pctValue))
  };
}

function screenVisualMarkup(program, index) {
  const rows = (program.rows || []).slice(0, 3);
  if (program.pattern === "code") {
    return `<span class="screen-visual visual-code">${rows.map((row, i) => `<i style="--w:${Math.max(28, program.power - i * 18)}%">${row}</i>`).join("")}</span>`;
  }
  if (program.pattern === "api") {
    return `<span class="screen-visual visual-api"><i></i><i></i><i></i><b>200</b></span>`;
  }
  if (program.pattern === "moba") {
    return `<span class="screen-visual visual-moba"><i></i><i></i><i></i><b></b></span>`;
  }
  if (program.pattern === "crosshair") {
    return `<span class="screen-visual visual-crosshair"><i></i><i></i><b></b></span>`;
  }
  if (program.pattern === "video") {
    return `<span class="screen-visual visual-video"><i style="--bar:${program.alert ? 82 : 46}%"></i><b></b><b></b></span>`;
  }
  if (program.pattern === "download") {
    return `<span class="screen-visual visual-download">${Array.from({ length: 6 }, (_, i) => `<i style="--d:${i}"></i>`).join("")}</span>`;
  }
  if (program.pattern === "rank") {
    return `<span class="screen-visual visual-rank">${[72, 52, 38, 26].map((h, i) => `<i style="--h:${Math.min(92, h + index * 2)}%"></i>`).join("")}</span>`;
  }
  if (program.pattern === "cards") {
    return `<span class="screen-visual visual-cards"><i>A</i><i>K</i><i>Q</i></span>`;
  }
  if (program.pattern === "idle") {
    return `<span class="screen-visual visual-idle"><i>Z</i><i>Z</i><i>Z</i></span>`;
  }
  return `<span class="screen-visual visual-fish"><i></i><b></b><em></em></span>`;
}

function screenHudMarkup(program, index) {
  return `
    <span class="screen-hud screen-pattern-${program.pattern} ${program.alert ? "screen-alert" : ""} ${program.game ? "screen-gameplay" : ""}" aria-hidden="true">
      <b>${program.tag}</b>
      <i>${program.title}</i>
      <em>${program.line}</em>
      ${screenVisualMarkup(program, index)}
      <span class="screen-bars">
        <u style="--bar:${program.power}%"></u>
        <u style="--bar:${Math.max(8, 100 - program.power / 2)}%"></u>
        <u style="--bar:${Math.max(12, (index + 1) * 8)}%"></u>
      </span>
    </span>
  `;
}

function horseStatClass(mood) {
  if (!mood) return "";
  if (mood.stamina <= 25) return "stat-tired";
  if (mood.focus <= 35) return "stat-slacking";
  if (mood.focus >= 78 && mood.stamina >= 45) return "stat-focused";
  return "";
}

function recommendedCommandFor(index, status = null) {
  const mood = state.horseMoods[index] || {};
  const rows = currentRows();
  const row = rows[index];
  const fallbackStatus = status || statusFor(row, Math.max(...rows.map((item) => item.tokens), 0), index);
  const action = state.horseActions[index] || {};
  const activeKey = action.until > Date.now() ? action.key : "";
  const behavior = activeBehaviorFor(index);
  if (activeBossOrderFor(index)) return { command: activeBossOrderFor(index).command, label: "点名", tone: "danger" };
  if (behavior?.command && !["panic", "rage"].includes(activeKey)) {
    const labels = {
      inspect: "查屏",
      snack: "补糖",
      praise: "表扬",
      nudge: "催活",
      break: "放风"
    };
    return { command: behavior.command, label: labels[behavior.command] || behavior.chip || "处理", tone: behavior.tone || "work" };
  }
  if (["nap", "snore"].includes(activeKey) || fallbackStatus.key === "sleep" || mood.stamina <= 20) {
    return { command: "nudge", label: "叫醒", tone: "sleep" };
  }
  if (["panic", "rage"].includes(activeKey) || mood.stress >= 78) {
    return { command: "snack", label: "补给", tone: "heal" };
  }
  if (["altTab", "hide", "fish", "laugh", "combo", "loot"].includes(activeKey) || fallbackStatus.key === "gaming" || mood.focus <= 34) {
    return { command: "inspect", label: "查屏", tone: "danger" };
  }
  if (mood.focus >= 78 && mood.stamina >= 42) {
    return { command: "praise", label: "表扬", tone: "bonus" };
  }
  return { command: "nudge", label: "催活", tone: "work" };
}

function horsePropFor(action) {
  const key = action?.until > Date.now() ? action.key : "";
  const props = {
    typing: { type: "keys", text: "KEY", hint: "帮它加速敲键盘" },
    debug: { type: "log", text: "LOG", hint: "捡起日志一起排障" },
    repair: { type: "tool", text: "扳", hint: "递工具修电脑" },
    coffee: { type: "cup", text: "杯", hint: "接住补给回血" },
    stretch: { type: "wind", text: "风", hint: "让它放松一下" },
    panic: { type: "alert", text: "!", hint: "马上安抚它" },
    rage: { type: "alert", text: "!!", hint: "拦住暴走需求" },
    altTab: { type: "tab", text: "TAB", hint: "抓住切屏现场" },
    hide: { type: "tab", text: "藏", hint: "揭开藏起来的小窗" },
    laugh: { type: "pad", text: "PAD", hint: "收走游戏手柄" },
    combo: { type: "pad", text: "5V5", hint: "打断开黑暗号" },
    loot: { type: "pad", text: "箱", hint: "收走战利品箱" },
    nap: { type: "sleep", text: "Z", hint: "叫醒低电马" },
    snore: { type: "sleep", text: "Zz", hint: "叫醒挂机马" },
    fish: { type: "fish", text: "钩", hint: "收掉摸鱼鱼竿" },
    spark: { type: "spark", text: "★", hint: "接住冲榜星星" },
    idea: { type: "spark", text: "灯", hint: "点亮灵感灯泡" },
    wave: { type: "wave", text: "OK", hint: "回应这匹马" }
  };
  return props[key] || null;
}

function screenTargetFor(action, status) {
  const key = action?.until > Date.now() ? action.key : "";
  const targets = {
    typing: { type: "work", text: "RUN", hint: "点屏幕加速任务" },
    debug: { type: "fix", text: "BUG", hint: "点掉屏幕里的 BUG" },
    repair: { type: "fix", text: "RST", hint: "确认重启任务" },
    coffee: { type: "heal", text: "HP", hint: "收下回血状态" },
    stretch: { type: "heal", text: "RELAX", hint: "确认放松回血" },
    panic: { type: "alert", text: "BOSS", hint: "安抚警报" },
    rage: { type: "alert", text: "!!!", hint: "压住暴走需求" },
    altTab: { type: "game", text: "TAB", hint: "点掉切屏窗口" },
    hide: { type: "game", text: "WIN", hint: "找出隐藏小窗" },
    laugh: { type: "game", text: "GAME", hint: "关掉游戏画面" },
    combo: { type: "game", text: "5V5", hint: "打断开黑队列" },
    loot: { type: "game", text: "LOOT", hint: "收走战利品" },
    nap: { type: "sleep", text: "Z", hint: "点醒睡眠画面" },
    snore: { type: "sleep", text: "ZZ", hint: "点醒挂机画面" },
    fish: { type: "game", text: "FISH", hint: "收掉摸鱼窗口" },
    spark: { type: "boost", text: "UP", hint: "接住冲榜加速" },
    idea: { type: "boost", text: "IDEA", hint: "点亮灵感窗口" },
    wave: { type: "boost", text: "OK", hint: "确认回应" }
  };
  if (targets[key]) return targets[key];
  if (status?.key === "gaming") return { type: "game", text: "ALT", hint: "查掉摸鱼窗口" };
  if (status?.key === "sleep") return { type: "sleep", text: "Z", hint: "点醒离席画面" };
  return null;
}

function intentFor(index, status, action) {
  const active = action?.until > Date.now();
  const key = active ? action.key : "";
  const base = (key && intentCopy[key]) || idleIntentByStatus[status.key] || idleIntentByStatus.working;
  const mood = state.horseMoods[index] || {};
  const pressureTone = mood.stress >= 78 ? "danger" : mood.stamina <= 22 ? "sleep" : mood.focus >= 82 ? "bonus" : base.tone;
  return {
    ...base,
    key: key || status.key,
    tone: pressureTone || base.tone,
    label: active ? base.label : base.label,
    hint: active ? (action.text || base.hint) : base.hint
  };
}

function chainActionFor(chosen, index) {
  const key = chosen?.key;
  if (["combo", "laugh", "loot"].includes(key)) {
    return { key: "altTab", text: "被带开黑", mood: "心动", screen: "game", emote: "PVP" };
  }
  if (["panic", "rage"].includes(key)) {
    return { key: "panic", text: "跟着紧张", mood: "被吓到", screen: "panic", emote: "!" };
  }
  if (["idea", "spark"].includes(key)) {
    return { key: "typing", text: "一起冲刺", mood: "被鼓舞", screen: "fast", emote: "UP" };
  }
  if (["nap", "snore"].includes(key)) {
    return { key: "fish", text: "也想摸鱼", mood: "被传染", screen: "calm", emote: "Z" };
  }
  if (["coffee", "stretch"].includes(key)) {
    return { key: "coffee", text: "蹭点补给", mood: "回血", screen: "calm", emote: "糖" };
  }
  if (["debug", "repair"].includes(key)) {
    return { key: "debug", text: "帮看日志", mood: "支援", screen: "glitch", emote: "LOG" };
  }
  return null;
}

function adjustHorseStats(index, focusDelta = 0, staminaDelta = 0) {
  const mood = state.horseMoods[index];
  if (!mood) return;
  mood.focus = clampStat((mood.focus ?? 50) + focusDelta);
  mood.stamina = clampStat((mood.stamina ?? 60) + staminaDelta);
}

function adjustHorseMood(index, { stress = 0, trust = 0 } = {}) {
  const mood = state.horseMoods[index];
  if (!mood) return;
  mood.stress = clampStat((mood.stress ?? 40) + stress);
  mood.trust = clampStat((mood.trust ?? 50) + trust);
}

function decayHorseStats() {
  if (state.patrolWave?.until > Date.now()) return;
  state.horseMoods.forEach((mood, index) => {
    const workingDrain = index < 6 ? 2 : 1;
    mood.stamina = clampStat((mood.stamina ?? 60) - workingDrain + (state.pressure >= 70 ? -1 : 0) + (mood.trust >= 72 ? 1 : 0));
    mood.focus = clampStat((mood.focus ?? 50) + (state.order >= 65 ? 1 : -1) - (mood.stamina <= 24 ? 2 : 0) - (mood.stress >= 72 ? 1 : 0));
    mood.stress = clampStat((mood.stress ?? 40) + (state.pressure >= 70 ? 2 : -1) - (mood.trust >= 70 ? 1 : 0));
    mood.trust = clampStat((mood.trust ?? 50) - (state.order <= 35 ? 1 : 0));
  });
  render();
}

function eventHitsScreen(event, index) {
  const stage = document.getElementById("gameStage");
  const slot = stations[index]?.screen;
  if (!stage || !slot) return false;
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * WORLD.width;
  const y = (event.clientY - rect.top) / rect.height * WORLD.height;
  return x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h;
}

function eventHitsHorse(event, index) {
  const stage = document.getElementById("gameStage");
  const slot = stations[index]?.horse;
  if (!stage || !slot) return false;
  const rect = stage.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width * WORLD.width;
  const y = (event.clientY - rect.top) / rect.height * WORLD.height;
  return x >= slot.x && x <= slot.x + slot.w && y >= slot.y && y <= slot.y + slot.h;
}

function activeBossOrderFor(index) {
  const order = state.bossOrder;
  return order && order.index === index && order.until > Date.now() ? order : null;
}

function runBossOrderCommand(index) {
  const order = activeBossOrderFor(index);
  if (!order) return false;
  if (order.command === "nudge") nudgeStation(index);
  if (order.command === "inspect") inspectStation(index);
  if (order.command === "snack") snackStation(index);
  if (order.command === "praise") praiseStation(index);
  if (order.command === "break") breakStation(index);
  return true;
}

function stationMarkup(row, index, maxTokens, bumped, priority = null) {
  const slot = stations[index];
  const status = statusFor(row, maxTokens, index);
  const prizeState = voucherStateFor(row);
  const prizeClass = prizeState.key;
  const prizeText = prizeState.label;
  const bossOrder = state.bossOrder?.index === index && state.bossOrder.until > Date.now() ? state.bossOrder : null;
  const bossOrderConfigItem = bossOrder ? bossOrderConfig[bossOrder.command] : null;
  const orderLeftMs = bossOrder ? Math.max(0, bossOrder.until - Date.now()) : 0;
  const orderPct = bossOrder ? Math.max(0, Math.min(100, Math.round(orderLeftMs / Math.max(1, bossOrder.until - bossOrder.startedAt) * 100))) : 0;
  const pctValue = maxTokens > 0 ? Math.max(3, Math.round(row.tokens / maxTokens * 100)) : 0;
  const selected = index === state.selectedIndex ? "selected" : "";
  const ordered = bossOrder ? "ordered" : "";
  const bump = bumped || state.stationPulse[index] > Date.now() ? "bump" : "";
  const story = state.stationStories[index]?.until > Date.now() ? state.stationStories[index] : null;
  const storyClass = story ? `story-${story.key}` : "";
  const glitch = state.screenGlitch[index] > Date.now() ? "glitch" : "";
  const action = state.horseActions[index];
  const activeInfo = action?.until > Date.now() ? "show-info" : "";
  const actionClass = action?.until > Date.now() ? `act-${action.key}` : "";
  const actionText = action?.until > Date.now() ? action.text : "";
  const moodState = state.horseMoods[index] || {};
  const quipText = moodState.quipUntil > Date.now() ? moodState.lastQuip : "";
  const mood = activeHorseMood(index);
  const moodClass = mood.active ? "mood-active" : "";
  const statClass = horseStatClass(moodState);
  const emoteText = mood.emote || status.label;
  const personality = horsePersonalities[index] || {};
  const program = screenProgram(index, action, status, pctValue);
  const focus = state.horseMoods[index]?.focus ?? 0;
  const stamina = state.horseMoods[index]?.stamina ?? 0;
  const intent = intentFor(index, status, action);
  const need = recommendedCommandFor(index, status);
  const behavior = activeBehaviorFor(index);
  const behaviorTone = behavior?.tone || moodState.behaviorTone || "";
  const behaviorChip = behavior?.chip || moodState.behaviorChip || "";
  const behaviorLabel = behavior?.label || moodState.behaviorLabel || "";
  const behaviorClass = behavior ? `behavior-${behavior.tone || "work"}` : "";
  const prop = horsePropFor(action);
  const propClaimed = prop && state.propClaims[index]?.key === action?.key && state.propClaims[index]?.until >= (action?.until || 0);
  const screenTarget = screenTargetFor(action, status);
  const screenClaimed = screenTarget && state.screenClaims[index]?.key === (action?.key || status.key) && state.screenClaims[index]?.until >= (action?.until || 0);
  const targetLeft = 26 + index % 3 * 18;
  const targetTop = 34 + index % 2 * 18;
  const priorityClass = priority ? `priority-${priority.tone} ${priority.current ? "current-target" : ""}` : "";
  const incident = activeIncidentFor(index);
  const incidentDuration = incident ? Math.max(1, incident.until - incident.startedAt) : 1;
  const incidentLeft = incident ? Math.max(0, Math.min(100, Math.round((incident.until - Date.now()) / incidentDuration * 100))) : 0;
  const prompt = activePromptFor(index);
  const promptDuration = prompt ? Math.max(1, prompt.until - prompt.startedAt) : 1;
  const promptLeft = prompt ? Math.max(0, Math.min(100, Math.round((prompt.until - Date.now()) / promptDuration * 100))) : 0;
  const chainTask = activeChainTaskFor(index);
  const chainDuration = chainTask ? Math.max(1, chainTask.until - chainTask.startedAt) : 1;
  const chainLeft = chainTask ? Math.max(0, Math.min(100, Math.round((chainTask.until - Date.now()) / chainDuration * 100))) : 0;
  const priorityPoint = stationMarkerPoint(index, -1.1) || { x: slot.screen.x + slot.screen.w * 0.5, y: slot.screen.y - 48 };
  const incidentPoint = stationMarkerPoint(index, 0) || { x: slot.screen.x + slot.screen.w * 0.5, y: slot.screen.y + slot.screen.h + 34 };
  const promptPoint = stationMarkerPoint(index, incident ? 1 : 0) || { x: slot.screen.x + slot.screen.w * 0.5, y: slot.screen.y + slot.screen.h + (incident ? 68 : 34) };
  const chainPoint = stationMarkerPoint(index, (incident ? 1 : 0) + (prompt ? 1 : 0)) || { x: slot.screen.x + slot.screen.w * 0.5, y: slot.screen.y + slot.screen.h + 34 };
  const expandedInfo = ordered || priority?.current ? "show-info" : "";
  const compactInfo = expandedInfo ? "" : "compact-info";

  return `
    <button
      class="station-unit ${slot.row} ${status.key} ${selected} ${ordered} ${expandedInfo} ${compactInfo} ${bump} ${storyClass}"
      type="button"
      data-index="${index}"
      data-action="station"
      style="left:${pct(slot.x, WORLD.width)};top:${pct(slot.y, WORLD.height)};width:${pct(slot.w, WORLD.width)};height:${pct(slot.h, WORLD.height)};--power:${pctValue};"
      aria-label="工位 ${index + 1}: ${maskEmail(row.email)} ${status.title}"
      title="${status.title}: ${maskEmail(row.email)}"
    ></button>
    <span class="station-base ${slot.row} ${status.key} ${bump}" aria-hidden="true"
      style="left:${pct(slot.base.x, WORLD.width)};top:${pct(slot.base.y, WORLD.height)};width:${pct(slot.base.w, WORLD.width)};height:${pct(slot.base.h, WORLD.height)};--station-base:url('${stationBaseSrc(index)}');--anim-delay:${index * -47}ms">
    </span>
    <span class="screen-slot ${slot.row} ${status.key} ${screenClassFor(mood)} ${statClass} ${glitch}" aria-hidden="true"
      data-index="${index}"
      data-action="screen"
      style="left:${pct(slot.screen.x, WORLD.width)};top:${pct(slot.screen.y, WORLD.height)};width:${pct(slot.screen.w, WORLD.width)};height:${pct(slot.screen.h, WORLD.height)};--screen-sheet:url('${screenSrc(index)}');--anim-delay:${index * -83}ms">
      ${screenHudMarkup(program, index)}
      ${screenTarget && !screenClaimed ? `<button class="screen-target target-${screenTarget.type} ${expandedInfo}" type="button"
        data-index="${index}" data-action="screen-target" style="left:${targetLeft}%;top:${targetTop}%"
        aria-label="${String(index + 1).padStart(2, "0")} 号屏幕目标：${screenTarget.hint}" title="${screenTarget.hint}">${screenTarget.text}</button>` : ""}
    </span>
    <span class="screen-frame ${slot.row}" aria-hidden="true"
      style="left:${pct(slot.base.x, WORLD.width)};top:${pct(slot.base.y, WORLD.height)};width:${pct(slot.base.w, WORLD.width)};height:${pct(slot.base.h, WORLD.height)};--screen-frame:url('${screenFrameSrc(index)}')">
    </span>
    <span class="screen-prompt ${slot.row} ${intent.tone} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.84, WORLD.width)};top:${pct(slot.screen.y - 12, WORLD.height)}">${intent.label}</span>
    <span class="need-chip ${slot.row} ${need.tone} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.12, WORLD.width)};top:${pct(slot.screen.y + slot.screen.h + 10, WORLD.height)}">${need.label}</span>
    ${behaviorChip ? `<span class="behavior-chip ${slot.row} ${behaviorTone} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.5, WORLD.width)};top:${pct(slot.screen.y - 12, WORLD.height)}"
      title="${behaviorLabel}">${behaviorChip}</span>` : ""}
    ${priority ? `<button class="priority-marker ${slot.row} ${priorityClass}" type="button" data-index="${index}" data-action="priority" data-command="${priority.command}"
      style="left:${pct(priorityPoint.x, WORLD.width)};top:${pct(priorityPoint.y, WORLD.height)}"
      aria-label="${String(index + 1).padStart(2, "0")} 号机优先处理：${priority.label}" title="优先处理：${priority.label}">
      <b>!</b><span>${priority.label}</span>
    </button>` : ""}
    ${incident ? `<button class="incident-card ${slot.row} incident-${incident.tone} ${expandedInfo}" type="button" data-index="${index}" data-action="incident"
      style="left:${pct(incidentPoint.x, WORLD.width)};top:${pct(incidentPoint.y, WORLD.height)};--incident-left:${incidentLeft}%"
      aria-label="${String(index + 1).padStart(2, "0")} 号机事件：${incident.label}，点击${incident.button}" title="${incident.text}">
      <b>${incident.label}</b><span>${incident.button}</span><i></i>
    </button>` : ""}
    ${prompt ? `<button class="station-prompt-card ${slot.row} prompt-${prompt.tone} ${isRelationPrompt(prompt) ? "relation-prompt" : ""} ${expandedInfo}" type="button" data-index="${index}" data-action="prompt"
      style="left:${pct(promptPoint.x, WORLD.width)};top:${pct(promptPoint.y, WORLD.height)};--prompt-left:${promptLeft}%"
      aria-label="${String(index + 1).padStart(2, "0")} 号机小任务：${prompt.label}，${prompt.button}" title="${prompt.text}">
      <b>${prompt.label}</b><span>${prompt.button}</span><small>${isRelationPrompt(prompt) ? "PAIR" : prompt.action === "command" ? "用按钮" : prompt.action === "horse" ? "点马" : "点屏"}</small><i></i>
    </button>` : ""}
    ${chainTask ? `<button class="chain-card ${slot.row} chain-${chainTask.tone} ${expandedInfo}" type="button" data-index="${index}" data-action="chain"
      style="left:${pct(chainPoint.x, WORLD.width)};top:${pct(chainPoint.y, WORLD.height)};--chain-left:${chainLeft}%"
      aria-label="${String(index + 1).padStart(2, "0")} 号机连锁挑战：${chainTask.label}，${chainTask.button}" title="${chainTask.text}">
      <b>${chainTask.label}</b><span>${chainTask.button}</span><small>${chainTask.action === "screen" ? "点屏" : chainTask.action === "horse" ? "点马" : "揍老板"}</small><i></i>
    </button>` : ""}
    ${bossOrder ? `<span class="boss-order-marker ${slot.row}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.5, WORLD.width)};top:${pct(slot.screen.y - 28, WORLD.height)};--order-left:${orderPct}%">
      <b>${String(index + 1).padStart(2, "0")} ${bossOrderConfigItem?.marker || "点名"}</b><i></i>
    </span>` : ""}
    <span class="station-fx ${slot.row} ${status.key}" aria-hidden="true"
      style="left:${pct(slot.screen.x - 10, WORLD.width)};top:${pct(slot.screen.y + slot.screen.h - 8, WORLD.height)};width:${pct(slot.screen.w + 44, WORLD.width)};height:${pct(slot.screen.h * 0.72, WORLD.height)};--fx-sheet:url('${stationFxSrc(status.key)}');--fx-alpha:${status.key === "sleep" ? 0.54 : Math.min(0.96, 0.46 + pctValue / 120)};--anim-delay:${index * -121}ms">
    </span>
    <span class="horse-overlay ${slot.row} ${status.key} ${actionClass} ${moodClass} ${statClass} ${behaviorClass}" aria-hidden="true"
      data-index="${index}"
      data-action="horse"
      style="left:${pct(slot.horse.x, WORLD.width)};top:${pct(slot.horse.y, WORLD.height)};width:${pct(slot.horse.w, WORLD.width)};height:${pct(slot.horse.h, WORLD.height)};--horse-sheet:url('${horseSrc(index, status.key)}');--anim-delay:${index * -97}ms">
    </span>
    ${prop && !propClaimed ? `<button class="horse-prop ${slot.row} prop-${prop.type} ${expandedInfo}" type="button"
      data-index="${index}" data-action="prop" data-prop="${prop.type}"
      style="left:${pct(slot.horse.x + slot.horse.w * 0.72, WORLD.width)};top:${pct(slot.horse.y + slot.horse.h * 0.42, WORLD.height)}"
      aria-label="${String(index + 1).padStart(2, "0")} 号机小事件：${prop.hint}" title="${prop.hint}">${prop.text}</button>` : ""}
    <span class="horse-emote ${slot.row} ${status.key} ${moodClass} ${statClass} ${activeInfo} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.horse.x + slot.horse.w * 0.66, WORLD.width)};top:${pct(slot.horse.y + slot.horse.h * 0.1, WORLD.height)}">${emoteText}</span>
    ${actionText ? `<span class="horse-bubble ${slot.row} ${expandedInfo}" style="left:${pct(slot.horse.x + slot.horse.w * 0.44, WORLD.width)};top:${pct(slot.horse.y - 12, WORLD.height)}">${actionText}</span>` : ""}
    ${quipText ? `<span class="horse-quip ${slot.row} ${intent.tone} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.horse.x + slot.horse.w * 0.54, WORLD.width)};top:${pct(slot.horse.y + slot.horse.h * 0.28, WORLD.height)}">${quipText}</span>` : ""}
    <span class="horse-intent ${slot.row} ${intent.tone} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.horse.x + slot.horse.w * 0.28, WORLD.width)};top:${pct(slot.horse.y + slot.horse.h * 0.66, WORLD.height)}">
      <b>${intent.label}</b><small>${intent.hint}</small>
    </span>
    <span class="horse-trait ${slot.row} ${statClass} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.horse.x + slot.horse.w * 0.48, WORLD.width)};top:${pct(slot.horse.y + slot.horse.h * 0.84, WORLD.height)}">${personality.name || "牛马"}</span>
    ${state.stationPulse[index] > Date.now() ? `<span class="station-spark ${slot.row}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w + 10, WORLD.width)};top:${pct(slot.screen.y + 8, WORLD.height)}">!</span>` : ""}
    ${story ? `<span class="story-chip ${slot.row} ${storyClass} ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.18, WORLD.width)};top:${pct(slot.screen.y - 16, WORLD.height)}">${story.label}</span>` : ""}
    <button class="station-badge ${status.key} ${selected}" type="button" data-index="${index}" data-action="station"
      style="left:${pct(slot.label.x, WORLD.width)};top:${pct(slot.label.y, WORLD.height)}">
      <b>${row.rank}</b>
      <span>${status.label}</span>
    </button>
    ${prizeText ? `<button class="station-prize ${slot.row} ${prizeClass}" type="button" data-index="${index}" data-action="voucher"
      style="left:${pct(slot.screen.x + slot.screen.w * 0.82, WORLD.width)};top:${pct(slot.screen.y - 23, WORLD.height)}"
      aria-label="${voucherStateTitle(row, prizeState)}" title="${voucherStateTitle(row, prizeState)}">
      <b>#${row.rank}</b><span>${prizeText}</span>
    </button>` : ""}
    <span class="mini-stats ${expandedInfo}" aria-hidden="true"
      style="left:${pct(slot.label.x + 2, WORLD.width)};top:${pct(slot.label.y + 27, WORLD.height)};--focus:${focus}%;--stamina:${stamina}%">
      <i></i><i></i>
    </span>
    <span class="token-meter ${status.key}" aria-hidden="true"
      style="left:${pct(slot.meter.x, WORLD.width)};top:${pct(slot.meter.y, WORLD.height)};--power:${pctValue}">
      <i></i>
    </span>
  `;
}

function rankMarkup(row, index, maxTokens) {
  const status = statusFor(row, maxTokens, index);
  const claimed = claimedVoucherMap();
  const claim = voucherClaimFor(row, claimed);
  const prepared = canIssueVoucher(row);
  const missing = canClaimVoucher(row) && !prepared && !claim;
  const prizeState = claim ? "已领券" : prepared ? "点我领" : missing ? "待放券" : status.title;
  const prizeClass = claim ? "voucher-claimed" : prepared ? "voucher-ready" : missing ? "voucher-missing" : "";
  const selected = index === state.selectedIndex ? "selected" : "";
  const title = prepared && !claim
    ? `#${row.rank} 每日前三兑换券已备好，点击领取`
    : missing
      ? `#${row.rank} 是今日前三，但还需要在 voucher-config.js 放入真实券码`
      : claim
        ? `#${row.rank} 今天已领取兑换券 ${claim.code}`
        : `${status.title}: ${maskEmail(row.email)}`;
  return `
    <li class="rank-row ${status.key} ${selected} ${prizeClass}" data-index="${index}" data-id="${row.id}">
      <button type="button" title="${title}" aria-label="${title}">
        <span class="rank-no">${row.rank}</span>
        <span class="rank-copy">
          <b>${maskEmail(row.email)}</b>
          <small>${formatTokens(row.tokens)} token · ${row.requests.toLocaleString("zh-CN")} req</small>
        </span>
        <span class="rank-state">${prizeState}</span>
      </button>
    </li>
  `;
}

function voucherMarkup(rows) {
  const codes = voucherCodes();
  const claimed = claimedVoucherMap();
  const today = shanghaiDateString();
  return Array.from({ length: 3 }, (_, index) => {
    const row = rows[index];
    const code = codes[index] || normalizeVoucher(null, index);
    const rankNo = index + 1;
    const rankClaim = activeVoucherClaimForRank(rankNo, claimed.ranks?.[rankNo]);
    const userClaim = row ? activeVoucherClaimForUser(claimed.users?.[userClaimKey(row)]) : null;
    const done = Boolean(userClaim);
    const selected = state.selectedIndex === index ? "selected" : "";
    const empty = !row || row.tokens <= 0 ? "empty" : "";
    const prepared = !isVoucherPlaceholder(code);
    const missing = !empty && !prepared && !rankClaim && !done ? "missing" : "";
    const owner = row ? maskEmail(row.email) : "等待上榜";
    const available = !rankClaim && !done && !empty && prepared ? "available" : "";
    const note = rankClaim
      ? `已发给 ${maskEmail(rankClaim.email)} ${claimTimeLabel(rankClaim.claimedAt)}`
      : done
        ? `今日已领取 ${claimTimeLabel(userClaim.claimedAt)}`
        : missing
          ? "先把真实券码放进柜台"
          : `今日前三：${owner}`;
    const codeText = rankClaim || done
      ? (rankClaim || userClaim).code
      : prepared
        ? "点我领取"
        : `待放券 ${today}`;
    return `
      <li class="${done || rankClaim ? "claimed" : ""} ${available} ${missing} ${selected} ${empty}" data-index="${index}" data-id="${row?.id || ""}">
        <button type="button">
          <b>#${rankNo}</b>
          <span>${code.title}</span>
          <em>${codeText}</em>
          <small>${note}</small>
        </button>
      </li>
    `;
  }).join("");
}

function renderVoucherBooth(rows = currentRows()) {
  if (!el.voucherBooth) return;
  const claimed = claimedVoucherMap();
  const topRows = rows.slice(0, 3);
  const states = topRows.map((row) => voucherStateFor(row, claimed));
  const claimedCount = states.filter((item) => item.key === "claimed").length;
  const readyCount = states.filter((item) => item.key === "ready").length;
  const missingCount = states.filter((item) => item.key === "missing").length;
  el.voucherBooth.dataset.state =
    readyCount ? "ready" :
    missingCount ? "missing" :
    claimedCount >= Math.min(topRows.length, 3) && claimedCount > 0 ? "claimed" :
    "empty";
  if (el.voucherBoothStatus) {
    el.voucherBoothStatus.textContent = `${claimedCount}/3`;
  }
  const slots = el.voucherBooth.querySelectorAll(".booth-slots i");
  slots.forEach((slot, index) => {
    const stateInfo = states[index] || { key: "empty" };
    slot.dataset.state = stateInfo.key;
    slot.textContent = String(index + 1);
  });
}

function selectedRow(rows) {
  return rows[Math.min(state.selectedIndex, Math.max(rows.length - 1, 0))];
}

function findMyRow(rows) {
  if (configuredMyUserId) return rows.find((row) => row.id === configuredMyUserId) || null;
  return rows[3] || rows[0] || null;
}

function renderTicker(rows) {
  if (Date.now() < state.tickerLockedUntil) return;
  const first = rows[0];
  if (!first) {
    setTicker("今天还没有 token 消耗记录。");
    return;
  }
  const verb = state.source === "api" ? "实时上榜" : "试玩上榜";
  const selected = rows[state.selectedIndex];
  setTicker(`${verb}: ${maskEmail(first.email)} 领先 ${formatTokens(first.tokens)} token。当前工位 ${String(state.selectedIndex + 1).padStart(2, "0")}：${selected ? maskEmail(selected.email) : "--"}`);
}

function renderMyStatus(rows) {
  const top3Floor = rows[2]?.tokens || 0;
  const mine = findMyRow(rows);
  if (!mine) {
    el.myStatus.textContent = "我的工位待机中";
    el.myDelta.textContent = "距离前三还差 -- token";
    return;
  }
  const delta = Math.max(0, top3Floor - mine.tokens);
  el.myStatus.textContent = `${maskEmail(mine.email)} · 第 ${mine.rank} 名`;
  el.myDelta.textContent = mine.rank <= 3 ? "已坐进前三，兑换券待领取" : `距离前三还差 ${formatTokens(delta)} token`;
}

function renderSelected(rows, maxTokens) {
  const row = selectedRow(rows);
  if (!row) return;
  const status = statusFor(row, maxTokens, state.selectedIndex);
  const mood = state.horseMoods[state.selectedIndex] || {};
  const personality = horsePersonalities[state.selectedIndex] || {};
  const action = state.horseActions[state.selectedIndex];
  const behavior = activeBehaviorFor(state.selectedIndex);
  const active = action?.until > Date.now();
  const pctValue = maxTokens > 0 ? Math.max(3, Math.round(row.tokens / maxTokens * 100)) : 0;
  el.selectedTitle.textContent = `${personality.name || "牛马"} · ${String(state.selectedIndex + 1).padStart(2, "0")} 号机`;
  el.selectedMeter.style.width = `${pctValue}%`;
  el.selectedUser.textContent = maskEmail(row.email);
  el.selectedTokens.textContent = `${formatTokens(row.tokens)} token`;
  el.selectedState.textContent = behavior ? `${status.title} · ${behavior.label}` : status.title;
  el.selectedRequests.textContent = row.requests.toLocaleString("zh-CN");
  if (el.selectedFocus) el.selectedFocus.textContent = `${mood.focus ?? 0}%`;
  if (el.selectedEnergy) el.selectedEnergy.textContent = `${mood.stamina ?? 0}%`;
  if (el.selectedTrait) el.selectedTrait.textContent = personality.quirk || "--";
  if (el.selectedMood) {
    const behaviorText = behavior ? ` · ${behavior.chip}` : "";
    el.selectedMood.textContent = active ? `${action.mood || mood.mood}${behaviorText} · ${action.text}` : `${mood.mood || status.caption}${behaviorText}`;
  }
  if (el.selectedStress) el.selectedStress.textContent = `${mood.stress ?? 0}%`;
  if (el.selectedTrust) el.selectedTrust.textContent = `${mood.trust ?? 0}%`;
  const inspector = el.selectedTitle.closest(".station-inspector");
  inspector?.classList.remove("changed");
  void inspector?.offsetWidth;
  inspector?.classList.add("changed");
}

function spawnPop(index, text, lifespan = 1500, offsetY = 0) {
  if (!el.fxLayer) return;
  const slot = stations[index].screen;
  const pop = document.createElement("span");
  pop.className = "token-pop";
  pop.style.left = `${(slot.x + slot.w / 2) / WORLD.width * 100}%`;
  pop.style.top = `${(slot.y + offsetY) / WORLD.height * 100}%`;
  pop.textContent = text;
  el.fxLayer.appendChild(pop);
  window.setTimeout(() => pop.remove(), lifespan);
}

function commandPop(index, text, tone = "work") {
  if (!el.fxLayer) return;
  const slot = stations[index] || stations[0];
  const pop = document.createElement("span");
  pop.className = `command-pop ${tone}`;
  pop.style.left = `${(slot.screen.x + slot.screen.w * 0.5) / WORLD.width * 100}%`;
  pop.style.top = `${(slot.screen.y - 20) / WORLD.height * 100}%`;
  pop.textContent = text;
  el.fxLayer.appendChild(pop);
  window.setTimeout(() => pop.remove(), 980);
}

function scenePop(x, y, text, tone = "work", lifespan = 1400) {
  if (!el.fxLayer) return;
  const pop = document.createElement("span");
  pop.className = `scene-pop ${tone}`;
  pop.style.left = `${x / WORLD.width * 100}%`;
  pop.style.top = `${y / WORLD.height * 100}%`;
  pop.textContent = text;
  el.fxLayer.appendChild(pop);
  window.setTimeout(() => pop.remove(), lifespan);
}

function rewardTicket(title, lines = [], tone = "bonus", index = state.selectedIndex) {
  if (!el.fxLayer) return;
  const node = document.createElement("span");
  node.className = `reward-ticket ${tone}`;
  node.style.left = "76.4%";
  node.style.top = "15.4%";
  const safeLines = lines.filter(Boolean).slice(0, 3);
  const titleNode = document.createElement("b");
  titleNode.textContent = title;
  node.appendChild(titleNode);
  safeLines.forEach((line) => {
    const lineNode = document.createElement("i");
    lineNode.textContent = line;
    node.appendChild(lineNode);
  });
  el.fxLayer.appendChild(node);
  window.setTimeout(() => node.remove(), 2600);
}

function relationshipPop(fromIndex, toIndex, type = "help", text = "") {
  if (!el.fxLayer || fromIndex == null || toIndex == null || fromIndex === toIndex) return;
  const from = stations[fromIndex]?.screen;
  const to = stations[toIndex]?.screen;
  if (!from || !to) return;
  const x1 = (from.x + from.w * 0.5) / WORLD.width * 100;
  const y1 = (from.y + from.h * 0.5) / WORLD.height * 100;
  const x2 = (to.x + to.w * 0.5) / WORLD.width * 100;
  const y2 = (to.y + to.h * 0.5) / WORLD.height * 100;
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.max(2, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const lines = relationshipLines[type] || relationshipLines.help;
  const node = document.createElement("span");
  node.className = `relationship-pop relation-${type}`;
  node.style.left = `${x1}%`;
  node.style.top = `${y1}%`;
  node.style.setProperty("--rel-len", `${length}%`);
  node.style.setProperty("--rel-angle", `${angle}deg`);
  node.textContent = text || lines[Math.floor(Math.random() * lines.length)];
  el.fxLayer.appendChild(node);
  window.setTimeout(() => node.remove(), 1450);
}

function renderBossDirective() {
  if (!el.fxLayer) return;
  const existing = el.fxLayer.querySelector(".boss-directive");
  const order = state.bossOrder;
  const now = Date.now();
  if (!order || order.until <= now) {
    existing?.remove();
    return;
  }
  const slot = stations[order.index]?.screen;
  if (!slot) {
    existing?.remove();
    return;
  }
  const config = bossOrderConfig[order.command] || bossOrderConfig.nudge;
  const fromX = BOSS_ORDER_ANCHOR.x / WORLD.width * 100;
  const fromY = BOSS_ORDER_ANCHOR.y / WORLD.height * 100;
  const toX = (slot.x + slot.w * 0.5) / WORLD.width * 100;
  const toY = (slot.y + slot.h * 0.18) / WORLD.height * 100;
  const dx = toX - fromX;
  const dy = toY - fromY;
  const length = Math.max(4, Math.hypot(dx, dy));
  const angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const leftPct = Math.max(0, Math.min(100, Math.round((order.until - now) / Math.max(1, order.until - order.startedAt) * 100)));
  const markup = `
    <i></i>
    <b>工单 ${String(order.index + 1).padStart(2, "0")}</b>
    <span>${config.label}</span>
    <small style="--order-left:${leftPct}%"></small>
  `;
  const node = existing || document.createElement("span");
  node.className = `boss-directive ${stations[order.index]?.row || "back"}`;
  node.style.left = `${fromX}%`;
  node.style.top = `${fromY}%`;
  node.style.setProperty("--boss-line-len", `${length}%`);
  node.style.setProperty("--boss-line-angle", `${angle}deg`);
  node.style.setProperty("--boss-ticket-x", `${dx}%`);
  node.style.setProperty("--boss-ticket-y", `${dy}%`);
  node.innerHTML = markup;
  if (!existing) el.fxLayer.appendChild(node);
}

function actionGrade(index, command, fallbackTone = "work") {
  const need = recommendedCommandFor(index);
  const perfect = need.command === command;
  commandPop(index, perfect ? "PERFECT" : "GOOD", perfect ? "bonus" : fallbackTone);
  if (perfect) {
    addHype(7, "精准操作");
    adjustHorseMood(index, { stress: -3, trust: 3 });
    markStationStory(index, "support", "PERF", 1600);
  }
  return perfect;
}

function toast(text) {
  if (!el.toastLayer) return;
  const node = document.createElement("div");
  node.className = "toast";
  node.textContent = text;
  el.toastLayer.appendChild(node);
  window.setTimeout(() => {
    node.classList.add("out");
    window.setTimeout(() => node.remove(), 320);
  }, 2600);
}

function copyText(text) {
  if (!text) return false;
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
      .then(() => toast("兑换券码已复制"))
      .catch(() => toast("券码已显示，请手动复制"));
    return true;
  }
  return false;
}

function comboPop(text) {
  if (!el.bossCow) return;
  const pop = document.createElement("span");
  pop.className = "combo-pop";
  pop.textContent = text;
  el.bossCow.appendChild(pop);
  window.setTimeout(() => pop.remove(), 720);
}

function stagePointForElement(element) {
  const stage = document.getElementById("gameStage");
  if (!stage || !element) return null;
  const stageRect = stage.getBoundingClientRect();
  const rect = element.getBoundingClientRect();
  if (!stageRect.width || !stageRect.height) return null;
  return {
    x: (rect.left + rect.width / 2 - stageRect.left) / stageRect.width * 100,
    y: (rect.top + rect.height / 2 - stageRect.top) / stageRect.height * 100
  };
}

function voucherPop(index, code) {
  if (!el.fxLayer) return;
  const slot = stations[index] || stations[0];
  const left = (slot.screen.x + slot.screen.w * 0.82) / WORLD.width * 100;
  const top = (slot.screen.y - 28) / WORLD.height * 100;
  const from = stagePointForElement(el.voucherBooth) || { x: 54, y: 31 };
  const flight = document.createElement("span");
  flight.className = "voucher-flight";
  flight.style.left = `${from.x}%`;
  flight.style.top = `${from.y}%`;
  flight.textContent = `#${index + 1}`;
  el.fxLayer.appendChild(flight);
  const flightAnimation = flight.animate(
    [
      { left: `${from.x}%`, top: `${from.y}%`, transform: "translate(-50%, -50%) scale(0.78) rotate(-5deg)", opacity: 0 },
      { left: `${from.x}%`, top: `${from.y + 2.2}%`, transform: "translate(-50%, -50%) scale(1.08) rotate(4deg)", opacity: 1 },
      { left: `${(from.x + left) / 2}%`, top: `${Math.min(from.y, top) - 7}%`, transform: "translate(-50%, -50%) scale(1) rotate(-2deg)", opacity: 1 },
      { left: `${left}%`, top: `${top}%`, transform: "translate(-50%, -50%) scale(0.82) rotate(0deg)", opacity: 0 }
    ],
    { duration: 860, easing: "steps(10)", fill: "forwards" }
  );
  flightAnimation.onfinish = () => flight.remove();
  const pop = document.createElement("span");
  pop.className = "voucher-pop";
  pop.dataset.code = code.code;
  pop.title = "点击复制兑换券码";
  pop.setAttribute("role", "button");
  pop.setAttribute("tabindex", "0");
  pop.style.left = `${left}%`;
  pop.style.top = `${top}%`;
  const rank = document.createElement("b");
  rank.textContent = `#${index + 1}`;
  const title = document.createElement("span");
  title.textContent = code.title;
  const coupon = document.createElement("code");
  coupon.textContent = code.code;
  pop.append(rank, title, coupon);
  pop.addEventListener("click", () => copyText(code.code));
  pop.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    copyText(code.code);
  });
  window.setTimeout(() => el.fxLayer?.appendChild(pop), 520);
  window.setTimeout(() => pop.remove(), 2600);
}

function pulseVoucherBooth(kind = "dispense") {
  if (!el.voucherBooth) return;
  el.voucherBooth.classList.remove("dispense", "denied", "missing", "claimed");
  void el.voucherBooth.offsetWidth;
  el.voucherBooth.classList.add(kind);
  window.setTimeout(() => el.voucherBooth?.classList.remove(kind), 760);
}

function settlementPrizeMarkup(rows, day = shanghaiDateString()) {
  const codes = voucherCodes(day);
  const claimed = claimedVoucherMap(day);
  return Array.from({ length: 3 }, (_, index) => {
    const row = rows[index];
    const rankNo = index + 1;
    const code = codes[index] || normalizeVoucher(null, index);
    const claim =
      activeVoucherClaimForRank(rankNo, claimed.ranks?.[rankNo], day) ||
      (row ? activeVoucherClaimForUser(claimed.users?.[userClaimKey(row)], day) : null);
    const owner = claim ? maskEmail(claim.email) : row && row.tokens > 0 ? maskEmail(row.email) : "空缺";
    const prepared = !isVoucherPlaceholder(code);
    const stateText = claim ? `已领取 ${claim.code}` : row && row.tokens > 0 ? (prepared ? "待领取" : "待备券") : "未发放";
    return `
      <li class="${claim ? "claimed" : row && row.tokens > 0 ? (prepared ? "available" : "missing") : "empty"}">
        <b>#${rankNo}</b>
        <span>${owner}</span>
        <small>${code.title} · ${stateText}</small>
      </li>
    `;
  }).join("");
}

function flipRanking(rebuild) {
  const before = new Map();
  el.topRanking.querySelectorAll("li[data-id]").forEach((li) => {
    before.set(li.dataset.id, li.getBoundingClientRect().top);
  });
  rebuild();
  el.topRanking.querySelectorAll("li[data-id]").forEach((li) => {
    const old = before.get(li.dataset.id);
    if (old == null) return;
    const dy = old - li.getBoundingClientRect().top;
    if (!dy) return;
    li.animate(
      [{ transform: `translateY(${dy}px)` }, { transform: "translateY(0)" }],
      { duration: 360, easing: "steps(6)" }
    );
  });
}

function render() {
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((row) => row.tokens), 0);
  state.selectedIndex = Math.min(state.selectedIndex, rows.length - 1);

  const now = Date.now();
  const bumps = new Set();
  const gains = [];
  rows.forEach((row, index) => {
    const prev = prevById[row.id];
    if (prev && row.tokens > prev.tokens) {
      bumps.add(index);
      gains.push({ index, delta: row.tokens - prev.tokens });
      state.screenGlitch[index] = now + 900;
    }
  });

  const currentTarget = renderTargetRadar(rows, maxTokens);
  renderCoachHint(currentTarget);
  const priorities = new Map(priorityIndexes(rows, maxTokens).map((item) => [
    item.index,
    { ...item, current: currentTarget?.index === item.index }
  ]));
  el.stationsLayer.innerHTML = rows
    .map((row, index) => stationMarkup(row, index, maxTokens, bumps.has(index), priorities.get(index)))
    .join("");

  flipRanking(() => {
    el.topRanking.innerHTML = rows.slice(0, 3).map((row, index) => rankMarkup(row, index, maxTokens)).join("");
  });

  if (el.voucherList) el.voucherList.innerHTML = voucherMarkup(rows);
  renderVoucherBooth(rows);
  el.totalTokens.textContent = `${formatTokens(rows.reduce((sum, row) => sum + row.tokens, 0))} token`;
  el.sourceLabel.textContent = state.source === "api" ? "LIVE" : "DEMO";
  renderTicker(rows);
  renderMyStatus(rows);
  renderSelected(rows, maxTokens);
  updateVoucherButton(rows);
  renderEventCard();
  renderCommandButtons();
  renderSelectionHud(rows, maxTokens);
  renderBossDirective();
  renderFever();

  if (firstRenderDone) {
    gains.forEach((gain) => spawnPop(gain.index, `+${formatTokens(gain.delta)}`));
    const top1 = rows[0];
    if (prevTop1Id && top1 && top1.id !== prevTop1Id && top1.tokens > 0) {
      toast(`${maskEmail(top1.email)} 登顶第一`);
      audio.rankup();
    } else {
      rows.slice(0, 3).forEach((row) => {
        const prev = prevById[row.id];
        if (row.tokens > 0 && prev && prev.rank > 3) {
          toast(`${maskEmail(row.email)} 杀入前三`);
          audio.rankup();
        }
      });
    }
  }

  prevTop1Id = rows[0]?.id ?? null;
  prevById = {};
  rows.forEach((row) => {
    prevById[row.id] = { tokens: row.tokens, rank: row.rank };
  });
  firstRenderDone = true;
}

function demoTick() {
  if (state.source !== "demo" || !state.rows.length) return;
  if (state.patrolWave?.until > Date.now()) return;
  state.rows.forEach((row) => {
    if (row.tokens <= 0) return;
    row.tokens += Math.floor(row.tokens * (0.003 + Math.random() * 0.03));
    if (Math.random() < 0.25) row.requests += 1;
  });
  const live = state.rows.filter((row) => row.tokens > 0);
  if (live.length && Math.random() < 0.5) {
    const surged = live[Math.floor(Math.random() * live.length)];
    surged.tokens += Math.floor(surged.tokens * (0.15 + Math.random() * 0.5));
  }
  state.rows.sort((a, b) => b.tokens - a.tokens || a.id - b.id);
  state.rows.forEach((row, index) => {
    row.rank = index + 1;
  });
  render();
}

function nextHorseDelay(index) {
  const personality = horsePersonalities[index] || { delay: 1 };
  const mood = state.horseMoods[index] || {};
  const focusBoost = (mood.focus ?? 50) >= 78 ? 0.72 : 1;
  const tiredSlow = (mood.stamina ?? 60) <= 24 ? 1.45 : 1;
  const chaosFast = (personality.chaos ?? 0.2) >= 0.4 ? 0.82 : 1;
  return Math.round((1500 + Math.random() * 3400) * personality.delay * focusBoost * tiredSlow * chaosFast);
}

function scheduleHorse(index, fromNow = nextHorseDelay(index)) {
  const mood = state.horseMoods[index];
  if (!mood) return;
  mood.nextAt = Date.now() + fromNow;
}

function pickHorseAction(index, status) {
  const personality = horsePersonalities[index] || {};
  const mood = state.horseMoods[index] || {};
  const row = currentRows()[index];
  const statusPool = horseActionPool[status.key] || horseActionPool.working;
  const biasPool = personality.bias && horseActionPool[personality.bias] ? horseActionPool[personality.bias] : statusPool;
  const chaos = personality.chaos ?? 0.2;
  const patience = personality.patience ?? 0.5;
  let pool = Math.random() < 0.42 + chaos * 0.25 ? biasPool : statusPool;
  const behaviorAction = behaviorActionFor(index, status);
  if (behaviorAction && Math.random() < 0.64 + chaos * 0.14) {
    return behaviorAction;
  }
  if (row?.rank <= 3 && row.tokens > 0 && Math.random() < 0.34) {
    pool = [
      { key: "spark", text: "守住前三券", mood: "护券冲刺", screen: "fast", emote: `#${row.rank}` },
      { key: "typing", text: "榜单别掉", mood: "前三紧张", screen: "fast", emote: "券" },
      { key: "idea", text: "算差距", mood: "看榜", screen: "fast", emote: "GAP" }
    ];
  }
  const signatures = signatureActions[index] || [];
  if (signatures.length && Math.random() < 0.3 + chaos * 0.2) {
    return signatures[Math.floor(Math.random() * signatures.length)];
  }
  const micros = personalMicroActions[index] || [];
  if (micros.length && Math.random() < 0.22 + chaos * 0.18) {
    return micros[Math.floor(Math.random() * micros.length)];
  }
  if (habitActions[index] && Math.random() < 0.14 + chaos * 0.16) {
    return habitActions[index];
  }
  if ((mood.stamina <= 24 || mood.stress >= 82) && Math.random() < 0.52) {
    pool = [
      { key: "nap", text: "撑不住了", mood: "疲劳", screen: "calm", emote: "低电" },
      { key: "snore", text: "眯 10 秒", mood: "回血", screen: "calm", emote: "Z" },
      { key: "stretch", text: "拉伸回血", mood: "恢复中", screen: "calm", emote: "伸" }
    ];
  } else if ((mood.focus <= 34 || mood.trust <= 28) && Math.random() < 0.38 + chaos * 0.35) {
    pool = [
      { key: "altTab", text: "又切窗口", mood: "走神", screen: "panic", emote: "TAB" },
      { key: "fish", text: "假装忙", mood: "摸鱼", screen: "game", emote: "鱼" },
      { key: "hide", text: "藏窗口", mood: "假忙", screen: "panic", emote: "HIDE" }
    ];
  } else if (mood.focus >= 80 && mood.stamina >= 42 && mood.trust >= 46 && Math.random() < 0.42) {
    pool = [
      { key: "typing", text: "进入心流", mood: "专注", screen: "fast", emote: "FOC" },
      { key: "debug", text: "秒解问题", mood: "专注排障", screen: "glitch", emote: "OK" },
      { key: "idea", text: "一把过审", mood: "灵感爆发", screen: "fast", emote: "IDEA" }
    ];
  } else if (state.pressure >= 72 && Math.random() < 0.42 + (1 - patience) * 0.18) {
    pool = [
      { key: "panic", text: "压力爆表!", mood: "赶工", screen: "panic", emote: "!!" },
      { key: "debug", text: "线上冒烟", mood: "抢修", screen: "glitch", emote: "BUG" },
      { key: "rage", text: "硬顶需求", mood: "暴走", screen: "panic", emote: "!!!" }
    ];
  } else if (state.order <= 42 && Math.random() < 0.3 + chaos * 0.35) {
    pool = [
      { key: "altTab", text: "又摸一下", mood: "摸鱼", screen: "panic", emote: "TAB" },
      { key: "fish", text: "假装忙", mood: "摸鱼", screen: "game", emote: "鱼" },
      { key: "laugh", text: "偷偷乐", mood: "放松", screen: "game", emote: "哈" }
    ];
  }
  if (personality.favorite && Math.random() < 0.18 + chaos * 0.12) {
    const favorite = pool.find((item) => item.key === personality.favorite);
    if (favorite) return favorite;
  }
  const recent = mood.recentKeys || [];
  const candidates = pool.length > 1 ? pool.filter((item) => !recent.includes(item.key)) : pool;
  return candidates[Math.floor(Math.random() * candidates.length)] || pool[0];
}

function triggerHorseAction(index, action, duration = 2200) {
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((row) => row.tokens), 0);
  const status = statusFor(rows[index], maxTokens, index);
  const chosen = action || pickHorseAction(index, status);
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (mood) {
    const previousKey = mood.lastKey;
    mood.mood = chosen.mood || status.title;
    mood.emote = chosen.emote || status.label;
    mood.screen = chosen.screen || "";
    mood.energy = Math.min(100, Math.max(8, Math.round((rows[index]?.tokens || 0) / Math.max(maxTokens, 1) * 100)));
    mood.lastKey = chosen.key;
    mood.recentKeys = [chosen.key, ...(mood.recentKeys || [])].slice(0, 3);
    mood.streak = chosen.key === previousKey ? (mood.streak || 0) + 1 : 1;
    mood.actionCount = (mood.actionCount || 0) + 1;
    mood.lastIntentAt = now;
    if (chosen.quip) {
      mood.lastQuip = chosen.quip;
      mood.quipUntil = now + Math.min(duration + 1000, 3800);
    } else if (!action && Math.random() < 0.54) {
      const quip = quipForAction(index, chosen, status);
      if (quip) {
        mood.lastQuip = quip;
        mood.quipUntil = now + Math.min(duration + 900, 3600);
      }
    } else if (chosen.text) {
      mood.lastQuip = chosen.text;
      mood.quipUntil = now + Math.min(duration + 600, 3200);
    }
    if (["typing", "debug", "spark"].includes(chosen.key)) adjustHorseStats(index, 4, -4);
    if (["panic", "altTab"].includes(chosen.key)) adjustHorseStats(index, 2, -6);
    if (["coffee", "nap", "snore"].includes(chosen.key)) adjustHorseStats(index, -1, 8);
    if (["laugh", "combo", "fish"].includes(chosen.key)) adjustHorseStats(index, -5, 2);
    if (["repair", "idea"].includes(chosen.key)) adjustHorseStats(index, 6, -5);
    if (["rage"].includes(chosen.key)) adjustHorseStats(index, 8, -10);
    if (["loot", "hide"].includes(chosen.key)) adjustHorseStats(index, -4, 1);
    if (["stretch"].includes(chosen.key)) adjustHorseStats(index, 1, 10);
    if (["panic", "rage"].includes(chosen.key)) adjustHorseMood(index, { stress: 8, trust: -2 });
    if (["coffee", "stretch", "idea", "wave"].includes(chosen.key)) adjustHorseMood(index, { stress: -5, trust: 4 });
    if (["altTab", "hide", "fish", "laugh", "loot", "combo"].includes(chosen.key)) adjustHorseMood(index, { stress: -2, trust: -3 });
  }
  state.horseActions[index] = { ...chosen, until: now + duration };
  state.stationPulse[index] = now + 520;
  state.screenGlitch[index] = now + (chosen.screen === "glitch" || chosen.screen === "panic" ? 980 : 520);
  maybeChainHorseAction(index, chosen);
  scheduleHorse(index, duration + nextHorseDelay(index));
  render();
  window.setTimeout(render, duration + 40);
}

function horseRelationshipPlan(index, chosen) {
  const mood = state.horseMoods[index] || {};
  const personality = horsePersonalities[index] || {};
  const chaos = personality.chaos ?? 0.2;
  const pairTargets = {
    0: [6, "hype", { key: "spark", text: "我也追券", mood: "追榜", screen: "fast", emote: "UP" }],
    1: [5, "help", { key: "repair", text: "我看下载", mood: "支援接口", screen: "glitch", emote: "DL" }],
    2: [3, "tease", { key: "loot", text: "我架枪", mood: "被拉开黑", screen: "game", emote: "AIM" }],
    3: [2, "tease", { key: "combo", text: "中路等我", mood: "回队", screen: "game", emote: "5V5" }],
    4: [7, "tease", { key: "laugh", text: "我也看一眼", mood: "被剧透", screen: "game", emote: "哈" }],
    5: [1, "help", { key: "debug", text: "日志给你", mood: "接口协同", screen: "glitch", emote: "LOG" }],
    6: [0, "hype", { key: "typing", text: "榜一别跑", mood: "追分", screen: "fast", emote: "GAP" }],
    7: [4, "tease", { key: "hide", text: "老板来了藏", mood: "一起藏窗", screen: "panic", emote: "藏" }],
    8: [9, "sleepy", { key: "fish", text: "也想摸鱼", mood: "低电传染", screen: "calm", emote: "Z" }],
    9: [8, "sleepy", { key: "snore", text: "钓到瞌睡", mood: "被带困", screen: "calm", emote: "困" }]
  };
  if (pairTargets[index] && Math.random() < 0.34 + chaos * 0.34) {
    return pairTargets[index];
  }
  if (mood.stress >= 76 && Math.random() < 0.42) {
    const target = [index - 1, index + 1].filter((item) => item >= 0 && item < 10)[0];
    if (target != null) return [target, "panic", { key: "panic", text: "邻座也紧张", mood: "被压力传染", screen: "panic", emote: "!" }];
  }
  if (["debug", "repair", "idea"].includes(chosen.key) && Math.random() < 0.34) {
    const target = index < 5 ? Math.min(9, index + 5) : Math.max(0, index - 5);
    return [target, "help", { key: "debug", text: "搭把手", mood: "远程支援", screen: "glitch", emote: "帮" }];
  }
  return null;
}

function maybePersonalRelationship(index, chosen) {
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (!mood || mood.nextPersonalAt > now) return;
  const plan = horseRelationshipPlan(index, chosen);
  if (!plan) return;
  const [target, relation, action] = plan;
  if (target == null || target === index || !state.horseMoods[target]) return;
  mood.nextPersonalAt = now + 6200 + Math.floor(Math.random() * 5200);
  window.setTimeout(() => {
    relationshipPop(index, target, relation);
    state.stationPulse[target] = Date.now() + 900;
    state.screenGlitch[target] = Date.now() + 760;
    triggerHorseAction(target, action, 1500 + Math.floor(Math.random() * 800));
    markStationStory(target, `pair-${relation}`, relation === "help" ? "协同" : relation === "hype" ? "追榜" : relation === "sleepy" ? "传染" : "互动", 2200);
    spawnRelationshipPrompt(index, target, relation, action);
  }, 320 + Math.floor(Math.random() * 420));
}

function maybePersonalityEvent(index) {
  const event = personalityEvents[index];
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (!event || !mood || mood.nextSignatureAt > now) return false;
  const personality = horsePersonalities[index] || {};
  const chance = 0.2 + (personality.chaos || 0.2) * 0.22 + (index < 3 ? 0.05 : 0);
  if (Math.random() > chance) return false;
  mood.nextSignatureAt = now + 13500 + Math.floor(Math.random() * 9000);
  markStationStory(index, event.key, event.label, 4200);
  setTicker(event.text, 3600);
  triggerHorseAction(index, event.action, 2500);
  adjustHorseMood(index, { stress: event.relation === "sleepy" ? -1 : 2, trust: event.relation === "help" || event.relation === "hype" ? 3 : -1 });
  if (event.target != null) {
    window.setTimeout(() => {
      relationshipPop(index, event.target, event.relation);
      markStationStory(event.target, event.key, event.label, 3000);
      triggerHorseAction(event.target, event.follow, 1900);
    }, 420);
  }
  addHype(event.relation === "hype" ? 8 : 5, event.label);
  return true;
}

function routineLabelFor(action, index) {
  const personality = horsePersonalities[index] || {};
  if (["combo", "loot", "laugh", "hide", "fish"].includes(action.key)) return "摸鱼日常";
  if (["nap", "snore"].includes(action.key)) return "低电日常";
  if (["debug", "repair"].includes(action.key)) return "排障日常";
  if (["spark", "idea", "typing"].includes(action.key)) return "冲榜日常";
  if (["coffee", "stretch"].includes(action.key)) return "回血日常";
  return personality.quirk || "日常";
}

function maybeRoutineBeat(index) {
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (!mood || mood.nextRoutineAt > now) return false;
  const patrolActive = state.patrolWave?.until > now;
  if (activeIncidentFor(index) || activePromptFor(index)) {
    mood.nextRoutineAt = now + 2400 + index * 120;
    return false;
  }
  const personality = horsePersonalities[index] || {};
  const signatures = signatureActions[index] || [];
  const micros = personalMicroActions[index] || [];
  const pool = [
    habitActions[index],
    ...signatures,
    ...micros
  ].filter(Boolean);
  const action = pool[Math.floor((mood.actionCount || 0) % Math.max(1, pool.length))] || habitActions[index];
  const baseDelay = patrolActive ? 10400 : 8200;
  const spreadDelay = patrolActive ? 9200 : 7400;
  mood.nextRoutineAt = now + Math.round((baseDelay + Math.random() * spreadDelay) * (personality.delay || 1));
  markStationStory(index, `routine-${action.key}`, routineLabelFor(action, index), 2600);
  const quip = quipForAction(index, action, statusFor(currentRows()[index], Math.max(...currentRows().map((row) => row.tokens), 0), index));
  triggerHorseAction(index, quip ? { ...action, quip } : action, 1900 + Math.floor(Math.random() * 700));
  if (!patrolActive && ["altTab", "hide", "fish", "combo", "loot", "snore", "nap"].includes(action.key) && Math.random() < 0.34 + (personality.chaos || 0.2) * 0.18) {
    window.setTimeout(() => startStationPrompt(index, true), 520);
  }
  return true;
}

function activeIncidentFor(index) {
  const incident = state.stationIncidents[index];
  if (!incident || incident.until <= Date.now()) return null;
  return incident;
}

function clearExpiredIncidents() {
  const now = Date.now();
  state.stationIncidents.forEach((incident, index) => {
    if (!incident || incident.until > now) return;
    const config = stationIncidentDeck[index] || stationIncidentDeck[0];
    state.stationIncidents[index] = null;
    adjustHorseMood(index, { stress: 5, trust: -2 });
    adjustHorseStats(index, -3, -2);
    markStationStory(index, "incident-miss", "MISS", 1500);
    commandPop(index, "MISS", "danger");
    if (state.selectedIndex === index) setTicker(`${horsePersonalities[index]?.name || `${index + 1} 号机`} 的「${config.label}」没处理，状态变差了。`, 2600);
    notePatrolIncident(index, false, incident.waveId || "");
  });
}

function maybeStartStationIncident(index, action = null) {
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (state.patrolClearUntil > now) return false;
  if (state.patrolWave?.until > now) return false;
  const activeCount = state.stationIncidents.filter((incident) => incident && incident.until > now).length;
  if (activeCount >= 2) return false;
  if (!mood || activeIncidentFor(index) || mood.nextIncidentAt > now) return false;
  const config = stationIncidentDeck[index] || stationIncidentDeck[0];
  const personality = horsePersonalities[index] || {};
  const row = currentRows()[index];
  const activeAction = action || state.horseActions[index] || {};
  const risky =
    ["altTab", "hide", "fish", "laugh", "combo", "loot", "panic", "rage", "snore", "nap"].includes(activeAction.key) ||
    (mood.focus ?? 50) <= 36 ||
    (mood.stress ?? 40) >= 74 ||
    (mood.stamina ?? 60) <= 24 ||
    row?.rank <= 3;
  const chance = (risky ? 0.34 : 0.14) + (personality.chaos || 0.2) * 0.18;
  if (Math.random() > chance) {
    mood.nextIncidentAt = now + 3600 + Math.floor(Math.random() * 4200);
    return false;
  }
  const duration = 11000 + Math.floor(Math.random() * 4500);
  state.stationIncidents[index] = {
    ...config,
    startedAt: now,
    until: now + duration,
    command: config.command,
    handled: false
  };
  mood.nextIncidentAt = now + duration + 7600 + Math.floor(Math.random() * 7200);
  markStationStory(index, `incident-${config.key}`, config.label.slice(0, 4), duration);
  triggerHorseAction(index, config.action, Math.min(duration, 3600));
  setTickerIfFree(`${horsePersonalities[index]?.name || `${index + 1} 号机`} 触发事件：${config.text}`, 3200);
  return true;
}

function forceStationIncident(index = state.selectedIndex, duration = 9000, waveId = "") {
  const target = Math.max(0, Math.min(9, Number(index) || 0));
  const config = stationIncidentDeck[target] || stationIncidentDeck[0];
  const now = Date.now();
  state.stationIncidents[target] = {
    ...config,
    startedAt: now,
    until: now + duration,
    command: config.command,
    waveId,
    handled: false
  };
  if (state.horseMoods[target]) state.horseMoods[target].nextIncidentAt = now + duration + 7200;
  markStationStory(target, `incident-${config.key}`, config.label.slice(0, 4), duration);
  triggerHorseAction(target, config.action, Math.min(duration, 3600));
  setTickerIfFree(`${horsePersonalities[target]?.name || `${target + 1} 号机`} 触发事件：${config.text}`, 3200);
  return state.stationIncidents[target];
}

function patrolWaveCandidates() {
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
  return rows
    .map((row, index) => {
      const status = statusFor(row, maxTokens, index);
      const mood = state.horseMoods[index] || {};
      let score = index;
      if (status.key === "gaming") score -= 30;
      if (status.key === "sleep") score -= 24;
      if ((mood.focus ?? 50) <= 38) score -= 18;
      if ((mood.stress ?? 40) >= 70) score -= 16;
      if ((mood.stamina ?? 60) <= 30) score -= 12;
      if (row.rank <= 3) score -= 8;
      return { index, score };
    })
    .sort((a, b) => a.score - b.score)
    .map((item) => item.index);
}

function startPatrolWave(force = false) {
  const now = Date.now();
  if (!force && (state.patrolWave?.until > now || now < state.nextPatrolWaveAt)) return false;
  const targets = [];
  for (const index of patrolWaveCandidates()) {
    if (targets.length >= 3) break;
    if (activeIncidentFor(index)) continue;
    targets.push(index);
  }
  while (targets.length < 3) {
    const fallback = targets.length;
    if (!targets.includes(fallback)) targets.push(fallback);
    else targets.push((fallback + 4) % 10);
  }
  state.patrolWave = {
    id: now,
    targets,
    target: targets.length,
    done: 0,
    misses: 0,
    startedAt: now,
    until: now + 52000
  };
  targets.forEach((index, order) => {
    window.setTimeout(() => forceStationIncident(index, 45000 + order * 1800, String(now)), order * 260);
  });
  state.nextPatrolWaveAt = now + 68000;
  bossSay("巡场开始，三台问题机先处理掉。");
  setTicker("巡场波次开始：清掉 3 张事件牌，网吧会进入奖励节奏。", 4200);
  renderEventCard();
  return true;
}

function finishPatrolWave(reason = "clear") {
  const wave = state.patrolWave;
  if (!wave) return;
  const success = reason === "clear" && (wave.done || 0) >= (wave.target || 3);
  state.patrolWave = null;
  state.nextPatrolWaveAt = Date.now() + (success ? 52000 : 30000);
  state.stationIncidents = state.stationIncidents.map(() => null);
  if (success) {
    state.patrolClearUntil = Date.now() + 5600;
    state.patrolClearText = "三台问题机已处理，全场进入 FEVER 奖励。";
    addCoins(10, "巡场完成", state.selectedIndex);
    addHype(30, "巡场完成");
    adjustArenaStats(-12, 10);
    triggerFever("巡场完成", state.selectedIndex, 6800);
    rewardTicket("巡场完成", ["三台问题机 CLEAR", "+10 币", "FEVER 奖励"], "fever", state.selectedIndex);
    rippleHorseReaction(state.selectedIndex, { key: "wave", text: "巡场过关!", mood: "松一口气", screen: "fast", emote: "OK" }, 2);
    bossSay("这一轮还算像样，继续盯着。");
    setTicker("巡场完成：三台问题机已处理，全场进入 FEVER 奖励。", 4400);
  } else {
    state.patrolClearUntil = Date.now() + 4200;
    state.patrolClearText = "有事件漏掉了，下一轮会更快来。";
    adjustArenaStats(8, -8);
    bossSay("巡场漏了，后面我会继续点名。");
    setTicker("巡场结束：有事件漏掉了，下一轮会更快来。", 3600);
  }
  renderEventCard();
}

function notePatrolIncident(index, cleared, waveId = "") {
  const wave = state.patrolWave;
  if (!wave || !wave.targets?.includes(index)) return "";
  if (waveId && waveId !== String(wave.id)) return "";
  if (cleared) wave.done = Math.min(wave.target, (wave.done || 0) + 1);
  else wave.misses = (wave.misses || 0) + 1;
  if (wave.done >= wave.target) {
    finishPatrolWave("clear");
    return "clear";
  }
  if ((wave.done || 0) + (wave.misses || 0) >= wave.target) {
    finishPatrolWave("miss");
    return "miss";
  }
  renderEventCard();
  return "";
}

function resolveStationIncident(index, source = "click") {
  const incident = activeIncidentFor(index);
  if (!incident) {
    commandPop(index, "无事件", "work");
    return false;
  }
  state.selectedIndex = index;
  state.stationIncidents[index] = null;
  state.stationPulse[index] = Date.now() + 1000;
  state.screenGlitch[index] = Date.now() + 900;
  adjustHorseStats(index, incident.focus || 0, incident.stamina || 0);
  adjustHorseMood(index, { stress: incident.stress || 0, trust: incident.trust || 0 });
  commandPop(index, "CLEAR", incident.tone === "danger" ? "bonus" : incident.tone);
  spawnPop(index, `${incident.button || "处理"} +${incident.reward || 3}`, 1400, -24);
  addCoins(incident.reward || 3, `处理${incident.label}`, index);
  if (!state.patrolWave?.until || state.patrolWave.until <= Date.now()) addHype(8, incident.label);
  if (state.patrolWave?.until > Date.now()) {
    state.horseActions[index] = { key: "wave", text: "处理好了!", mood: "状态回正", screen: "fast", emote: "OK", until: Date.now() + 1500 };
  } else {
    triggerHorseAction(index, { key: "wave", text: "处理好了!", mood: "状态回正", screen: "fast", emote: "OK" }, 1500);
  }
  markStationStory(index, `incident-clear-${incident.key}`, "CLEAR", 1800);
  const waveResult = notePatrolIncident(index, true, incident.waveId || "");
  if (!waveResult) setTicker(`${String(index + 1).padStart(2, "0")} 号机事件已处理：${incident.label}`, 3600);
  render();
  return true;
}

window.__arenaDebug = {
  behaviors() {
    return state.horseMoods.map((mood, index) => ({
      index,
      name: horsePersonalities[index]?.name,
      behavior: mood.behaviorLabel || "",
      chip: mood.behaviorChip || "",
      tone: mood.behaviorTone || "",
      action: state.horseActions[index]?.key || "",
      focus: mood.focus,
      stamina: mood.stamina,
      stress: mood.stress,
      trust: mood.trust
    }));
  },
  spawnIncident(index = state.selectedIndex) {
    return forceStationIncident(index, 9000);
  },
  resolveIncident(index = state.selectedIndex) {
    return resolveStationIncident(Math.max(0, Math.min(9, Number(index) || 0)), "debug");
  },
  startPatrolWave() {
    return startPatrolWave(true);
  },
  startChainChallenge() {
    return startChainChallenge(true);
  },
  spawnPairPrompt(from = 0, to = 1, relation = "help") {
    const fromIndex = Math.max(0, Math.min(9, Number(from) || 0));
    const toIndex = Math.max(0, Math.min(9, Number(to) || 0));
    relationshipPop(fromIndex, toIndex, relation);
    return spawnRelationshipPrompt(fromIndex, toIndex, relation, { key: "debug", text: "接一下", mood: "关系连锁", screen: "glitch", emote: "PAIR" });
  }
};

function maybeChainHorseAction(index, chosen) {
  const mood = state.horseMoods[index];
  const now = Date.now();
  if (!mood || mood.nextChainAt > now) return;
  const chain = chainActionFor(chosen, index);
  if (!chain) return;
  const personality = horsePersonalities[index] || {};
  const chance = Math.min(0.62, 0.16 + (personality.chaos || 0.2) * 0.45 + (state.pressure >= 70 ? 0.12 : 0));
  if (Math.random() > chance) return;
  mood.nextChainAt = now + 5200;
  const neighbors = [index - 1, index + 1].filter((item) => item >= 0 && item <= 9);
  const target = neighbors[Math.floor(Math.random() * neighbors.length)];
  if (target == null) return;
  window.setTimeout(() => {
    const relationType =
      ["combo", "laugh", "loot", "altTab", "hide"].includes(chosen.key) ? "tease" :
      ["panic", "rage"].includes(chosen.key) ? "panic" :
      ["nap", "snore", "fish"].includes(chosen.key) ? "sleepy" :
      ["idea", "spark", "typing"].includes(chosen.key) ? "hype" :
      "help";
    relationshipPop(index, target, relationType);
    adjustHorseMood(target, { stress: chain.key === "panic" ? 5 : -2, trust: chain.key === "altTab" ? -2 : 1 });
    triggerHorseAction(target, chain, 1200 + Math.floor(Math.random() * 800));
    spawnPop(target, `连锁 ${chain.emote || ""}`.trim(), 1200, -18);
    spawnRelationshipPrompt(index, target, relationType, chain);
  }, 180 + Math.floor(Math.random() * 260));
}

function randomHorseBehavior() {
  const now = Date.now();
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((row) => row.tokens), 0);
  const patrolActive = state.patrolWave?.until > now;
  clearExpiredIncidents();
  clearExpiredPrompts();
  if (!patrolActive) startStationPrompt();
  rows.forEach((_, index) => {
    const mood = state.horseMoods[index];
    if (!mood) return;
    if (!mood.nextAt) scheduleHorse(index, 300 + index * 260 + Math.random() * 900);
    if (activeIncidentFor(index)) return;
    const status = statusFor(rows[index], maxTokens, index);
    if (!activeBehaviorFor(index) && (mood.nextBehaviorAt <= now || Math.random() < 0.04)) {
      activateBehavior(index, status, true);
    }
    if (maybeRoutineBeat(index)) return;
    if (mood.nextAt > now) return;
    if (maybePersonalityEvent(index)) return;
    const action = pickHorseAction(index, status);
    triggerHorseAction(index, action, 1500 + Math.floor(Math.random() * 2200));
    maybeStartStationIncident(index, action);
    maybePersonalRelationship(index, action);
  });
}

function selectStation(index, withReaction = false) {
  state.selectedIndex = (index + 10) % 10;
  audio.select();
  if (withReaction) {
    const reaction = manualReactions[Math.floor(Math.random() * manualReactions.length)];
    triggerHorseAction(state.selectedIndex, reaction, 2100);
    spawnPop(state.selectedIndex, reaction.text);
    const rows = currentRows();
    const row = rows[state.selectedIndex];
    const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
    const status = statusFor(row, maxTokens, state.selectedIndex);
    setTicker(`你拍了 ${String(state.selectedIndex + 1).padStart(2, "0")} 号机：${status.title}，${maskEmail(row.email)}。`, 2400);
  } else {
    render();
  }
}

function screenTapStation(index) {
  state.selectedIndex = index;
  if (completeChainTask(index, "screen")) return;
  if (runBossOrderCommand(index)) return;
  if (completeStationPrompt(index, "screen")) {
    render();
    return;
  }
  if (activeIncidentFor(index)) {
    resolveStationIncident(index, "screen");
    return;
  }
  const rows = currentRows();
  const row = rows[index];
  const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
  const status = statusFor(row, maxTokens, index);
  const mood = state.horseMoods[index] || {};
  const action = state.horseActions[index] || {};
  const activeKey = action.until > Date.now() ? action.key : "";
  if (["altTab", "hide", "fish", "laugh", "combo", "loot"].includes(activeKey) || status.key === "gaming") {
    commandPop(index, "查屏", "danger");
    inspectStation(index);
    setTicker(`${String(index + 1).padStart(2, "0")} 号屏幕露馅了：${horsePersonalities[index]?.name || "牛马"} 正在切窗口。`, 3200);
    return;
  }
  if (status.key === "sleep" || mood.stamina <= 18) {
    commandPop(index, "叫醒", "sleep");
    wakeStation(index);
    return;
  }
  commandPop(index, "催活", "work");
  nudgeStation(index);
}

function horseTapStation(index) {
  state.selectedIndex = index;
  if (completeChainTask(index, "horse")) return;
  if (runBossOrderCommand(index)) return;
  if (completeStationPrompt(index, "horse")) {
    render();
    return;
  }
  if (activeIncidentFor(index)) {
    resolveStationIncident(index, "horse");
    return;
  }
  const mood = state.horseMoods[index] || {};
  const action = state.horseActions[index] || {};
  const activeKey = action.until > Date.now() ? action.key : "";
  if (["nap", "snore"].includes(activeKey) || mood.stamina <= 20) {
    commandPop(index, "叫醒", "sleep");
    wakeStation(index);
    return;
  }
  if (["panic", "rage"].includes(activeKey) || mood.stress >= 78) {
    commandPop(index, "补给", "heal");
    snackStation(index);
    setTicker(`${horsePersonalities[index]?.name || `${index + 1} 号机`} 压力太高，先给它一点补给。`, 2600);
    return;
  }
  if (["altTab", "hide", "fish", "laugh", "combo", "loot"].includes(activeKey) || mood.focus <= 34) {
    commandPop(index, "查岗", "danger");
    inspectStation(index);
    return;
  }
  commandPop(index, "表扬", "bonus");
  praiseStation(index);
}

function actionInteractionKind(key) {
  if (["altTab", "hide", "fish", "laugh", "combo", "loot"].includes(key)) return "gaming";
  if (["nap", "snore"].includes(key)) return "tired";
  if (["panic", "rage"].includes(key)) return "stress";
  if (["coffee", "stretch"].includes(key)) return "heal";
  if (["typing", "debug", "repair", "spark", "idea", "wave"].includes(key)) return "focus";
  return "work";
}

function claimHorseProp(index) {
  const action = state.horseActions[index] || {};
  if (!action.key || action.until <= Date.now()) {
    commandPop(index, "过期", "danger");
    rememberCoachHint({ index, kind: "screen", text: "换一个发光目标", tone: "danger" }, 1600);
    renderCoachHint();
    return;
  }
  if (state.propClaims[index]?.key === action.key && state.propClaims[index]?.until >= action.until) {
    commandPop(index, "已处理", "work");
    rememberCoachHint({ index, kind: "screen", text: "找下一个目标", tone: "work" }, 1500);
    renderCoachHint();
    return;
  }
  const prop = horsePropFor(action);
  if (!prop) return;
  state.selectedIndex = index;
  state.propClaims[index] = { key: action.key, until: action.until };
  state.stationPulse[index] = Date.now() + 900;
  state.screenGlitch[index] = Date.now() + 560;
  audio.select();
  spawnPop(index, prop.text, 1100, -22);
  scenePop(
    stations[index].horse.x + stations[index].horse.w * 0.72,
    stations[index].horse.y + stations[index].horse.h * 0.34,
    "CLEAR",
    prop.type === "alert" || prop.type === "tab" || prop.type === "pad" ? "danger" : "bonus",
    1100
  );
  const activeKey = action.key;
  const kind = actionInteractionKind(activeKey);
  if (kind === "gaming") {
    commandPop(index, "抓到", "danger");
    inspectStation(index);
    addCoins(1, "抓小动作", index);
    setTicker(`${String(index + 1).padStart(2, "0")} 号机的小动作被你抓到了。`, 2200);
  } else if (kind === "tired") {
    commandPop(index, "叫醒", "sleep");
    wakeStation(index);
    addCoins(1, "点道具叫醒", index);
  } else if (kind === "stress") {
    commandPop(index, "安抚", "heal");
    snackStation(index);
    addCoins(1, "安抚警报", index);
  } else if (kind === "heal") {
    commandPop(index, "接住", "heal");
    adjustHorseMood(index, { stress: -4, trust: 4 });
    adjustHorseStats(index, 2, 8);
    addCoins(2, "接住补给", index);
    triggerHorseAction(index, { key: "wave", text: "接到了!", mood: "被照顾", screen: "calm", emote: "OK" }, 1500);
  } else if (kind === "focus") {
    commandPop(index, "助攻", "bonus");
    adjustHorseMood(index, { stress: -2, trust: 5 });
    adjustHorseStats(index, 7, -2);
    addCoins(2, "小道具助攻", index);
    triggerHorseAction(index, { key: "spark", text: "助攻成功!", mood: "被助攻", screen: "fast", emote: "UP" }, 1500);
  } else {
    commandPop(index, "拾取", "work");
    addCoins(1, "拾取道具", index);
  }
  addHype(5, "小道具互动");
  maybeSpawnInteractionChain(index, "", action);
  rememberCoachHint({ index, kind: "screen", text: "继续找下一个发光点", tone: "bonus" }, 1700);
  rewardTicket("GOOD", [`${horsePersonalities[index]?.name || "牛马"} 已响应`, "找下一个目标"], "bonus", index);
  renderCoachHint();
  render();
}

function claimScreenTarget(index) {
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
  const status = statusFor(rows[index], maxTokens, index);
  const action = state.horseActions[index] || {};
  const key = action?.until > Date.now() ? action.key : status.key;
  const target = screenTargetFor(action, status);
  if (!target) {
    screenTapStation(index);
    return;
  }
  const until = action?.until > Date.now() ? action.until : Date.now() + 1800;
  if (state.screenClaims[index]?.key === key && state.screenClaims[index]?.until >= until) {
    commandPop(index, "已点掉", "work");
    rememberCoachHint({ index, kind: "horse", text: "换马或追雷达", tone: "work" }, 1500);
    renderCoachHint();
    return;
  }
  state.selectedIndex = index;
  state.screenClaims[index] = { key, until };
  state.stationPulse[index] = Date.now() + 900;
  state.screenGlitch[index] = Date.now() + 840;
  audio.select();
  spawnPop(index, target.text, 980, -16);
  scenePop(
    stations[index].screen.x + stations[index].screen.w * 0.5,
    stations[index].screen.y + stations[index].screen.h * 0.5,
    "HIT",
    target.type === "game" || target.type === "alert" ? "danger" : "bonus",
    1050
  );
  const kind = actionInteractionKind(key);
  if (kind === "gaming") {
    commandPop(index, "关窗", "danger");
    inspectStation(index);
    addCoins(1, "点掉屏幕摸鱼", index);
  } else if (kind === "tired") {
    commandPop(index, "唤醒", "sleep");
    wakeStation(index);
    addCoins(1, "点醒屏幕", index);
  } else if (kind === "stress") {
    commandPop(index, "稳住", "heal");
    adjustHorseMood(index, { stress: -7, trust: 2 });
    adjustHorseStats(index, 2, 5);
    addCoins(1, "屏幕稳压", index);
    triggerHorseAction(index, { key: "coffee", text: "稳住了", mood: "冷静", screen: "calm", emote: "稳" }, 1400);
  } else if (kind === "heal") {
    commandPop(index, "回血", "heal");
    adjustHorseMood(index, { stress: -4, trust: 3 });
    adjustHorseStats(index, 2, 8);
    addCoins(1, "屏幕回血", index);
  } else if (kind === "focus") {
    commandPop(index, "命中", "bonus");
    adjustHorseMood(index, { stress: -2, trust: 3 });
    adjustHorseStats(index, 5, -2);
    addCoins(1, "屏幕助攻", index);
    triggerHorseAction(index, { key: "typing", text: "目标命中!", mood: "加速", screen: "fast", emote: "RUN" }, 1400);
  } else {
    commandPop(index, "点中", "work");
    addCoins(1, "屏幕目标", index);
  }
  addHype(4, "屏幕目标");
  maybeSpawnInteractionChain(index, "", action);
  rememberCoachHint({ index, kind: "horse", text: "再点马或追下一个屏幕", tone: "bonus" }, 1700);
  renderCoachHint();
  setTicker(`${String(index + 1).padStart(2, "0")} 号屏幕目标已处理：${target.text}`, 2200);
  render();
}

function wakeStation(index) {
  const personality = horsePersonalities[index] || {};
  actionGrade(index, "nudge", "sleep");
  const action = { key: "panic", text: "被叫醒了!", mood: "惊醒", screen: "panic", emote: "醒" };
  adjustHorseStats(index, 10, -5);
  adjustHorseMood(index, { stress: 6, trust: -1 });
  triggerHorseAction(index, action, 1900);
  spawnPop(index, "醒醒", 1500, -18);
  addCoins(2, "叫醒", index);
  addHype(9, "叫醒摸鱼马");
  adjustArenaStats(5, 3);
  setTicker(`${personality.name || `${index + 1} 号机`} 被叫醒，屏幕马上切回工作台。`, 2800);
  completeBossOrder("nudge", index);
}

function nudgeStation(index) {
  const rows = currentRows();
  const row = rows[index];
  const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
  const status = statusFor(row, maxTokens, index);
  actionGrade(index, "nudge", "work");
  const reactions = {
    working: [
      { key: "typing", text: "加速敲代码", mood: "被催工", screen: "fast", emote: "RUN" },
      { key: "debug", text: "开始排障", mood: "查问题", screen: "glitch", emote: "BUG" }
    ],
    overdrive: [
      { key: "spark", text: "冲榜模式", mood: "火力全开", screen: "fast", emote: "MAX" },
      { key: "typing", text: "别催，键盘热了", mood: "爆肝", screen: "fast", emote: "HOT" }
    ],
    gaming: [
      { key: "altTab", text: "秒切工作台", mood: "装忙", screen: "panic", emote: "TAB" },
      { key: "laugh", text: "这局马上结束", mood: "开黑", screen: "game", emote: "GG" }
    ],
    sleep: [
      { key: "panic", text: "谁叫我？", mood: "惊醒", screen: "panic", emote: "!" },
      { key: "fish", text: "我在看日志", mood: "摸鱼", screen: "game", emote: "鱼" }
    ]
  };
  const pool = reactions[status.key] || reactions.working;
  const action = pool[Math.floor(Math.random() * pool.length)];
  adjustHorseStats(index, 8, -6);
  triggerHorseAction(index, action, 2100);
  spawnPop(index, action.emote || action.text);
  addCoins(2, "催活", index);
  addHype(5, "催活");
  adjustArenaStats(4, 3);
  const orderDone = completeBossOrder("nudge", index);
  const questDone = advanceQuest("nudge");
  if (!questDone && !orderDone) setTicker(`你拍了 ${String(index + 1).padStart(2, "0")} 号机：${action.text}`, 2600);
}

function inspectStation(index) {
  actionGrade(index, "inspect", "danger");
  const action = { key: "panic", text: "查岗来了!", mood: "被查岗", screen: "panic", emote: "查" };
  adjustHorseStats(index, 12, -8);
  triggerHorseAction(index, action, 1900);
  rippleHorseReaction(index, { key: "altTab", text: "全员切屏!", mood: "装忙", screen: "panic", emote: "TAB" }, 1);
  spawnPop(index, "查岗");
  bossSay("我就说吧，摸鱼的一眼就看出来。");
  addCoins(3, "查岗", index);
  addHype(14, "查岗");
  adjustArenaStats(8, 7);
  const orderDone = completeBossOrder("inspect", index);
  const questDone = advanceQuest("inspect");
  if (!questDone && !orderDone) setTicker(`你查岗了 ${String(index + 1).padStart(2, "0")} 号机，附近工位开始装忙。`, 2800);
}

function snackStation(index) {
  actionGrade(index, "snack", "heal");
  const action = { key: "coffee", text: "补糖回血!", mood: "开心回血", screen: "calm", emote: "糖" };
  adjustHorseStats(index, 3, 16);
  triggerHorseAction(index, action, 2300);
  spawnPop(index, "+糖");
  audio.reward();
  addCoins(2, "发糖", index);
  addHype(4, "发糖");
  adjustArenaStats(-7, 2);
  const orderDone = completeBossOrder("snack", index);
  const questDone = advanceQuest("snack");
  if (!questDone && !orderDone) setTicker(`${String(index + 1).padStart(2, "0")} 号机收到了补给，干活速度恢复了一点。`, 2800);
}

function praiseStation(index) {
  const personality = horsePersonalities[index] || {};
  actionGrade(index, "praise", "bonus");
  const action = { key: "idea", text: "被夸精神了!", mood: "心流", screen: "fast", emote: "赞" };
  adjustHorseStats(index, 14, -3);
  triggerHorseAction(index, action, 2200);
  spawnPop(index, "+专注");
  addCoins(3, "表扬", index);
  addHype(6, "表扬");
  adjustArenaStats(-3, 5);
  const orderDone = completeBossOrder("praise", index);
  const questDone = advanceQuest("praise");
  if (!questDone && !orderDone) setTicker(`${personality.name || `${index + 1} 号机`} 被表扬了，专注条往上跳了一格。`, 2800);
}

function breakStation(index) {
  const personality = horsePersonalities[index] || {};
  actionGrade(index, "break", "heal");
  const action = { key: "stretch", text: "放风 5 分钟!", mood: "回血", screen: "calm", emote: "松" };
  adjustHorseStats(index, -4, 22);
  triggerHorseAction(index, action, 2400);
  spawnPop(index, "+体力");
  addCoins(2, "放风", index);
  addHype(5, "放风");
  adjustArenaStats(-28, -4);
  const orderDone = completeBossOrder("break", index);
  const questDone = advanceQuest("break");
  if (!questDone && !orderDone) setTicker(`${personality.name || `${index + 1} 号机`} 去门口透了口气，网吧压力降了一点。`, 3000);
}

function runQuickCommand(command) {
  if (!canRunCommand(command)) return;
  const index = state.selectedIndex;
  if (completeStationPrompt(index, command)) {
    startCommandCooldown(command);
    render();
    return;
  }
  if (command === "nudge") nudgeStation(index);
  if (command === "inspect") inspectStation(index);
  if (command === "snack") snackStation(index);
  if (command === "praise") praiseStation(index);
  if (command === "break") breakStation(index);
  startCommandCooldown(command);
}

function runPriorityCommand(index, command = "") {
  state.selectedIndex = index;
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((item) => item.tokens), 0);
  const row = rows[index];
  const resolved = command || stationPriorityInfo(row, index, maxTokens).command;
  if (String(resolved).startsWith("prompt:")) {
    const prompt = activePromptFor(index);
    if (prompt) {
      completeStationPrompt(index, "priority");
      render();
      return;
    }
  }
  if (String(resolved).startsWith("chain:")) {
    const task = activeChainTaskFor(index);
    if (task) {
      completeChainTask(index, task.action);
      return;
    }
  }
  const tone =
    resolved === "inspect" ? "danger" :
    resolved === "voucher" || resolved === "praise" ? "bonus" :
    resolved === "snack" || resolved === "break" ? "heal" :
    "work";
  commandPop(index, "优先", tone);
  if (resolved === "incident" || activeIncidentFor(index)) {
    resolveStationIncident(index, "priority");
    return;
  }
  if (resolved === "voucher") {
    window.setTimeout(claimVoucher, 40);
    return;
  }
  if (resolved === "inspect") inspectStation(index);
  else if (resolved === "snack") snackStation(index);
  else if (resolved === "praise") praiseStation(index);
  else if (resolved === "break") breakStation(index);
  else nudgeStation(index);
}

function rippleHorseReaction(centerIndex, action, radius = 1) {
  for (let index = Math.max(0, centerIndex - radius); index <= Math.min(9, centerIndex + radius); index += 1) {
    const delay = Math.abs(index - centerIndex) * 130;
    window.setTimeout(() => triggerHorseAction(index, action, 1400 + delay), delay);
  }
}

function bossSay(line, mood = "talk") {
  if (!el.bossCow) return;
  el.bossSpeech.textContent = line;
  el.bossCow.classList.remove("talk", "hit");
  void el.bossCow.offsetWidth;
  el.bossCow.classList.add(mood);
  window.setTimeout(() => el.bossCow?.classList.remove(mood), mood === "hit" ? 720 : 1100);
}

function updateScoreBadge() {
  const bucket = todayBucket();
  if (el.bossScoreValue) el.bossScoreValue.textContent = bucket.score.toLocaleString("zh-CN");
}

function updateDayBadge() {
  if (el.dayNumber) el.dayNumber.textContent = String(dayNumber()).padStart(2, "0");
}

function punchBoss() {
  const bossTask = activeChainChallenge()?.tasks.find((task) => task.action === "boss" && !task.done);
  if (bossTask && completeChainTask(bossTask.index, "boss")) return;
  const bucket = todayBucket();
  const now = Date.now();
  state.combo = now - state.lastPunch < 1500 ? state.combo + 1 : 1;
  state.lastPunch = now;
  state.bossLockedUntil = now + 1600;
  bucket.hits += 1;
  bucket.score += state.combo;
  saveStore();

  audio.punch();
  document.getElementById("gameStage")?.classList.add("boss-hit-shake");
  window.setTimeout(() => document.getElementById("gameStage")?.classList.remove("boss-hit-shake"), 420);
  const line = bossHitLines[(bucket.hits - 1) % bossHitLines.length];
  bossSay(line, "hit");
  if (state.combo > 1) comboPop(`COMBO x${state.combo}`);
  updateScoreBadge();
  addCoins(1, "揍老板", state.selectedIndex);
  addHype(12 + Math.min(10, state.combo * 2), "揍老板");
  adjustArenaStats(10, -5);
  const questDone = advanceQuest("boss");
  if (!questDone) setTicker(`你揍了牛老板 ${bucket.hits} 下（连击 x${state.combo}）：${line}`, 2800);

  const rows = currentRows();
  rows.forEach((_, index) => {
    const chance = index < 5 ? 0.68 : 0.44;
    if (Math.random() < chance) {
      window.setTimeout(
        () => triggerHorseAction(index, { key: "panic", text: "老板挨揍了!", mood: "集体惊醒", screen: "panic", emote: "!" }, 1500),
        index * 55
      );
    }
  });
}

function runSceneAction(kind) {
  const now = Date.now();
  state.sceneActionCooldowns ||= {};
  const until = state.sceneActionCooldowns[kind] || 0;
  if (until > now) {
    toast("场景物件冷却中");
    return;
  }
  state.sceneActionCooldowns[kind] = now + 5200;
  audio.select();
  if (kind === "fan") {
    adjustArenaStats(-9, 2);
    addCoins(2, "吊扇降温", state.selectedIndex);
    scenePop(392, 112, "降温", "heal");
    bossSay("风扇别开太大，电费也算成本。");
    setTicker("你打开吊扇，网吧压力降了一点，低电马精神回来了。", 3000);
    [8, 9, 5].forEach((index, order) => {
      window.setTimeout(() => triggerHorseAction(index, { key: "stretch", text: "凉快了!", mood: "回血", screen: "calm", emote: "风" }, 1400), order * 120);
    });
    return;
  }
  if (kind === "sign") {
    adjustArenaStats(4, 5);
    addHype(12, "拍亮招牌");
    addCoins(2, "拍亮招牌", 0);
    scenePop(1030, 142, "马力+", "bonus");
    bossSay("招牌亮了，前三继续给我冲。");
    setTicker("你拍亮网吧招牌，前三和榜单马开始兴奋。", 3000);
    [0, 1, 2, 6].forEach((index, order) => {
      window.setTimeout(() => triggerHorseAction(index, { key: "spark", text: "马力全开!", mood: "冲榜", screen: "fast", emote: "UP" }, 1500), order * 100);
    });
    return;
  }
  if (kind === "door") {
    adjustArenaStats(-6, -2);
    addCoins(2, "门口放风", state.selectedIndex);
    scenePop(1578, 242, "放风", "heal");
    bossSay("放风可以，别趁机下机。");
    setTicker("门口透进一点冷风，前排马放松了一下。", 3000);
    [5, 6, 7, 8, 9].forEach((index, order) => {
      adjustHorseMood(index, { stress: -5, trust: 2 });
      adjustHorseStats(index, 1, 8);
      window.setTimeout(() => triggerHorseAction(index, { key: "stretch", text: "透口气", mood: "放松", screen: "calm", emote: "松" }, 1350), order * 90);
    });
  }
}

function cycleBossLine() {
  if (Date.now() < state.bossLockedUntil) return;
  if (state.bossOrder && state.bossOrder.until > Date.now()) return;
  const line = bossLines[state.bossLineIndex % bossLines.length];
  state.bossLineIndex += 1;
  bossSay(line);
}

function randomArenaEvent() {
  if (state.patrolWave?.until > Date.now() || state.patrolClearUntil > Date.now()) return;
  const events = [
    {
      title: "网线松了",
      text: "网管喊：全场续费，别断线！",
      boss: "续费先交，需求后补。",
      action: { key: "panic", text: "别断网!", mood: "抢救连接", screen: "panic", emote: "NET" },
      pressure: 8,
      order: -4,
      stress: 9
    },
    {
      title: "前三冒光",
      text: "排行榜刷新，前三座位开始冒光。",
      boss: "前三有券，后面继续卷。",
      action: { key: "spark", text: "冲榜!", mood: "冲榜", screen: "fast", emote: "↑" },
      topOnly: true,
      pressure: 6,
      order: 4,
      trust: 2
    },
    {
      title: "老板巡场",
      text: "老板巡场，摸鱼窗口集体消失。",
      boss: "谁屏幕上是游戏？",
      action: { key: "altTab", text: "秒切!", mood: "装忙", screen: "panic", emote: "TAB" },
      pressure: 12,
      order: 8,
      stress: 10,
      trust: -3
    },
    {
      title: "夜宵到了",
      text: "夜宵到了，前排马恢复一点精神。",
      boss: "吃完继续干，别太开心。",
      action: { key: "coffee", text: "回血!", mood: "补给", screen: "calm", emote: "糖" },
      frontOnly: true,
      pressure: -10,
      order: 3,
      stress: -8,
      trust: 4
    },
    {
      title: "包夜开黑",
      text: "角落传来开黑暗号，几台电脑瞬间切到游戏。",
      boss: "我听见语音了，谁在喊中路集合？",
      action: { key: "combo", text: "开黑暗号!", mood: "上头", screen: "game", emote: "PVP" },
      pressure: -3,
      order: -9,
      stress: -4,
      trust: -5,
      oddOnly: true
    }
  ];
  const event = events[Math.floor(Math.random() * events.length)];
  triggerArenaEvent(event);
}

function triggerArenaEvent(event) {
  const now = Date.now();
  if (state.patrolWave?.until > now || state.patrolClearUntil > now) return;
  state.eventTitle = event.title || "突发事件";
  state.eventText = event.text;
  state.eventStartedAt = now;
  state.eventUntil = now + (event.duration || 5800);
  adjustArenaStats(event.pressure ?? (event.topOnly ? 6 : event.frontOnly ? -5 : 4), event.order ?? (event.frontOnly ? 3 : -2));
  setTicker(event.text, 3000);
  bossSay(event.boss);
  const indexes = Array.from({ length: 10 }, (_, index) => index).filter((index) => {
    if (event.topOnly) return index < 3;
    if (event.frontOnly) return index >= 5;
    if (event.oddOnly) return index % 2 === 1;
    return Math.random() < 0.58;
  });
  indexes.forEach((index) => adjustHorseMood(index, { stress: event.stress || 0, trust: event.trust || 0 }));
  indexes.forEach((index, order) => {
    window.setTimeout(() => triggerHorseAction(index, event.action, 1500 + Math.floor(Math.random() * 900)), order * 90);
  });
  renderEventCard();
}

function markStationStory(index, key, label, duration = 2400) {
  if (!state.stationStories[index]) return;
  state.stationStories[index] = { key, label, until: Date.now() + duration };
  state.stationPulse[index] = Date.now() + Math.min(duration, 900);
}

function relationPromptConfig(relation, action = {}) {
  const configs = {
    help: {
      key: "pair-help",
      label: "协同",
      action: "screen",
      button: "接力",
      tone: "work",
      text: "关系线亮了，点屏幕把协同接住。",
      command: "nudge",
      reward: 4,
      focus: 8,
      stamina: -2,
      stress: -4,
      trust: 5
    },
    hype: {
      key: "pair-hype",
      label: "追榜",
      action: "screen",
      button: "助推",
      tone: "bonus",
      text: "旁边马被带动了，点屏幕把追榜节奏接住。",
      command: "praise",
      reward: 5,
      focus: 10,
      stamina: -4,
      stress: -3,
      trust: 5
    },
    tease: {
      key: "pair-tease",
      label: "带偏",
      action: "screen",
      button: "抓包",
      tone: "danger",
      text: "摸鱼暗号传过去了，点屏幕把它抓回来。",
      command: "inspect",
      reward: 4,
      focus: 9,
      stamina: -2,
      stress: 2,
      trust: -1
    },
    panic: {
      key: "pair-panic",
      label: "传慌",
      action: "horse",
      button: "安抚",
      tone: "heal",
      text: "紧张传到邻座，点马安抚一下。",
      command: "snack",
      reward: 4,
      focus: 4,
      stamina: 6,
      stress: -9,
      trust: 4
    },
    sleepy: {
      key: "pair-sleepy",
      label: "犯困",
      action: "horse",
      button: "叫醒",
      tone: "sleep",
      text: "低电状态传染了，点马叫醒。",
      command: "nudge",
      reward: 4,
      focus: 8,
      stamina: 5,
      stress: -2,
      trust: 2
    }
  };
  const base = configs[relation] || configs.help;
  return {
    ...base,
    horseAction: action.key ? action : { key: "wave", text: base.label, mood: base.label, screen: base.tone === "danger" ? "panic" : base.tone === "sleep" ? "calm" : "fast", emote: base.label.slice(0, 1) }
  };
}

function spawnRelationshipPrompt(fromIndex, toIndex, relation = "help", action = null) {
  if (toIndex == null || !state.horseMoods[toIndex] || activePromptFor(toIndex) || activeIncidentFor(toIndex)) return false;
  const now = Date.now();
  if (now < state.nextRelationshipPromptAt) return false;
  if (activeRelationPromptCount(now) >= 1) return false;
  const config = relationPromptConfig(relation, action || {});
  const duration = 9600 + Math.floor(Math.random() * 3200);
  state.stationPrompts[toIndex] = {
    ...config,
    relationFrom: fromIndex,
    startedAt: now,
    until: now + duration,
    handled: false
  };
  markStationStory(toIndex, config.key, config.label, duration);
  state.nextRelationshipPromptAt = now + 7200 + Math.floor(Math.random() * 5200);
  rememberCoachHint({ index: toIndex, kind: config.action === "horse" ? "horse" : "screen", text: config.label, tone: config.tone }, 2400);
  renderCoachHint();
  return true;
}

function maybeSpawnInteractionChain(index, relationHint = "", action = null) {
  const now = Date.now();
  if (now < state.nextRelationshipPromptAt || state.patrolWave?.until > now) return false;
  const activeCount = state.stationPrompts.filter((prompt) => prompt && prompt.until > now).length;
  if (activeCount >= 2) return false;
  const actionKey = action?.key || state.horseActions[index]?.key || "";
  const relation =
    relationHint ||
    (["combo", "laugh", "loot", "altTab", "hide", "fish"].includes(actionKey) ? "tease" :
    ["nap", "snore"].includes(actionKey) ? "sleepy" :
    ["panic", "rage"].includes(actionKey) ? "panic" :
    ["idea", "spark", "typing"].includes(actionKey) ? "hype" :
    "help");
  const candidates = [index - 1, index + 1, index < 5 ? index + 5 : index - 5]
    .filter((item, pos, arr) => item >= 0 && item < 10 && arr.indexOf(item) === pos)
    .filter((item) => !activePromptFor(item) && !activeIncidentFor(item));
  if (!candidates.length) return false;
  const target = candidates[Math.floor(Math.random() * candidates.length)];
  const chainAction = action || chainActionFor(state.horseActions[index], index) || { key: "wave", text: "接力!", mood: "被带动", screen: "fast", emote: "GO" };
  const ok = spawnRelationshipPrompt(index, target, relation, chainAction);
  if (!ok) return false;
  relationshipPop(index, target, relation);
  setTicker(`关系连锁：${horsePersonalities[index]?.name || `${index + 1}号机`} 影响了 ${horsePersonalities[target]?.name || `${target + 1}号机`}，追过去处理。`, 2800);
  return true;
}

const stationPromptDeck = [
  { key: "sprint", label: "冲券", action: "screen", button: "点屏", tone: "bonus", text: "榜单差距在闪，点屏幕给它冲一把。", command: "praise", horseAction: { key: "spark", text: "冲券!", mood: "护榜冲刺", screen: "fast", emote: "券" }, reward: 4, focus: 9, stamina: -4, stress: -2, trust: 4 },
  { key: "debug", label: "报错", action: "screen", button: "修屏", tone: "danger", text: "接口日志爆红，点屏幕帮它定位。", command: "inspect", horseAction: { key: "debug", text: "抓到报错", mood: "查日志", screen: "glitch", emote: "BUG" }, reward: 3, focus: 8, stamina: -3, stress: -5, trust: 3 },
  { key: "alt", label: "切屏", action: "screen", button: "关窗", tone: "danger", text: "摸鱼窗口冒出来了，点屏幕关掉。", command: "inspect", horseAction: { key: "altTab", text: "窗口露馅!", mood: "心虚", screen: "panic", emote: "TAB" }, reward: 3, focus: 10, stamina: -5, stress: 4, trust: -1 },
  { key: "snack", label: "低电", action: "horse", button: "喂糖", tone: "heal", text: "体力条快见底，点马给补给。", command: "snack", horseAction: { key: "coffee", text: "补糖!", mood: "回血", screen: "calm", emote: "糖" }, reward: 3, focus: 2, stamina: 14, stress: -6, trust: 5 },
  { key: "wake", label: "打盹", action: "horse", button: "叫醒", tone: "sleep", text: "它又低头了，点马叫醒。", command: "nudge", horseAction: { key: "snore", text: "眯一下", mood: "打盹", screen: "calm", emote: "Z" }, reward: 3, focus: 9, stamina: -4, stress: 4, trust: -1 },
  { key: "praise", label: "心流", action: "command", button: "表扬", tone: "bonus", text: "键盘声很稳，用表扬把心流接住。", command: "praise", horseAction: { key: "idea", text: "心流来了", mood: "专注", screen: "fast", emote: "OK" }, reward: 4, focus: 12, stamina: -3, stress: -4, trust: 6 },
  { key: "break", label: "过载", action: "command", button: "放风", tone: "heal", text: "压力条过热，用放风降温。", command: "break", horseAction: { key: "rage", text: "过载!", mood: "紧绷", screen: "panic", emote: "!!" }, reward: 4, focus: -2, stamina: 16, stress: -12, trust: 4 }
];

const chainChallengeDeck = [
  {
    key: "intro-tour",
    title: "开场巡机",
    text: "先学三步：点屏幕、点马、最后揍一下牛老板。",
    boss: "新来的先按规矩巡一遍：屏幕、马、柜台都点到。",
    reward: 8,
    targets: [
      { index: 2, action: "screen", label: "点屏", button: "点屏", tone: "danger", text: "峡谷马屏幕冒出小窗，点屏幕关掉。", horseAction: { key: "combo", text: "开局五排!", mood: "摸鱼露馅", screen: "game", emote: "5V5" }, clearAction: { key: "altTab", text: "切回来了!", mood: "装忙成功", screen: "panic", emote: "TAB" } },
      { index: 1, action: "horse", label: "点马", button: "拍马", tone: "bonus", text: "接口马准备救火，点马让它接手。", horseAction: { key: "debug", text: "等我看日志", mood: "准备救火", screen: "glitch", emote: "LOG" }, clearAction: { key: "spark", text: "接手了!", mood: "救火启动", screen: "fast", emote: "OK" } },
      { index: 0, action: "boss", label: "老板", button: "揍他", tone: "danger", text: "最后揍一下牛老板，打断碎碎念。", horseAction: { key: "panic", text: "老板盯场!", mood: "被盯", screen: "panic", emote: "!" }, clearAction: { key: "wave", text: "舒服了!", mood: "士气回来", screen: "fast", emote: "OK" } }
    ]
  },
  {
    key: "lan-clean",
    title: "开黑清场",
    text: "语音暗号传开了，按顺序点掉几台游戏屏幕。",
    boss: "谁在喊中路集合？三台屏幕给我切回来。",
    reward: 9,
    fever: true,
    targets: [
      { index: 2, action: "screen", label: "峡谷", button: "关局", tone: "danger", text: "峡谷马正在喊五排，点屏幕切回工作台。", horseAction: { key: "combo", text: "中路集合!", mood: "开黑露馅", screen: "game", emote: "5V5" }, clearAction: { key: "altTab", text: "切回来了!", mood: "装忙成功", screen: "panic", emote: "TAB" } },
      { index: 3, action: "screen", label: "CS2", button: "收枪", tone: "danger", text: "枪法马还在架 A 点，点屏幕收掉准星。", horseAction: { key: "loot", text: "A 点有人!", mood: "架枪露馅", screen: "game", emote: "A" }, clearAction: { key: "wave", text: "枪收了!", mood: "回工单", screen: "fast", emote: "OK" } },
      { index: 4, action: "screen", label: "追剧", button: "关窗", tone: "danger", text: "追剧马小窗弹出来了，点屏幕关掉。", horseAction: { key: "hide", text: "小窗漏了!", mood: "追剧假忙", screen: "panic", emote: "TV" }, clearAction: { key: "typing", text: "我在写!", mood: "恢复工作", screen: "fast", emote: "RUN" } }
    ]
  },
  {
    key: "power-save",
    title: "低电抢救",
    text: "后排开始犯困，点马把低电状态救回来。",
    boss: "困了也别睡，先把这轮跑完。",
    reward: 8,
    targets: [
      { index: 8, action: "horse", label: "打盹", button: "叫醒", tone: "sleep", text: "瞌睡马头点三下，点马叫醒。", horseAction: { key: "snore", text: "头点三下", mood: "低电", screen: "calm", emote: "Z" }, clearAction: { key: "coffee", text: "醒了!", mood: "回血", screen: "calm", emote: "糖" } },
      { index: 9, action: "horse", label: "摸鱼", button: "收竿", tone: "sleep", text: "钓鱼马也慢下来了，点马把鱼竿收掉。", horseAction: { key: "fish", text: "钓日志", mood: "低电摸鱼", screen: "game", emote: "鱼" }, clearAction: { key: "wave", text: "收线!", mood: "回神", screen: "fast", emote: "OK" } },
      { index: 5, action: "screen", label: "卡种", button: "重拨", tone: "heal", text: "下载马进度条卡住，点屏幕重拨。", horseAction: { key: "repair", text: "进度卡住!", mood: "守下载", screen: "glitch", emote: "DL" }, clearAction: { key: "repair", text: "跑起来!", mood: "恢复下载", screen: "fast", emote: "MB/s" } }
    ]
  },
  {
    key: "api-rescue",
    title: "接口救火",
    text: "接口日志冒烟，相关工位要一起救回来。",
    boss: "线上先救，谁会看日志谁上。",
    reward: 10,
    fever: true,
    targets: [
      { index: 1, action: "screen", label: "500", button: "修屏", tone: "danger", text: "接口马屏幕爆红，点屏幕定位 BUG。", horseAction: { key: "debug", text: "500 冒烟!", mood: "接口告警", screen: "glitch", emote: "500" }, clearAction: { key: "debug", text: "定位到!", mood: "排障", screen: "glitch", emote: "LOG" } },
      { index: 5, action: "screen", label: "下载", button: "连线", tone: "work", text: "下载马帮忙查连接，点屏幕确认。", horseAction: { key: "repair", text: "查连接!", mood: "协同排障", screen: "glitch", emote: "FIX" }, clearAction: { key: "wave", text: "连上了!", mood: "支援成功", screen: "fast", emote: "OK" } },
      { index: 0, action: "horse", label: "支援", button: "拍马", tone: "bonus", text: "卷王马准备支援，点马让它接手一段。", horseAction: { key: "typing", text: "我顶一段!", mood: "支援救火", screen: "fast", emote: "UP" }, clearAction: { key: "spark", text: "顶住了!", mood: "救火完成", screen: "fast", emote: "OK" } }
    ]
  },
  {
    key: "boss-counter",
    title: "老板压榨",
    text: "牛老板开始碎碎念，先点两台机再揍一下老板。",
    boss: "都别看我，先把这三件事做完。",
    reward: 11,
    targets: [
      { index: 6, action: "screen", label: "冲券", button: "助推", tone: "bonus", text: "榜单马在算差距，点屏幕助推。", horseAction: { key: "idea", text: "差距缩小!", mood: "算分", screen: "fast", emote: "GAP" }, clearAction: { key: "spark", text: "追上去!", mood: "冲券", screen: "fast", emote: "UP" } },
      { index: 7, action: "screen", label: "纸牌", button: "收牌", tone: "danger", text: "纸牌马摸到红桃 A，点屏幕收牌。", horseAction: { key: "laugh", text: "红桃 A!", mood: "接龙", screen: "game", emote: "ACE" }, clearAction: { key: "altTab", text: "收起来!", mood: "装忙", screen: "panic", emote: "TAB" } },
      { index: 0, action: "boss", label: "老板", button: "揍他", tone: "danger", text: "最后去柜台揍一下牛老板，打断碎碎念。", horseAction: { key: "panic", text: "老板盯着!", mood: "被盯", screen: "panic", emote: "!" }, clearAction: { key: "wave", text: "舒服了!", mood: "士气回来", screen: "fast", emote: "OK" } }
    ]
  }
];

function activePromptFor(index) {
  const prompt = state.stationPrompts[index];
  if (!prompt || prompt.until <= Date.now()) return null;
  return prompt;
}

function isRelationPrompt(prompt) {
  return Boolean(prompt && (prompt.relationFrom != null || String(prompt.key || "").startsWith("pair-")));
}

function activeRelationPromptCount(now = Date.now()) {
  return state.stationPrompts.filter((prompt) => isRelationPrompt(prompt) && prompt.until > now).length;
}

function promptPoolFor(index, row, status) {
  const mood = state.horseMoods[index] || {};
  const personality = horsePersonalities[index] || {};
  const pool = [];
  if (row?.rank <= 3 && row.tokens > 0) pool.push("sprint", "praise");
  if (status.key === "gaming" || (personality.chaos ?? 0) >= 0.38 || mood.focus <= 38) pool.push("alt");
  if (status.key === "sleep" || mood.stamina <= 28) pool.push("wake", "snack");
  if (mood.stress >= 72) pool.push("break", "snack");
  if (status.key === "working" || status.key === "overdrive") pool.push("debug", "praise");
  if (index === 1 || index === 5) pool.push("debug");
  if (index === 2 || index === 3 || index === 4 || index === 7) pool.push("alt");
  if (index === 8 || index === 9) pool.push("wake");
  const keys = pool.length ? pool : ["debug", "snack", "praise"];
  return keys
    .map((key) => stationPromptDeck.find((item) => item.key === key))
    .filter(Boolean);
}

function startStationPrompt(index = -1, force = false) {
  const now = Date.now();
  if (!force && now < state.nextPromptAt) return false;
  if (!force && activeRelationPromptCount(now) > 0) {
    state.nextPromptAt = now + 2600;
    return false;
  }
  if (state.patrolWave?.until > now || state.patrolClearUntil > now) return false;
  const rows = currentRows();
  const maxTokens = Math.max(...rows.map((row) => row.tokens), 0);
  const candidates = rows
    .map((row, candidateIndex) => ({ row, index: candidateIndex, mood: state.horseMoods[candidateIndex] || {} }))
    .filter(({ row, index: candidateIndex }) => row && row.tokens > 0 && !activeIncidentFor(candidateIndex) && !activePromptFor(candidateIndex));
  if (!candidates.length) {
    state.nextPromptAt = now + 3200;
    return false;
  }
  const picked = index >= 0
    ? candidates.find((item) => item.index === index) || candidates[0]
    : candidates
      .map((item) => {
        const status = statusFor(item.row, maxTokens, item.index);
        const score =
          (item.row.rank <= 3 ? -18 : 0) +
          (status.key === "gaming" ? -16 : 0) +
          (status.key === "sleep" ? -14 : 0) +
          ((item.mood.focus ?? 50) <= 36 ? -12 : 0) +
          ((item.mood.stress ?? 40) >= 70 ? -10 : 0) +
          Math.random() * 24;
        return { ...item, score };
      })
      .sort((a, b) => a.score - b.score)[0];
  const status = statusFor(picked.row, maxTokens, picked.index);
  const pool = promptPoolFor(picked.index, picked.row, status);
  const config = pool[Math.floor(Math.random() * pool.length)] || stationPromptDeck[0];
  const duration = 15500 + Math.floor(Math.random() * 5200);
  state.stationPrompts[picked.index] = {
    ...config,
    startedAt: now,
    until: now + duration,
    handled: false
  };
  state.nextPromptAt = now + 11200 + Math.floor(Math.random() * 5600);
  markStationStory(picked.index, `prompt-${config.key}`, config.label, duration);
  triggerHorseAction(picked.index, config.horseAction, Math.min(duration, 3200));
  setTickerIfFree(`${horsePersonalities[picked.index]?.name || `${picked.index + 1} 号机`} 冒出小任务：${config.text}`, 3000);
  return true;
}

function clearExpiredPrompts() {
  const now = Date.now();
  state.stationPrompts.forEach((prompt, index) => {
    if (!prompt || prompt.until > now) return;
    state.stationPrompts[index] = null;
    adjustHorseMood(index, { stress: 4, trust: -2 });
    adjustHorseStats(index, -2, -3);
    commandPop(index, "MISS", "danger");
    markStationStory(index, "prompt-miss", "MISS", 1400);
  });
}

function completeStationPrompt(index, source = "") {
  const prompt = activePromptFor(index);
  if (!prompt) return false;
  const sourceMatches =
    source === "priority" ||
    (prompt.action === "screen" && source === "screen") ||
    (prompt.action === "horse" && source === "horse") ||
    (prompt.action === "command" && source === prompt.command);
  if (!sourceMatches) return false;
  state.stationPrompts[index] = null;
  state.selectedIndex = index;
  state.stationPulse[index] = Date.now() + 1050;
  state.screenGlitch[index] = Date.now() + 720;
  adjustHorseStats(index, prompt.focus || 0, prompt.stamina || 0);
  adjustHorseMood(index, { stress: prompt.stress || 0, trust: prompt.trust || 0 });
  triggerHorseAction(index, { key: "spark", text: "小任务完成!", mood: "响应成功", screen: "fast", emote: "OK" }, 1600);
  const relationPrompt = isRelationPrompt(prompt);
  commandPop(index, relationPrompt ? "PAIR" : "TASK", prompt.tone === "danger" ? "bonus" : prompt.tone);
  spawnPop(index, `+${prompt.reward || 2}${relationPrompt ? "连锁" : "任务"}`, 1200, -24);
  rewardTicket(relationPrompt ? "关系连锁" : "工位挑战", [`${prompt.label} CLEAR`, `+${prompt.reward || 2} 币`], prompt.tone === "danger" ? "bonus" : prompt.tone, index);
  addCoins(prompt.reward || 2, relationPrompt ? "关系连锁" : "工位挑战", index);
  addHype(relationPrompt ? 12 : 7, relationPrompt ? "关系连锁" : "工位挑战");
  if (relationPrompt && Number.isInteger(prompt.relationFrom)) {
    relationshipPop(prompt.relationFrom, index, String(prompt.key || "").replace("pair-", "") || "help", "接住了");
    rippleHorseReaction(index, { key: "wave", text: "配合上了!", mood: "连锁成功", screen: "fast", emote: "OK" }, 1);
  }
  markStationStory(index, `prompt-clear-${prompt.key}`, "CLEAR", 1700);
  setTicker(`${String(index + 1).padStart(2, "0")} 号机完成小任务：${prompt.label}。`, 2600);
  return true;
}

function activeChainChallenge() {
  const challenge = state.chainChallenge;
  if (!challenge || challenge.until <= Date.now()) return null;
  return challenge;
}

function activeChainTaskFor(index) {
  const challenge = activeChainChallenge();
  if (!challenge) return null;
  return challenge.tasks.find((task) => task.index === index && !task.done) || null;
}

function chainChallengeCandidates(template) {
  const rows = currentRows();
  return template.targets.filter((target) => {
    const row = rows[target.index];
    return row && (row.tokens > 0 || target.index < 5);
  });
}

function startChainChallenge(force = false) {
  const now = Date.now();
  if (!force && now < state.nextChainChallengeAt) return false;
  if (state.patrolWave?.until > now || state.patrolClearUntil > now || activeChainChallenge()) return false;
  const intro = force && !state.introChallengeStarted ? chainChallengeDeck.find((item) => item.key === "intro-tour") : null;
  const shuffled = intro
    ? [intro]
    : chainChallengeDeck
      .map((template) => ({ template, sort: Math.random() }))
      .sort((a, b) => a.sort - b.sort)
      .map(({ template }) => template);
  const template = shuffled.find((item) => chainChallengeCandidates(item).length >= 2);
  if (!template) {
    state.nextChainChallengeAt = now + 9000;
    return false;
  }
  const duration = 30000 + template.targets.length * 2600;
  const tasks = chainChallengeCandidates(template).slice(0, 4).map((target, order) => ({
    ...target,
    id: `${now}-${target.index}-${target.action}`,
    order,
    done: false,
    startedAt: now,
    until: now + duration
  }));
  state.chainChallenge = {
    id: now,
    key: template.key,
    title: template.title,
    text: template.text,
    reward: template.reward || 8,
    fever: Boolean(template.fever),
    startedAt: now,
    until: now + duration,
    tasks,
    misses: 0
  };
  if (force && !state.introChallengeStarted) state.introChallengeStarted = true;
  state.nextChainChallengeAt = now + 46000 + Math.floor(Math.random() * 18000);
  tasks.forEach((task, order) => {
    const delay = order * 220;
    window.setTimeout(() => {
      markStationStory(task.index, `chain-${template.key}`, task.label, duration);
      triggerHorseAction(task.index, task.horseAction, Math.min(duration, 3600));
      if (order > 0) relationshipPop(tasks[0].index, task.index, task.tone === "danger" ? "panic" : task.tone === "sleep" ? "sleepy" : "help");
    }, delay);
  });
  bossSay(template.boss);
  setTicker(`${force ? "开场挑战" : "连锁挑战"}：${template.text}`, 5200);
  rewardTicket(force ? "开场挑战" : "连锁挑战", tasks.map((task) => `${task.button} ${task.label}`).slice(0, 3), "bonus", tasks[0]?.index ?? state.selectedIndex);
  renderEventCard();
  return true;
}

function startIntroChallengeWhenReady(attempt = 0) {
  const readyRows = currentRows().filter((row) => row && row.tokens > 0).length;
  if (readyRows >= 3 && startChainChallenge(true)) return true;
  if (attempt < 8) {
    window.setTimeout(() => startIntroChallengeWhenReady(attempt + 1), 650);
  }
  return false;
}

function finishChainChallenge(reason = "clear") {
  const challenge = state.chainChallenge;
  if (!challenge) return;
  const done = challenge.tasks.filter((task) => task.done).length;
  const total = challenge.tasks.length;
  const success = reason === "clear" && done >= total;
  const focusIndex = challenge.tasks[Math.max(0, done - 1)]?.index ?? state.selectedIndex;
  state.chainChallenge = null;
  state.nextChainChallengeAt = Date.now() + (success ? 42000 : 22000);
  if (success) {
    addCoins(challenge.reward || 8, "连锁挑战", focusIndex);
    addHype(22 + total * 4, "连锁挑战");
    adjustArenaStats(-8, 8);
    rewardTicket("连锁清场", [`${challenge.title} CLEAR`, `+${challenge.reward || 8} 币`], challenge.fever ? "fever" : "bonus", focusIndex);
    if (challenge.fever) triggerFever(challenge.title, focusIndex, 6200);
    rippleHorseReaction(focusIndex, { key: "wave", text: "清场完成!", mood: "节奏回来了", screen: "fast", emote: "OK" }, 2);
    bossSay("这轮清得还行，网吧先稳住。");
    setTicker(`连锁挑战完成：${challenge.title}，${total} 个目标全部处理。`, 4200);
  } else {
    adjustArenaStats(7, -6);
    challenge.tasks.filter((task) => !task.done).forEach((task) => {
      adjustHorseMood(task.index, { stress: 5, trust: -2 });
      markStationStory(task.index, "chain-miss", "MISS", 1800);
      commandPop(task.index, "MISS", "danger");
    });
    bossSay("连锁都能漏，等会儿我再巡一遍。");
    setTicker(`连锁挑战漏掉了：${challenge.title}，下轮会更快。`, 3600);
  }
  renderEventCard();
  render();
}

function clearExpiredChainChallenge() {
  const challenge = state.chainChallenge;
  if (!challenge || challenge.until > Date.now()) return;
  challenge.misses = challenge.tasks.filter((task) => !task.done).length;
  finishChainChallenge("miss");
}

function completeChainTask(index, source = "") {
  const challenge = activeChainChallenge();
  if (!challenge) return false;
  const task = challenge.tasks.find((item) => item.index === index && !item.done && item.action === source);
  if (!task) return false;
  task.done = true;
  state.selectedIndex = index;
  state.stationPulse[index] = Date.now() + 1150;
  state.screenGlitch[index] = Date.now() + 820;
  adjustHorseStats(index, task.tone === "sleep" ? 4 : 8, task.tone === "sleep" ? 12 : -3);
  adjustHorseMood(index, { stress: task.tone === "danger" ? -7 : -4, trust: 4 });
  commandPop(index, "CHAIN", task.tone === "danger" ? "bonus" : task.tone);
  spawnPop(index, `${task.button} OK`, 1300, -24);
  triggerHorseAction(index, task.clearAction || { key: "wave", text: "处理好了!", mood: "回正", screen: "fast", emote: "OK" }, 1500);
  markStationStory(index, `chain-clear-${challenge.key}`, "CHAIN", 1800);
  addCoins(2, "连锁目标", index);
  setTicker(`${String(index + 1).padStart(2, "0")} 号机连锁目标完成：${task.label}`, 2400);
  if (challenge.tasks.every((item) => item.done)) {
    finishChainChallenge("clear");
  } else {
    renderEventCard();
    render();
  }
  return true;
}

function runSceneBeat(beat) {
  const rows = currentRows();
  const liveIndexes = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => row && row.tokens > 0)
    .map(({ index }) => index);
  if (!liveIndexes.length) return false;
  const now = Date.now();
  if (state.sceneCooldown[beat.key] && state.sceneCooldown[beat.key] > now) return false;
  const indexes = beat.pick(rows, liveIndexes);
  if (!indexes.length) return false;
  state.sceneCooldown[beat.key] = now + beat.cooldown;
  state.sceneNextAt = now + 5200 + Math.floor(Math.random() * 6800);
  state.eventTitle = beat.title;
  state.eventText = beat.text;
  state.eventStartedAt = now;
  state.eventUntil = now + beat.duration;
  adjustArenaStats(beat.pressure || 0, beat.order || 0);
  setTicker(beat.text, 3600);
  bossSay(beat.boss);
  indexes.forEach((index, order) => {
    const action = typeof beat.action === "function" ? beat.action(index, order) : beat.action;
    const delay = order * (beat.stagger || 140);
    markStationStory(index, beat.key, beat.label, beat.duration);
    adjustHorseMood(index, { stress: beat.stress || 0, trust: beat.trust || 0 });
    window.setTimeout(() => triggerHorseAction(index, action, beat.actionDuration || 2100), delay);
  });
  if (indexes.length > 1) {
    indexes.slice(1, 4).forEach((target, order) => {
      window.setTimeout(() => relationshipPop(indexes[0], target, beat.relation || "hype"), 260 + order * 160);
    });
  }
  if (beat.after) beat.after(indexes, rows);
  renderEventCard();
  return true;
}

function sceneBeatPool() {
  const pairScenes = pairBeats.map((beat) => ({
    key: beat.key,
    title: beat.title,
    label: beat.label,
    text: beat.text,
    boss: beat.boss,
    duration: 4600,
    cooldown: 21000,
    pressure: beat.pressure || 0,
    order: beat.order || 0,
    stress: beat.stress || 0,
    trust: beat.trust || 0,
    stagger: 180,
    relation: beat.relation,
    pick: () => beat.pair,
    action: (index, order) => order === 0 ? beat.first : beat.second,
    after: (indexes) => {
      markStationStory(indexes[0], beat.key, beat.label, 4600);
      markStationStory(indexes[1], beat.key, beat.label, 4600);
      relationshipPop(indexes[0], indexes[1], beat.relation, relationshipLines[beat.relation]?.[0] || "");
      spawnRelationshipPrompt(indexes[0], indexes[1], beat.relation, beat.second);
    }
  }));
  return [
    ...pairScenes,
    {
      key: "lan",
      title: "邻桌开黑",
      label: "开黑",
      text: "峡谷马一喊集合，旁边几台屏幕开始心虚闪烁。",
      boss: "谁在语音？我在柜台都听见了。",
      duration: 5200,
      cooldown: 18000,
      order: -7,
      stress: -3,
      trust: -4,
      stagger: 160,
      relation: "tease",
      pick: () => [2, 3, 4, 7].filter((index) => currentRows()[index]?.tokens > 0 || index < 5),
      action: (index, order) => order === 0
        ? { key: "combo", text: "中路集合!", mood: "开黑发起", screen: "game", emote: "5V5" }
        : { key: "altTab", text: "被拉进队", mood: "心虚开黑", screen: "panic", emote: "TAB" },
      after: (indexes) => addHype(indexes.length * 4, "邻桌开黑")
    },
    {
      key: "sprint",
      title: "前三冲刺",
      label: "冲榜",
      text: "前三座位的键盘声突然变密，兑换券像在柜台发光。",
      boss: "前三稳住，后面的给我追。",
      duration: 5600,
      cooldown: 16000,
      pressure: 8,
      order: 5,
      stress: 4,
      trust: 2,
      relation: "hype",
      pick: () => [0, 1, 2],
      action: (index) => index === 0
        ? { key: "spark", text: "守住第一!", mood: "冠军冲刺", screen: "fast", emote: "NO.1" }
        : { key: "typing", text: "追前三券!", mood: "追榜", screen: "fast", emote: "UP" }
    },
    {
      key: "sleepy",
      title: "低电传染",
      label: "低电",
      text: "瞌睡马开始点头，后排几匹马也跟着犯困。",
      boss: "困了也别睡，先把这轮跑完。",
      duration: 5200,
      cooldown: 22000,
      pressure: -3,
      order: -5,
      stress: -4,
      trust: -1,
      stagger: 180,
      relation: "sleepy",
      pick: () => [8, 9, 5].filter((index) => index >= 0),
      action: (index, order) => order === 0
        ? { key: "snore", text: "头点三下", mood: "低电", screen: "calm", emote: "Z" }
        : { key: "fish", text: "也想摸鱼", mood: "被传染", screen: "calm", emote: "困" }
    },
    {
      key: "patrol",
      title: "老板巡场",
      label: "巡场",
      text: "牛老板从柜台探头，游戏窗口开始集体缩小。",
      boss: "我数三声，屏幕都给我切回来。",
      duration: 5000,
      cooldown: 17000,
      pressure: 10,
      order: 8,
      stress: 8,
      trust: -2,
      stagger: 90,
      relation: "panic",
      pick: () => [2, 3, 4, 7, 9],
      action: { key: "hide", text: "窗口缩小!", mood: "假忙", screen: "panic", emote: "藏" }
    },
    {
      key: "support",
      title: "隔壁支援",
      label: "支援",
      text: "接口马抓到日志，旁边两台一起帮它看屏幕。",
      boss: "这个可以，出问题先互相救一下。",
      duration: 5000,
      cooldown: 19000,
      pressure: -4,
      order: 4,
      stress: -5,
      trust: 4,
      stagger: 150,
      relation: "help",
      pick: () => [0, 1, 5, 6],
      action: (index, order) => order === 1
        ? { key: "debug", text: "日志在这里", mood: "定位问题", screen: "glitch", emote: "LOG" }
        : { key: "repair", text: "一起救火", mood: "协同", screen: "glitch", emote: "FIX" },
      after: (indexes) => indexes.forEach((index) => adjustHorseStats(index, 5, -2))
    }
  ];
}

function sceneDirector() {
  const now = Date.now();
  if (now < state.introGraceUntil && !state.introChallengeStarted) {
    state.sceneNextAt = now + 1600;
    return;
  }
  if (activeChainChallenge()) {
    state.sceneNextAt = now + 2800;
    return;
  }
  if (startChainChallenge(false)) {
    state.sceneNextAt = now + 6800;
    return;
  }
  if (state.patrolClearUntil > now) {
    state.sceneNextAt = now + 2800;
    return;
  }
  if (state.patrolWave?.until > now) {
    state.sceneNextAt = now + 2800;
    return;
  }
  if (now < state.sceneNextAt) return;
  if (state.bossOrder && state.bossOrder.until > now) {
    state.sceneNextAt = now + 3200;
    return;
  }
  const beats = sceneBeatPool();
  const shuffled = beats
    .map((beat) => ({ beat, sort: Math.random() }))
    .sort((a, b) => a.sort - b.sort)
    .map(({ beat }) => beat);
  const played = shuffled.some((beat) => runSceneBeat(beat));
  if (!played) state.sceneNextAt = now + 4200;
}

function updateVoucherButton(rows = currentRows()) {
  if (!el.voucherClaimButton) return;
  const selected = rows[state.selectedIndex];
  const claimed = claimedVoucherMap();
  const inTop3 = canClaimVoucher(selected);
  const prepared = inTop3 && canIssueVoucher(selected);
  const preparedCount = voucherPreparedCount();
  const claimedCount = voucherClaimedCount(shanghaiDateString(), claimed);
  const pendingIndex = firstPendingVoucherIndex(rows);
  const userClaim = inTop3 ? activeVoucherClaimForUser(claimed.users?.[userClaimKey(selected)]) : null;
  const rankClaim = inTop3 ? activeVoucherClaimForRank(selected.rank, claimed.ranks?.[selected.rank]) : null;
  const userDone = Boolean(userClaim);
  const rankDone = Boolean(rankClaim);
  if (el.voucherReadyCount) {
    el.voucherReadyCount.textContent = `${claimedCount}/3`;
    el.voucherReadyCount.title = `今日已领取 ${claimedCount} 张，已预置 ${preparedCount} 张`;
    el.voucherReadyCount.classList.toggle("missing", preparedCount < 3);
    el.voucherReadyCount.classList.toggle("done", claimedCount >= 3);
  }
  el.voucherClaimButton.disabled = !inTop3 || !prepared || userDone || rankDone;
  if (!inTop3) {
    el.voucherClaimButton.textContent = pendingIndex >= 0 ? `去 #${pendingIndex + 1} 领奖` : "选中前三领取";
    if (el.voucherNote) {
      el.voucherNote.textContent =
        preparedCount < 3
          ? `已放 ${preparedCount}/3 张券，请先在 voucher-config.js 填好每日前三兑换券。`
          : `今日 ${shanghaiDateString()} 前三各可领取 1 张预置兑换券，00:00 刷新。`;
    }
  } else if (!prepared) {
    el.voucherClaimButton.textContent = `#${selected.rank} 待放券`;
    const code = voucherCodes()[selected.rank - 1] || normalizeVoucher(null, selected.rank - 1);
    if (el.voucherNote) el.voucherNote.textContent = `请把 ${code.code} 换成你提前准备好的真实兑换券码。`;
  } else if (userDone) {
    el.voucherClaimButton.textContent = "今日已领取";
    const claim = userClaim;
    if (el.voucherNote) el.voucherNote.textContent = `已领取：${claim?.code || "券码已发出"}${claimTimeLabel(claim?.claimedAt) ? ` · ${claimTimeLabel(claim.claimedAt)}` : ""}`;
  } else if (rankDone) {
    el.voucherClaimButton.textContent = `#${selected.rank} 已发出`;
    const claim = rankClaim;
    if (el.voucherNote) el.voucherNote.textContent = `#${selected.rank} 已发给 ${maskEmail(claim.email)}${claimTimeLabel(claim.claimedAt) ? ` · ${claimTimeLabel(claim.claimedAt)}` : ""}。`;
  } else {
    el.voucherClaimButton.textContent = `领取 #${selected.rank} 每日券`;
    const code = voucherCodes()[selected.rank - 1] || normalizeVoucher(null, selected.rank - 1);
    if (el.voucherNote) el.voucherNote.textContent = `柜台已放票：${code.title}${code.note ? ` · ${code.note}` : ""}`;
  }
}

function claimVoucher(explicitIndex = state.selectedIndex) {
  const rows = currentRows();
  const hasExplicitIndex = Number.isInteger(explicitIndex);
  const targetIndex = hasExplicitIndex ? Math.max(0, Math.min(9, explicitIndex)) : state.selectedIndex;
  const row = rows[targetIndex];
  state.selectedIndex = targetIndex;
  if (!canClaimVoucher(row)) {
    const pendingIndex = firstPendingVoucherIndex(rows);
    if (pendingIndex >= 0 && !hasExplicitIndex) {
      selectStation(pendingIndex, true);
      window.setTimeout(claimVoucher, 80);
      return;
    }
    pulseVoucherBooth("denied");
    toast("先选中今日前三的有效工位。");
    bossSay("不是前三别挤柜台，先把 token 冲上去。");
    return;
  }
  if (!canIssueVoucher(row)) {
    const code = voucherCodes()[row.rank - 1] || normalizeVoucher(null, row.rank - 1);
    pulseVoucherBooth("missing");
    toast(`#${row.rank} 还没配置真实券码。`);
    if (el.voucherNote) el.voucherNote.textContent = `请先把 ${code.code} 换成你提前准备好的兑换券。`;
    bossSay(`#${row.rank} 的券还没放柜台，先别空手套马。`);
    updateVoucherButton(rows);
    return;
  }
  const claimed = claimedVoucherMap();
  const userKey = userClaimKey(row);
  if (activeVoucherClaimForUser(claimed.users?.[userKey])) {
    pulseVoucherBooth("claimed");
    toast("这匹马今天已经领过券。");
    return;
  }
  if (activeVoucherClaimForRank(row.rank, claimed.ranks?.[row.rank])) {
    pulseVoucherBooth("claimed");
    toast(`#${row.rank} 兑换券今天已经发出。`);
    return;
  }
  const code = voucherCodes()[row.rank - 1] || normalizeVoucher(null, row.rank - 1);
  const claim = {
    email: row.email,
    rank: row.rank,
    title: code.title,
    code: code.code,
    note: code.note || "",
    claimedAt: new Date().toISOString()
  };
  claimed.users[userKey] = claim;
  claimed.ranks[row.rank] = { ...claim, userId: row.id };
  saveStore();
  audio.reward();
  triggerHorseAction(targetIndex, { key: "spark", text: "领券成功!" }, 2600);
  rippleHorseReaction(targetIndex, { key: "wave", text: "前三发券!", mood: "围观发券", screen: "fast", emote: "券" }, 1);
  addCoins(6, "前三领券", targetIndex);
  addHype(18, "前三领券");
  adjustArenaStats(-4, 5);
  advanceQuest("voucher");
  pulseVoucherBooth("dispense");
  voucherPop(targetIndex, code);
  rewardTicket("前三兑奖", [`#${row.rank} ${code.title}`, "券码已发出"], "bonus", targetIndex);
  commandPop(targetIndex, "PRIZE", "bonus");
  setTicker(`每日前三兑奖：#${row.rank} ${maskEmail(row.email)} 领取 ${code.title}。`, 4200);
  toast(`#${row.rank} ${maskEmail(row.email)} 已领取 ${code.title}`);
  if (el.voucherNote) el.voucherNote.textContent = `券码：${code.code}${code.note ? ` · ${code.note}` : ""}`;
  bossSay(`${maskEmail(row.email)} 领了 #${row.rank} 券，其他马继续干活。`);
  render();
}

function runSettlement(champion) {
  audio.reward();
  const previousDay = watchedDay || shanghaiDateString();
  const rows = currentRows();
  el.settlementDay.textContent = `DAY ${String(Math.max(1, dayNumber() - 1)).padStart(2, "0")} 结算`;
  el.settlementChampion.textContent =
    champion && champion.tokens > 0
      ? `冠军 ${maskEmail(champion.email)} · ${formatTokens(champion.tokens)} token`
      : "今天无人冲榜，全员安全下机";
  document.getElementById("settlementPrizes")?.remove();
  const list = document.createElement("ol");
  list.id = "settlementPrizes";
  list.className = "settlement-prizes";
  list.innerHTML = settlementPrizeMarkup(rows, previousDay);
  el.settlementChampion.after(list);
  el.settlementOverlay.hidden = false;
  todayBucket();
  state.combo = 0;
  updateDayBadge();
  updateScoreBadge();
}

function updateCountdown() {
  const left = Math.max(0, secondsUntilShanghaiMidnight());
  const hours = Math.floor(left / 3600);
  const minutes = Math.floor((left % 3600) / 60);
  const seconds = left % 60;
  el.hoursLeft.textContent = `${hours}h`;
  el.countdown.textContent = [hours, minutes, seconds].map((part) => String(part).padStart(2, "0")).join(":");

  const today = shanghaiDateString();
  if (watchedDay && today !== watchedDay) {
    runSettlement(state.rows[0]);
  }
  watchedDay = today;
}

function updateMuteButton() {
  if (!el.muteButton) return;
  el.muteButton.textContent = audio.muted ? "OFF" : "SFX";
  el.muteButton.setAttribute("aria-pressed", String(audio.muted));
}

document.addEventListener("click", (event) => {
  const marker = event.target.closest?.(".priority-marker[data-index]");
  if (!marker) return;
  event.preventDefault();
  event.stopPropagation();
  const index = Number(marker.dataset.index || 0);
  runPriorityCommand(index, marker.dataset.command || "");
}, true);

document.addEventListener("click", (event) => {
  const card = event.target.closest?.(".incident-card[data-index]");
  if (!card) return;
  event.preventDefault();
  event.stopPropagation();
  resolveStationIncident(Number(card.dataset.index || 0), "card");
}, true);

el.stationsLayer.addEventListener("click", (event) => {
  const target = event.target.closest("[data-index]");
  if (!target) return;
  const index = Number(target.dataset.index || 0);
  if (target.dataset.action === "incident") {
    resolveStationIncident(index, "card");
    return;
  }
  if (target.dataset.action === "prompt") {
    completeStationPrompt(index, "priority");
    render();
    return;
  }
  if (target.dataset.action === "chain") {
    const task = activeChainTaskFor(index);
    if (task) completeChainTask(index, task.action);
    return;
  }
  if (target.dataset.action === "voucher") {
    selectStation(index);
    claimVoucher(index);
    return;
  }
  if (target.dataset.action === "prop") {
    claimHorseProp(index);
    return;
  }
  if (target.dataset.action === "screen-target") {
    claimScreenTarget(index);
    return;
  }
  if (target.dataset.action === "priority") {
    runPriorityCommand(index, target.dataset.command || "");
    return;
  }
  if (target.dataset.action === "horse") {
    horseTapStation(index);
    return;
  }
  if (target.dataset.action === "screen" || eventHitsScreen(event, index)) {
    screenTapStation(index);
    return;
  }
  if (activeBossOrderFor(index)) {
    runBossOrderCommand(index);
    return;
  }
  if (eventHitsHorse(event, index)) {
    horseTapStation(index);
    return;
  }
  selectStation(index, true);
});

el.topRanking.addEventListener("click", (event) => {
  const row = event.target.closest(".rank-row");
  if (!row) return;
  const index = Number(row.dataset.index || 0);
  selectStation(index, true);
  const rows = currentRows();
  const topRow = rows[index];
  const stateInfo = voucherStateFor(topRow);
  if (stateInfo.key === "ready" || stateInfo.key === "missing" || stateInfo.key === "claimed") {
    claimVoucher(index);
  }
});

el.voucherList?.addEventListener("click", (event) => {
  const row = event.target.closest("li[data-index]");
  if (!row) return;
  const index = Number(row.dataset.index || 0);
  selectStation(index, true);
  claimVoucher(index);
});

document.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") {
    event.preventDefault();
    selectStation(state.selectedIndex + 1);
  }
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
    event.preventDefault();
    selectStation(state.selectedIndex - 1);
  }
  if (event.key === " ") {
    const active = document.activeElement;
    const isButton = active && active.tagName === "BUTTON";
    if (!isButton || active === el.bossCow) {
      event.preventDefault();
      punchBoss();
    }
  }
  if (event.key === "Enter") {
    const active = document.activeElement;
    const isButton = active && active.tagName === "BUTTON";
    if (!isButton) {
      event.preventDefault();
      nudgeStation(state.selectedIndex);
    }
  }
});

el.refreshButton.addEventListener("click", loadRanking);
el.bossCow.addEventListener("click", punchBoss);
el.voucherClaimButton?.addEventListener("click", claimVoucher);
el.voucherBooth?.addEventListener("click", () => {
  bossSay("前三拿票到柜台，券码我锁在抽屉里。");
  claimVoucher();
});

el.ambientLayer?.addEventListener("click", (event) => {
  const button = event.target.closest?.("[data-scene-action]");
  if (!button) return;
  event.preventDefault();
  event.stopPropagation();
  runSceneAction(button.dataset.sceneAction || "");
});

el.targetRadar?.addEventListener("click", () => {
  runRadarTarget();
});

el.quickActions?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-command]");
  if (!button) return;
  runQuickCommand(button.dataset.command);
});

el.selectionHud?.addEventListener("click", (event) => {
  const button = event.target.closest("button[data-command]");
  if (!button) return;
  runQuickCommand(button.dataset.command);
});

el.muteButton?.addEventListener("click", () => {
  audio.muted = !audio.muted;
  store.muted = audio.muted;
  saveStore();
  updateMuteButton();
  if (!audio.muted) audio.select();
});

el.settlementClose?.addEventListener("click", () => {
  el.settlementOverlay.hidden = true;
});

window.addEventListener("pointerdown", () => audio.ensure(), { once: true });

watchedDay = shanghaiDateString();
todayBucket();
updateDayBadge();
updateScoreBadge();
updateMuteButton();
updateCountdown();
renderShift();
renderQuest();

loadRanking();
setTimeout(() => startIntroChallengeWhenReady(), 1200);
setTimeout(() => startPatrolWave(true), 18000);
setTimeout(() => maybeStartBossOrder(true), 54000);
if (usingLiveApi) setInterval(loadRanking, 30000);
setInterval(demoTick, 4200);
setInterval(randomHorseBehavior, 1700);
setInterval(sceneDirector, 1400);
setInterval(decayHorseStats, 7600);
setInterval(tickBossOrder, 1000);
setInterval(() => {
  clearExpiredIncidents();
  clearExpiredChainChallenge();
  startPatrolWave(false);
  renderEventCard();
}, 500);
setTimeout(cycleBossLine, 1200);
setInterval(cycleBossLine, 6200);
setInterval(randomArenaEvent, 12500);
setInterval(() => advanceShiftPhase(false), 28000);
setInterval(() => {
  renderEventCard();
  renderCommandButtons();
  renderSelectionHud();
  renderFever();
}, 250);
