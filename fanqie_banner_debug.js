// 番茄小说 banner 调试脚本（临时用，抓到接口后换回正式版）
// v3 修复（2026-10-13）：用 if/else 保证 $done 只调用一次。
//   v2 的 bug：$done({}) 后代码继续往下执行，最后一次 $done 覆盖了前面的，导致 fqnovel.com 响应仍被改写。
// *.fqnovel.com 只记录 banner 日志、绝不改写响应体；去广告仅对 *.fanqienovel.com 生效。

const url = $request.url || "";

// ---- 调试：找 banner / 运营位痕迹（所有域名都记，只读不写） ----
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

// ---- 去广告：只对 fanqienovel.com 生效；其他域名原样放行 ----
if (/fanqienovel\.com/i.test(url)) {
  var body = $response.body;
  if (body && typeof body === "string") {
    try {
      var obj = JSON.parse(body);
      stripAds(obj);
      $done({ body: JSON.stringify(obj) });
    } catch (e) {
      $done({}); // 解析失败：原样放行
    }
  } else {
    $done({});
  }
} else {
  $done({}); // fqnovel.com 等：只记录日志，不碰响应体
}

// 判断一个数据项是不是广告：只认明确标记，不猜
function isAd(item) {
  if (!item || typeof item !== "object") return false;
  if (item.is_ad === true || item.isAd === true) return true;
  if (item.ad_id || item.adId || item.creative_id || item.creativeId) return true;
  if (item.ad_info || item.adInfo) return true;
  var t = String(item.cell_type || item.cellType || item.item_type || item.card_type || "");
  if (/(^|_)ad(_|$)/i.test(t)) return true;
  return false;
}

// 递归遍历：从数组里删掉广告条目，其他原样保留
function stripAds(node) {
  if (Array.isArray(node)) {
    for (var i = node.length - 1; i >= 0; i--) {
      if (isAd(node[i])) {
        node.splice(i, 1);
      } else {
        stripAds(node[i]);
      }
    }
  } else if (node && typeof node === "object") {
    for (var k in node) {
      if (Object.prototype.hasOwnProperty.call(node, k)) {
        stripAds(node[k]);
      }
    }
  }
}
