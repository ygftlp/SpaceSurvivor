# SpaceSurvivor Redesign Roadmap (V2)

## Goals
- Make each run readable, tense, and replayable within 90-120 seconds.
- Remove hidden state/implicit timers that cause pause/input inconsistencies.
- Separate content data from scene logic so balancing can be done without code edits.

## Core Design Pillars
1. `Clarity`: Player should always know threat priority and next objective.
2. `Control`: Input and hit feedback must feel deterministic on mobile touch.
3. `Build Identity`: Every run should produce a clearly different build by 45s.
4. `Clean Architecture`: Scene = orchestration, systems = behavior, data = tuning.

## Phase Plan

### Phase 1: Stability + UX Baseline (1-2 days)
- Input reliability:
  - Pause menu buttons commit on `touchend`.
  - Add debug hitbox/touch overlay (3-finger toggle).
- Pause safety:
  - Freeze wave progression and async spawns while paused.
  - Block enemy bullet creation while paused/endgame.
- Result flow:
  - "Abandon mission" exits immediately with deterministic transition.

Definition of done:
- No enemy bullets/spawns while paused in any scenario.
- Pause menu button hit success > 99% in repeated taps.

### Phase 2: Combat Loop Redesign (3-5 days)
- Replace scripted "time-only pressure" with "threat budget director":
  - Threat points accumulate over time.
  - Director spends points on enemy squads by role:
    - `harass`, `burst`, `zone`, `elite`.
- Add explicit target priority markers:
  - Hangar icon, turret icon, core exposed state.
- Introduce short combat beats:
  - 0-30s onboarding beat.
  - 30-70s escalation beat.
  - 70-110s resolution beat (boss or extraction window).

Definition of done:
- Runs no longer feel like random spawn noise.
- Death causes can be explained from replay screenshots.

### Phase 3: Build System Redesign (4-6 days)
- Build categories:
  - `weapon`, `mobility`, `defense`, `economy`, `utility`.
- Skill choice constraints:
  - Always offer 1 offense + 1 defense + 1 wildcard.
- Add synergy tags:
  - Example: `burn`, `pulse`, `drone`, `crit`, `shield`.
- Mid-run identity check:
  - At 60s, player should have 1 dominant tag and 1 support tag.

Definition of done:
- Build summary shows tag distribution and core mechanic.
- Distinct run patterns visible in telemetry.

### Phase 4: Content Pipeline + Balancing (continuous)
- Move enemy/weapon/mission tuning into data tables.
- Add validation checks for content:
  - Missing assets, invalid IDs, impossible wave budget.
- Add balancing metrics dump per run:
  - Damage taken per 10s.
  - Active enemies over time.
  - Time-to-first-death cause distribution.

Definition of done:
- Balance changes require data edits only for common cases.
- Each release includes a balancing report.

## Suggested Technical Refactor
- `scene/battleScene.js`: keep orchestration only.
- Add/expand systems:
  - `systems/inputSystem`
  - `systems/pauseSystem`
  - `systems/directorSystem`
  - `systems/combatResolutionSystem`
  - `systems/rewardSystem`
- Data modules:
  - `data/missionProfiles`
  - `data/threatCurves`
  - `data/skillPools`

## Immediate Next Implementation (recommended)
1. Add `PauseSystem` abstraction (single source of truth for pause/freeze state).
2. Split `WaveManager` into `DirectorSystem` + `SpawnService`.
3. Move current hardcoded wave script into `data/missionProfiles.js`.
4. Add a small in-run debug HUD (threat budget, active enemies, director state).

