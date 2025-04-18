/**
 * SmartTemplateEngine.js
 * 智能模板引擎，负责模板的创建、保存、适配和应用
 */
class SmartTemplateEngine {
  constructor(options = {}) {
    this.templates = {};
    this.options = {
      autoAdapt: options.autoAdapt !== false,
      preserveOriginalClasses: options.preserveOriginalClasses || false,
      adaptDataSources: options.adaptDataSources !== false,
      debug: options.debug || false
    };
    
    this.conflictHandlers = {
      name: options.nameConflictHandler || this._defaultNameConflictHandler,
      style: options.styleConflictHandler || this._defaultStyleConflictHandler,
      data: options.dataConflictHandler || this._defaultDataConflictHandler
    };
    
    if (this.options.debug) {
      console.log('SmartTemplateEngine initialized with options:', this.options);
    }
  }
  
  /**
   * 保存模板
   * @param {string} id - 模板ID
   * @param {Object} template - 模板定义
   * @param {Object} options - 保存选项
   * @returns {string} 保存的模板ID
   */
  saveTemplate(id, template, options = {}) {
    if (!id || typeof id !== 'string') {
      throw new UniCanvasError('INVALID_ID', 'Template ID must be a string');
    }
    
    if (!template || typeof template !== 'object') {
      throw new UniCanvasError('INVALID_TEMPLATE', 'Template must be an object');
    }
    
    // 处理模板元数据
    const metadata = {
      createdAt: new Date(),
      updatedAt: new Date(),
      sourceEnvironment: options.sourceEnvironment || null,
      version: options.version || '1.0.0',
      author: options.author || null,
      description: options.description || '',
      tags: options.tags || [],
      ...template.metadata
    };
    
    // 保存模板
    this.templates[id] = {
      ...template,
      metadata
    };
    
    if (this.options.debug) {
      console.log(`Template saved with ID: ${id}`);
    }
    
    return id;
  }
  
  /**
   * 获取模板
   * @param {string} id - 模板ID
   * @returns {Object|null} 模板定义或null
   */
  getTemplate(id) {
    if (!this.templates[id]) {
      return null;
    }
    
    return this.templates[id];
  }
  
  /**
   * 应用模板到目标环境
   * @param {string} templateId - 模板ID
   * @param {Object} targetEnvironment - 目标环境信息
   * @param {Object} options - 应用选项
   * @returns {Object} 适配后的模板
   */
  applyTemplate(templateId, targetEnvironment, options = {}) {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new UniCanvasError(
        'TEMPLATE_NOT_FOUND',
        `Template ${templateId} not found`,
        { templateId }
      );
    }
    
    if (!targetEnvironment || !targetEnvironment.id) {
      throw new UniCanvasError(
        'INVALID_TARGET',
        'Target environment must have an ID',
        { targetEnvironment }
      );
    }
    
    // 合并选项
    const applyOptions = {
      ...this.options,
      ...options
    };
    
    // 获取源环境
    const sourceEnvironment = template.metadata.sourceEnvironment || { id: 'default' };
    
    // 如果源环境和目标环境相同，直接返回模板
    if (sourceEnvironment.id === targetEnvironment.id) {
      return template;
    }
    
    if (this.options.debug) {
      console.log(`Applying template ${templateId} from ${sourceEnvironment.id} to ${targetEnvironment.id}`);
    }
    
    // 开始适配过程
    const adaptedTemplate = JSON.parse(JSON.stringify(template)); // 深拷贝
    
    // 1. 适配类名
    if (!applyOptions.preserveOriginalClasses) {
      this._adaptClassNames(adaptedTemplate, sourceEnvironment, targetEnvironment);
    }
    
    // 2. 适配数据路径
    if (applyOptions.adaptDataSources) {
      adaptedTemplate.data = this._transformDataPaths(
        adaptedTemplate.data || {},
        sourceEnvironment,
        targetEnvironment
      );
    }
    
    // 3. 更新元数据
    adaptedTemplate.metadata = {
      ...adaptedTemplate.metadata,
      adaptedFrom: templateId,
      adaptedAt: new Date(),
      targetEnvironment: targetEnvironment.id
    };
    
    if (this.options.debug) {
      console.log('Template adaptation complete');
    }
    
    return adaptedTemplate;
  }
  
  /**
   * 设置冲突处理器
   * @param {Object} handlers - 处理器对象
   */
  onConflict(handlers) {
    if (!handlers || typeof handlers !== 'object') {
      throw new UniCanvasError('INVALID_HANDLERS', 'Handlers must be an object');
    }
    
    this.conflictHandlers = {
      ...this.conflictHandlers,
      ...handlers
    };
    
    return this;
  }
  
  /**
   * 批量导入模板
   * @param {Array} templates - 模板数组
   * @param {Object} options - 导入选项
   * @returns {Array} 导入的模板ID列表
   */
  importTemplates(templates, options = {}) {
    if (!Array.isArray(templates)) {
      throw new UniCanvasError('INVALID_TEMPLATES', 'Templates must be an array');
    }
    
    const importedIds = [];
    
    templates.forEach(template => {
      try {
        const id = template.id || `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        this.saveTemplate(id, template, options);
        importedIds.push(id);
      } catch (error) {
        if (options.continueOnError) {
          console.error('Error importing template:', error);
        } else {
          throw error;
        }
      }
    });
    
    if (this.options.debug) {
      console.log(`Imported ${importedIds.length} templates`);
    }
    
    return importedIds;
  }
  
  /**
   * 导出模板
   * @param {string} templateId - 模板ID
   * @param {Object} options - 导出选项
   * @returns {Object} 导出的模板
   */
  exportTemplate(templateId, options = {}) {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new UniCanvasError(
        'TEMPLATE_NOT_FOUND',
        `Template ${templateId} not found`,
        { templateId }
      );
    }
    
    // 创建导出版本
    const exportedTemplate = JSON.parse(JSON.stringify(template));
    
    // 添加导出元数据
    exportedTemplate.metadata = {
      ...exportedTemplate.metadata,
      exportedAt: new Date(),
      exportVersion: options.version || exportedTemplate.metadata.version
    };
    
    // 如果需要，移除敏感信息
    if (options.removeSensitiveData) {
      delete exportedTemplate.metadata.author;
      delete exportedTemplate.metadata.sourceEnvironment;
    }
    
    // 如果需要，添加导出格式信息
    if (options.format) {
      exportedTemplate.metadata.format = options.format;
    }
    
    return exportedTemplate;
  }
  
  /**
   * 适配类名
   * @param {Object} template - 模板对象
   * @param {Object} sourceEnv - 源环境
   * @param {Object} targetEnv - 目标环境
   * @private
   */
  _adaptClassNames(template, sourceEnv, targetEnv) {
    if (!template.html) {
      return;
    }
    
    // 提取所有类名
    const classRegex = /class=["']([^"']+)["']/g;
    let match;
    const classNames = new Set();
    
    while ((match = classRegex.exec(template.html)) !== null) {
      match[1].split(/\s+/).forEach(className => {
        if (className) classNames.add(className);
      });
    }
    
    // 适配每个类名
    classNames.forEach(className => {
      // 检查是否需要适配
      if (this._shouldAdaptClassName(className, sourceEnv, targetEnv)) {
        const adaptedName = this.conflictHandlers.name(className, targetEnv, sourceEnv);
        
        // 替换HTML中的类名
        template.html = template.html.replace(
          new RegExp(`(class=["'][^"']*)(\\b${className}\\b)([^"']*)["']`, 'g'),
          `$1${adaptedName}$3"`
        );
        
        // 替换CSS中的类名
        if (template.css) {
          template.css = template.css.replace(
            new RegExp(`\\.${className}(\\s|\\{|:)`, 'g'),
            `.${adaptedName}$1`
          );
        }
      }
    });
  }
  
  /**
   * 转换数据路径
   * @param {Object} data - 数据对象
   * @param {Object} sourceEnv - 源环境
   * @param {Object} targetEnv - 目标环境
   * @returns {Object} 转换后的数据
   * @private
   */
  _transformDataPaths(data, sourceEnv, targetEnv) {
    const transformedData = {};
    
    // 递归处理数据对象
    const processObject = (obj, path = '') => {
      if (!obj || typeof obj !== 'object') {
        return obj;
      }
      
      if (Array.isArray(obj)) {
        return obj.map(item => processObject(item));
      }
      
      const result = {};
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const fullPath = path ? `${path}.${key}` : key;
          
          // 检查是否需要转换路径
          if (typeof value === 'string' && value.startsWith('$data.')) {
            // 数据引用路径
            const dataPath = value.substring(6);
            const adaptedPath = this.conflictHandlers.data(dataPath, targetEnv, sourceEnv);
            result[key] = `$data.${adaptedPath}`;
          } else if (typeof value === 'object' && value !== null) {
            // 递归处理嵌套对象
            result[key] = processObject(value, fullPath);
          } else {
            // 保持原值
            result[key] = value;
          }
        }
      }
      
      return result;
    };
    
    return processObject(data);
  }
  
  /**
   * 检查类名是否需要适配
   * @param {string} className - 类名
   * @param {Object} sourceEnv - 源环境
   * @param {Object} targetEnv - 目标环境
   * @returns {boolean} 是否需要适配
   * @private
   */
  _shouldAdaptClassName(className, sourceEnv, targetEnv) {
    // 系统类名不适配
    if (className.startsWith('unicanvas-') || className.startsWith('uc-')) {
      return false;
    }
    
    // 已经包含环境前缀的类名不适配
    if (className.startsWith(`${sourceEnv.id}-`)) {
      return true;
    }
    
    return true;
  }
  
  /**
   * 默认类名冲突处理器
   * @param {string} className - 原始类名
   * @param {Object} targetEnv - 目标环境
   * @returns {string} 处理后的类名
   * @private
   */
  _defaultNameConflictHandler(className, targetEnv) {
    return `${targetEnv.id}-${className}`;
  }
  
  /**
   * 默认样式冲突处理器
   * @param {string} selector - CSS选择器
   * @param {Object} targetEnv - 目标环境
   * @returns {string} 处理后的选择器
   * @private
   */
  _defaultStyleConflictHandler(selector, targetEnv) {
    // 为选择器添加环境前缀
    return `[data-env="${targetEnv.id}"] ${selector}`;
  }
  
  /**
   * 默认数据路径冲突处理器
   * @param {string} path - 数据路径
   * @param {Object} targetEnv - 目标环境
   * @returns {string} 处理后的路径
   * @private
   */
  _defaultDataConflictHandler(path, targetEnv) {
    // 为数据路径添加环境前缀
    if (path.startsWith('/')) {
      return `/${targetEnv.id}${path}`;
    }
    return `${targetEnv.id}.${path}`;
  }
  
  /**
   * 搜索模板
   * @param {Object} criteria - 搜索条件
   * @returns {Array} 匹配的模板ID列表
   */
  searchTemplates(criteria = {}) {
    const results = [];
    
    for (const id in this.templates) {
      if (Object.prototype.hasOwnProperty.call(this.templates, id)) {
        const template = this.templates[id];
        let match = true;
        
        // 检查标签
        if (criteria.tags && Array.isArray(criteria.tags)) {
          const templateTags = template.metadata.tags || [];
          match = criteria.tags.every(tag => templateTags.includes(tag));
        }
        
        // 检查作者
        if (criteria.author && match) {
          match = template.metadata.author === criteria.author;
        }
        
        // 检查环境
        if (criteria.environment && match) {
          match = template.metadata.sourceEnvironment?.id === criteria.environment;
        }
        
        // 检查关键词
        if (criteria.keyword && match) {
          const keyword = criteria.keyword.toLowerCase();
          const description = (template.metadata.description || '').toLowerCase();
          const name = (template.metadata.name || '').toLowerCase();
          match = description.includes(keyword) || name.includes(keyword);
        }
        
        if (match) {
          results.push(id);
        }
      }
    }
    
    return results;
  }
}

// 导出模块
export default SmartTemplateEngine;
