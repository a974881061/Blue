/**
 * 京东洗车 - 位置伪装脚本
 * 修改 jch_hy_queue_precheck 请求中的经纬度，绕过500米限制
 * 
 * 接口说明:
 * - URL: https://api.m.jd.com/jch_hy_queue_precheck
 * - Method: POST
 * - Content-Type: application/x-www-form-urlencoded
 * - 请求体格式: body={"latitude":xxx,"longitude":xxx}&functionId=jch_hy_queue_precheck&appid=M-JDJCH&loginType=2
 *   其中 body 字段的值是 URL 编码的 JSON
 * 
 * BoxJS 配置项:
 * - jd_carwash_latitude  : 目标纬度（默认 31.173500）
 * - jd_carwash_longitude : 目标经度（默认 121.426000）
 * - jd_carwash_notify    : 是否开启通知（true/false，默认 true）
 */

// ========== 默认配置（BoxJS 未配置时使用） ==========
const DEFAULT_LATITUDE = 31.173500;    // 田林东路附近 - 默认纬度
const DEFAULT_LONGITUDE = 121.426000;  // 田林东路附近 - 默认经度
const DEFAULT_NOTIFY = true;            // 默认开启通知

// ========== 读取 BoxJS 配置 ==========
function getPrefs() {
  let latitude = DEFAULT_LATITUDE;
  let longitude = DEFAULT_LONGITUDE;
  let notify = DEFAULT_NOTIFY;
  
  try {
    // Loon 插件参数方式读取（#!argument 定义的参数）
    if (typeof $prefs !== 'undefined') {
      const latVal = $prefs.valueForKey('latitude');
      const lngVal = $prefs.valueForKey('longitude');
      const notifyVal = $prefs.valueForKey('notify');
      
      if (latVal !== undefined && latVal !== null && latVal !== '') {
        latitude = parseFloat(latVal);
      }
      if (lngVal !== undefined && lngVal !== null && lngVal !== '') {
        longitude = parseFloat(lngVal);
      }
      if (notifyVal !== undefined && notifyVal !== null && notifyVal !== '') {
        notify = notifyVal === 'true' || notifyVal === true;
      }
    }
    // 兼容 $persistentStore 方式（BoxJS 兼容）
    else if (typeof $persistentStore !== 'undefined') {
      const latVal = $persistentStore.read('jd_carwash_latitude');
      const lngVal = $persistentStore.read('jd_carwash_longitude');
      const notifyVal = $persistentStore.read('jd_carwash_notify');
      
      if (latVal) latitude = parseFloat(latVal);
      if (lngVal) longitude = parseFloat(lngVal);
      if (notifyVal) notify = notifyVal === 'true';
    }
  } catch (e) {
    console.log('JD Carwash: 读取配置失败，使用默认值 - ' + e.message);
  }
  
  // 校验坐标有效性
  if (isNaN(latitude) || isNaN(longitude)) {
    console.log('JD Carwash: 配置坐标无效，使用默认值');
    latitude = DEFAULT_LATITUDE;
    longitude = DEFAULT_LONGITUDE;
  }
  
  return { latitude, longitude, notify };
}

function main() {
  const prefs = getPrefs();
  const TARGET_LATITUDE = prefs.latitude;
  const TARGET_LONGITUDE = prefs.longitude;
  const ENABLE_NOTIFY = prefs.notify;
  
  const body = $request.body;
  
  if (!body) {
    console.log('JD Carwash: 无请求体，跳过');
    $done({});
    return;
  }
  
  try {
    console.log('JD Carwash: 原始请求体: ' + body.substring(0, 200));
    console.log('JD Carwash: 目标坐标: ' + TARGET_LATITUDE + ', ' + TARGET_LONGITUDE);
    
    // 解析 form-data
    const formData = parseFormData(body);
    
    if (formData.body) {
      // body 字段是 URL 编码的 JSON
      const bodyJsonStr = decodeURIComponent(formData.body);
      const bodyJson = JSON.parse(bodyJsonStr);
      
      const originalLat = bodyJson.latitude;
      const originalLng = bodyJson.longitude;
      
      console.log('JD Carwash: 原始坐标 - lat: ' + originalLat + ', lng: ' + originalLng);
      
      // 修改坐标
      bodyJson.latitude = TARGET_LATITUDE;
      bodyJson.longitude = TARGET_LONGITUDE;
      
      console.log('JD Carwash: 修改后坐标 - lat: ' + bodyJson.latitude + ', lng: ' + bodyJson.longitude);
      
      // 重新编码 body JSON（URL 编码）
      formData.body = encodeURIComponent(JSON.stringify(bodyJson));
      
      // 重新构建 form-data
      const newBody = buildFormData(formData);
      
      console.log('JD Carwash: 新请求体: ' + newBody.substring(0, 200));
      console.log('JD Carwash: 位置伪装成功！');
      
      // 发送通知
      if (ENABLE_NOTIFY) {
        $notification.post(
          '京东洗车',
          '位置伪装成功',
          '原始: ' + originalLat.toFixed(5) + ', ' + originalLng.toFixed(5) + 
          '\n目标: ' + TARGET_LATITUDE + ', ' + TARGET_LONGITUDE
        );
      }
      
      $done({ body: newBody });
    } else {
      console.log('JD Carwash: 未找到 body 字段，跳过');
      $done({});
    }
  } catch (e) {
    console.log('JD Carwash: 处理出错 - ' + e.message);
    console.log('JD Carwash: 错误堆栈 - ' + e.stack);
    $notification.post('京东洗车', '位置伪装失败', e.message);
    $done({});
  }
}

// 解析 application/x-www-form-urlencoded 格式数据
function parseFormData(str) {
  const result = {};
  if (!str) return result;
  
  const pairs = str.split('&');
  for (const pair of pairs) {
    const idx = pair.indexOf('=');
    if (idx > 0) {
      const key = pair.substring(0, idx);
      const value = pair.substring(idx + 1);
      result[key] = value;
    } else if (idx === 0) {
      // 空 key
      result[''] = pair.substring(1);
    }
  }
  return result;
}

// 构建 application/x-www-form-urlencoded 格式数据
function buildFormData(obj) {
  const pairs = [];
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      pairs.push(key + '=' + obj[key]);
    }
  }
  return pairs.join('&');
}

main();
