/**
 * UniCanvas.js
 * 核心整合模块，负责协调各个子系统的工作
 */
import GlobalResourceHub from './GlobalResourceHub.js';
import SandboxBridge from './SandboxBridge.js';
import SmartTemplateEngine from './SmartTemplateEngine.js';
import EventEmitter from './EventEmitter.js';
import ConflictDetector from './ConflictDetector.js';
import TemplateMarket from './TemplateMarket.js';
import { UniCanvasError } from './UniCanvasError.js';

class UniCanvas extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      debug: options.debug || false,
      securityLevel: options.securityLevel || 'strict',
      autoInitialize: options.autoInitialize !== false,
      ...options
    };
    
    this.sites = {};
    this.pages = {};
    
    // 初始化子系统
    this.resourceHub = new GlobalResourceHub(options.resourceHub);
    this.sandboxBridge = new SandboxBridge(options.sandboxBridge);
    this.templateEngine = new SmartTemplateEngine(options.templateEngine);
    this.conflictDetector = new ConflictDetector(options.conflictDetector);
    this.templateMarket = new TemplateMarket(options.templateMarket);
    
    // 版本信息
    this.version = '1.0.0';
    
    // 自动初始化
    if (this.options.autoInitialize) {
      this.initialize();
    }
    
    if (this.options.debug) {
      console.log('UniCanvas initialized with options:', this.options);
    }
  }
  
  /**
   * 初始化系统
   * @returns {UniCanvas} 当前实例
   */
  initialize() {
    // 注册内部事件处理
    this._registerInternalEventHandlers();
    
    // 连接子系统
    this._connectSubsystems();
    
    // 触发初始化完成事件
    this.emit('initialized', {
      timestamp: Date.now(),
      version: this.version
    });
    
    if (this.options.debug) {
      console.log('UniCanvas initialization complete');
    }
    
    return this;
  }
  
  /**
   * 创建站点
   * @param {Object} siteConfig - 站点配置
   * @returns {string} 站点ID
   */
  createSite(siteConfig = {}) {
    if (!siteConfig.name) {
      throw new UniCanvasError('INVALID_SITE_CONFIG', 'Site name is required');
    }
    
    const siteId = siteConfig.id || `site_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查站点ID是否已存在
    if (this.sites[siteId]) {
      throw new UniCanvasError('SITE_EXISTS', `Site with ID ${siteId} already exists`);
    }
    
    // 创建站点对象
    this.sites[siteId] = {
      id: siteId,
      name: siteConfig.name,
      domain: siteConfig.domain || null,
      description: siteConfig.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      pages: [],
      config: {
        theme: siteConfig.theme || 'default',
        layout: siteConfig.layout || 'standard',
        security: siteConfig.security || this.options.securityLevel,
        ...siteConfig.config
      }
    };
    
    // 触发站点创建事件
    this.emit('site.created', {
      siteId,
      site: this.sites[siteId]
    });
    
    if (this.options.debug) {
      console.log(`Site created: ${siteId}`, this.sites[siteId]);
    }
    
    return siteId;
  }
  
  /**
   * 获取站点
   * @param {string} siteId - 站点ID
   * @returns {Object|null} 站点对象或null
   */
  getSite(siteId) {
    return this.sites[siteId] || null;
  }
  
  /**
   * 创建页面
   * @param {string} siteId - 站点ID
   * @param {Object} pageConfig - 页面配置
   * @returns {string} 页面ID
   */
  createPage(siteId, pageConfig = {}) {
    const site = this.getSite(siteId);
    
    if (!site) {
      throw new UniCanvasError('SITE_NOT_FOUND', `Site ${siteId} not found`);
    }
    
    if (!pageConfig.name) {
      throw new UniCanvasError('INVALID_PAGE_CONFIG', 'Page name is required');
    }
    
    const pageId = pageConfig.id || `page_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查页面ID是否已存在
    if (this.pages[pageId]) {
      throw new UniCanvasError('PAGE_EXISTS', `Page with ID ${pageId} already exists`);
    }
    
    // 创建页面对象
    this.pages[pageId] = {
      id: pageId,
      siteId,
      name: pageConfig.name,
      path: pageConfig.path || '/',
      title: pageConfig.title || pageConfig.name,
      description: pageConfig.description || '',
      createdAt: new Date(),
      updatedAt: new Date(),
      components: [],
      layout: pageConfig.layout || site.config.layout,
      meta: pageConfig.meta || {},
      content: pageConfig.content || ''
    };
    
    // 更新站点页面列表
    site.pages.push(pageId);
    
    // 触发页面创建事件
    this.emit('page.created', {
      pageId,
      siteId,
      page: this.pages[pageId]
    });
    
    if (this.options.debug) {
      console.log(`Page created: ${pageId} in site ${siteId}`, this.pages[pageId]);
    }
    
    return pageId;
  }
  
  /**
   * 获取页面
   * @param {string} pageId - 页面ID
   * @returns {Object|null} 页面对象或null
   */
  getPage(pageId) {
    return this.pages[pageId] || null;
  }
  
  /**
   * 添加组件到页面
   * @param {string} pageId - 页面ID
   * @param {Object} component - 组件定义
   * @param {Object} options - 添加选项
   * @returns {string} 组件ID
   */
  addComponentToPage(pageId, component, options = {}) {
    const page = this.getPage(pageId);
    
    if (!page) {
      throw new UniCanvasError('PAGE_NOT_FOUND', `Page ${pageId} not found`);
    }
    
    if (!component || typeof component !== 'object') {
      throw new UniCanvasError('INVALID_COMPONENT', 'Component must be an object');
    }
    
    const componentId = component.id || `comp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查组件ID是否已存在于页面中
    if (page.components.some(comp => comp.id === componentId)) {
      throw new UniCanvasError('COMPONENT_EXISTS', `Component with ID ${componentId} already exists in page ${pageId}`);
    }
    
    // 创建组件对象
    const componentObj = {
      id: componentId,
      type: component.type || 'custom',
      name: component.name || 'Unnamed Component',
      content: component.content || '',
      style: component.style || '',
      script: component.script || '',
      data: component.data || {},
      position: options.position || { x: 0, y: 0 },
      size: options.size || { width: 'auto', height: 'auto' },
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // 添加到页面
    page.components.push(componentObj);
    
    // 触发组件添加事件
    this.emit('component.added', {
      componentId,
      pageId,
      siteId: page.siteId,
      component: componentObj
    });
    
    if (this.options.debug) {
      console.log(`Component ${componentId} added to page ${pageId}`, componentObj);
    }
    
    return componentId;
  }
  
  /**
   * 获取页面组件
   * @param {string} pageId - 页面ID
   * @param {string} componentId - 组件ID
   * @returns {Object|null} 组件对象或null
   */
  getPageComponent(pageId, componentId) {
    const page = this.getPage(pageId);
    
    if (!page) {
      return null;
    }
    
    return page.components.find(comp => comp.id === componentId) || null;
  }
  
  /**
   * 配置站点间通信
   * @param {string} sourceSiteId - 源站点ID
   * @param {string} targetSiteId - 目标站点ID
   * @param {Object} options - 通信选项
   */
  configureSiteCommunication(sourceSiteId, targetSiteId, options = {}) {
    const sourceSite = this.getSite(sourceSiteId);
    const targetSite = this.getSite(targetSiteId);
    
    if (!sourceSite) {
      throw new UniCanvasError('SITE_NOT_FOUND', `Source site ${sourceSiteId} not found`);
    }
    
    if (!targetSite) {
      throw new UniCanvasError('SITE_NOT_FOUND', `Target site ${targetSiteId} not found`);
    }
    
    // 允许站点间通信
    this.sandboxBridge.allowOrigins([`site_${sourceSiteId}`, `site_${targetSiteId}`]);
    
    // 触发通信配置事件
    this.emit('communication.configured', {
      sourceSiteId,
      targetSiteId,
      options
    });
    
    if (this.options.debug) {
      console.log(`Communication configured between ${sourceSiteId} and ${targetSiteId}`);
    }
    
    return { sourceSiteId, targetSiteId };
  }
  
  /**
   * 渲染页面
   * @param {string} pageId - 页面ID
   * @param {Object} options - 渲染选项
   * @returns {string} 渲染后的HTML
   */
  renderPage(pageId, options = {}) {
    const page = this.getPage(pageId);
    
    if (!page) {
      throw new UniCanvasError('PAGE_NOT_FOUND', `Page ${pageId} not found`);
    }
    
    const site = this.getSite(page.siteId);
    
    if (!site) {
      throw new UniCanvasError('SITE_NOT_FOUND', `Site ${page.siteId} not found`);
    }
    
    // 构建页面基础结构
    let html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  ${this._generatePageMeta(page)}
  ${this._generatePageStyles(page, site)}
</head>
<body data-site="${site.id}" data-page="${page.id}">
  <div class="unicanvas-page-container">
    ${this._renderPageContent(page, site, options)}
  </div>
  ${this._generatePageScripts(page, site)}
</body>
</html>`;
    
    // 触发页面渲染事件
    this.emit('page.rendered', {
      pageId,
      siteId: page.siteId
    });
    
    return html;
  }
  
  /**
   * 注册内部事件处理器
   * @private
   */
  _registerInternalEventHandlers() {
    // 监听模板应用事件
    this.on('template.applied', (data) => {
      if (this.options.debug) {
        console.log(`Template ${data.templateId} applied to ${data.targetEnvironment.id}`);
      }
      
      // 检查冲突
      this.conflictDetector.checkConflicts({
        type: 'template',
        source: data.templateId,
        target: data.targetEnvironment.id
      });
    });
    
    // 监听资源访问事件
    this.on('resource.accessed', (data) => {
      if (this.options.debug) {
        console.log(`Resource ${data.resourceId} accessed by ${data.accessorId}`);
      }
    });
  }
  
  /**
   * 连接子系统
   * @private
   */
  _connectSubsystems() {
    // 连接模板引擎和资源中心
    this.templateEngine.on('template.saved', (data) => {
      // 注册模板资源
      this.resourceHub.registerComponent(data.templateId, {
        type: 'template',
        content: data.template
      }, {
        scope: 'template',
        metadata: data.template.metadata
      });
    });
    
    // 连接冲突检测器和模板引擎
    this.conflictDetector.on('conflict.detected', (data) => {
      if (this.options.debug) {
        console.warn('Conflict detected:', data);
      }
      
      // 使用模板引擎的冲突处理器
      if (data.type === 'css') {
        this.templateEngine.conflictHandlers.style(data.selector, data.target);
      } else if (data.type === 'name') {
        this.templateEngine.conflictHandlers.name(data.name, data.target);
      }
    });
    
    // 连接沙箱桥接器和事件系统
    this.sandboxBridge.on('message.received', (data) => {
      this.emit('message.received', data);
      
      // 处理特定类型的消息
      if (data.payload && data.payload.type === 'resource.request') {
        const { resourceType, resourceId } = data.payload;
        let resource = null;
        
        // 获取请求的资源
        if (resourceType === 'style') {
          resource = this.resourceHub.getStyleVariable(resourceId);
        } else if (resourceType === 'component') {
          resource = this.resourceHub.getComponent(resourceId);
        } else if (resourceType === 'script') {
          resource = this.resourceHub.getScript(resourceId);
        } else if (resourceType === 'data') {
          resource = this.resourceHub.getDataModel(resourceId);
        }
        
        // 响应请求
        this.sandboxBridge.respondToMessage(data.id, {
          resourceType,
          resourceId,
          resource,
          success: !!resource
        });
      }
    });
    
    // 连接模板市场和模板引擎
    this.templateMarket.on('template.published', (data) => {
      // 将发布的模板添加到模板引擎
      this.templateEngine.saveTemplate(data.templateId, data.template, {
        sourceEnvironment: data.environment,
        author: data.author
      });
    });
  }
  
  /**
   * 生成页面元数据
   * @param {Object} page - 页面对象
   * @returns {string} 元数据HTML
   * @private
   */
  _generatePageMeta(page) {
    let metaHtml = '';
    
    if (page.meta) {
      for (const [key, value] of Object.entries(page.meta)) {
        metaHtml += `  <meta name="${key}" content="${value}">\n`;
      }
    }
    
    return metaHtml;
  }
  
  /**
   * 生成页面样式
   * @param {Object} page - 页面对象
   * @param {Object} site - 站点对象
   * @returns {string} 样式HTML
   * @private
   */
  _generatePageStyles(page, site) {
    let stylesHtml = `  <style>
    :root {
`;
    
    // 添加全局样式变量
    for (const [key, variable] of Object.entries(this.resourceHub.styleVariables)) {
      if (variable.access === 'public' || variable.scope === 'system') {
        stylesHtml += `      ${key}: ${variable.value};\n`;
      }
    }
    
    stylesHtml += `    }
    
    /* 站点样式 */
    [data-site="${site.id}"] {
      font-family: sans-serif;
    }
    
    /* 页面容器 */
    .unicanvas-page-container {
      width: 100%;
      margin: 0 auto;
      position: relative;
    }
    
    /* 组件样式 */
`;
    
    // 添加组件样式
    page.components.forEach(component => {
      if (component.style) {
        stylesHtml += `    /* ${component.name} */\n`;
        stylesHtml += `    ${component.style}\n\n`;
      }
    });
    
    stylesHtml += `  </style>`;
    
    return stylesHtml;
  }
  
  /**
   * 生成页面脚本
   * @param {Object} page - 页面对象
   * @param {Object} site - 站点对象
   * @returns {string} 脚本HTML
   * @private
   */
  _generatePageScripts(page, site) {
    let scriptsHtml = `  <script>
    // UniCanvas 运行时
    window.UniCanvas = {
      siteId: "${site.id}",
      pageId: "${page.id}",
      components: {},
      data: {},
      events: new EventEmitter(),
      
      // 初始化函数
      init() {
        console.log("UniCanvas initialized for page ${page.id}");
        this.setupComponents();
        this.setupCommunication();
      },
      
      // 设置组件
      setupComponents() {
`;
    
    // 添加组件初始化代码
    page.components.forEach(component => {
      scriptsHtml += `        // 初始化组件: ${component.name}\n`;
      scriptsHtml += `        this.components["${component.id}"] = {\n`;
      scriptsHtml += `          id: "${component.id}",\n`;
      scriptsHtml += `          type: "${component.type}",\n`;
      scriptsHtml += `          data: ${JSON.stringify(component.data)}\n`;
      scriptsHtml += `        };\n\n`;
    });
    
    scriptsHtml += `      },
      
      // 设置通信
      setupCommunication() {
        window.addEventListener("message", (event) => {
          // 消息处理逻辑
          if (event.data && event.data.target === "site_${site.id}") {
            this.events.emit("message", event.data);
          }
        });
      }
    };
    
    // 组件脚本
`;
    
    // 添加组件脚本
    page.components.forEach(component => {
      if (component.script) {
        scriptsHtml += `    // ${component.name} 脚本\n`;
        scriptsHtml += `    (function() {\n`;
        scriptsHtml += `      ${component.script}\n`;
        scriptsHtml += `    })();\n\n`;
      }
    });
    
    scriptsHtml += `    
    // 初始化
    document.addEventListener("DOMContentLoaded", () => {
      UniCanvas.init();
    });
  </script>`;
    
    return scriptsHtml;
  }
  
  /**
   * 渲染页面内容
   * @param {Object} page - 页面对象
   * @param {Object} site - 站点对象
   * @param {Object} options - 渲染选项
   * @returns {string} 内容HTML
   * @private
   */
  _renderPageContent(page, site, options) {
    let contentHtml = '';
    
    // 如果有页面内容，直接使用
    if (page.content) {
      contentHtml = page.content;
    } else {
      // 否则渲染组件
      page.components.forEach(component => {
        contentHtml += `<div class="unicanvas-component" data-component-id="${component.id}" data-component-type="${component.type}">
      ${component.content}
    </div>\n`;
      });
    }
    
    return contentHtml;
  }
  
  /**
   * 获取系统状态
   * @returns {Object} 系统状态信息
   */
  getSystemStatus() {
    return {
      version: this.version,
      sites: Object.keys(this.sites).length,
      pages: Object.keys(this.pages).length,
      resources: this.resourceHub.getResourceStats(),
      templates: Object.keys(this.templateEngine.templates).length,
      uptime: process.uptime ? process.uptime() : 0
    };
  }
}

// 导出模块
export default UniCanvas;
