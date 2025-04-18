# UniCanvas

<p align="center">
  <img src="https://via.placeholder.com/200x200?text=UniCanvas" alt="UniCanvas Logo" width="200" height="200">
</p>

<p align="center">
  一个强大的跨站点内容管理与通信框架
  <br />
  <a href="#demo"><strong>查看演示 »</strong></a>
  <br />
  <br />
  <a href="#getting-started">快速开始</a>
  ·
  <a href="#features">核心功能</a>
  ·
  <a href="#examples">示例</a>
  ·
  <a href="#documentation">文档</a>
</p>

## 简介

UniCanvas 是一个现代化的前端框架，专注于解决跨站点内容管理、安全通信和模板系统的复杂问题。它提供了一套完整的工具，帮助开发者创建统一、安全且可扩展的多站点应用。

### 解决的问题

- 跨站点/页面资源共享与冲突管理
- 安全的跨域通信
- 统一的模板系统与市场
- 复杂前端架构的模块化管理

## 特性

<p align="center">
  <img src="https://via.placeholder.com/800x400?text=UniCanvas+Architecture" alt="UniCanvas Architecture" width="800">
</p>

### 🔄 全局资源中心 (GlobalResourceHub)
集中管理跨页面和跨站点的共享资源，自动处理依赖关系和版本控制。

```javascript
// 注册全局资源
uniCanvas.resourceHub.register('commonStyles', {
  type: 'css',
  content: '.common-button { background: blue; color: white; }'
});

// 在任何页面使用
uniCanvas.resourceHub.use('commonStyles');
```

### 🔒 沙箱通信网关 (SandboxBridge)
提供安全的跨域通信机制，支持事件广播、请求-响应模式和消息过滤。

```javascript
// 站点A发送消息
uniCanvas.sandbox.send('siteB', {
  type: 'DATA_REQUEST',
  payload: { id: '12345' }
});

// 站点B接收消息
uniCanvas.sandbox.on('DATA_REQUEST', (data, source) => {
  // 处理来自站点A的请求
});
```

### 📝 智能模板引擎 (SmartTemplateEngine)
强大的模板系统，支持自适应布局、条件渲染和数据绑定。

```javascript
// 创建模板
const template = uniCanvas.templateEngine.create({
  name: 'productCard',
  html: '<div class="card">{{product.name}} - ${{product.price}}</div>',
  css: '.card { padding: 15px; border: 1px solid #eee; }',
  schema: {
    product: { type: 'object', required: true }
  }
});

// 应用模板
template.render('#container', { product: { name: 'Awesome Product', price: 99.99 } });
```

### 🛒 模板市场 (TemplateMarket)
发布、搜索和使用社区创建的模板，加速开发过程。

```javascript
// 搜索模板
uniCanvas.templateMarket.search('product card').then(templates => {
  // 使用找到的模板
  if (templates.length > 0) {
    uniCanvas.templateMarket.use(templates[0].id);
  }
});
```

### ⚠️ 冲突检测系统 (ConflictDetector)
自动检测和解决资源冲突，确保应用稳定性。

```javascript
// 启用冲突检测
uniCanvas.conflictDetector.enable();

// 注册冲突解决策略
uniCanvas.conflictDetector.registerStrategy('css', (a, b) => {
  return { resolution: 'merge', result: a + b };
});
```

## 快速开始

### 安装

```bash
# 使用 npm
npm install unicanvas

# 或使用 CDN
<script src="https://cdn.example.com/unicanvas.min.js"></script>
```

### 基本用法

```javascript
// 创建 UniCanvas 实例
const uniCanvas = new UniCanvas({
  debug: true,
  securityLevel: 'moderate'
});

// 注册资源
uniCanvas.resourceHub.register('appStyles', {
  type: 'css',
  url: '/styles/main.css'
});

// 创建模板
const headerTemplate = uniCanvas.templateEngine.create({
  name: 'header',
  html: '<header>{{title}}</header>',
  css: 'header { background: #333; color: white; padding: 20px; }',
});

// 渲染模板
headerTemplate.render('#app-header', { title: 'My Awesome App' });

// 设置跨站点通信
uniCanvas.sandbox.connect(['https://partner-site.com']);
uniCanvas.sandbox.on('DATA_UPDATE', handleDataUpdate);
```

## 示例

- [基础示例](https://github.com/yourusername/unicanvas/examples/basic)
- [多站点通信](https://github.com/yourusername/unicanvas/examples/cross-site)
- [模板市场集成](https://github.com/yourusername/unicanvas/examples/template-market)
- [资源冲突解决](https://github.com/yourusername/unicanvas/examples/conflict-resolution)

## 文档

详细文档请访问 [unicanvas.github.io/docs](https://unicanvas.github.io/docs)

### API 参考

- [UniCanvas](https://unicanvas.github.io/docs/api/unicanvas)
- [GlobalResourceHub](https://unicanvas.github.io/docs/api/resource-hub)
- [SandboxBridge](https://unicanvas.github.io/docs/api/sandbox-bridge)
- [SmartTemplateEngine](https://unicanvas.github.io/docs/api/template-engine)
- [TemplateMarket](https://unicanvas.github.io/docs/api/template-market)
- [ConflictDetector](https://unicanvas.github.io/docs/api/conflict-detector)

## 贡献指南

我们欢迎所有形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

## 许可证

本项目采用 MIT 许可证 - 详情请参阅 [LICENSE](LICENSE) 文件。

## 联系方式

项目作者 - [@yourname](https://github.com/yourname)

项目链接: [https://github.com/yourusername/unicanvas](https://github.com/yourusername/unicanvas)
