// 番茄小说 banner 调试脚本（临时用，抓到接口后换回正式版）
// v4 修复（2026-10-13）：加回评论 URL 放行（v3 误删导致评论区被当广告清空）。
//   去广告逻辑与 fanqie_ads.js 完全一致；banner 日志只读不写。

const url = $request.url || "";

// ---- 调试：找 banner / 运营位痕迹（只读不写） ----
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

// ---- 评论相关接口：直接放行，一个字符都不改（保证评论区正常的关键） ----
if (/comment|reply|discuss/i.test(url)) {
  $done({});
} else {
// ---- 去广告：只删明确带广告标记的条目 ----
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
}

// 判断一个数据项是不是广告：只认明确标记，不猜
function isAd(item) {
  if (!item || typeof item !== "object") return false;
  if (item.is_ad === true || item.isAd === true) return true;
  if (item.ad_id || item.adId || item.creative_id || item.creativeId) return true;
  if (item.ad_info || item.adInfo) return true;
  if (item.rit || item.slot_id || item.slotId || item.ad_slot_id || item.adSlotId) return true;
  var t = String(item.cell_type || item.cellType || item.item_type || item.card_type || "");
  if (/(^|_)ad(_|$)/i.test(t)) return true;
  if (/banner/i.test(t) && (item.ad_position || item.adPosition || item.track_url || item.trackUrl || item.click_track_url)) return true;
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
