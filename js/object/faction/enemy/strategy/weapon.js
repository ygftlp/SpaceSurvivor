// Weapon Strategies
// Each strategy implements: update(enemy, dt)

const canUpdateWeapon = (enemy, dt) => {
    if (!enemy || !enemy.active || !enemy.scene) return false;
    if (enemy.scene.isPaused || enemy.scene.gameEnded) return false;
    if (!enemy.hasEnteredView) return false;
    if ((enemy.fireEnableDelay || 0) > 0) {
        enemy.fireEnableDelay = Math.max(0, enemy.fireEnableDelay - dt);
        return false;
    }
    if (typeof enemy.scene.isEnemyInFireWindow === 'function' && !enemy.scene.isEnemyInFireWindow(enemy)) return false;
    if ((enemy.weaponWarmup || 0) > 0) {
        enemy.weaponWarmup = Math.max(0, enemy.weaponWarmup - dt);
        return false;
    }
    return true;
};

const getCooldownScale = (enemy) => {
    const t = (enemy && enemy.scene && enemy.scene.waveManager && Number.isFinite(enemy.scene.waveManager.levelTime))
        ? enemy.scene.waveManager.levelTime
        : 999;

    // Early run gets a softer fire cadence.
    if (t <= 20) return 1.35 - (t / 20) * 0.25; // 1.35 -> 1.10
    if (t <= 40) return 1.10 - ((t - 20) / 20) * 0.10; // 1.10 -> 1.00
    return 1.0;
};

const limitVolleyCount = (enemy, desired, min = 1) => {
    const t = (enemy && enemy.scene && enemy.scene.waveManager && Number.isFinite(enemy.scene.waveManager.levelTime))
        ? enemy.scene.waveManager.levelTime
        : 999;
    if (t < 20) return Math.max(min, Math.min(desired, 2));
    if (t < 35) return Math.max(min, Math.min(desired, 3));
    return Math.max(min, desired);
};

const tickFire = (enemy, dt, baseCadence) => {
    const seed = Number.isFinite(enemy.fireTimer) ? enemy.fireTimer : baseCadence;
    enemy.fireTimer = seed - dt;
    return enemy.fireTimer <= 0;
};

const resetFire = (enemy, cadence) => {
    enemy.fireTimer = cadence * getCooldownScale(enemy);
};

const ensureDamage = (enemy, cfg) => {
    if (cfg.damage === undefined && enemy.damage) {
        cfg.damage = enemy.damage;
    }
    return cfg;
};

export const WeaponStrategies = {
    NONE: {
        update: () => {}
    },

    PEA_SHOOTER: {
        update: (enemy, dt) => {
            if (!canUpdateWeapon(enemy, dt)) return;
            const cadence = enemy.fireRate || 2.0;
            if (!tickFire(enemy, dt, cadence)) return;

            if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                const cfg = ensureDamage(enemy, enemy.config.weaponConfig || {});
                const speed = cfg.speed || 300;
                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
            }
            resetFire(enemy, cadence);
        }
    },

    SPREAD: {
        update: (enemy, dt) => {
            if (!canUpdateWeapon(enemy, dt)) return;
            const cadence = enemy.fireRate || 3.0;
            if (!tickFire(enemy, dt, cadence)) return;

            if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                const cfg = ensureDamage(enemy, enemy.config.weaponConfig || {});
                const speed = cfg.speed || 300;
                const count = limitVolleyCount(enemy, 3);
                if (count >= 1) enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                if (count >= 2) enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, -15, speed, cfg);
                if (count >= 3) enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 15, speed, cfg);
            }
            resetFire(enemy, cadence);
        }
    },

    RAPID: {
        update: (enemy, dt) => {
            if (!canUpdateWeapon(enemy, dt)) return;
            const cadence = 0.5;
            if (!tickFire(enemy, dt, cadence)) return;

            if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                const cfg = ensureDamage(enemy, enemy.config.weaponConfig || {});
                const speed = (cfg.speed || 300) * 1.2;
                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
            }
            resetFire(enemy, cadence);
        }
    },

    SNIPER: {
        update: (enemy, dt) => {
            if (!canUpdateWeapon(enemy, dt)) return;
            const cadence = 4.0;
            if (!tickFire(enemy, dt, cadence)) return;

            if (enemy.scene && enemy.scene.spawnEnemyBullet) {
                const cfg = ensureDamage(enemy, enemy.config.weaponConfig || {});
                const speed = (cfg.speed || 300) * 2.0;
                enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
            }
            resetFire(enemy, cadence);
        }
    },

    PROCEDURAL: {
        update: (enemy, dt) => {
            if (!canUpdateWeapon(enemy, dt)) return;

            const cfg = ensureDamage(enemy, enemy.config.weaponConfig || {});
            const cadence = enemy.fireRate || cfg.rate || 2.0;
            if (!tickFire(enemy, dt, cadence)) return;
            if (!(enemy.scene && enemy.scene.spawnEnemyBullet)) return;

            const speed = cfg.speed || 300;
            const scale = getCooldownScale(enemy);

            switch (cfg.pattern) {
                case 'SPREAD': {
                    const count = limitVolleyCount(enemy, cfg.count || 3);
                    const spread = cfg.spread || 30;
                    const startAngle = -spread / 2;
                    const step = spread / (count - 1 || 1);
                    for (let i = 0; i < count; i++) {
                        const angle = startAngle + step * i;
                        enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, angle, speed, cfg);
                    }
                    break;
                }
                case 'RING': {
                    const ringCount = limitVolleyCount(enemy, cfg.count || 8, 2);
                    for (let i = 0; i < ringCount; i++) {
                        const angle = (360 / ringCount) * i;
                        enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, angle, speed, cfg);
                    }
                    break;
                }
                case 'SPIRAL_EMITTER': {
                    enemy.weaponAngle = (enemy.weaponAngle || 0) + (cfg.spinSpeed || 10);
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.weaponAngle, speed, cfg);
                    enemy.fireTimer = 0.1 * scale;
                    return;
                }
                case 'V_SHAPE': {
                    enemy.scene.spawnEnemyBullet(enemy.x - 20, enemy.y, 0, speed, cfg);
                    enemy.scene.spawnEnemyBullet(enemy.x + 20, enemy.y, 0, speed, cfg);
                    break;
                }
                case 'CROSS': {
                    const count = 4;
                    const baseAngle = enemy.weaponAngle || 0;
                    enemy.weaponAngle = baseAngle + (cfg.spinSpeed || 0);
                    for (let i = 0; i < count; i++) {
                        const angle = baseAngle + (90 * i);
                        enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, angle, speed, cfg);
                    }
                    break;
                }
                case 'WAVE': {
                    const phase = (Date.now() / 500) * (cfg.spinSpeed || 5);
                    const offset = Math.sin(phase) * (cfg.spread || 20);
                    enemy.scene.spawnEnemyBullet(enemy.x + offset, enemy.y + enemy.height / 2, 0, speed, cfg);
                    enemy.fireTimer = 0.15 * scale;
                    return;
                }
                case 'TORNADO': {
                    enemy.weaponAngle = (enemy.weaponAngle || 0) + (cfg.spinSpeed || 5);
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, enemy.weaponAngle, speed, cfg);
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, -enemy.weaponAngle, speed, cfg);
                    enemy.fireTimer = 0.1 * scale;
                    return;
                }
                case 'TARGETED_SPREAD': {
                    const count = limitVolleyCount(enemy, cfg.count || 3);
                    const spread = 15;
                    const start = -spread / 2;
                    const step = spread / (count - 1 || 1);
                    for (let i = 0; i < count; i++) {
                        enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, start + step * i, speed, cfg);
                    }
                    break;
                }
                case 'RANDOM': {
                    const count = limitVolleyCount(enemy, cfg.count || 5, 2);
                    for (let i = 0; i < count; i++) {
                        const angle = (Math.random() - 0.5) * (cfg.spread || 45);
                        const speedVar = speed * (0.8 + Math.random() * 0.4);
                        enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, angle, speedVar, cfg);
                    }
                    break;
                }
                case 'STRAIGHT':
                default:
                    enemy.scene.spawnEnemyBullet(enemy.x, enemy.y + enemy.height / 2, 0, speed, cfg);
                    break;
            }

            resetFire(enemy, cadence);
        }
    }
};
