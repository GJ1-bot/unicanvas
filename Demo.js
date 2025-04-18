/**
 * Demo.js
 * UniCanvas 演示程序
 */
import UniCanvas from './UniCanvas.js';

// 创建 UniCanvas 实例
const uniCanvas = new UniCanvas({
  debug: true,
  securityLevel: 'moderate'
});

// 演示函数
const runDemo = async () => {
  console.log('UniCanvas Demo - 开始运行');
  console.log('版本:', uniCanvas.version);
  
  try {
    // 1. 创建站点
    console.log('\n1. 创建站点');
    const marketingSiteId = uniCanvas.createSite({
      name: '营销站点',
      domain: 'marketing.example.com',
      description: '产品营销和展示站点',
      theme: 'light'
    });
    
    const dashboardSiteId = uniCanvas.createSite({
      name: '仪表盘站点',
      domain: 'dashboard.example.com',
      description: '数据分析和管理仪表盘',
      theme: 'dark'
    });
    
    console.log('已创建站点:', marketingSiteId, dashboardSiteId);
    
    // 2. 注册全局资源
    console.log('\n2. 注册全局资源');
    uniCanvas.resourceHub.registerStyleVariable('--primary-color', '#3498db', {
      scope: 'global',
      metadata: { description: '主要主题颜色' }
    });
    
    uniCanvas.resourceHub.registerStyleVariable('--secondary-color', '#2ecc71', {
      scope: 'global',
      metadata: { description: '次要主题颜色' }
    });
    
    uniCanvas.resourceHub.registerStyleVariable('--dark-bg', '#2c3e50', {
      scope: 'global',
      metadata: { description: '深色背景' }
    });
    
    // 注册数据模型
    uniCanvas.resourceHub.registerDataModel('user', {
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
        email: { type: 'string' },
        role: { type: 'string' }
      },
      required: ['id', 'name']
    });
    
    console.log('全局资源统计:', uniCanvas.resourceHub.getResourceStats());
    
    // 3. 创建页面
    console.log('\n3. 创建页面');
    const landingPageId = uniCanvas.createPage(marketingSiteId, {
      name: '着陆页',
      path: '/',
      title: '欢迎来到我们的产品',
      description: '了解我们的产品和服务'
    });
    
    const dashboardPageId = uniCanvas.createPage(dashboardSiteId, {
      name: '主仪表盘',
      path: '/dashboard',
      title: '数据仪表盘',
      description: '查看和分析您的数据'
    });
    
    console.log('已创建页面:', landingPageId, dashboardPageId);
    
    // 4. 保存模板
    console.log('\n4. 保存模板');
    const cardTemplate = {
      html: '<div class="card"><div class="card-header">{{title}}</div><div class="card-body">{{content}}</div></div>',
      css: '.card { border: 1px solid #ddd; border-radius: 4px; margin-bottom: 20px; } .card-header { background-color: var(--primary-color); color: white; padding: 10px; } .card-body { padding: 15px; }',
      data: { title: '默认标题', content: '默认内容' }
    };
    
    const templateId = uniCanvas.templateEngine.saveTemplate('card-template', cardTemplate, {
      sourceEnvironment: { id: 'marketing' },
      author: 'demo-user',
      version: '1.0.0'
    });
    
    console.log('已保存模板:', templateId);
    
    // 5. 应用模板到另一个站点
    console.log('\n5. 应用模板到另一个站点');
    const adaptedTemplate = uniCanvas.templateEngine.applyTemplate(templateId, { id: 'dashboard' }, {
      preserveOriginalClasses: false
    });
    
    console.log('适配后的模板:', adaptedTemplate);
    
    // 6. 添加组件到页面
    console.log('\n6. 添加组件到页面');
    const marketingCardId = uniCanvas.addComponentToPage(landingPageId, {
      type: 'card',
      name: '营销卡片',
      content: cardTemplate.html,
      style: cardTemplate.css,
      data: {
        title: '我们的产品特点',
        content: '探索我们产品的所有惊人功能和好处。'
      }
    });
    
    const dashboardCardId = uniCanvas.addComponentToPage(dashboardPageId, {
      type: 'card',
      name: '仪表盘卡片',
      content: adaptedTemplate.html,
      style: adaptedTemplate.css,
      data: {
        title: '性能概览',
        content: '查看您的关键性能指标和统计数据。'
      }
    });
    
    console.log('已添加组件:', marketingCardId, dashboardCardId);
    
    // 7. 配置站点间通信
    console.log('\n7. 配置站点间通信');
    uniCanvas.configureSiteCommunication(marketingSiteId, dashboardSiteId, {
      allowedMessageTypes: ['data.update', 'navigation']
    });
    
    // 8. 发布模板到市场
    console.log('\n8. 发布模板到市场');
    const marketplaceId = uniCanvas.templateMarket.publishTemplate(cardTemplate, {
      name: '基础卡片',
      description: '一个简单的卡片组件，带有标题和内容区域',
      tags: ['ui', 'card', 'basic'],
      author: 'demo-user',
      category: 'ui'
    });
    
    console.log('已发布模板到市场:', marketplaceId);
    
    // 9. 搜索模板
    console.log('\n9. 搜索模板');
    const searchResults = uniCanvas.templateMarket.searchTemplates({
      query: 'card',
      tags: ['ui'],
      sortBy: 'relevance'
    });
    
    console.log('搜索结果:', searchResults);
    
    // 10. 渲染页面
    console.log('\n10. 渲染页面');
    const renderedPage = uniCanvas.renderPage(landingPageId);
    console.log('渲染页面 HTML 长度:', renderedPage.length);
    
    // 11. 检查冲突
    console.log('\n11. 检查冲突');
    const conflicts = uniCanvas.conflictDetector.checkConflicts({
      type: 'template',
      source: templateId,
      target: 'dashboard',
      content: cardTemplate
    });
    
    console.log('检测到的冲突:', conflicts.length);
    
    // 12. 获取系统状态
    console.log('\n12. 系统状态');
    const status = uniCanvas.getSystemStatus();
    console.log('系统状态:', status);
    
    console.log('\nUniCanvas Demo - 运行完成');
    return true;
  } catch (error) {
    console.error('演示运行错误:', error);
    return false;
  }
};

// 运行演示
document.addEventListener('DOMContentLoaded', () => {
  const demoContainer = document.getElementById('demo-container');
  const demoOutput = document.getElementById('demo-output');
  const runButton = document.getElementById('run-demo');
  
  if (runButton) {
    runButton.addEventListener('click', async () => {
      demoOutput.innerHTML = '<div class="loading">运行演示中...</div>';
      
      // 捕获控制台输出
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const logs = [];
      
      console.log = (...args) => {
        logs.push({ type: 'log', content: args.join(' ') });
        originalConsoleLog.apply(console, args);
      };
      
      console.error = (...args) => {
        logs.push({ type: 'error', content: args.join(' ') });
        originalConsoleError.apply(console, args);
      };
      
      try {
        const result = await runDemo();
        
        // 恢复控制台
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        
        // 显示结果
        let output = '';
        logs.forEach(log => {
          if (log.type === 'error') {
            output += `<div class="error">${log.content}</div>`;
          } else {
            output += `<div class="log">${log.content}</div>`;
          }
        });
        
        demoOutput.innerHTML = output;
        
        // 添加结果状态
        const resultStatus = document.createElement('div');
        resultStatus.className = result ? 'success' : 'failure';
        resultStatus.textContent = result ? '演示成功完成' : '演示运行失败';
        demoOutput.appendChild(resultStatus);
      
      } catch (error) {
        // 恢复控制台
        console.log = originalConsoleLog;
        console.error = originalConsoleError;
        
        // 显示错误
        demoOutput.innerHTML = `<div class="error">演示运行出错: ${error.message}</div>`;
        console.error('Demo error:', error);
      }
    });
  }
  
  // 添加示例UI
  if (demoContainer && !demoContainer.hasChildNodes()) {
    demoContainer.innerHTML = `
      <div class="demo-header">
        <h2>UniCanvas 演示</h2>
        <p>这个演示展示了 UniCanvas 的核心功能</p>
      </div>
      <div class="demo-controls">
        <button id="run-demo" class="demo-button">运行演示</button>
      </div>
      <div id="demo-output" class="demo-output">
        <div class="placeholder">点击"运行演示"按钮开始</div>
      </div>
      <style>
        .demo-header { margin-bottom: 20px; }
        .demo-header h2 { margin-bottom: 5px; }
        .demo-controls { margin-bottom: 15px; }
        .demo-button {
          background-color: var(--unicanvas-primary-color, #3498db);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
        }
        .demo-output {
          background-color: #f5f5f5;
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 15px;
          min-height: 300px;
          max-height: 600px;
          overflow-y: auto;
          font-family: monospace;
          white-space: pre-wrap;
        }
        .placeholder {
          color: #777;
          font-style: italic;
          text-align: center;
          padding: 40px 0;
        }
        .loading {
          text-align: center;
          color: #3498db;
          padding: 20px 0;
        }
        .log { margin: 5px 0; }
        .error {
          color: #e74c3c;
          margin: 5px 0;
          font-weight: bold;
        }
        .success {
          background-color: #2ecc71;
          color: white;
          padding: 10px;
          text-align: center;
          margin-top: 15px;
          border-radius: 4px;
        }
        .failure {
          background-color: #e74c3c;
          color: white;
          padding: 10px;
          text-align: center;
          margin-top: 15px;
          border-radius: 4px;
        }
      </style>
    `;
  }
});

// 高级演示功能
class AdvancedDemo {
  constructor(uniCanvas) {
    this.uniCanvas = uniCanvas;
    this.demoData = {
      users: [
        { id: 1, name: '张三', role: 'admin' },
        { id: 2, name: '李四', role: 'user' },
        { id: 3, name: '王五', role: 'editor' }
      ],
      products: [
        { id: 101, name: '产品A', price: 199, stock: 50 },
        { id: 102, name: '产品B', price: 299, stock: 30 },
        { id: 103, name: '产品C', price: 399, stock: 15 }
      ]
    };
  }
  
  /**
   * 创建完整的营销站点
   */
  async createMarketingSite() {
    // 创建站点
    const siteId = this.uniCanvas.createSite({
      name: '完整营销站点',
      domain: 'full-marketing.example.com',
      description: '具有多个页面的完整营销站点',
      theme: 'light',
      layout: 'marketing'
    });
    
    // 创建页面
    const homePageId = this.uniCanvas.createPage(siteId, {
      name: '首页',
      path: '/',
      title: '欢迎访问我们的网站',
      description: '探索我们的产品和服务'
    });
    
    const productsPageId = this.uniCanvas.createPage(siteId, {
      name: '产品页面',
      path: '/products',
      title: '我们的产品',
      description: '浏览我们的产品目录'
    });
    
    const aboutPageId = this.uniCanvas.createPage(siteId, {
      name: '关于我们',
      path: '/about',
      title: '关于我们',
      description: '了解我们的故事和团队'
    });
    
    // 创建导航组件
    const navComponent = {
      type: 'navigation',
      name: '主导航',
      content: `
        <nav class="main-nav">
          <ul>
            <li><a href="/">首页</a></li>
            <li><a href="/products">产品</a></li>
            <li><a href="/about">关于我们</a></li>
            <li><a href="/contact">联系我们</a></li>
          </ul>
        </nav>
      `,
      style: `
        .main-nav {
          background-color: var(--primary-color);
          padding: 10px 0;
        }
        .main-nav ul {
          display: flex;
          list-style: none;
          margin: 0;
          padding: 0;
          justify-content: center;
        }
        .main-nav li {
          margin: 0 15px;
        }
        .main-nav a {
          color: white;
          text-decoration: none;
          font-weight: bold;
        }
        .main-nav a:hover {
          text-decoration: underline;
        }
      `
    };
    
    // 添加导航到所有页面
    this.uniCanvas.addComponentToPage(homePageId, navComponent);
    this.uniCanvas.addComponentToPage(productsPageId, navComponent);
    this.uniCanvas.addComponentToPage(aboutPageId, navComponent);
    
    // 添加首页内容
    this.uniCanvas.addComponentToPage(homePageId, {
      type: 'hero',
      name: '首页英雄区',
      content: `
        <div class="hero">
          <h1>欢迎来到我们的网站</h1>
          <p>我们提供最好的产品和服务</p>
          <a href="/products" class="cta-button">浏览产品</a>
        </div>
      `,
      style: `
        .hero {
          text-align: center;
          padding: 60px 20px;
          background-color: #f5f5f5;
        }
        .hero h1 {
          font-size: 2.5em;
          margin-bottom: 20px;
          color: var(--primary-color);
        }
        .hero p {
          font-size: 1.2em;
          margin-bottom: 30px;
        }
        .cta-button {
          display: inline-block;
          background-color: var(--secondary-color);
          color: white;
          padding: 12px 24px;
          border-radius: 4px;
          text-decoration: none;
          font-weight: bold;
        }
      `
    });
    
    // 添加产品列表
    this.uniCanvas.addComponentToPage(productsPageId, {
      type: 'product-list',
      name: '产品列表',
      content: `
        <div class="product-list">
          <h1>我们的产品</h1>
          <div class="products">
            {{#each products}}
            <div class="product-card">
              <h3>{{name}}</h3>
              <p class="price">¥{{price}}</p>
              <p class="stock">库存: {{stock}}</p>
              <button class="buy-button">购买</button>
            </div>
            {{/each}}
          </div>
        </div>
      `,
      style: `
        .product-list {
          padding: 40px 20px;
        }
        .product-list h1 {
          text-align: center;
          margin-bottom: 30px;
          color: var(--primary-color);
        }
        .products {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
        }
        .product-card {
          border: 1px solid #ddd;
          border-radius: 4px;
          padding: 20px;
          text-align: center;
        }
        .product-card h3 {
          margin-top: 0;
        }
        .price {
          font-size: 1.2em;
          font-weight: bold;
          color: var(--primary-color);
        }
        .stock {
          color: #777;
        }
        .buy-button {
          background-color: var(--secondary-color);
          color: white;
          border: none;
          padding: 8px 16px;
          border-radius: 4px;
          cursor: pointer;
          margin-top: 10px;
        }
      `,
      data: {
        products: this.demoData.products
      }
    });
    
    return {
      siteId,
      pages: {
        home: homePageId,
        products: productsPageId,
        about: aboutPageId
      }
    };
  }
  
  /**
   * 创建仪表盘站点
   */
  async createDashboardSite() {
    // 创建站点
    const siteId = this.uniCanvas.createSite({
      name: '管理仪表盘',
      domain: 'admin.example.com',
      description: '管理和分析仪表盘',
      theme: 'dark',
      layout: 'dashboard'
    });
    
    // 创建页面
    const dashboardPageId = this.uniCanvas.createPage(siteId, {
      name: '仪表盘',
      path: '/dashboard',
      title: '管理仪表盘',
      description: '查看关键指标和统计数据'
    });
    
    const usersPageId = this.uniCanvas.createPage(siteId, {
      name: '用户管理',
      path: '/users',
      title: '用户管理',
      description: '管理系统用户'
    });
    
    // 添加侧边栏
    const sidebarComponent = {
      type: 'sidebar',
      name: '仪表盘侧边栏',
      content: `
        <div class="sidebar">
          <div class="sidebar-header">
            <h3>管理控制台</h3>
          </div>
          <ul class="sidebar-menu">
            <li><a href="/dashboard"><i class="icon">📊</i> 仪表盘</a></li>
            <li><a href="/users"><i class="icon">👥</i> 用户管理</a></li>
            <li><a href="/products"><i class="icon">📦</i> 产品管理</a></li>
            <li><a href="/settings"><i class="icon">⚙️</i> 设置</a></li>
          </ul>
        </div>
      `,
      style: `
        .sidebar {
          background-color: var(--dark-bg);
          color: white;
          width: 250px;
          height: 100vh;
          position: fixed;
          left: 0;
          top: 0;
        }
        .sidebar-header {
          padding: 20px;
          border-bottom: 1px solid rgba(255,255,255,0.1);
        }
        .sidebar-menu {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        .sidebar-menu li a {
          display: flex;
          align-items: center;
          padding: 15px 20px;
          color: white;
          text-decoration: none;
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .sidebar-menu li a:hover {
          background-color: rgba(255,255,255,0.1);
        }
        .icon {
          margin-right: 10px;
        }
        .dashboard-content {
          margin-left: 250px;
          padding: 20px;
        }
      `
    };
    
    // 添加侧边栏到所有页面
    this.uniCanvas.addComponentToPage(dashboardPageId, sidebarComponent);
    this.uniCanvas.addComponentToPage(usersPageId, sidebarComponent);
    
    // 添加仪表盘内容
    this.uniCanvas.addComponentToPage(dashboardPageId, {
      type: 'dashboard-content',
      name: '仪表盘内容',
      content: `
        <div class="dashboard-content">
          <h1>仪表盘</h1>
          <div class="stats-grid">
            <div class="stat-card">
              <h3>总用户</h3>
              <div class="stat-value">1,234</div>
            </div>
            <div class="stat-card">
              <h3>总产品</h3>
              <div class="stat-value">42</div>
            </div>
            <div class="stat-card">
              <h3>总订单</h3>
              <div class="stat-value">857</div>
            </div>
            <div class="stat-card">
              <h3>收入</h3>
              <div class="stat-value">¥123,456</div>
            </div>
          </div>
        </div>
      `,
      style: `
        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }
        .stat-card {
          background-color: white;
          border-radius: 4px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
          margin-top: 0;
          color: #777;
          font-size: 0.9em;
          text-transform: uppercase;
        }
        .stat-value {
          font-size: 2em;
          font-weight: bold;
          color: var(--primary-color);
        }
      `
    });
    
    // 添加用户管理内容
    this.uniCanvas.addComponentToPage(usersPageId, {
      type: 'users-table',
      name: '用户表格',
      content: `
        <div class="dashboard-content">
          <h1>用户管理</h1>
          <div class="users-table-container">
            <table class="users-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>姓名</th>
                  <th>角色</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {{#each users}}
                <tr>
                  <td>{{id}}</td>
                  <td>{{name}}</td>
                  <td>{{role}}</td>
                  <td>
                    <button class="edit-button">编辑</button>
                    <button class="delete-button">删除</button>
                  </td>
                </tr>
                {{/each}}
              </tbody>
            </table>
          </div>
        </div>
      `,
      style: `
        .users-table-container {
          background-color: white;
          border-radius: 4px;
          padding: 20px;
          box-shadow: 0 2px 5px rgba(0,0,0,0.1);
          margin-top: 20px;
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th, .users-table td {
          padding: 12px 15px;
          text-align: left;
          border-bottom: 1px solid #ddd;
        }
        .users-table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
        .edit-button, .delete-button {
          padding: 5px 10px;
          border: none;
          border-radius: 3px;
          cursor: pointer;
          margin-right: 5px;
        }
        .edit-button {
          background-color: var(--primary-color);
          color: white;
        }
        .delete-button {
          background-color: #e74c3c;
          color: white;
        }
      `,
      data: {
        users: this.demoData.users
      }
    });
    
    return {
      siteId,
      pages: {
        dashboard: dashboardPageId,
        users: usersPageId
      }
    };
  }
}

// 导出模块
export default {
  runDemo,
  AdvancedDemo
};
