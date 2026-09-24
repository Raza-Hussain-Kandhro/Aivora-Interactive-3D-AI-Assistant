# Robot model

Drop a rigged, Draco-compressed GLB here as `robot.glb` (target < 3.5 MB, TRD 4.4), then set:

```
VITE_ROBOT_MODEL_URL=/models/robot.glb
```

Expected animation clip names (matched case-insensitively, partial match allowed):

| Clip | Bot state |
| --- | --- |
| `Idle` | idle |
| `Listening` | listening |
| `Thinking` | thinking |
| `Talking` | speaking |
| `Wave` | happy |
| `Confused` | confused |

Node-name hints used for auto-detection:

- Head bone: `head`, `neck`, `mixamorigHead`
- Visor material: `visor`, `eye`, `screen`, `face`, `glass`
- Chest / core: `chest`, `core`, `reactor`, `torso`, `spine`
- Accent parts (recoloured by the customizer): names containing `accent`, `trim`, `light`, `glow`, `joint`, `ring`, `antenna`

Without a GLB, `FallbackRobot.tsx` renders a fully animated primitive robot instead.
