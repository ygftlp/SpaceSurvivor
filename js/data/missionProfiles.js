export const MissionProfiles = {
    survivalV2: {
        id: 'survival_v2',
        label: '星域突围',
        durationSec: 110,
        maxActiveEnemies: 22,
        maxThreatBudget: 80,
        spendInterval: {
            min: 0.85,
            max: 1.9
        },
        boss: {
            spawnTime: 96,
            type: 'BOSS',
            hint: '首领阶段：先拆机库，再破炮塔，最后打核心'
        },
        beats: [
            {
                id: 'onboarding',
                label: '阶段一',
                start: 0,
                end: 30,
                incomePerSec: 6.2,
                activeCap: 5,
                hint: '侦察机来袭，保持移动并清理侧翼',
                roleWeights: {
                    harass: 0.85,
                    zone: 0.12,
                    burst: 0.08,
                    elite: 0
                }
            },
            {
                id: 'escalation',
                label: '阶段二',
                start: 30,
                end: 70,
                incomePerSec: 13,
                activeCap: 14,
                hint: '火力提升，爆发小队开始入场',
                roleWeights: {
                    harass: 0.35,
                    zone: 0.25,
                    burst: 0.25,
                    elite: 0.15
                }
            },
            {
                id: 'resolution',
                label: '阶段三',
                start: 70,
                end: 110,
                incomePerSec: 18,
                activeCap: 18,
                hint: '终局推进：精英护航与首领窗口',
                roleWeights: {
                    harass: 0.15,
                    zone: 0.2,
                    burst: 0.25,
                    elite: 0.4
                }
            }
        ],
        squads: [
            {
                id: 'scout_flank',
                role: 'harass',
                cost: 8,
                weight: 1.2,
                minTime: 0,
                maxTime: 110,
                entries: [
                    { type: 'Drone_Small', count: 2, spread: 120, laneBias: 'flank' }
                ]
            },
            {
                id: 'needle_pair',
                role: 'harass',
                cost: 10,
                weight: 1.0,
                minTime: 35,
                maxTime: 90,
                entries: [
                    { type: 'Drone_Scout', count: 2, spread: 140, laneBias: 'split' }
                ]
            },
            {
                id: 'kamikaze_pack',
                role: 'burst',
                cost: 14,
                weight: 1.0,
                minTime: 32,
                maxTime: 110,
                entries: [
                    { type: 'Drone_Kamikaze', count: 3, spread: 90, laneBias: 'center' }
                ]
            },
            {
                id: 'crossfire_lane',
                role: 'zone',
                cost: 16,
                weight: 0.9,
                minTime: 40,
                maxTime: 110,
                entries: [
                    { type: 'Drone_Scout', count: 1, spread: 0, laneBias: 'center' },
                    { type: 'Drone_Small', count: 2, spread: 180, laneBias: 'split' }
                ]
            },
            {
                id: 'elite_anchor',
                role: 'elite',
                cost: 24,
                weight: 0.8,
                minTime: 52,
                maxTime: 110,
                entries: [
                    { type: 'Elite_Fighter', count: 1, spread: 0, laneBias: 'center' },
                    { type: 'Drone_Small', count: 2, spread: 160, laneBias: 'flank' }
                ]
            },
            {
                id: 'elite_burst',
                role: 'elite',
                cost: 30,
                weight: 0.7,
                minTime: 78,
                maxTime: 110,
                entries: [
                    { type: 'Elite_Fighter', count: 1, spread: 0, laneBias: 'center' },
                    { type: 'Drone_Kamikaze', count: 2, spread: 120, laneBias: 'split' }
                ]
            }
        ]
    }
};

export default MissionProfiles;
