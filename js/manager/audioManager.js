/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 音效管理器，使用微信小游戏 InnerAudioContext。
 */

import { platform } from '../platform/index.js';

export default class AudioManager {
    constructor() {
        this.ctx = platform.createInnerAudioContext();
        this.sounds = {
            'shoot': 'audio/shoot.mp3', // 占位符路径
            'explosion': 'audio/explosion.mp3',
            'coin': 'audio/coin.mp3'
        };

        // 预加载逻辑（在微信小游戏中可能需要下载）
        // 这里暂时实现为简单的“即时播放”接口
    }

    play(name) {
        // 由于没有真实的音频文件，暂时只 Log
        // 实际开发时解开下面代码并放入真实文件

        // const src = this.sounds[name];
        // if (src) {
        //     const audio = wx.createInnerAudioContext();
        //     audio.src = src;
        //     audio.play();
        // }
        // console.log(`Play Sound: ${name}`);
    }
}

export const audioManager = new AudioManager();
