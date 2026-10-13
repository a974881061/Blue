/*
 * DT生活(ebeck) - 青龙每日签到（零依赖 Node 版，无需 wx_server / 微信 code）
 *
 * cron: 30 9 * * *
 *
 * 环境变量：
 *   dtsh_token   DT生活 token，多账号用 & 或换行分隔，可加 #备注
 *                例： abcdef123456#大号 & uvwxyz789012#小号
 *
 * token 获取方式（Loon，已绕过一次性 wx code）：
 *   打开「DT生活」微信小程序，Loon 插件自动抓取 Authorization Bearer；
 *   手机 Safari 访问 http://dt.local/token 可一键复制当前 token，粘贴到青龙环境变量即可。
 *
 * 失效处理：通知提示 token 过期时，重新打开一次小程序（Loon 自动刷新），再复制更新环境变量。
 */

const https = require("https");

const API_HOST = "ebeikeapi.ebeck.cn";
const API_BASE = "/api/v2";
const APP_VERSION = "251";
const UA =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 " +
  "(KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003231) NetType/WIFI Language/zh_CN";
const REFERER = "https://servicewechat.com/wx51a2021dd921f747/297/page-frame.html";

function api(path, token) {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ version: APP_VERSION, client: "wxmp", token });
    const req = https.request(
      {
        hostname: API_HOST,
        path: API_BASE + path,
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
          Authorization: "Bearer " + token,
          "User-Agent": UA,
          Referer: REFERER,
          Accept: "*/*",
        },
        timeout: 15000,
      },
      (res) => {
        let buf = "";
        res.on("data", (c) => (buf += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(buf));
          } catch (e) {
            reject(new Error(`响应解析失败: ${buf.slice(0, 160)}`));
          }
        });
      }
    );
    req.on("error", reject);
    req.on("timeout", () => req.destroy(new Error("请求超时")));
    req.write(payload);
    req.end();
  });
}

function parseAccounts(raw) {
  return String(raw || "")
    .split(/\n|&/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((item) => {
      const idx = item.indexOf("#");
      return idx >= 0
        ? { token: item.slice(0, idx).trim(), remark: item.slice(idx + 1).trim() }
        : { token: item, remark: "" };
    })
    .filter((a) => a.token);
}

const isAlreadySigned = (msg, code) =>
  code === "sign_401" || /已签|无需重复|已经签过/i.test(String(msg || ""));
const isTokenDead = (msg, code) =>
  Number(code) === 9999 || /登录失败|重新登录|未授权|token|失效/i.test(String(msg || ""));

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function runOne(acc, index) {
  const tag = `账号${index + 1}${acc.remark ? `(${acc.remark})` : ""}`;
  const lines = [];
  try {
    const signRes = await api("/user/userSign", acc.token);
    if (signRes.status === "ok") {
      const d = signRes.data || {};
      lines.push(`✅ ${tag} 签到成功${d.points !== undefined ? `，积分+${d.points}` : ""}${d.sign_num !== undefined ? `，连续${d.sign_num}天` : ""}`);
    } else if (isAlreadySigned(signRes.msg, signRes.code)) {
      lines.push(`✅ ${tag} 今日已签到（${signRes.msg || ""}）`);
    } else if (isTokenDead(signRes.msg, signRes.code)) {
      lines.push(`❌ ${tag} token 已失效（${signRes.msg || signRes.code}），请重新打开小程序抓取后更新 dtsh_token`);
      return { lines, dead: true };
    } else {
      lines.push(`❌ ${tag} 签到失败：${signRes.msg || signRes.code || "未知错误"}`);
    }

    await sleep(800);
    try {
      const ptsRes = await api("/user/userPointsGoldInfo", acc.token);
      if (ptsRes.status === "ok" && ptsRes.data && ptsRes.data.points !== undefined) {
        lines.push(`   当前总积分：${ptsRes.data.points}`);
      }
    } catch (_) {}
  } catch (e) {
    lines.push(`❌ ${tag} 请求异常：${e.message || e}`);
  }
  return { lines, dead: false };
}

async function loadNotify() {
  const candidates = ["./sendNotify", "../sendNotify", "../../sendNotify"];
  for (const p of candidates) {
    try {
      const mod = require(p);
      if (mod && typeof mod.sendNotify === "function") return mod.sendNotify;
    } catch (_) {}
  }
  return null;
}

!(async () => {
  const accounts = parseAccounts(process.env.dtsh_token);
  const summary = ["## DT生活签到 " + new Date().toLocaleDateString("zh-CN"), ""];

  if (!accounts.length) {
    summary.push("未配置环境变量 dtsh_token");
    const text = summary.join("\n");
    console.log(text);
    const notify = await loadNotify();
    if (notify) await notify("DT生活签到", "未配置 dtsh_token");
    return;
  }

  let deadCount = 0;
  for (let i = 0; i < accounts.length; i++) {
    const { lines, dead } = await runOne(accounts[i], i);
    if (dead) deadCount++;
    summary.push(...lines, "");
    if (i < accounts.length - 1) await sleep(1500);
  }

  const text = summary.join("\n");
  console.log(text);
  const notify = await loadNotify();
  if (notify) {
    await notify(
      `DT生活签到 ${deadCount ? "（" + deadCount + "个token失效）" : ""}`,
      summary.slice(2).join("\n")
    );
  }
})();
