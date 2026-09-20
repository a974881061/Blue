/**
 * i百联 - 每日签到 + 积分任务（多账号版）
 *
 * 功能：
 *   1. 每日签到赚积分（连续签到递增，7天档最高 5 积分）
 *   2. 自动完成所有浏览类积分任务（每周刷新，每个任务 2 积分）
 *   账号1 由 GetToken 脚本自动抓取，其他账号在 BoxJS 手动填写凭证 JSON。
 *   Token 为非 JWT 格式，无法检测过期；签到失败提示凭证无效时，重新打开 App 触发抓取即可。
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=ibailian_signin.js, tag=i百联签到, enabled=true, timeout=60
 *
 * BoxJS 可配置项：
 * - IBL_AccountCount  账号数量（默认 1）
 * - IBL_Creds_1       账号1 凭证 JSON（自动抓取，含 membertoken/devicekey/smDeviceid）
 * - IBL_Creds_2       账号2 凭证 JSON（手动填写）
 * - IBL_Creds_3       账号3 凭证 JSON（手动填写）
 */
const $env = (function () {
  const isLoon = typeof $loon !== "undefined";
  const isSurge = typeof $httpClient !== "undefined" && !isLoon;
  const isQX = typeof $task !== "undefined";
  return { isLoon, isSurge, isQX, isCli: isLoon || isSurge };
})();

function notify(title, sub, body) {
  if ($env.isQX && typeof $notify === "function") {
    $notify(title, sub, body);
  } else if (typeof $notification !== "undefined" && $notification.post) {
    $notification.post(title, sub, body);
  } else if (typeof $notify === "function") {
    $notify(title, sub, body);
  }
}

function finish() { $done(); }

// === 工具：Base64 ===
function b64encode(str) {
  // 兼容 Loon/Surge 环境
  if (typeof $base64 !== "undefined" && $base64.encode) {
    return $base64.encode(str);
  }
  if (typeof btoa === "function") {
    return btoa(unescape(encodeURIComponent(str)));
  }
  // 手写简易 base64（兜底）
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var result = "";
  var bytes = utf8Encode(str);
  var i = 0;
  while (i < bytes.length) {
    var b1 = bytes[i++];
    var b2 = bytes[i++];
    var b3 = bytes[i++];
    result += chars.charAt(b1 >> 2);
    result += chars.charAt(((b1 & 3) << 4) | (b2 >> 4));
    result += isNaN(b2) ? "=" : chars.charAt(((b2 & 15) << 2) | (b3 >> 6));
    result += isNaN(b3) ? "=" : chars.charAt(b3 & 63);
  }
  return result;
}

function b64decode(str) {
  if (typeof $base64 !== "undefined" && $base64.decode) {
    return $base64.decode(str);
  }
  if (typeof atob === "function") {
    return decodeURIComponent(escape(atob(str)));
  }
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var result = "";
  var bytes = [];
  str = String(str).replace(/\s/g, "").replace(/=+$/, "");
  var i = 0;
  while (i < str.length) {
    var c1 = chars.indexOf(str.charAt(i++));
    var c2 = chars.indexOf(str.charAt(i++));
    var c3 = chars.indexOf(str.charAt(i++));
    var c4 = chars.indexOf(str.charAt(i++));
    var b1 = (c1 << 2) | (c2 >> 4);
    var b2 = ((c2 & 15) << 4) | (c3 >> 2);
    var b3 = ((c3 & 3) << 6) | c4;
    bytes.push(b1);
    if (c3 !== -1) bytes.push(b2);
    if (c4 !== -1) bytes.push(b3);
  }
  return utf8Decode(bytes);
}

function utf8Encode(str) {
  var bytes = [];
  for (var i = 0; i < str.length; i++) {
    var code = str.charCodeAt(i);
    if (code < 0x80) {
      bytes.push(code);
    } else if (code < 0x800) {
      bytes.push(0xc0 | (code >> 6));
      bytes.push(0x80 | (code & 0x3f));
    } else if (code < 0xd800 || code >= 0xe000) {
      bytes.push(0xe0 | (code >> 12));
      bytes.push(0x80 | ((code >> 6) & 0x3f));
      bytes.push(0x80 | (code & 0x3f));
    } else {
      i++;
      var code2 = str.charCodeAt(i);
      var cp = 0x10000 + (((code & 0x3ff) << 10) | (code2 & 0x3ff));
      bytes.push(0xf0 | (cp >> 18));
      bytes.push(0x80 | ((cp >> 12) & 0x3f));
      bytes.push(0x80 | ((cp >> 6) & 0x3f));
      bytes.push(0x80 | (cp & 0x3f));
    }
  }
  return bytes;
}

function utf8Decode(bytes) {
  var str = "";
  var i = 0;
  while (i < bytes.length) {
    var b = bytes[i++];
    var code;
    if (b < 0x80) {
      code = b;
    } else if (b < 0xe0) {
      code = ((b & 0x1f) << 6) | (bytes[i++] & 0x3f);
    } else if (b < 0xf0) {
      code = ((b & 0x0f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
    } else {
      code = ((b & 0x07) << 18) | ((bytes[i++] & 0x3f) << 12) | ((bytes[i++] & 0x3f) << 6) | (bytes[i++] & 0x3f);
      code -= 0x10000;
      str += String.fromCharCode(0xd800 + (code >> 10));
      code = 0xdc00 + (code & 0x3ff);
    }
    str += String.fromCharCode(code);
  }
  return str;
}

// === 解析响应（可能是 base64 编码，也可能是明文 JSON） ===
function parseResponse(text) {
  var data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    // 尝试 base64 解码
    try {
      var decoded = b64decode(text);
      data = JSON.parse(decoded);
    } catch (e2) {
      return null;
    }
  }
  // 二次解析 obj 字段
  if (data && data.obj && typeof data.obj === "string") {
    try {
      data._obj = JSON.parse(data.obj);
    } catch (e) {
      data._obj = {};
    }
  }
  return data;
}

// === 配置 ===
var accountCount = parseInt($persistentStore.read("IBL_AccountCount")) || 1;

// === 结果汇总 ===
var results = [];
var totalPoints = 0;

// === 构建请求头 ===
function buildHeaders(creds, host) {
  var h = {
    "content-type": "application/json",
    "channelid": "1",
    "chnflg": "app-h5",
    "membertoken": creds.membertoken,
    "origin": "https://mh5.bl.com",
    "referer": "https://mh5.bl.com/bl-front-end/pages/mypoints/myPoints?hidebar=true&blappversion=9.20.0",
    "Accept-Encoding": "gzip,compress,br,deflate",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 18_7 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 djAppVersion=9.20.0 iBailian",
  };
  if (creds.devicekey) h["devicekey"] = creds.devicekey;
  if (creds.smDeviceid) h["sm-deviceid"] = creds.smDeviceid;
  return h;
}

// === 1. 每日签到 ===
function doSignIn(creds, callback) {
  var url = "https://mh5.bl.com/h5_gateway/signIn/submitSignInv2.htm";
  var body = '{"channelId":1,"buId":"3000","shopId":"-1"}';
  var headers = buildHeaders(creds);

  $httpClient.post({
    url: url,
    timeout: 8000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      callback("签到请求异常 - " + errormsg, 0);
      return;
    }
    var parsed = parseResponse(data);
    if (!parsed) {
      callback("签到响应解析失败", 0);
      return;
    }
    if (parsed.resCode === "00100000") {
      var obj = parsed._obj || {};
      if (obj.signStatus === "1") {
        callback("今日已签到", 0);
      } else {
        var pts = parseInt(obj.signPoint) || 0;
        callback("签到成功 +" + pts + "积分（连续" + (obj.keepDays || "?") + "天）", pts);
      }
    } else {
      var inner = parsed._obj || {};
      var msg = inner.errMsg || parsed.errMsg || parsed.msg || ("resCode " + parsed.resCode);
      callback("签到失败: " + msg, 0);
    }
  });
}

// === 2. 获取任务列表 ===
function getTaskList(creds, callback) {
  var url = "https://mh5.bl.com/h5_gateway/signIn/getTaskListv2.htm";
  // 请求体是 base64 编码的 {}
  var body = b64encode("{}");
  var headers = buildHeaders(creds);
  // content-type 保持 application/json，请求体是 base64 编码的 JSON 字符串

  $httpClient.post({
    url: url,
    timeout: 8000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      callback("获取任务列表失败 - " + errormsg, []);
      return;
    }
    var parsed = parseResponse(data);
    if (!parsed) {
      callback("获取任务列表失败：响应解析失败", []);
      return;
    }
    if (parsed.resCode !== "00100000") {
      var errMsg = parsed.msg || parsed.errMsg || ("错误码 " + parsed.resCode);
      callback("获取任务列表失败：" + errMsg, []);
      return;
    }
    var obj = parsed._obj || {};
    var tasks = obj.pointTaskList || [];
    callback(null, tasks);
  });
}

// === 3. 完成单个任务 ===
function doTask(creds, task, callback) {
  var url = "https://mh5.bl.com/h5_gateway/jkTask/addTaskv2.htm";
  var bodyObj = {
    actId: task.taskCode,
    taskCode: task.taskCode,
    taskId: String(task.taskId || "14"),
    memberToken: creds.membertoken
  };
  var body = b64encode(JSON.stringify(bodyObj));
  var headers = buildHeaders(creds);
  // content-type 保持 application/json，请求体是 base64 编码的 JSON 字符串

  $httpClient.post({
    url: url,
    timeout: 8000,
    headers: headers,
    body: body
  }, function (errormsg, response, data) {
    if (errormsg) {
      callback(false, "请求失败 - " + errormsg);
      return;
    }
    var parsed = parseResponse(data);
    if (!parsed) {
      callback(false, "响应解析失败");
      return;
    }
    if (parsed.resCode === "00100000") {
      callback(true, "完成 +" + (task.pointValues || "?") + "积分");
    } else {
      var inner = parsed._obj || {};
      var msg = inner.errMsg || parsed.errMsg || ("resCode " + parsed.resCode);
      callback(false, msg);
    }
  });
}

// === 4. 做所有未完成的任务 ===
function doAllTasks(creds, callback) {
  getTaskList(creds, function (err, tasks) {
    if (err) {
      callback(err, 0, 0);
      return;
    }

    // 筛选未完成的任务（buttonText !== "已完成"）
    var todo = [];
    var done = [];
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      if (t.buttonText === "已完成") {
        done.push(t);
      } else {
        todo.push(t);
      }
    }

    if (todo.length === 0) {
      callback("任务：已完成 " + done.length + "/" + tasks.length + "（无待做任务）", 0, tasks.length);
      return;
    }

    var taskPoints = 0;
    var taskDone = 0;
    var taskFail = 0;
    var details = [];

    function processTask(idx) {
      if (idx >= todo.length) {
        var summary = "任务：完成" + taskDone + "个 失败" + taskFail + "个 共+" + taskPoints + "积分";
        callback(summary, taskPoints, tasks.length);
        return;
      }

      var task = todo[idx];
      doTask(creds, task, function (ok, msg) {
        if (ok) {
          taskDone++;
          taskPoints += parseInt(task.pointValues) || 0;
          details.push("✅ " + task.taskName + " " + msg);
        } else {
          taskFail++;
          details.push("❌ " + task.taskName + " " + msg);
        }
        processTask(idx + 1);
      });
    }

    processTask(0);
  });
}

// === 单账号完整流程 ===
function processAccount(index, callback) {
  var storeKey = "IBL_Creds_" + index;
  var raw = $persistentStore.read(storeKey);
  var label = "账号" + index;

  if (!raw) {
    results.push(label + ": 未配置凭证");
    callback();
    return;
  }

  var creds;
  try {
    creds = JSON.parse(raw);
  } catch (e) {
    results.push(label + ": 凭证格式错误");
    callback();
    return;
  }

  if (!creds.membertoken) {
    results.push(label + ": 缺少 membertoken");
    callback();
    return;
  }

  var accountPoints = 0;
  var lines = [];

  // 步骤1：签到
  doSignIn(creds, function (signMsg, signPts) {
    accountPoints += signPts;
    lines.push(signMsg);

    // 步骤2：做任务
    doAllTasks(creds, function (taskMsg, taskPts, total) {
      accountPoints += taskPts;
      lines.push(taskMsg);
      totalPoints += accountPoints;

      var prefix = label + "(" + accountPoints + "积分): ";
      results.push(prefix + lines.join(" | "));
      callback();
    });
  });
}

// === 顺序执行所有账号 ===
var currentIndex = 1;
function processNext() {
  if (currentIndex > accountCount) {
    var summary = results.join("\n");
    var sub = "共 " + accountCount + " 个账号，总计 +" + totalPoints + " 积分";
    notify("i百联签到+任务", sub, summary);
    finish();
    return;
  }
  processAccount(currentIndex, function () {
    currentIndex++;
    processNext();
  });
}
processNext();
