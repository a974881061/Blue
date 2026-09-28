const CONFIG = {
  group: "Zuanke8",
  companyWifi: ["Yanfeng-personal-device"],
  onCompany: "香港时延优选",
  offCompany: "DIRECT",
  notify: true,
};

(() => {
  const raw = $config.getConfig();
  const cfg = typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
  const ssid = (cfg.ssid || "").trim();
  if ((cfg.all_policy_groups || []).indexOf(CONFIG.group) < 0) {
    if (CONFIG.notify)
      $notification.post(
        `${CONFIG.group} 切换脚本未生效`,
        `配置里找不到策略组：${CONFIG.group}`,
        "请检查脚本 CONFIG.group 与 [Proxy Group] 的组名是否完全一致"
      );
    return $done();
  }
  const isCompany = CONFIG.companyWifi.some(
    (n) => n.trim().toLowerCase() === ssid.toLowerCase()
  );
  const target = isCompany ? CONFIG.onCompany : CONFIG.offCompany;
  const current =
    $config.getSelectedPolicy(CONFIG.group) ||
    (cfg.policy_select || {})[CONFIG.group];
  if (current === target) return $done();
  $config.setSelectPolicy(CONFIG.group, target);
  if (CONFIG.notify)
    $notification.post(
      `${CONFIG.group} → ${target}`,
      ssid ? `当前 WiFi：${ssid}` : "当前为蜂窝网络",
      isCompany
        ? "公司网络会拦截目标域名，已改走代理"
        : "非公司网络无需绕路，已改回直连"
    );
  $done();
})();
