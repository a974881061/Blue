const CONFIG = {
  group: "赚客8通道",
  companyWifi: ["Yanfeng-persional-device"],
  onCompany: "香港时延优选",
  offCompany: "DIRECT",
  notify: true,
};

(() => {
  const raw = $config.getConfig();
  const cfg = typeof raw === "string" ? JSON.parse(raw || "{}") : raw || {};
  const ssid = (cfg.ssid || "").trim();
  const isCompany = CONFIG.companyWifi.some(
    (n) => n.trim().toLowerCase() === ssid.toLowerCase()
  );
  const target = isCompany ? CONFIG.onCompany : CONFIG.offCompany;
  const current = (cfg.policy_select || {})[CONFIG.group];
  if (current !== target) $config.setSelectPolicy(CONFIG.group, target);
  if (CONFIG.notify && current !== target)
    $notification.post(
      `${CONFIG.group} → ${target}`,
      ssid ? `当前 WiFi：${ssid}` : "当前为蜂窝网络",
      isCompany
        ? "公司网络会拦截目标域名，已改走代理"
        : "非公司网络无需绕路，已改回直连"
    );
  $done();
})();
