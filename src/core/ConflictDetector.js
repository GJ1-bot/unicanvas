/**
 * ConflictDetector.js
 * 冲突检测系统，负责检测和解决资源冲突
 */
import EventEmitter from './EventEmitter.js';
import { UniCanvasError } from './UniCanvasError.js';

class ConflictDetector extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      autoResolve: options.autoResolve !== false,
      strictMode: options.strictMode || false,
      trackHistory: options.trackHistory !== false,
      debug: options.debug || false,
      ...options
    };
    
    this.conflicts = [];
    this.resolutions = {};
    this.cssSelectors = new Set();
    this.jsVariables = new Set();
    this.resourceIds = new Set();
    
    if (this.options.debug) {
      console.log('ConflictDetector initialized with options:', this.options);
    }
  }
  
  /**
   * 检查冲突
   * @param {Object} resource - 资源对象
   * @returns {Array} 检测到的冲突
   */
  checkConflicts(resource) {
    if (!resource || typeof resource !== 'object') {
      throw new UniCanvasError('INVALID_RESOURCE', 'Resource must be an object');
    }
    
    const detectedConflicts = [];
    
    // 根据资源类型检查不同的冲突
    switch (resource.type) {
      case 'css':
        detectedConflicts.push(...this._checkCssConflicts(resource));
        break;
      case 'js':
        detectedConflicts.push(...this._checkJsConflicts(resource));
        break;
      case 'template':
        detectedConflicts.push(...this._checkTemplateConflicts(resource));
        break;
      case 'component':
        detectedConflicts.push(...this._checkComponentConflicts(resource));
        break;
      default:
        if (this.options.debug) {
          console.warn(`Unknown resource type: ${resource.type}`);
        }
    }
    
    // 记录冲突
    if (detectedConflicts.length > 0) {
      this._recordConflicts(detectedConflicts, resource);
      
      // 触发冲突检测事件
      detectedConflicts.forEach(conflict => {
        this.emit('conflict.detected', {
          ...conflict,
          resourceType: resource.type,
          source: resource.source,
          target: resource.target
        });
      });
      
      // 如果启用了自动解决，尝试解决冲突
      if (this.options.autoResolve) {
        detectedConflicts.forEach(conflict => {
          this.resolveConflict(conflict);
        });
      }
    }
    
    return detectedConflicts;
  }
  
  /**
   * 解决冲突
   * @param {Object} conflict - 冲突对象
   * @returns {Object|null} 解决结果或null
   */
  resolveConflict(conflict) {
    if (!conflict || typeof conflict !== 'object') {
      throw new UniCanvasError('INVALID_CONFLICT', 'Conflict must be an object');
    }
    
    if (!conflict.id) {
      conflict.id = `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    let resolution = null;
    
    // 根据冲突类型应用不同的解决策略
    switch (conflict.type) {
      case 'css':
        resolution = this._resolveCssConflict(conflict);
        break;
      case 'js':
        resolution = this._resolveJsConflict(conflict);
        break;
      case 'id':
        resolution = this._resolveIdConflict(conflict);
        break;
      case 'name':
        resolution = this._resolveNameConflict(conflict);
        break;
      default:
        if (this.options.debug) {
          console.warn(`Unknown conflict type: ${conflict.type}`);
        }
    }
    
    // 记录解决结果
    if (resolution) {
      this.resolutions[conflict.id] = resolution;
      
      // 触发冲突解决事件
      this.emit('conflict.resolved', {
        conflictId: conflict.id,
        conflict,
        resolution
      });
    }
    
    return resolution;
  }
  
  /**
   * 注册CSS选择器
   * @param {string} selector - CSS选择器
   * @param {Object} context - 上下文信息
   * @returns {boolean} 是否已存在
   */
  registerCssSelector(selector, context = {}) {
    const exists = this.cssSelectors.has(selector);
    
    if (!exists) {
      this.cssSelectors.add(selector);
    } else if (this.options.debug) {
      console.warn(`CSS selector already registered: ${selector}`);
    }
    
    return exists;
  }
  
  /**
   * 注册JavaScript变量
   * @param {string} variable - 变量名
   * @param {Object} context - 上下文信息
   * @returns {boolean} 是否已存在
   */
  registerJsVariable(variable, context = {}) {
    const exists = this.jsVariables.has(variable);
    
    if (!exists) {
      this.jsVariables.add(variable);
    } else if (this.options.debug) {
      console.warn(`JavaScript variable already registered: ${variable}`);
    }
    
    return exists;
  }
  
  /**
   * 注册资源ID
   * @param {string} id - 资源ID
   * @param {Object} context - 上下文信息
   * @returns {boolean} 是否已存在
   */
  registerResourceId(id, context = {}) {
    const exists = this.resourceIds.has(id);
    
    if (!exists) {
      this.resourceIds.add(id);
    } else if (this.options.debug) {
      console.warn(`Resource ID already registered: ${id}`);
    }
    
    return exists;
  }
  
  /**
   * 获取冲突历史
   * @param {number} limit - 限制数量
   * @returns {Array} 冲突历史
   */
  getConflictHistory(limit = 10) {
    return this.conflicts.slice(0, limit);
  }
  
  /**
   * 获取解决方案
   * @param {string} conflictId - 冲突ID
   * @returns {Object|null} 解决方案或null
   */
  getResolution(conflictId) {
    return this.resolutions[conflictId] || null;
  }
  
  /**
   * 检查CSS冲突
   * @param {Object} resource - 资源对象
   * @returns {Array} 冲突列表
   * @private
   */
  _checkCssConflicts(resource) {
    const conflicts = [];
    
    if (!resource.content) {
      return conflicts;
    }
    
    // 提取CSS选择器
    const selectorRegex = /([^\{\}]+)(?=\s*\{)/g;
    let match;
    
    while ((match = selectorRegex.exec(resource.content)) !== null) {
      const selector = match[1].trim();
      
      // 检查选择器是否已存在
      if (this.cssSelectors.has(selector)) {
        conflicts.push({
          type: 'css',
          selector,
          source: resource.source,
          target: resource.target,
          severity: 'medium',
          message: `CSS selector conflict: ${selector}`
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * 检查JavaScript冲突
   * @param {Object} resource - 资源对象
   * @returns {Array} 冲突列表
   * @private
   */
  _checkJsConflicts(resource) {
    const conflicts = [];
    
    if (!resource.content) {
      return conflicts;
    }
    
    // 提取变量声明
    const varRegex = /(?:var|let|const)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g;
    let match;
    
    while ((match = varRegex.exec(resource.content)) !== null) {
      const variable = match[1];
      
      // 检查变量是否已存在
      if (this.jsVariables.has(variable)) {
        conflicts.push({
          type: 'js',
          variable,
          source: resource.source,
          target: resource.target,
          severity: 'high',
          message: `JavaScript variable conflict: ${variable}`
        });
      }
    }
    
    return conflicts;
  }
  
  /**
   * 检查模板冲突
   * @param {Object} resource - 资源对象
   * @returns {Array} 冲突列表
   * @private
   */
  _checkTemplateConflicts(resource) {
    const conflicts = [];
    
    // 检查模板ID冲突
    if (resource.source && this.resourceIds.has(resource.source)) {
      conflicts.push({
        type: 'id',
        id: resource.source,
        source: resource.source,
        target: resource.target,
        severity: 'medium',
        message: `Template ID conflict: ${resource.source}`
      });
    }
    
    // 如果模板包含CSS，检查CSS冲突
    if (resource.content && resource.content.css) {
      const cssResource = {
        type: 'css',
        content: resource.content.css,
        source: resource.source,
        target: resource.target
      };
      
      conflicts.push(...this._checkCssConflicts(cssResource));
    }
    
    // 如果模板包含JS，检查JS冲突
    if (resource.content && resource.content.script) {
      const jsResource = {
        type: 'js',
        content: resource.content.script,
        source: resource.source,
        target: resource.target
      };
      
      conflicts.push(...this._checkJsConflicts(jsResource));
    }
    
    return conflicts;
  }
  
  /**
   * 检查组件冲突
   * @param {Object} resource - 资源对象
   * @returns {Array} 冲突列表
   * @private
   */
  _checkComponentConflicts(resource) {
    const conflicts = [];
    
    // 检查组件名称冲突
    if (resource.name) {
      // 提取组件名称
      const componentName = resource.name;
      
      // 检查名称是否已存在
      if (this.resourceIds.has(`component_${componentName}`)) {
        conflicts.push({
          type: 'name',
          name: componentName,
          source: resource.source,
          target: resource.target,
          severity: 'low',
          message: `Component name conflict: ${componentName}`
        });
      } else {
        // 注册组件名称
        this
        // 注册组件名称
        this.resourceIds.add(`component_${componentName}`);
      }
    }
    
    return conflicts;
  }
  
  /**
   * 记录冲突
   * @param {Array} conflicts - 冲突列表
   * @param {Object} resource - 资源对象
   * @private
   */
  _recordConflicts(conflicts, resource) {
    if (!this.options.trackHistory) {
      return;
    }
    
    conflicts.forEach(conflict => {
      conflict.id = conflict.id || `conflict_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      conflict.timestamp = Date.now();
      conflict.resourceType = resource.type;
      
      this.conflicts.unshift(conflict);
    });
    
    // 限制历史大小
    if (this.conflicts.length > 100) {
      this.conflicts = this.conflicts.slice(0, 100);
    }
  }
  
  /**
   * 解决CSS冲突
   * @param {Object} conflict - 冲突对象
   * @returns {Object} 解决方案
   * @private
   */
  _resolveCssConflict(conflict) {
    // 创建新的选择器，添加目标环境前缀
    const newSelector = `[data-env="${conflict.target}"] ${conflict.selector}`;
    
    return {
      type: 'css',
      original: conflict.selector,
      resolved: newSelector,
      strategy: 'prefix',
      timestamp: Date.now()
    };
  }
  
  /**
   * 解决JavaScript变量冲突
   * @param {Object} conflict - 冲突对象
   * @returns {Object} 解决方案
   * @private
   */
  _resolveJsConflict(conflict) {
    // 创建新的变量名，添加目标环境前缀
    const newVariable = `${conflict.target}_${conflict.variable}`;
    
    return {
      type: 'js',
      original: conflict.variable,
      resolved: newVariable,
      strategy: 'rename',
      timestamp: Date.now()
    };
  }
  
  /**
   * 解决ID冲突
   * @param {Object} conflict - 冲突对象
   * @returns {Object} 解决方案
   * @private
   */
  _resolveIdConflict(conflict) {
    // 创建新的ID，添加时间戳
    const newId = `${conflict.id}_${Date.now()}`;
    
    return {
      type: 'id',
      original: conflict.id,
      resolved: newId,
      strategy: 'timestamp',
      timestamp: Date.now()
    };
  }
  
  /**
   * 解决名称冲突
   * @param {Object} conflict - 冲突对象
   * @returns {Object} 解决方案
   * @private
   */
  _resolveNameConflict(conflict) {
    // 创建新的名称，添加目标环境前缀
    const newName = `${conflict.target}_${conflict.name}`;
    
    return {
      type: 'name',
      original: conflict.name,
      resolved: newName,
      strategy: 'prefix',
      timestamp: Date.now()
    };
  }
  
  /**
   * 清除所有注册的资源
   */
  clear() {
    this.cssSelectors.clear();
    this.jsVariables.clear();
    this.resourceIds.clear();
    this.conflicts = [];
    this.resolutions = {};
    
    if (this.options.debug) {
      console.log('ConflictDetector cleared');
    }
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    return {
      cssSelectors: this.cssSelectors.size,
      jsVariables: this.jsVariables.size,
      resourceIds: this.resourceIds.size,
      conflicts: this.conflicts.length,
      resolutions: Object.keys(this.resolutions).length
    };
  }
}

// 导出模块
export default ConflictDetector;
