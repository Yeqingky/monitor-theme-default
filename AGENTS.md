# `monitor-theme-default` 开发说明

## 仓库职责

本仓库是 `monitor` 的内置默认前端主题, 负责展示公开节点状态, 汇总指标, 费用信息和节点历史图表. 主题构建产物位于 `dist/`.

## 代码导航

- `src/App.tsx`: 应用入口, 主题切换, 客户端路由, 站点访问状态和页面骨架.
- `src/components/Summary.tsx`: 节点汇总, 流量, 实时速度和剩余价值.
- `src/components/NodeCard.tsx`: 节点卡片和资源用量.
- `src/components/NodeDetail.tsx`: 节点详情和历史图表.
- `src/lib/api.ts`: 同源 API 和 WebSocket 数据访问.
- `src/lib/finance.ts`: 费用, 汇率和剩余价值计算.
- `src/lib/format.ts`: 页面显示格式化.
- `src/index.css`: Tailwind 入口, 主题变量和全局样式.
- `theme.json`: 主题包元数据.

## 鉴权方式

主题只使用同源接口返回的 `me` 状态判断访问权限. 公开页关闭且用户未登录时跳转 `/admin/`; 不在主题中实现登录或保存凭据. 匿名访问必须遵守 hub 对公开节点和敏感字段的过滤结果.

## 必须延续的界面要求

- 保持响应式布局, 黑白配色和现有紧凑的信息层级.
- 顶部导航使用 sticky 定位, 必须覆盖内容卡片和浮层.
- 汇总卡片中的“剩余价值”明细可以浮出, 但不得遮挡顶部导航.
- 实时数字使用 `.tnum`, 长文本应在窄屏中截断或换行, 不得造成横向溢出.
- 主题页面保持可访问性: 可点击卡片支持键盘操作, 控件保留语义标签和焦点样式.

## 业务规则

- 节点列表按 `sort` 再按 `id` 升序展示.
- 流量方向统一先上传后下载, 计费流量遵循节点的 `traffic_mode`.
- 费用计算使用节点原始计费周期和有效汇率; 缺少汇率或到期日时只将受影响的汇总显示为不可用, 不展示部分总额.
- 一次性费用不计入周期支出和剩余价值.
- 历史图表必须使用 hub 返回的丢包统计, 不得对桶级百分比直接平均.

## 开发与验证命令

```bash
npm ci
npm run build
npm run lint
npm test
```

提交前至少运行 `npm run build && npm run lint && npm test`.

## 版本控制与发布规则

- 不修改 `README.md` 来记录发布说明.
- 发布时在仓库根目录维护 `.release-notes.md`, 并用 `.git/info/exclude` 忽略该文件.
- 版本号, `theme.json`, Git tag 和发布包必须保持一致.
- 发布完成后同步 GitHub Release 说明, 保留自动生成的 `Full Changelog: <previous-tag>...<current-tag>` 段落.
- 未经明确要求不提交, 打 tag 或推送远程.
