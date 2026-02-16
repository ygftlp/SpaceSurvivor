import MissionProfiles from '../data/missionProfiles.js';
import DirectorSystem from '../system/director/DirectorSystem.js';
import SpawnService from '../system/director/SpawnService.js';

export default class WaveManager {
    constructor(game) {
        this.game = game;
        this.profile = MissionProfiles.survivalV2;

        this.levelTime = 0;
        this.currentAct = 1;
        this.currentHint = null;
        this.supplyCount = 0;
        this.maxSupplyDrops = 3;

        this.spawnService = new SpawnService(this.game, {
            maxEnemies: this.profile.maxActiveEnemies
        });
        this.director = new DirectorSystem(this.game, this.spawnService, this.profile);
    }

    startSurvival() {
        this.levelTime = 0;
        this.currentAct = 1;
        this.currentHint = null;
        this.supplyCount = 0;
        this.maxSupplyDrops = 3;

        if (this.game && Array.isArray(this.game.enemies)) {
            this.game.enemies = [];
        }

        this.director.start();
        this.syncState();
    }

    update(dt) {
        if (!this.game || this.game.isPaused || this.game.gameEnded) return;
        this.director.update(dt);
        this.syncState();
    }

    syncState() {
        this.levelTime = this.director.levelTime;
        this.currentAct = this.director.getCurrentAct();
        this.currentHint = this.director.getCurrentHint();
    }

    spawnEnemy(type) {
        return this.spawnService.spawnEnemy(type, this.getCurrentAct());
    }

    spawnBoss() {
        return this.spawnService.spawnBoss();
    }

    spawnSupply() {
        if (this.supplyCount >= this.maxSupplyDrops) return false;
        const ok = this.spawnService.spawnSupply();
        if (ok) this.supplyCount += 1;
        return ok;
    }

    getActiveEnemyCount() {
        return this.spawnService.getActiveEnemyCount();
    }

    getCurrentAct() {
        return this.currentAct;
    }

    getCurrentHint() {
        return this.currentHint;
    }

    getDurationSec() {
        return this.director.getDurationSec();
    }

    getRemainingTime() {
        return Math.max(0, this.getDurationSec() - this.levelTime);
    }

    getProgressPercent() {
        const duration = this.getDurationSec();
        if (duration <= 0) return 100;
        return Math.min(100, (this.levelTime / duration) * 100);
    }

    getDirectorState() {
        return this.director.getState();
    }
}
