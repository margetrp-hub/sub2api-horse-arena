# SUB2API Horse Arcade

像素小游戏风格的 token 消耗排行原型。页面读取 SUB2API 用户排行，把用户映射成 10 台网吧电脑前的小马，并带有老板、任务、屏幕动画和每日前三兑换券。

## 打开方式

本地服务地址：

```text
http://127.0.0.1:8765/index.html
```

也可以直接打开：

```text
D:\wiki\output\sub2api-horse-arena\index.html
```

## 每日前三兑换券

提前把真实券码写到 `voucher-config.js`。默认的 `TOP1-READY` / `TOP2-READY` / `TOP3-READY` 只是占位，不会被发出；填好真实兑换券后，当日 token 排名前三才可以领取。每个名次每天只能发一次，每个用户每天也只能领一次。日期按上海时间刷新。

```js
window.SUB2API_VOUCHERS = {
  default: [
    { title: "冠军兑换券", code: "TOP1-READY", note: "每日第 1 名" },
    { title: "亚军兑换券", code: "TOP2-READY", note: "每日第 2 名" },
    { title: "季军兑换券", code: "TOP3-READY", note: "每日第 3 名" }
  ],
  dates: {
    "2026-06-27": {
      rank1: { title: "冠军兑换券", code: "REAL-CODE-001", note: "当天冠军专属" },
      rank2: { title: "亚军兑换券", code: "REAL-CODE-002", note: "当天亚军专属" },
      rank3: { title: "季军兑换券", code: "REAL-CODE-003", note: "当天季军专属" }
    }
  }
};
```

支持数组，也支持 `rank1`、`top1`、`#1` 这类名次键。

## 接真实 SUB2API 数据

页面默认请求：

```text
/api/v1/admin/dashboard/users-ranking
```

在 `index.html` 引入 `app.js` 之前注入配置即可：

```html
<script>
  window.SUB2API_BASE_URL = "https://your-sub2api.example.com";
  window.SUB2API_ADMIN_TOKEN = "admin jwt";
  window.SUB2API_MY_USER_ID = 155;
</script>
```

请求参数：

```text
start_date=今天
end_date=今天
limit=10
Authorization: Bearer <admin token>
```

token 计算优先使用 `input_tokens + output_tokens`，否则使用接口返回的 `tokens` 或 `total_tokens` 字段。
