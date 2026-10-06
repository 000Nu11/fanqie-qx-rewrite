// 番茄小说通用去广告 · Quantumult X script-response-body 脚本
// 配合「番茄小说去广告.conf」使用
//
// 设计原则：
// 1. URL 里带 comment / reply / discuss 的请求，直接原样返回，一个字符都不改
//    —— 这是保证评论区正常阅读的关键
// 2. 只删除「明确带广告标记」的数据条目，不确定的不动
// 3. 响应体不是 JSON（比如章节内容加密了）时直接放行，不报错

const url = $request.url || "";

// ---- 评论相关接口：直接放行 ----
if (/comment|reply|discuss/i.test(url)) {
  $done({});
}

let body = $response.body;
if (!body || typeof body !== "string") {
  $done({});
}

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
