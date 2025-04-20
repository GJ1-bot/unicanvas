/**
 * TemplateMarket.js
 * 模板市场，负责模板的发布、搜索和使用
 */
import EventEmitter from './EventEmitter.js';
import { UniCanvasError } from './UniCanvasError.js';

class TemplateMarket extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      enableRating: options.enableRating !== false,
      enableComments: options.enableComments !== false,
      requireApproval: options.requireApproval || false,
      debug: options.debug || false,
      ...options
    };
    
    this.templates = {};
    this.categories = {};
    this.tags = new Set();
    this.authors = new Set();
    
    // 初始化默认类别
    this._initDefaultCategories();
    
    if (this.options.debug) {
      console.log('TemplateMarket initialized with options:', this.options);
    }
  }
  
  /**
   * 发布模板
   * @param {Object} template - 模板定义
   * @param {Object} metadata - 元数据
   * @returns {string} 发布的模板ID
   */
  publishTemplate(template, metadata = {}) {
    if (!template || typeof template !== 'object') {
      throw new UniCanvasError('INVALID_TEMPLATE', 'Template must be an object');
    }
    
    if (!metadata.name) {
      throw new UniCanvasError('INVALID_METADATA', 'Template name is required');
    }
    
    // 生成模板ID
    const templateId = metadata.id || `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // 检查ID是否已存在
    if (this.templates[templateId]) {
      throw new UniCanvasError('TEMPLATE_EXISTS', `Template with ID ${templateId} already exists`);
    }
    
    // 处理标签
    const tags = metadata.tags || [];
    tags.forEach(tag => this.tags.add(tag));
    
    // 处理作者
    if (metadata.author) {
      this.authors.add(metadata.author);
    }
    
    // 处理类别
    const category = metadata.category || 'uncategorized';
    if (!this.categories[category]) {
      this.categories[category] = {
        name: category,
        description: `Templates in ${category} category`,
        templates: []
      };
    }
    this.categories[category].templates.push(templateId);
    
    // 创建完整的模板对象
    this.templates[templateId] = {
      id: templateId,
      template,
      metadata: {
        name: metadata.name,
        description: metadata.description || '',
        author: metadata.author || 'anonymous',
        version: metadata.version || '1.0.0',
        tags,
        category,
        createdAt: new Date(),
        updatedAt: new Date(),
        downloads: 0,
        rating: {
          average: 0,
          count: 0,
          total: 0
        },
        comments: [],
        status: this.options.requireApproval ? 'pending' : 'approved'
      }
    };
    
    // 触发模板发布事件
    this.emit('template.published', {
      templateId,
      template,
      metadata: this.templates[templateId].metadata,
      environment: metadata.environment || null,
      author: metadata.author || 'anonymous'
    });
    
    if (this.options.debug) {
      console.log(`Template published: ${templateId}`, this.templates[templateId].metadata);
    }
    
    return templateId;
  }
  
  /**
   * 获取模板
   * @param {string} templateId - 模板ID
   * @returns {Object|null} 模板对象或null
   */
  getTemplate(templateId) {
    const template = this.templates[templateId];
    
    if (!template) {
      return null;
    }
    
    // 检查状态
    if (template.metadata.status !== 'approved' && !this.options.debug) {
      return null;
    }
    
    // 增加下载计数
    template.metadata.downloads++;
    template.metadata.updatedAt = new Date();
    
    // 触发模板下载事件
    this.emit('template.downloaded', {
      templateId,
      downloads: template.metadata.downloads
    });
    
    return {
      ...template,
      template: { ...template.template } // 返回副本
    };
  }
  
  /**
   * 搜索模板
   * @param {Object} criteria - 搜索条件
   * @returns {Array} 匹配的模板ID列表
   */
  searchTemplates(criteria = {}) {
    const results = [];
    
    // 处理搜索条件
    const query = criteria.query ? criteria.query.toLowerCase() : '';
    const tags = criteria.tags || [];
    const author = criteria.author;
    const category = criteria.category;
    const sortBy = criteria.sortBy || 'relevance';
    const limit = criteria.limit || 20;
    
    // 遍历所有模板
    for (const id in this.templates) {
      if (Object.prototype.hasOwnProperty.call(this.templates, id)) {
        const template = this.templates[id];
        
        // 跳过未批准的模板
        if (template.metadata.status !== 'approved' && !this.options.debug) {
          continue;
        }
        
        let match = true;
        
        // 检查查询
        if (query) {
          const name = template.metadata.name.toLowerCase();
          const description = template.metadata.description.toLowerCase();
          match = name.includes(query) || description.includes(query);
        }
        
        // 检查标签
        if (match && tags.length > 0) {
          match = tags.every(tag => template.metadata.tags.includes(tag));
        }
        
        // 检查作者
        if (match && author) {
          match = template.metadata.author === author;
        }
        
        // 检查类别
        if (match && category) {
          match = template.metadata.category === category;
        }
        
        if (match) {
          results.push({
            id,
            metadata: { ...template.metadata },
            score: this._calculateRelevanceScore(template, query, tags)
          });
        }
      }
    }
    
    // 排序结果
    switch (sortBy) {
      case 'downloads':
        results.sort((a, b) => b.metadata.downloads - a.metadata.downloads);
        break;
      case 'rating':
        results.sort((a, b) => b.metadata.rating.average - a.metadata.rating.average);
        break;
      case 'newest':
        results.sort((a, b) => new Date(b.metadata.createdAt) - new Date(a.metadata.createdAt));
        break;
      case 'relevance':
      default:
        results.sort((a, b) => b.score - a.score);
    }
    
    // 限制结果数量
    return results.slice(0, limit).map(result => result.id);
  }
  
  /**
   * 对模板进行评分
   * @param {string} templateId - 模板ID
   * @param {number} rating - 评分 (1-5)
   * @param {Object} options - 评分选项
   * @returns {Object} 更新后的评分信息
   */
  rateTemplate(templateId, rating, options = {}) {
    if (!this.options.enableRating) {
      throw new UniCanvasError('RATING_DISABLED', 'Rating is disabled');
    }
    
    const template = this.templates[templateId];
    
    if (!template) {
      throw new UniCanvasError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }
    
    // 验证评分
    if (rating < 1 || rating > 5 || !Number.isInteger(rating)) {
      throw new UniCanvasError('INVALID_RATING', 'Rating must be an integer between 1 and 5');
    }
    
    // 更新评分
    template.metadata.rating.count++;
    template.metadata.rating.total += rating;
    template.metadata.rating.average = template.metadata.rating.total / template.metadata.rating.count;
    template.metadata.updatedAt = new Date();
    
    // 触发评分事件
    this.emit('template.rated', {
      templateId,
      rating,
      average: template.metadata.rating.average,
      count: template.metadata.rating.count,
      userId: options.userId || 'anonymous'
    });
    
    return { ...template.metadata.rating };
  }
  
  /**
   * 添加评论
   * @param {string} templateId - 模板ID
   * @param {string} comment - 评论内容
   * @param {Object} options - 评论选项
   * @returns {string} 评论ID
   */
  addComment(templateId, comment, options = {}) {
    if (!this.options.enableComments) {
      throw new UniCanvasError('COMMENTS_DISABLED', 'Comments are disabled');
    }
    
    const template = this.templates[templateId];
    
    if (!template) {
      throw new UniCanvasError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }
    
    if (!comment || typeof comment !== 'string') {
      throw new UniCanvasError('INVALID_COMMENT', 'Comment must be a non-empty string');
    }
    
    // 创建评论对象
    const commentId = `comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const commentObj = {
      id: commentId,
      text: comment,
      author: options.author || 'anonymous',
      createdAt: new Date(),
      status: this.options.requireApproval ? 'pending' : 'approved'
    };
    
    // 添加评论
    template.metadata.comments.push(commentObj);
    template.metadata.updatedAt = new Date();
    
    // 触发评论事件
    this.emit('template.commented', {
      templateId,
      commentId,
      comment: commentObj
    });
    
    return commentId;
  }
  
  /**
   * 获取类别
   * @param {string} categoryId - 类别ID
   * @returns {Object|null} 类别对象或null
   */
  getCategory(categoryId) {
    return this.categories[categoryId] || null;
  }
  
  /**
   * 获取所有类别
   * @returns {Object} 类别对象
   */
  getAllCategories() {
    return { ...this.categories };
  }
  
  /**
   * 获取所有标签
   * @returns {Array} 标签数组
   */
  getAllTags() {
    return [...this.tags];
  }
  
  /**
   * 获取所有作者
   * @returns {Array} 作者数组
   */
  getAllAuthors() {
    return [...this.authors];
  }
  
  /**
   * 批准模板
   * @param {string} templateId - 模板ID
   * @returns {boolean} 是否成功
   */
  approveTemplate(templateId) {
    const template = this.templates[templateId];
    
    if (!template) {
      throw new UniCanvasError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }
    
    template.metadata.status = 'approved';
    template.metadata.updatedAt = new Date();
    
    // 触发批准事件
    this.emit('template.approved', {
      templateId,
      metadata: template.metadata
    });
    
    return true;
  }
  
  /**
   * 拒绝模板
   * @param {string} templateId - 模板ID
   * @param {string} reason - 拒绝原因
   * @returns {boolean} 是否成功
   */
  rejectTemplate(templateId, reason = '') {
    const template = this.templates[templateId];
    
    if (!template) {
      throw new UniCanvasError('TEMPLATE_NOT_FOUND', `Template ${templateId} not found`);
    }
    
    template.metadata.status = 'rejected';
    template.metadata.rejectionReason = reason;
    template.metadata.updatedAt = new Date();
    
    // 触发拒绝事件
    this.emit('template.rejected', {
      templateId,
      reason,
      metadata: template.metadata
    });
    
    return true;
  }
  
  /**
   * 初始化默认类别
   * @private
   */
  _initDefaultCategories() {
    this.categories = {
      ui: {
        name: 'UI Components',
        description: 'User interface components like buttons, forms, and cards',
        templates: []
      },
      layout: {
        name: 'Layouts',
        description: 'Page layouts and structural templates',
        templates: []
      },
      data: {
        name: 'Data Visualization',
        description: 'Charts, graphs, and data display templates',
        templates: []
      },
      page: {
        name: 'Page Templates',
        description: 'Complete page templates for various purposes',
        templates: []
      },
      utility: {
        name: 'Utilities',
        description: 'Utility components and helper templates',
        templates: []
      },
      uncategorized: {
        name: 'Uncategorized',
        description: 'Templates without a specific category',
        templates: []
      }
    };
  }
  
  /**
   * 计算相关性分数
   * @param {Object} template - 模板对象
   * @param {string} query - 搜索查询
   * @param {Array} tags - 标签数组
   * @returns {number} 相关性分数
   * @private
   */
  _calculateRelevanceScore(template, query, tags) {
    let score = 0;
    
    // 基础分数
    score += template.metadata.downloads * 0.1; // 下载量
    score += template.metadata.rating.average * 5; // 评分
    
    // 查询匹配
    if (query) {
      const name = template.metadata.name.toLowerCase();
      const description = template.metadata.description.toLowerCase();
      
      if (name === query) {
        score += 50; // 精确匹配名称
      } else if (name.includes(query)) {
        score += 30; // 名称包含查询
      }
      
      if (description.includes(query)) {
        score += 10; // 描述包含查询
      }
    }
    
    // 标签匹配
    if (tags.length > 0) {
      const matchedTags = tags.filter(tag => template.metadata.tags.includes(tag));
      score += matchedTags.length * 15; // 每个匹配的标签加分
    }
    
    return score;
  }
  
  /**
   * 获取统计信息
   * @returns {Object} 统计信息
   */
  getStats() {
    const totalTemplates = Object.keys(this.templates).length;
    const approvedTemplates = Object.values(this.templates)
      .filter(template => template.metadata.status === 'approved').length;
    const pendingTemplates = Object.values(this.templates)
      .filter(template => template.metadata.status === 'pending').length;
    
    return {
      totalTemplates,
      approvedTemplates,
      pendingTemplates,
      categories: Object.keys(this.categories).length,
      tags: this.tags.size,
      authors: this.authors.size
    };
  }
}

// 导出模块
export default TemplateMarket;
