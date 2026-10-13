// 番茄小说 banner 调试脚本（临时用，抓到接口后换回正式版）
// v2 修复（2026-10-13）：*.fqnovel.com 只记录日志、绝不改写响应体。
//   原因：评论接口也在 fqnovel.com 下，之前改写响应导致评论区网络错误。
// *.fanqienovel.com 保持原有去广告逻辑不变。

const url = $request.url || "";

// ---- 调试：找 banner / 运营位痕迹（所有经过的域名都记，只读不写） ----
try {
  var b0 = $response.body;
  if (b0 && typeof b0 === "string") {
    var m = b0.match(/banner|运营|征文|float|悬浮|bottom_ad|底部横幅|operation/i);
    if (m) {
      console.log("[FANQIE_BANNER] URL=" + url);
      var idx = b0.search(/banner|运营|征文|float|悬浮|bottom_ad|底部横幅|operation/i);
      var snippet = b0.slice(Math.max(0, idx - 150), idx + 400);
      console.log("[FANQIE_BANNER] HIT=" + m[0] + " SNIPPET=" + snippet.slice(0, 500));
    }
  }
} catch (e) {}

// ---- 去广告：只对 fanqienovel.com 生效；其他域名（fqnovel.com 等）原样放行 ----
if (!/fanqienovel\.com/i.test(url)) {
  $done({});
}

let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
}

// 以下与 fanqie_ads.js 完全一致：只删明确带广告标记的条目
try {
  const obj = JSON.parse(body);
  stripAds(obj);
  $done({ body: JSON.stringify(obj) });
} catch (e) {
  // 解析失败（加密/压缩/非 JSON）：原样放行
  $done({});
}

// 判断一个数据项是不是广告：只认明确标记，不猜
function isAd(item) {
  if (!item || typeof item !== "object") return false;
  if (item.is_ad === true || item.isAd === true) return true;
  if (item.ad_id || item.adId || item.creative_id || item.creativeId) return true;
  if (item.ad_info || item.adInfo) return true;
  const t = String(item.cell_type || item.cellType || item.item_type || item.card_type || "");
  if (/(^|_)ad(_|$)/i.test(t)) return true;
  return false;
}

// 递归遍历：从数组里删掉广告条目，其他原样保留
function stripAds(node) {
  if (Array.isArray(node)) {
    for (let i = node.length - 1; i >= 0; i--) {
      if (isAd(node[i])) {
        node.splice(i, 1);
      } else {
        stripAds(node[i]);
      }
    }
  } else if (node && typeof node === "object") {
    for (const k of Object.keys(node)) {
      stripAds(node[k]);
    }
  }
}
