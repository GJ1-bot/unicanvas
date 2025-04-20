/**
 * SandboxBridge.js
 * 沙箱通信网关，负责安全地处理跨页面/站点通信
 */
class SandboxBridge {
  constructor(options = {}) {
    this.options = {
      allowedOrigins: options.allowedOrigins || [],
      messageTimeout: options.messageTimeout || 5000,
      maxMessageSize: options.maxMessageSize || 1024 * 1024, // 1MB
      securityLevel: options.securityLevel || 'strict',
      debug: options.debug || false
    };
    
    this.messageHandlers = {};
    this.pendingResponses = {};
    this.messageCounter = 0;
    
    // 初始化消息监听器
    this._initMessageListener();
    
    if (this.options.debug) {
      console.log('SandboxBridge initialized with options:', this.options);
    }
  }
  
  /**
   * 允许特定来源的通信
   * @param {Array<string>} origins - 允许的来源列表
   */
  allowOrigins(origins) {
    if (!Array.isArray(origins)) {
      throw new UniCanvasError('INVALID_ORIGINS', 'Origins must be an array');
    }
    
    this.options.allowedOrigins = [
      ...this.options.allowedOrigins,
      ...origins
    ];
    
    if (this.options.debug) {
      console.log('Updated allowed origins:', this.options.allowedOrigins);
    }
    
    return this.options.allowedOrigins;
  }
  
  /**
   * 发送消息到指定目标
   * @param {Object} message - 消息内容
   * @param {string} targetOrigin - 目标来源
   * @param {Object} options - 发送选项
   * @returns {Promise} 消息发送结果
   */
  postMessage(message, targetOrigin, options = {}) {
    if (!message || typeof message !== 'object') {
      throw new UniCanvasError('INVALID_MESSAGE', 'Message must be an object');
    }
    
    if (!targetOrigin) {
      throw new UniCanvasError('INVALID_TARGET', 'Target origin is required');
    }
    
    // 检查消息大小
    const messageSize = JSON.stringify(message).length;
    if (messageSize > this.options.maxMessageSize) {
      throw new UniCanvasError(
        'MESSAGE_TOO_LARGE', 
        `Message size (${messageSize} bytes) exceeds maximum allowed size (${this.options.maxMessageSize} bytes)`
      );
    }
    
    // 生成消息ID
    const messageId = this._generateMessageId();
    
    // 构建完整消息
    const fullMessage = {
      id: messageId,
      timestamp: Date.now(),
      source: window.location.origin,
      target: targetOrigin,
      payload: message,
      requiresResponse: options.requiresResponse || false
    };
    
    // 发送消息
    if (this.options.debug) {
      console.log(`Sending message ${messageId} to ${targetOrigin}:`, fullMessage);
    }
    
    // 如果需要响应，创建Promise
    if (options.requiresResponse) {
      return new Promise((resolve, reject) => {
        // 设置超时
        const timeoutId = setTimeout(() => {
          delete this.pendingResponses[messageId];
          reject(new UniCanvasError(
            'RESPONSE_TIMEOUT', 
            `Response for message ${messageId} timed out after ${this.options.messageTimeout}ms`
          ));
        }, this.options.messageTimeout);
        
        // 存储等待响应的信息
        this.pendingResponses[messageId] = {
          resolve,
          reject,
          timeoutId
        };
        
        // 发送消息
        window.parent.postMessage(fullMessage, targetOrigin);
      });
    } else {
      // 不需要响应，直接发送
      window.parent.postMessage(fullMessage, targetOrigin);
      return Promise.resolve({ sent: true, id: messageId });
    }
  }
  
  /**
   * 注册消息处理器
   * @param {string} type - 消息类型
   * @param {Function} handler - 处理函数
   */
  registerHandler(type, handler) {
    if (typeof handler !== 'function') {
      throw new UniCanvasError('INVALID_HANDLER', 'Message handler must be a function');
    }
    
    this.messageHandlers[type] = handler;
    
    if (this.options.debug) {
      console.log(`Registered handler for message type: ${type}`);
    }
    
    return this;
  }
  
  /**
   * 监听所有消息
   * @param {Function} callback - 回调函数
   */
  onMessage(callback) {
    if (typeof callback !== 'function') {
      throw new UniCanvasError('INVALID_CALLBACK', 'Message callback must be a function');
    }
    
    this.globalMessageCallback = callback;
    
    if (this.options.debug) {
      console.log('Registered global message callback');
    }
    
    return this;
  }
  
  /**
   * 响应特定消息
   * @param {string} messageId - 消息ID
   * @param {Object} responseData - 响应数据
   * @param {Object} options - 响应选项
   */
  respondToMessage(messageId, responseData, options = {}) {
    if (!messageId) {
      throw new UniCanvasError('INVALID_MESSAGE_ID', 'Message ID is required');
    }
    
    const responseMessage = {
      id: this._generateMessageId(),
      responseToId: messageId,
      timestamp: Date.now(),
      source: window.location.origin,
      payload: responseData,
      isResponse: true,
      status: options.status || 'success'
    };
    
    if (this.options.debug) {
      console.log(`Sending response for message ${messageId}:`, responseMessage);
    }
    
    // 发送响应
    if (options.targetOrigin) {
      window.parent.postMessage(responseMessage, options.targetOrigin);
    } else {
      // 如果没有指定目标，发送给所有允许的来源
      window.parent.postMessage(responseMessage, '*');
    }
    
    return responseMessage;
  }
  
  /**
   * 初始化消息监听器
   * @private
   */
  _initMessageListener() {
    window.addEventListener('message', (event) => {
      // 验证消息来源
      if (!this._isOriginAllowed(event.origin)) {
        if (this.options.debug) {
          console.warn(`Received message from unauthorized origin: ${event.origin}`);
        }
        return;
      }
      
      // 验证消息格式
      if (!this._validateMessage(event.data)) {
        if (this.options.debug) {
          console.warn('Received invalid message format:', event.data);
        }
        return;
      }
      
      const message = event.data;
      
      if (this.options.debug) {
        console.log(`Received message ${message.id} from ${event.origin}:`, message);
      }
      
      // 处理响应消息
      if (message.isResponse && message.responseToId) {
        const pendingResponse = this.pendingResponses[message.responseToId];
        if (pendingResponse) {
          clearTimeout(pendingResponse.timeoutId);
          
          if (message.status === 'error') {
            pendingResponse.reject(new UniCanvasError(
              'REMOTE_ERROR',
              message.payload.message || 'Remote error',
              message.payload.details || {}
            ));
          } else {
            pendingResponse.resolve(message.payload);
          }
          
          delete this.pendingResponses[message.responseToId];
        }
        return;
      }
      
      // 处理普通消息
      try {
        // 检查是否有特定类型的处理器
        const messageType = message.payload?.type;
        if (messageType && this.messageHandlers[messageType]) {
          const result = this.messageHandlers[messageType](message.payload, {
            source: message.source,
            messageId: message.id,
            timestamp: message.timestamp
          });
          
          // 如果需要响应
          if (message.requiresResponse) {
            Promise.resolve(result).then(responseData => {
              this.respondToMessage(message.id, responseData, {
                targetOrigin: message.source
              });
            }).catch(error => {
              this.respondToMessage(message.id, {
                message: error.message,
                details: error.details || {}
              }, {
                targetOrigin: message.source,
                status: 'error'
              });
            });
          }
        } else if (this.globalMessageCallback) {
          // 使用全局回调
          this.globalMessageCallback(message.payload, {
            source: message.source,
            messageId: message.id,
            timestamp: message.timestamp,
            respond: (responseData) => {
              if (message.requiresResponse) {
                this.respondToMessage(message.id, responseData, {
                  targetOrigin: message.source
                });
              }
            }
          });
        }
      } catch (error) {
        console.error('Error processing message:', error);
        
        // 如果需要响应，发送错误
        if (message.requiresResponse) {
          this.respondToMessage(message.id, {
            message: error.message,
            details: error.details || {}
          }, {
            targetOrigin: message.source,
            status: 'error'
          });
        }
      }
    });
    
    if (this.options.debug) {
      console.log('Message listener initialized');
    }
  }
  
  /**
   * 验证消息格式
   * @param {Object} message - 待验证的消息
   * @returns {boolean} 是否有效
   * @private
   */
  _validateMessage(message) {
    // 基本格式检查
    if (!message || typeof message !== 'object') {
      return false;
    }
    
    // 必需字段检查
    if (!message.id || !message.timestamp || !message.source || !message.payload) {
      return false;
    }
    
    // 时间戳检查（防止重放攻击）
    const messageAge = Date.now() - message.timestamp;
    if (messageAge < 0 || messageAge > 60000) { // 1分钟内的消息有效
      return false;
    }
    
    return true;
  }
  
  /**
   * 生成唯一的消息ID
   * @returns {string} 消息ID
   * @private
   */
  _generateMessageId() {
    this.messageCounter++;
    return `msg_${Date.now()}_${this.messageCounter}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  /**
   * 检查来源是否被允许
   * @param {string} origin - 来源
   * @returns {boolean} 是否允许
   * @private
   */
  _isOriginAllowed(origin) {
    // 如果允许列表为空，则拒绝所有来源
    if (this.options.allowedOrigins.length === 0) {
      return false;
    }
    
    // 如果包含 '*'，则允许所有来源
    if (this.options.allowedOrigins.includes('*')) {
      return true;
    }
    
    // 检查具体来源
    return this.options.allowedOrigins.some(allowedOrigin => {
      // 精确匹配
      if (allowedOrigin === origin) {
        return true;
      }
      
      // 通配符匹配 (例如 https://*.example.com)
      if (allowedOrigin.includes('*')) {
        const pattern = allowedOrigin.replace(/\*/g, '.*');
        const regex = new RegExp(`^${pattern}$`);
        return regex.test(origin);
      }
      
      return false;
    });
  }
}

// 导出模块
export default SandboxBridge;
