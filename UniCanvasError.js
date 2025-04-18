/**
 * UniCanvasError.js
 * 统一错误处理机制
 */

/**
 * UniCanvas 错误类
 * @extends Error
 */
export class UniCanvasError extends Error {
    /**
     * 创建错误实例
     * @param {string} code - 错误代码
     * @param {string} message - 错误消息
     * @param {Object} details - 错误详情
     */
    constructor(code, message, details = {}) {
      super(message);
      this.name = 'UniCanvasError';
      this.code = code;
      this.details = details;
      this.timestamp = Date.now();
      
      // 捕获堆栈跟踪
      if (Error.captureStackTrace) {
        Error.captureStackTrace(this, UniCanvasError);
      }
    }
    
    /**
     * 获取格式化的错误信息
     * @returns {string} 格式化的错误信息
     */
    format() {
      return `[${this.code}] ${this.message}`;
    }
    
    /**
     * 获取错误的JSON表示
     * @returns {Object} JSON对象
     */
    toJSON() {
      return {
        name: this.name,
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp
      };
    }
  }
  
  /**
   * 错误处理器
   */
  export class ErrorHandler {
    constructor() {
      this.errorListeners = [];
      this.errorHistory = [];
      this.maxHistorySize = 50;
    }
    
    /**
     * 处理错误
     * @param {Error|UniCanvasError} error - 错误对象
     * @param {Object} context - 错误上下文
     */
    handleError(error, context = {}) {
      // 转换为 UniCanvasError
      const unicanvasError = error instanceof UniCanvasError 
        ? error 
        : new UniCanvasError('UNKNOWN_ERROR', error.message, { originalError: error });
      
      // 添加上下文
      unicanvasError.details = {
        ...unicanvasError.details,
        context
      };
      
      // 记录到历史
      this._addToHistory(unicanvasError);
      
      // 通知监听器
      this._notifyListeners(unicanvasError);
      
      return unicanvasError;
    }
    
    /**
     * 添加错误监听器
     * @param {Function} listener - 监听函数
     */
    addListener(listener) {
      if (typeof listener !== 'function') {
        throw new UniCanvasError('INVALID_LISTENER', 'Error listener must be a function');
      }
      
      this.errorListeners.push(listener);
    }
    
    /**
     * 移除错误监听器
     * @param {Function} listener - 监听函数
     */
    removeListener(listener) {
      const index = this.errorListeners.indexOf(listener);
      
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    }
    
    /**
     * 获取错误历史
     * @param {number} limit - 限制数量
     * @returns {Array} 错误历史
     */
    getHistory(limit = 10) {
      return this.errorHistory.slice(0, limit);
    }
    
    /**
     * 清除错误历史
     */
    clearHistory() {
      this.errorHistory = [];
    }
    
    /**
     * 添加错误到历史
     * @param {UniCanvasError} error - 错误对象
     * @private
     */
    _addToHistory(error) {
      this.errorHistory.unshift(error);
      
      // 限制历史大小
      if (this.errorHistory.length > this.maxHistorySize) {
        this.errorHistory.pop();
      }
    }
    
    /**
     * 通知所有监听器
     * @param {UniCanvasError} error - 错误对象
     * @private
     */
    _notifyListeners(error) {
      this.errorListeners.forEach(listener => {
        try {
          listener(error);
        } catch (listenerError) {
          console.error('Error in error listener:', listenerError);
        }
      });
    }
  }
  
  // 创建全局错误处理器实例
  export const errorHandler = new ErrorHandler();
  
  // 导出默认错误处理器
  export default errorHandler;
  