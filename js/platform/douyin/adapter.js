/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 抖音/字节小游戏平台适配器。
 */

import BaseAdapter from '../adapter.js';

export default class DouyinAdapter extends BaseAdapter {
    constructor() {
        super();
        this.platformName = 'douyin';
    }

    setStorage(key, value) {
        try {
            tt.setStorageSync(key, value);
        } catch (e) {
            console.error('Douyin setStorage failed', e);
        }
    }

    getStorage(key) {
        try {
            return tt.getStorageSync(key);
        } catch (e) {
            console.error('Douyin getStorage failed', e);
            return null;
        }
    }

    shareAppMessage(title, imageUrl) {
        // 抖音需要配置 templateId
        tt.shareAppMessage({
            title: title,
            imageUrl: imageUrl,
            success() {
                console.log('Douyin share success');
            }
        });
    }

    createInnerAudioContext() {
        return tt.createInnerAudioContext();
    }

    vibrate(type = 'short') {
        if (type === 'short') {
            tt.vibrateShort();
        } else {
            tt.vibrateLong();
        }
    }
}
