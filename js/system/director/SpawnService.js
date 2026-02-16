import { GameConfig } from '../../config.js';
import Enemy from '../../object/faction/enemy/Enemy.js';
import TitanBattleship from '../../object/faction/enemy/boss/TitanBattleship.js';

const DEFAULT_ENEMY_CONFIGS = {
    Drone_Small: {
        chassis: 'SCOUT',
        hp: 24,
        speed: 138,
        damage: 7,
        score: 12,
        movement: 'LINEAR',
        weapon: 'NONE',
        spawnGraceDuration: 1.8,
        width: 74,
        height: 74,
        scale: 1.08,
        color: '#3cf2d6'
    },
    Drone_Kamikaze: {
        chassis: 'SCOUT',
        hp: 18,
        speed: 186,
        damage: 17,
        score: 18,
        movement: 'LINEAR',
        weapon: 'NONE',
        spawnGraceDuration: 1.8,
        width: 72,
        height: 72,
        scale: 1.1,
        color: '#ff7b45'
    },
    Drone_Scout: {
        chassis: 'SCOUT',
        hp: 30,
        speed: 192,
        damage: 10,
        score: 18,
        movement: 'SINE',
        weapon: 'PEA_SHOOTER',
        fireRate: 3.1,
        weaponWarmup: 2.2,
        spawnGraceDuration: 2.0,
        width: 78,
        height: 78,
        scale: 1.14,
        color: '#38b7ff'
    },
    Elite_Fighter: {
        chassis: 'FIGHTER',
        hp: 95,
        speed: 126,
        damage: 16,
        score: 56,
        movement: 'ZIGZAG',
        weapon: 'SPREAD',
        fireRate: 3.6,
        weaponWarmup: 2.6,
        spawnGraceDuration: 2.2,
        width: 92,
        height: 92,
        scale: 1.24,
        color: '#ff5572'
    }
};

export default class SpawnService {
    constructor(scene, options = {}) {
        this.scene = scene;
        this.enemyConfigs = { ...DEFAULT_ENEMY_CONFIGS };
        this.maxEnemies = options.maxEnemies || 24;
        this.pendingSpawns = [];
    }

    startSession(profile) {
        this.pendingSpawns = [];
        this.maxEnemies = profile && profile.maxActiveEnemies ? profile.maxActiveEnemies : this.maxEnemies;
    }

    update(dt, levelTime, act) {
        if (!this.scene || this.scene.isPaused || this.scene.gameEnded) return;
        if (!this.pendingSpawns.length) return;

        for (let i = this.pendingSpawns.length - 1; i >= 0; i--) {
            const job = this.pendingSpawns[i];
            job.delay -= dt;
            if (job.delay > 0) continue;

            this.pendingSpawns.splice(i, 1);
            this.spawnEnemy(job.type, job.act || act, {
                x: job.x,
                y: job.y,
                entryRole: job.entryRole,
                spawnTime: levelTime
            });
        }
    }

    queueSquad(squad, context = {}) {
        if (!squad || !Array.isArray(squad.entries)) return 0;

        let queued = 0;
        const cadence = context.cadence || 0.26;
        const act = context.act || 1;

        for (let i = 0; i < squad.entries.length; i++) {
            const entry = squad.entries[i];
            const points = this.createSpawnPoints(
                entry.count || 1,
                entry.spread || 120,
                entry.laneBias || 'center'
            );

            for (let k = 0; k < points.length; k++) {
                this.pendingSpawns.push({
                    type: entry.type || 'Drone_Small',
                    x: points[k].x,
                    y: points[k].y,
                    delay: (i * cadence) + (k * 0.08),
                    act,
                    entryRole: squad.role || 'harass'
                });
                queued++;
            }
        }

        return queued;
    }

    createSpawnPoints(count, spread, laneBias) {
        const points = [];
        const width = GameConfig.Screen.width;
        const topY = 180;
        const margin = 84;

        const laneXs = {
            left: width * 0.24,
            center: width * 0.5,
            right: width * 0.76
        };

        for (let i = 0; i < count; i++) {
            let baseX = laneXs.center;
            if (laneBias === 'flank') {
                baseX = Math.random() > 0.5 ? laneXs.left : laneXs.right;
            } else if (laneBias === 'split') {
                baseX = i % 2 === 0 ? laneXs.left : laneXs.right;
            } else if (laneBias === 'left') {
                baseX = laneXs.left;
            } else if (laneBias === 'right') {
                baseX = laneXs.right;
            }

            const slot = count <= 1 ? 0 : (i - (count - 1) / 2);
            const jitter = (Math.random() - 0.5) * 26;
            const x = Math.max(margin, Math.min(width - margin, baseX + slot * (spread / Math.max(1, count - 1)) + jitter));
            points.push({ x, y: topY });
        }

        return points;
    }

    spawnEnemy(type, act = 1, overrides = {}) {
        if (!this.scene || this.scene.isPaused || this.scene.gameEnded) return false;

        if (type === 'BOSS') {
            return this.spawnBoss();
        }

        if (this.getActiveEnemyCount() >= this.maxEnemies) {
            return false;
        }

        const base = this.enemyConfigs[type] || this.enemyConfigs.Drone_Small;
        const diffScale = 1 + Math.max(0, act - 1) * 0.22;

        const config = {
            ...base,
            hp: Math.floor(base.hp * diffScale),
            damage: Math.floor(base.damage * diffScale)
        };

        const spawnTime = Number.isFinite(overrides.spawnTime) ? overrides.spawnTime : 0;
        let x = Number.isFinite(overrides.x) ? overrides.x : 80 + Math.random() * (GameConfig.Screen.width - 160);
        const y = Number.isFinite(overrides.y) ? overrides.y : 180;

        // Early-run readability: avoid spawning exactly on player's bullet center line.
        if (spawnTime < 35 && this.scene && this.scene.player) {
            const px = this.scene.player.x;
            if (Math.abs(x - px) < 120) {
                const laneLeft = Math.max(72, px - 190);
                const laneRight = Math.min(GameConfig.Screen.width - 72, px + 190);
                x = Math.random() > 0.5 ? laneLeft : laneRight;
            }
        }

        const enemy = new Enemy(config, x, y, this.scene);
        enemy.altitude = 120 + Math.random() * 80;
        enemy.hasEnteredView = true;
        enemy.fireEnableDelay = Math.max(enemy.fireEnableDelay || 0, 1.1 + Math.random() * 0.7);

        this.scene.enemies.push(enemy);

        if (this.scene.effectManager) {
            for (let i = 0; i < 8; i++) {
                const a = (Math.PI * 2 * i) / 8;
                const px = x + Math.cos(a) * (24 + Math.random() * 12);
                const py = y + Math.sin(a) * (24 + Math.random() * 12);
                this.scene.effectManager.spawnParticle(px, py, '#f97316', 2);
            }
        }

        return true;
    }

    spawnBoss() {
        if (!this.scene || this.scene.isPaused || this.scene.gameEnded) return false;

        const hasBoss = Array.isArray(this.scene.enemies)
            && this.scene.enemies.some(e => e && e.active && e.isBoss);
        if (hasBoss) return false;

        const boss = new TitanBattleship(GameConfig.Screen.width / 2, 150, this.scene);
        this.scene.enemies.push(boss);
        if (this.scene.onBossSpawned) {
            this.scene.onBossSpawned(boss);
        }
        return true;
    }

    spawnSupply() {
        if (!this.scene || this.scene.isPaused || this.scene.gameEnded) return false;
        if (!this.scene.spawnSupplyCrate) return false;
        this.scene.spawnSupplyCrate();
        return true;
    }

    getActiveEnemyCount() {
        if (!this.scene || !Array.isArray(this.scene.enemies)) return 0;
        return this.scene.enemies.filter(enemy => enemy && enemy.active).length;
    }

    getQueueLength() {
        return this.pendingSpawns.length;
    }
}
