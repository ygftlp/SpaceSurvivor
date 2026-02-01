/**
 * Author: yangguangftlp@163.com
 * Date: 2026-01-31
 * Description: 场景基类，所有具体场景 (Home, Battle, Result) 都继承自它。
 */

export default class BaseScene {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
    }
    /**
     * Get Game Instance
     */
    get game() {
        return this.sceneManager.game;
    }

    /**
     * 场景进入时调用 (初始化)
     * @param {object} params 传递给场景的参数
     */
    enter(params) {
        // Override me
    }

    /**
     * 场景退出时调用 (清理资源)
     */
    exit() {
        // Override me
    }

    /**
     * 每一帧更新逻辑
     * @param {number} dt Delta Time in seconds
     */
    update(dt) {
        // Override me
    }

    /**
     * 每一帧渲染
     * @param {CanvasRenderingContext2D} ctx 
     */
    render(ctx) {
        // Override me
    }

    /**
     * 处理触摸输入
     */
    handleInput(type, x, y) {
        // Override me
    }
}
