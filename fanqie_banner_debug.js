// 番茄小说 banner 调试脚本（临时用，抓到接口后换回正式版）
// 去广告逻辑与 fanqie_ads.js 完全一致，行为不变；
// 额外：只要响应体里出现 banner / 运营位 相关关键词，
// 就会把请求 URL 和命中的片段打到 QX「日志」里。
// 下次底部广告冒出来后，去 QX 日志搜 FANQIE_BANNER，把那几行发给老铁。

const url = $request.url || "";

// ---- 评论相关接口：直接放行（连日志都不打，避免刷屏） ----
if (/comment|reply|discuss/i.test(url)) {
  $done({});
}

let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
}

// ---- 调试：找 banner / 运营位痕迹 ----
try {
  var m = body.match(/banner|运营|征文|float|悬浮|bottom_ad|底部横幅|operation/i);
  if (m) {
    console.log("[FANQIE_BANNER] URL=" + url);
    var idx = body.search(/banner|运营|征文|float|悬浮|bottom_ad|底部横幅|operation/i);
    var snippet = body.slice(Math.max(0, idx - 150), idx + 400);
    console.log("[FANQIE_BANNER] HIT=" + m[0] + " SNIPPET=" + snippet.slice(0, 500));
  }
} catch (e) {}

// ---- 以下与 fanqie_ads.js 完全一致：只删明确带广告标记的条目 ----
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
