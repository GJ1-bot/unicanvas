/**
 * EventEmitter.js
 * 事件系统，负责处理事件的注册、触发和管理
 */
class EventEmitter {
    constructor() {
      this.events = {};
      this.maxListeners = 10;
      this.wildcardListeners = [];
    }
    
    /**
     * 注册事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听函数
     * @param {Object} options - 配置选项
     * @returns {EventEmitter} 当前实例
     */
    on(event, listener, options = {}) {
      if (typeof listener !== 'function') {
        throw new Error('Event listener must be a function');
      }
      
      // 处理通配符事件
      if (event === '*') {
        this.wildcardListeners.push({
          listener,
          once: !!options.once
        });
        return this;
      }
      
      if (!this.events[event]) {
        this.events[event] = [];
      }
      
      // 检查监听器数量限制
      if (this.events[event].length >= this.maxListeners) {
        console.warn(`Possible EventEmitter memory leak detected. ${this.events[event].length} listeners added for event "${event}"`);
      }
      
      this.events[event].push({
        listener,
        once: !!options.once,
        priority: options.priority || 0
      });
      
      // 按优先级排序
      this.events[event].sort((a, b) => b.priority - a.priority);
      
      return this;
    }
    
    /**
     * 注册一次性事件监听器
     * @param {string} event - 事件名称
     * @param {Function} listener - 监听函数
     * @param {Object} options - 配置选项
     * @returns {EventEmitter} 当前实例
     */
    once(event, listener, options = {}) {
      return this.on(event, listener, { ...options, once: true });
    }
    
    /**
     * 移除事件监听器
     * @param {string} event - 事件名称
     * @param {Function} [listener] - 监听函数
     * @returns {EventEmitter} 当前实例
     */
    off(event, listener) {
      // 处理通配符事件
      if (event === '*') {
        if (listener) {
          this.wildcardListeners = this.wildcardListeners.filter(item => item.listener !== listener);
        } else {
          this.wildcardListeners = [];
        }
        return this;
      }
      
      if (!this.events[event]) {
        return this;
      }
      
      if (listener) {
        this.events[event] = this.events[event].filter(item => item.listener !== listener);
      } else {
        delete this.events[event];
      }
      
      return this;
    }
    
    /**
     * 触发事件
     * @param {string} event - 事件名称
     * @param {*} data - 事件数据
     * @returns {boolean} 是否有监听器处理了事件
     */
    emit(event, data) {
      const hasListeners = (this.events[event] && this.events[event].length > 0) || this.wildcardListeners.length > 0;
      
      // 处理特定事件监听器
      if (this.events[event]) {
        // 创建副本，因为监听器可能会在处理过程中被移除
        const listeners = [...this.events[event]];
        
        // 执行监听器
        for (const item of listeners) {
          try {
            item.listener(data);
          } catch (error) {
            console.error(`Error in event listener for "${event}":`, error);
          }
          
          // 如果是一次性监听器，移除它
          if (item.once) {
            this.off(event, item.listener);
          }
        }
      }
      
      // 处理通配符监听器
      for (const item of [...this.wildcardListeners]) {
        try {
          item.listener(event, data);
        } catch (error) {
          console.error(`Error in wildcard event listener for "${event}":`, error);
        }
        
        // 如果是一次性监听器，移除它
        if (item.once) {
          const index = this.wildcardListeners.indexOf(item);
          if (index !== -1) {
            this.wildcardListeners.splice(index, 1);
          }
        }
      }
      
      return hasListeners;
    }
    
    /**
     * 获取事件监听器
     * @param {string} event - 事件名称
     * @returns {Array} 监听器数组
     */
    listeners(event) {
      if (event === '*') {
        return this.wildcardListeners.map(item => item.listener);
      }
      
      return this.events[event] ? this.events[event].map(item => item.listener) : [];
    }
    
    /**
     * 获取事件监听器数量
     * @param {string} event - 事件名称
     * @returns {number} 监听器数量
     */
    listenerCount(event) {
      if (event === '*') {
        return this.wildcardListeners.length;
      }
      
      return this.events[event] ? this.events[event].length : 0;
    }
    
    /**
     * 设置最大监听器数量
     * @param {number} n - 最大数量
     * @returns {EventEmitter} 当前实例
     */
    setMaxListeners(n) {
      this.maxListeners = n;
      return this;
    }
    
    /**
     * 获取所有事件名称
     * @returns {Array} 事件名称数组
     */
    eventNames() {
      return Object.keys(this.events);
    }
    
    /**
     * 移除所有监听器
     * @param {string} [event] - 事件名称
     * @returns {EventEmitter} 当前实例
     */
    removeAllListeners(event) {
      if (event) {
        delete this.events[event];
      } else {
        this.events = {};
        this.wildcardListeners = [];
      }
      
      return this;
    }
  }
  
  // 导出模块
  export default EventEmitter;
  