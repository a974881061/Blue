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
 * 配置项（Loon 插件参数 / BoxJS）:
 * - storeName : 门店名称（从预设列表中选择，留空则使用自定义坐标）
 * - latitude  : 自定义纬度（优先级高于门店名称）
 * - longitude : 自定义经度（优先级高于门店名称）
 * - notify    : 是否开启通知（true/false，默认 true）
 */

// ========== 预设门店列表（按距离排序，上海地区） ==========
// 格式: "门店名称": [纬度, 经度]
// 数据来源: svc_api_getStoreList 接口（共86家，此处为前22家）
// 如需新增门店，在下方添加即可，或使用自定义坐标
const STORE_LIST = {
  // ===== 徐汇区附近（5km内）=====
  '田林东路店': [31.172779, 121.426992],      // 田林东路403号
  '古北路店': [31.187012, 121.403246],        // 古北路1799号
  '老沪闵路店': [31.133981, 121.433947],      // 老沪闵路871号(罗秀路地铁站3号口)
  '龙茗路店': [31.14955, 121.38301],          // 龙茗路1599-1601号
  '罗锦路店': [31.123429, 121.418098],        // 罗锦路85-3号(全季酒店西北)
  '报春路店': [31.125551, 121.392134],        // 报春路185号
  // ===== 闵行区（5-10km）=====
  '黄桦路店': [31.184784, 121.365994],        // 黄桦路438号
  '双流路店': [31.21118, 121.380158],          // 双流路8号(茅台路)
  '春申路大润发店': [31.108035, 121.40783],    // 春申路2801号
  '七莘路店': [31.142441, 121.360382],        // 中谊路518号七宝夜市
  '涞亭南路店': [31.143979, 121.331942],      // 涞亭南路89号虹桥启赋城15栋
  // ===== 普陀/长宁区（10km内）=====
  '建德花园店': [31.23385, 121.36309],        // 棕榈路50-52号
  // ===== 浦东/虹口（10-15km）=====
  '三鲁公路店': [31.117525, 121.509301],      // 三鲁路5565号2幢
  '九亭大街店': [31.122151, 121.322343],      // 九新公路377号
  '涞坊路店': [31.15115, 121.31133],          // 涞坊路607号
  '东方路店': [31.217046, 121.531036],        // 东方路1243号
  '东宝兴路店': [31.260832, 121.478119],      // 中兴路122-124号底座
  '瑞虹新城店': [31.265123, 121.502915],      // 虹口区三河路402号
  // ===== 远郊（15km+）=====
  '周浦小上海步行街店': [31.119293, 121.579243], // 浦东新区周浦镇川周公路4375号
  '徐泾明珠路店': [31.189576, 121.262358],    // 明珠路980号5-1楼
  '泗泾地铁站店': [31.116111, 121.262133],    // 横港路车享家汽车养护中心
  '上海财经大学店': [31.309404, 121.498009],  // 政青路69弄一层1-2-3
};

// ========== 默认配置 ==========
const DEFAULT_STORE = '田林东路店';    // 默认门店
const DEFAULT_LATITUDE = 31.172779;    // 默认纬度（田林东路店精确坐标）
const DEFAULT_LONGITUDE = 121.426992;  // 默认经度（田林东路店精确坐标）
const DEFAULT_NOTIFY = true;            // 默认开启通知

// ========== 读取配置 ==========
function getPrefs() {
  let storeName = DEFAULT_STORE;
  let latitude = DEFAULT_LATITUDE;
  let longitude = DEFAULT_LONGITUDE;
  let notify = DEFAULT_NOTIFY;
  
  try {
    // Loon 插件参数方式读取（#!argument 定义的参数）
    if (typeof $prefs !== 'undefined') {
      const storeVal = $prefs.valueForKey('storeName');
      const latVal = $prefs.valueForKey('latitude');
      const lngVal = $prefs.valueForKey('longitude');
      const notifyVal = $prefs.valueForKey('notify');
      
      if (storeVal !== undefined && storeVal !== null && storeVal !== '') {
        storeName = storeVal;
      }
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
      const storeVal = $persistentStore.read('jd_carwash_storeName');
      const latVal = $persistentStore.read('jd_carwash_latitude');
      const lngVal = $persistentStore.read('jd_carwash_longitude');
      const notifyVal = $persistentStore.read('jd_carwash_notify');
      
      if (storeVal) storeName = storeVal;
      if (latVal) latitude = parseFloat(latVal);
      if (lngVal) longitude = parseFloat(lngVal);
      if (notifyVal) notify = notifyVal === 'true';
    }
  } catch (e) {
    console.log('JD Carwash: 读取配置失败，使用默认值 - ' + e.message);
  }
  
  // 优先使用自定义坐标（如果设置了有效的经纬度）
  const customLatValid = !isNaN(latitude) && latitude !== DEFAULT_LATITUDE;
  const customLngValid = !isNaN(longitude) && longitude !== DEFAULT_LONGITUDE;
  
  let finalLat = latitude;
  let finalLng = longitude;
  let finalStore = storeName;
  
  // 如果自定义坐标无效或为默认值，尝试从门店列表获取
  if (!customLatValid && !customLngValid && storeName && STORE_LIST[storeName]) {
    finalLat = STORE_LIST[storeName][0];
    finalLng = STORE_LIST[storeName][1];
    finalStore = storeName;
  }
  
  // 校验坐标有效性
  if (isNaN(finalLat) || isNaN(finalLng)) {
    console.log('JD Carwash: 配置坐标无效，使用默认值');
    finalLat = DEFAULT_LATITUDE;
    finalLng = DEFAULT_LONGITUDE;
    finalStore = DEFAULT_STORE;
  }
  
  return { 
    latitude: finalLat, 
    longitude: finalLng, 
    storeName: finalStore,
    notify: notify 
  };
}

// ========== 获取门店列表描述（用于通知） ==========
function getStoreListText() {
  const stores = Object.keys(STORE_LIST);
  if (stores.length === 0) return '（无预设门店）';
  return stores.join('、');
}

function main() {
  const prefs = getPrefs();
  const TARGET_LATITUDE = prefs.latitude;
  const TARGET_LONGITUDE = prefs.longitude;
  const STORE_NAME = prefs.storeName;
  const ENABLE_NOTIFY = prefs.notify;
  
  const body = $request.body;
  
  if (!body) {
    console.log('JD Carwash: 无请求体，跳过');
    $done({});
    return;
  }
  
  try {
    console.log('JD Carwash: 原始请求体: ' + body.substring(0, 200));
    console.log('JD Carwash: 当前门店: ' + STORE_NAME);
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
          '位置伪装成功 - ' + STORE_NAME,
          '原始: ' + originalLat.toFixed(5) + ', ' + originalLng.toFixed(5) + 
          '\n目标: ' + TARGET_LATITUDE + ', ' + TARGET_LONGITUDE +
          '\n\n预设门店: ' + getStoreListText()
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
