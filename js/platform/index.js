/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 平台适配层入口，根据运行环境自动选择适配器。
 */

import WeChatAdapter from './wx/adapter.js';
import DouyinAdapter from './douyin/adapter.js';
import BaseAdapter from './adapter.js';

class Platform {
    constructor() {
        this.adapter = null;
        this.init();
    }

    init() {
        if (typeof wx !== 'undefined' && typeof tt === 'undefined') {
            // 微信环境
            console.log('Platform: Detected WeChat');
            this.adapter = new WeChatAdapter();
        } else if (typeof tt !== 'undefined') {
            // 字节跳动Environment (抖音)
            console.log('Platform: Detected Douyin');
            this.adapter = new DouyinAdapter();
        } else {
            // 浏览器或其他未知环境
            console.warn('Platform: Unknown environment, using base adapter');
            this.adapter = new BaseAdapter();
        }
    }

    // 代理方法
    setStorage(key, value) { return this.adapter.setStorage(key, value); }
    getStorage(key) { return this.adapter.getStorage(key); }
    shareAppMessage(title, img) { return this.adapter.shareAppMessage(title, img); }
    createInnerAudioContext() { return this.adapter.createInnerAudioContext(); }
    vibrate(t) { return this.adapter.vibrate(t); }

    // 获取当前平台名称
    getName() { return this.adapter.platformName; }
}

export const platform = new Platform();
