/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 平台适配器基类，定义通用接口。
 */

export default class BaseAdapter {
    constructor() {
        this.platformName = 'base';
    }

    /**
     * 保存数据到本地存储
     * @param {string} key 
     * @param {string} value 
     */
    setStorage(key, value) {
        console.warn('setStorage not implemented');
    }

    /**
     * 读取本地存储数据
     * @param {string} key 
     * @returns {string} value
     */
    getStorage(key) {
        console.warn('getStorage not implemented');
        return null;
    }

    /**
     * 主动拉起分享
     * @param {string} title 分享标题
     * @param {string} imageUrl 图片链接
     */
    shareAppMessage(title, imageUrl) {
        console.warn('shareAppMessage not implemented');
    }

    /**
     * 创建音频上下文
     */
    createInnerAudioContext() {
        console.warn('createInnerAudioContext not implemented');
        return null;
    }

    /**
    * 震动反馈
    * @param {string} type 'short' | 'long'
    */
    vibrate(type = 'short') {
        console.warn('vibrate not implemented');
    }
}
