/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 微信小游戏平台适配器。
 */

import BaseAdapter from '../adapter.js';

export default class WeChatAdapter extends BaseAdapter {
    constructor() {
        super();
        this.platformName = 'wechat';
    }

    setStorage(key, value) {
        try {
            wx.setStorageSync(key, value);
        } catch (e) {
            console.error('WeChat setStorage failed', e);
        }
    }

    getStorage(key) {
        try {
            return wx.getStorageSync(key);
        } catch (e) {
            console.error('WeChat getStorage failed', e);
            return null;
        }
    }

    shareAppMessage(title, imageUrl) {
        wx.shareAppMessage({
            title: title || 'Space Survivor',
            imageUrl: imageUrl || '' // 默认图片
        });
    }

    createInnerAudioContext() {
        return wx.createInnerAudioContext();
    }

    vibrate(type = 'short') {
        if (type === 'short') {
            wx.vibrateShort({ type: 'medium' });
        } else {
            wx.vibrateLong();
        }
    }
}
