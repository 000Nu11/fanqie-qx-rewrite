# 番茄小说去广告 · Quantumult X 重写规则

去开屏 / 信息流 / 阅读器内广告，评论区不受影响。

## 文件

- `fanqie-qx.conf`：QX 重写规则，引用用这个（脚本直链已填好，开箱即用）
- `fanqie_ads.js`：通用 JSON 去广告脚本

## 使用

1. QX 开启 MitM，安装证书，并在「设置 → 通用 → 关于本机 → 证书信任设置」里信任它。
2. QX → 重写 → 引用，添加：

   ```
   https://raw.githubusercontent.com/000Nu11/fanqie-qx-rewrite/main/fanqie-qx.conf
   ```

3. 回 QX 首页打开总开关。

## 原理

- 穿山甲(Pangle)广告 SDK 域名直接 `reject-200`：只下发广告，不承载正文和评论。
- 响应体重写脚本遇到评论 URL 直接放行，只删除带明确广告标记的数据条目。

## 还剩广告？

用 Stream（App Store 免费）抓包，找到广告请求的域名和路径后加一条 `reject-200` 规则即可。
