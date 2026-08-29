import type { HorseMode } from "../types";

type PhraseParts = {
  leads: readonly string[];
  actions: readonly string[];
  tails: readonly string[];
};

const PARTS: Record<HorseMode, PhraseParts> = {
  working: {
    leads: [
      "进度条还在跑",
      "接口刚刚连上",
      "日志开始说人话",
      "模型终于回消息",
      "缓存这周很配合",
      "任务队列排整齐",
      "这次真的没报错",
      "参数已经对齐",
      "脚本正在收尾",
      "需求我都记住了",
    ],
    actions: [
      "我在盯着调用",
      "先把重试关掉",
      "马上提交结果",
      "再校一次账单",
      "顺手补个监控",
      "正在清理上下文",
      "先压住延迟",
      "等上游回个包",
      "把最后一行写完",
      "再跑一次测试",
    ],
    tails: [
      "，五分钟交差",
      "，老板先别刷新",
      "，这周能准点走",
      "，这版肯定稳定",
      "，排名还能再冲",
    ],
  },
  overdrive: {
    leads: [
      "红灯已经全亮",
      "键盘按出残影",
      "并发正在起飞",
      "请求像雪片一样",
      "队列马上清空",
      "周榜榜首在招手",
      "CPU 开始发烫",
      "风扇已经拉满",
      "最后一波冲刺",
      "所有窗口都在跑",
    ],
    actions: [
      "我把限速顶开",
      "先接住这一波",
      "继续盯住错误率",
      "再开一组并发",
      "把超时往回压",
      "正在追赶榜一",
      "先别碰电源",
      "让缓存再扛一轮",
      "把吞吐拉上去",
      "这周必须清零",
    ],
    tails: [
      "，谁都别下班",
      "，榜一马上换人",
      "，咖啡续上就行",
      "，老板别站背后",
      "，这一轮能赢",
    ],
  },
  gaming: {
    leads: [
      "窗口已经切好了",
      "耳机只是降噪用的",
      "这一把刚好开局",
      "鼠标正在热身",
      "队友突然喊我",
      "显卡需要做体检",
      "午休还有三分钟",
      "老板脚步声很远",
      "屏幕亮度刚刚好",
      "测试账号已上线",
    ],
    actions: [
      "我在测试显卡",
      "顺便测下延迟",
      "马上就切回代码",
      "这局结束就干活",
      "先验证一下手速",
      "正在观察帧率",
      "帮同事排查掉线",
      "再看一眼战绩",
      "只打最后一回合",
      "老板来就按切屏",
    ],
    tails: [
      "，这也算压测",
      "，绝对不是摸鱼",
      "，两分钟就结束",
      "，工单没有超时",
      "，声音已经关了",
    ],
  },
  sleep: {
    leads: [
      "眼睛只是省电",
      "脑子正在编译",
      "呼吸进入低功耗",
      "工位临时待机",
      "灵感正在加载",
      "接口还没回包",
      "午休刚刚开始",
      "显示器先醒着",
      "意识切到后台",
      "我在监听错误",
    ],
    actions: [
      "等日志自己长大",
      "让缓存安静一会",
      "闭眼看下架构",
      "先做五分钟冥想",
      "等待上游修复",
      "把任务挂在后台",
      "用梦排查问题",
      "等老板走远一点",
      "正在恢复精力",
      "稍后自动重连",
    ],
    tails: [
      "，叫我记得轻点",
      "，报警会把我叫醒",
      "，这不算离线",
      "，醒来立刻提交",
      "，系统一切正常",
    ],
  },
};

const pools = Object.fromEntries(
  Object.entries(PARTS).map(([mode, parts]) => [
    mode,
    parts.leads.flatMap((lead) =>
      parts.actions.flatMap((action) => parts.tails.map((tail) => `${lead}，${action}${tail}`)),
    ),
  ]),
) as Record<HorseMode, string[]>;

export const WORKER_PHRASE_COUNT = Object.values(pools).reduce(
  (total, phrases) => total + phrases.length,
  0,
);

export function randomWorkerPhrase(
  mode: HorseMode,
  previous = "",
  random: () => number = Math.random,
): string {
  const phrases = pools[mode];
  let index = Math.floor(random() * phrases.length) % phrases.length;
  if (phrases[index] === previous) index = (index + 1) % phrases.length;
  return phrases[index];
}
