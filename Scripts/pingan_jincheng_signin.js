/**
 * 平安银行 - 金橙福利社 每日浏览任务（积分浏览）
 *
 * 功能：自动查询任务列表，对未完成的浏览类任务（COUNT_DOWN）逐个执行：
 *       1. 调用 timing/start 开始任务
 *       2. 等待任务时长（默认5秒）
 *       3. 调用 timing/complete 完成任务
 *
 * 任务类型：COUNT_DOWN（浏览类，每个20积分）
 * 频道号：2026061701（金橙日日赚积分）
 *
 * Loon [Script] 配置：
 * cron "0 9 * * *" script-path=pingan_jincheng_signin.js, tag=平安金橙福利社, enabled=true, timeout=180
 */

var $env = (function () {
  var isLoon = typeof $loon !== "undefined";
  var isSurge = typeof $httpClient !== "undefined" && !isLoon;
  var isQX = typeof $task !== "undefined";
  return { isLoon: isLoon, isSurge: isSurge, isQX: isQX, isCli: isLoon || isSurge };
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

var STORE_KEY = "PINGAN_JINCHENG_COOKIE";
var CHANNEL_NUMBER = "2026061701";

var API_BASE = "https://rsb.pingan.com.cn";
var cookie = $persistentStore.read(STORE_KEY) || "";

var results = [];
var totalPoints = 0;

// 通用请求头
function getHeaders() {
  return {
    "Content-Type": "application/x-www-form-urlencoded",
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 MicroMessenger/8.0.50(0x18003231) NetType/WIFI Language/zh_CN",
    "Referer": "https://b.pingan.com.cn/",
    "Cookie": cookie,
    "Accept": "application/json, text/plain, */*"
  };
}

// base64 编码
function b64encode(str) {
  // Loon 环境可能没有 btoa，手动实现
  var chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  var out = "", i = 0, len = str.length;
  while (i < len) {
    var c1 = str.charCodeAt(i++) & 0xff;
    var c2 = i < len ? str.charCodeAt(i++) & 0xff : NaN;
    var c3 = i < len ? str.charCodeAt(i++) & 0xff : NaN;
    
    var b1 = c1 >> 2;
    var b2 = ((c1 & 3) << 4) | (c2 >> 4);
    var b3 = ((c2 & 15) << 2) | (c3 >> 6);
    var b4 = c3 & 63;
    
    if (isNaN(c2)) {
      b3 = b4 = 64;
    } else if (isNaN(c3)) {
      b4 = 64;
    }
    
    out += chars.charAt(b1) + chars.charAt(b2) + chars.charAt(b3) + chars.charAt(b4);
  }
  return out;
}

// 查询任务列表
function queryTasks(callback) {
  var url = API_BASE + "/idata/cust/cmss_biz/cmss/task/channel/queryChannelTasksV4.do?channelNumber=" + CHANNEL_NUMBER;
  
  $httpClient.get({
    url: url,
    headers: getHeaders(),
    timeout: 10000
  }, function (error, response, data) {
    if (error) {
      callback(null, "查询任务列表失败: " + error);
      return;
    }
    try {
      var parsed = JSON.parse(data);
      if (parsed.data && parsed.data.taskList) {
        callback(parsed.data.taskList, null);
      } else {
        callback(null, "任务列表格式异常");
      }
    } catch (e) {
      callback(null, "解析任务列表失败: " + e.message);
    }
  });
}

// 开始任务
function startTask(taskId, callback) {
  var timestamp = Date.now().toString();
  var bodyStr = "channelId=KDAPP0000001&appId=50408&taskId=" + taskId + "&time=5&type=1&timestamp=" + timestamp;
  var body = b64encode(bodyStr);
  
  $httpClient.post({
    url: API_BASE + "/info/brop/cmp/cust/ugc/uc/auth/task/timing/start",
    headers: getHeaders(),
    body: body,
    timeout: 10000
  }, function (error, response, data) {
    if (error) {
      callback(false, "start 请求失败: " + error);
      return;
    }
    try {
      var parsed = JSON.parse(data);
      if (parsed.responseCode === "000000") {
        callback(true, null);
      } else {
        callback(false, "start 失败: " + (parsed.responseMsg || parsed.responseCode));
      }
    } catch (e) {
      callback(false, "start 解析失败: " + e.message);
    }
  });
}

// 完成任务
function completeTask(taskId, callback) {
  var timestamp = Date.now().toString();
  var bodyStr = "channelId=KDAPP0000001&appId=50408&taskId=" + taskId + "&timestamp=" + timestamp;
  var body = b64encode(bodyStr);
  
  $httpClient.post({
    url: API_BASE + "/info/brop/cmp/cust/ugc/uc/auth/task/timing/complete",
    headers: getHeaders(),
    body: body,
    timeout: 10000
  }, function (error, response, data) {
    if (error) {
      callback(false, "complete 请求失败: " + error);
      return;
    }
    try {
      var parsed = JSON.parse(data);
      if (parsed.responseCode === "000000") {
        callback(true, null);
      } else {
        callback(false, "complete 失败: " + (parsed.responseMsg || parsed.responseCode));
      }
    } catch (e) {
      callback(false, "complete 解析失败: " + e.message);
    }
  });
}

// 执行单个浏览任务
function doTask(task, callback) {
  var taskId = task.taskId;
  var taskName = task.taskName || ("任务" + taskId);
  
  console.log("开始任务: " + taskName + " (ID: " + taskId + ")");
  
  // 1. 开始任务
  startTask(taskId, function (success, err) {
    if (!success) {
      results.push(taskName + ": ❌ 开始失败 - " + err);
      callback();
      return;
    }
    
    console.log("任务已开始，等待5秒...");
    
    // 2. 等待 5 秒（任务要求浏览5秒以上，多等1秒保险）
    setTimeout(function () {
      // 3. 完成任务
      completeTask(taskId, function (success2, err2) {
        if (success2) {
          totalPoints += 20;
          results.push(taskName + ": ✅ 完成 (+20积分)");
        } else {
          results.push(taskName + ": ❌ 完成失败 - " + err2);
        }
        callback();
      });
    }, 6000);
  });
}

// 主流程
function main() {
  if (!cookie) {
    notify("平安金橙福利社", "❌ 未配置 Cookie", "请先打开金橙福利社页面自动获取 Cookie");
    finish();
    return;
  }

  console.log("查询任务列表...");
  
  queryTasks(function (taskList, err) {
    if (err) {
      notify("平安金橙福利社", "❌ 查询失败", err);
      finish();
      return;
    }
    
    // 筛选未完成的浏览任务
    var todoTasks = [];
    for (var i = 0; i < taskList.length; i++) {
      var task = taskList[i];
      if (task.taskSource === "COUNT_DOWN" && task.taskStatus !== "COMPLETED") {
        todoTasks.push(task);
      }
    }
    
    console.log("共 " + taskList.length + " 个任务，待完成浏览任务 " + todoTasks.length + " 个");
    
    if (todoTasks.length === 0) {
      // 检查已完成的数量
      var completedCount = 0;
      for (var j = 0; j < taskList.length; j++) {
        if (taskList[j].taskSource === "COUNT_DOWN" && taskList[j].taskStatus === "COMPLETED") {
          completedCount++;
        }
      }
      results.push("所有浏览任务已完成（" + completedCount + " 个）");
      totalPoints = completedCount * 20;
      sendResult();
      return;
    }
    
    // 逐个执行任务
    var current = 0;
    function nextTask() {
      if (current >= todoTasks.length) {
        sendResult();
        return;
      }
      
      doTask(todoTasks[current], function () {
        current++;
        // 间隔 1 秒再做下一个
        setTimeout(nextTask, 1000);
      });
    }
    
    nextTask();
  });
}

// 发送结果通知
function sendResult() {
  var title = "平安金橙福利社";
  var sub = "今日获得 " + totalPoints + " 积分";
  var body = results.join("\n");
  notify(title, sub, body);
  finish();
}

main();
