/**
 * GlobalResourceHub.js
 * 全局资源中心，负责管理和协调跨页面/站点的共享资源
 */
class GlobalResourceHub {
  constructor(options = {}) {
    this.styleVariables = {};
    this.components = {};
    this.scripts = {};
    this.dataModels = {};
    this.permissions = options.permissions || { 
      allowGlobalAccess: false,
      restrictedVars: []
    };
    this.inheritanceConfig = {
      enabled: options.enableInheritance || false,
      strategy: options.inheritanceStrategy || 'shallow'
    };
    
    // 初始化内置变量
    this._initBuiltInVariables();
  }
  
  /**
   * 注册样式变量
   * @param {string} id - 变量ID
   * @param {string} value - 变量值
   * @param {Object} options - 配置选项
   * @returns {string} 注册的变量ID
   */
  registerStyleVariable(id, value, options = {}) {
    if (!id || typeof id !== 'string') {
      throw new UniCanvasError('INVALID_ID', 'Style variable ID must be a string');
    }
    
    const scope = options.scope || 'global';
    const access = options.access || 'public';
    
    // 检查权限
    if (access === 'restricted' && !this.permissions.allowGlobalAccess) {
      this.permissions.restrictedVars.push(id);
    }
    
    this.styleVariables[id] = {
      value,
      scope,
      access,
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return id;
  }
  
  /**
   * 获取样式变量
   * @param {string} id - 变量ID
   * @param {Object} options - 获取选项
   * @returns {string|null} 变量值或null
   */
  getStyleVariable(id, options = {}) {
    if (!this.styleVariables[id]) {
      return null;
    }
    
    const variable = this.styleVariables[id];
    
    // 检查访问权限
    if (variable.access === 'restricted' && 
        this.permissions.restrictedVars.includes(id) && 
        !options.bypassRestriction) {
      throw new UniCanvasError(
        'ACCESS_DENIED', 
        `Access to restricted variable ${id} denied`
      );
    }
    
    return variable.value;
  }
  
  /**
   * 注册组件
   * @param {string} id - 组件ID
   * @param {Object} component - 组件定义
   * @param {Object} options - 配置选项
   * @returns {string} 注册的组件ID
   */
  registerComponent(id, component, options = {}) {
    if (!id || typeof id !== 'string') {
      throw new UniCanvasError('INVALID_ID', 'Component ID must be a string');
    }
    
    if (!component || typeof component !== 'object') {
      throw new UniCanvasError('INVALID_COMPONENT', 'Component must be an object');
    }
    
    const scope = options.scope || 'global';
    const access = options.access || 'public';
    
    this.components[id] = {
      definition: component,
      scope,
      access,
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return id;
  }
  
  /**
   * 获取组件
   * @param {string} id - 组件ID
   * @param {Object} options - 获取选项
   * @returns {Object|null} 组件定义或null
   */
  getComponent(id, options = {}) {
    if (!this.components[id]) {
      return null;
    }
    
    const component = this.components[id];
    
    // 检查访问权限
    if (component.access === 'restricted' && !options.bypassRestriction) {
      throw new UniCanvasError(
        'ACCESS_DENIED', 
        `Access to restricted component ${id} denied`
      );
    }
    
    return component.definition;
  }
  
  /**
   * 注册脚本
   * @param {string} id - 脚本ID
   * @param {string|Function} script - 脚本内容或函数
   * @param {Object} options - 配置选项
   * @returns {string} 注册的脚本ID
   */
  registerScript(id, script, options = {}) {
    if (!id || typeof id !== 'string') {
      throw new UniCanvasError('INVALID_ID', 'Script ID must be a string');
    }
    
    if (!script || (typeof script !== 'string' && typeof script !== 'function')) {
      throw new UniCanvasError('INVALID_SCRIPT', 'Script must be a string or function');
    }
    
    const scope = options.scope || 'global';
    const access = options.access || 'public';
    const executeInSandbox = options.sandbox !== false; // 默认在沙箱中执行
    
    this.scripts[id] = {
      content: script,
      scope,
      access,
      sandbox: executeInSandbox,
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return id;
  }
  
  /**
   * 获取脚本
   * @param {string} id - 脚本ID
   * @param {Object} options - 获取选项
   * @returns {string|Function|null} 脚本内容或null
   */
  getScript(id, options = {}) {
    if (!this.scripts[id]) {
      return null;
    }
    
    const script = this.scripts[id];
    
    // 检查访问权限
    if (script.access === 'restricted' && !options.bypassRestriction) {
      throw new UniCanvasError(
        'ACCESS_DENIED', 
        `Access to restricted script ${id} denied`
      );
    }
    
    return script.content;
  }
  
  /**
   * 注册数据模型
   * @param {string} id - 数据模型ID
   * @param {Object} dataModel - 数据模型定义
   * @param {Object} options - 配置选项
   * @returns {string} 注册的数据模型ID
   */
  registerDataModel(id, dataModel, options = {}) {
    if (!id || typeof id !== 'string') {
      throw new UniCanvasError('INVALID_ID', 'Data model ID must be a string');
    }
    
    if (!dataModel || typeof dataModel !== 'object') {
      throw new UniCanvasError('INVALID_DATA_MODEL', 'Data model must be an object');
    }
    
    const scope = options.scope || 'global';
    const access = options.access || 'public';
    
    this.dataModels[id] = {
      schema: dataModel,
      scope,
      access,
      metadata: options.metadata || {},
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    return id;
  }
  
  /**
   * 获取数据模型
   * @param {string} id - 数据模型ID
   * @param {Object} options - 获取选项
   * @returns {Object|null} 数据模型定义或null
   */
  getDataModel(id, options = {}) {
    if (!this.dataModels[id]) {
      return null;
    }
    
    const dataModel = this.dataModels[id];
    
    // 检查访问权限
    if (dataModel.access === 'restricted' && !options.bypassRestriction) {
      throw new UniCanvasError(
        'ACCESS_DENIED', 
        `Access to restricted data model ${id} denied`
      );
    }
    
    return dataModel.schema;
  }
  
  /**
   * 配置资源继承策略
   * @param {Object} config - 继承配置
   */
  configInheritance(config) {
    if (!config || typeof config !== 'object') {
      throw new UniCanvasError('INVALID_CONFIG', 'Inheritance config must be an object');
    }
    
    this.inheritanceConfig = {
      ...this.inheritanceConfig,
      ...config
    };
    
    return this.inheritanceConfig;
  }
  
  /**
   * 获取所有资源的统计信息
   * @returns {Object} 资源统计信息
   */
  getResourceStats() {
    return {
      styleVariables: Object.keys(this.styleVariables).length,
      components: Object.keys(this.components).length,
      scripts: Object.keys(this.scripts).length,
      dataModels: Object.keys(this.dataModels).length,
      restrictedCount: this.permissions.restrictedVars.length
    };
  }
  
  /**
   * 初始化内置变量
   * @private
   */
  _initBuiltInVariables() {
    // 系统默认变量
    this.registerStyleVariable('--unicanvas-primary-color', '#3498db', { 
      scope: 'system',
      access: 'public',
      metadata: { description: 'Primary theme color' }
    });
    
    this.registerStyleVariable('--unicanvas-secondary-color', '#2ecc71', { 
      scope: 'system',
      access: 'public',
      metadata: { description: 'Secondary theme color' }
    });
    
    this.registerStyleVariable('--unicanvas-text-color', '#333333', { 
      scope: 'system',
      access: 'public',
      metadata: { description: 'Default text color' }
    });
  }
}

// 导出模块
export default GlobalResourceHub;
