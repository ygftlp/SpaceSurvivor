/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 场景管理器，负责管理和切换场景。
 */

import HomeScene from './homeScene.js';
import BattleScene from './battleScene.js';
import ResultScene from './resultScene.js';
import SplashScene from './splashScene.js';
import ProfileScene from './profileScene.js';
import StoryScene from './storyScene.js';

export default class SceneManager {
    constructor(game) {
        this.game = game; // Reference to Main
        this.currentScene = null;

        // 预注册场景
        this.scenes = {
            'SPLASH': SplashScene,
            'STORY': StoryScene,
            'HOME': HomeScene,
            'BATTLE': BattleScene,
            'RESULT': ResultScene,
            'PROFILE': ProfileScene
        };
    }

    /**
     * 切换场景
     * @param {string} key 场景 Key ('HOME', 'BATTLE', etc.)
     * @param {object} params 传递参数
     */
    switchScene(key, params = {}) {
        if (this.currentScene) {
            this.currentScene.exit();
        }

        const SceneClass = this.scenes[key];
        if (SceneClass) {
            this.currentScene = new SceneClass(this);
            this.currentScene.enter(params);
            console.log(`SceneManager: Switched to ${key}`);
        } else {
            console.error(`SceneManager: Scene ${key} not found!`);
        }
    }

    update(dt) {
        if (this.currentScene) {
            this.currentScene.update(dt);
        }
    }

    render(ctx) {
        if (this.currentScene) {
            this.currentScene.render(ctx);
        }
    }

    handleInput(type, x, y) {
        if (this.currentScene) {
            this.currentScene.handleInput(type, x, y);
        }
    }
}
