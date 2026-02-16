export default class DirectorSystem {
    constructor(scene, spawnService, profile) {
        this.scene = scene;
        this.spawnService = spawnService;
        this.profile = profile;

        this.levelTime = 0;
        this.currentAct = 1;
        this.currentBeat = null;
        this.currentBeatIndex = -1;

        this.threatBudget = 0;
        this.nextSpendIn = 0;
        this.bossSpawned = false;

        this.currentHint = null;
        this.hintTimer = 0;
        this.lastSquadId = null;
        this.lastRole = null;
    }

    start() {
        this.levelTime = 0;
        this.currentAct = 1;
        this.currentBeatIndex = -1;
        this.currentBeat = null;
        this.threatBudget = Math.min(8, Math.max(0, this.profile.maxThreatBudget * 0.12));
        this.nextSpendIn = 0.55;
        this.bossSpawned = false;
        this.currentHint = null;
        this.hintTimer = 0;
        this.lastSquadId = null;
        this.lastRole = null;

        if (this.spawnService && this.spawnService.startSession) {
            this.spawnService.startSession(this.profile);
        }
        this.updateBeatState(true);
    }

    update(dt) {
        if (!this.scene || this.scene.isPaused || this.scene.gameEnded) return;

        this.levelTime += dt;

        this.updateBeatState(false);
        this.updateHintTimer(dt);
        this.accumulateThreat(dt);

        if (this.spawnService && this.spawnService.update) {
            this.spawnService.update(dt, this.levelTime, this.currentAct);
        }

        this.trySpawnBoss();
        this.trySpendThreat(dt);
    }

    updateHintTimer(dt) {
        if (this.hintTimer <= 0) return;
        this.hintTimer -= dt;
        if (this.hintTimer <= 0) {
            this.currentHint = null;
        }
    }

    updateBeatState(force) {
        const beats = this.profile && Array.isArray(this.profile.beats) ? this.profile.beats : [];
        if (!beats.length) return;

        let nextBeatIndex = beats.length - 1;
        for (let i = 0; i < beats.length; i++) {
            const beat = beats[i];
            if (this.levelTime >= beat.start && this.levelTime < beat.end) {
                nextBeatIndex = i;
                break;
            }
        }

        if (!force && nextBeatIndex === this.currentBeatIndex) return;

        this.currentBeatIndex = nextBeatIndex;
        this.currentBeat = beats[nextBeatIndex];
        this.currentAct = nextBeatIndex + 1;

        const beatLabel = this.currentBeat && this.currentBeat.label ? this.currentBeat.label : `阶段 ${this.currentAct}`;
        const beatHint = this.currentBeat && this.currentBeat.hint ? this.currentBeat.hint : null;
        this.pushHint(`${beatLabel} 开始`, 2.8);
        if (beatHint) {
            this.pushHint(beatHint, 3.6);
        }
    }

    accumulateThreat(dt) {
        const income = this.currentBeat && this.currentBeat.incomePerSec ? this.currentBeat.incomePerSec : 0;
        const cap = this.profile && this.profile.maxThreatBudget ? this.profile.maxThreatBudget : 60;
        this.threatBudget = Math.min(cap, this.threatBudget + income * dt);
    }

    trySpawnBoss() {
        if (this.bossSpawned) return;
        const boss = this.profile ? this.profile.boss : null;
        if (!boss) return;
        if (this.levelTime < boss.spawnTime) return;

        const success = this.spawnService && this.spawnService.spawnBoss && this.spawnService.spawnBoss();
        if (!success) return;

        this.bossSpawned = true;
        this.pushHint(boss.hint || '首领正在进入战区', 4.2);
    }

    trySpendThreat(dt) {
        if (!this.currentBeat) return;

        this.nextSpendIn -= dt;
        if (this.nextSpendIn > 0) return;

        const activeEnemies = this.spawnService ? this.spawnService.getActiveEnemyCount() : 0;
        const activeCap = this.currentBeat.activeCap || this.profile.maxActiveEnemies || 16;
        if (activeEnemies >= activeCap) {
            this.nextSpendIn = 0.35;
            return;
        }

        const squad = this.pickSquad();
        if (!squad) {
            this.nextSpendIn = 0.45;
            return;
        }

        const cost = squad.cost || 0;
        if (cost > this.threatBudget) {
            this.nextSpendIn = 0.28;
            return;
        }

        this.threatBudget = Math.max(0, this.threatBudget - cost);
        const queued = this.spawnService.queueSquad(squad, {
            act: this.currentAct,
            cadence: 0.24 + Math.random() * 0.18
        });

        if (queued > 0) {
            this.lastSquadId = squad.id;
            this.lastRole = squad.role;
        }

        const spend = this.profile && this.profile.spendInterval ? this.profile.spendInterval : { min: 0.8, max: 1.6 };
        const min = Math.max(0.15, spend.min || 0.8);
        const max = Math.max(min + 0.1, spend.max || 1.6);
        this.nextSpendIn = min + Math.random() * (max - min);
    }

    pickSquad() {
        const squads = this.profile && Array.isArray(this.profile.squads) ? this.profile.squads : [];
        if (!squads.length) return null;

        const available = squads.filter((s) => {
            const minTime = Number.isFinite(s.minTime) ? s.minTime : 0;
            const maxTime = Number.isFinite(s.maxTime) ? s.maxTime : this.profile.durationSec;
            if (this.levelTime < minTime || this.levelTime > maxTime) return false;
            return (s.cost || 0) <= this.threatBudget + 8;
        });
        if (!available.length) return null;

        const roleWeights = (this.currentBeat && this.currentBeat.roleWeights) || {};
        let totalWeight = 0;
        const weighted = [];

        for (let i = 0; i < available.length; i++) {
            const squad = available[i];
            const roleWeight = roleWeights[squad.role] !== undefined ? roleWeights[squad.role] : 0.2;
            let weight = Math.max(0.01, roleWeight * (squad.weight || 1));
            if (squad.id === this.lastSquadId) {
                weight *= 0.62;
            }
            totalWeight += weight;
            weighted.push({ squad, weight });
        }

        if (totalWeight <= 0) {
            return available[Math.floor(Math.random() * available.length)];
        }

        let roll = Math.random() * totalWeight;
        for (let i = 0; i < weighted.length; i++) {
            roll -= weighted[i].weight;
            if (roll <= 0) {
                return weighted[i].squad;
            }
        }

        return weighted[weighted.length - 1].squad;
    }

    pushHint(text, duration = 3.2) {
        if (!text) return;
        this.currentHint = text;
        this.hintTimer = duration;
        if (this.scene && this.scene.showDirectorHint) {
            this.scene.showDirectorHint(text);
        }
    }

    getCurrentHint() {
        return this.currentHint;
    }

    getCurrentAct() {
        return this.currentAct;
    }

    getDurationSec() {
        return this.profile && this.profile.durationSec ? this.profile.durationSec : 90;
    }

    getState() {
        const income = this.currentBeat && this.currentBeat.incomePerSec ? this.currentBeat.incomePerSec : 0;
        return {
            levelTime: this.levelTime,
            act: this.currentAct,
            beatId: this.currentBeat ? this.currentBeat.id : null,
            beatLabel: this.currentBeat ? this.currentBeat.label : null,
            threatBudget: this.threatBudget,
            maxThreatBudget: this.profile.maxThreatBudget,
            incomePerSec: income,
            nextSpendIn: this.nextSpendIn,
            activeEnemies: this.spawnService ? this.spawnService.getActiveEnemyCount() : 0,
            queuedSpawns: this.spawnService ? this.spawnService.getQueueLength() : 0,
            bossSpawned: this.bossSpawned,
            lastRole: this.lastRole,
            lastSquadId: this.lastSquadId
        };
    }
}
