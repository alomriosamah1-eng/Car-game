# Veloura Drive — UX/UI Architecture

## Product direction

Veloura Drive is a premium, offline-first Android driving experience. The interface uses a restrained pearl, graphite, mauve, and copper palette with Arabic-first RTL support and a clear landscape driving mode. The game separates decision-making screens from the driving HUD so the road remains unobstructed.

## User flow

```text
Splash → Main Menu
             ├─ Play → Car Selection → Customization → Environment → Pre‑Drive → Gameplay
             ├─ Garage → Car Details / Colors → Select for Drive
             ├─ Music → File Picker / Player
             ├─ Settings → Audio / Controls / Graphics / Gameplay / Language
             └─ About

Gameplay → Pause Overlay → Resume / Restart / Settings / Main Menu
```

## Screen map

| Screen | Primary job | Primary action | Secondary action |
|---|---|---|---|
| Splash | Establish brand and load lightweight scene | Continue automatically | Error retry |
| Main Menu | Give a new user an obvious starting point | Play | Garage, Music, Settings, About |
| Car Selection | Compare three vehicles at useful scale | Choose car | Back |
| Customization | Apply color and available appearance options | Confirm customization | Back |
| Environment | Choose a route without a long list | Choose environment | Back |
| Pre‑Drive | Confirm car, color, environment, and controls | Start Drive | Back / Edit |
| Gameplay | Drive with minimal unobstructed HUD | Throttle / steer / brake | Camera, pause, music |
| Pause | Stop simulation safely | Resume | Restart, Settings, Main Menu |
| Music | Pick and control local audio | Select file / play | Back |
| Settings | Organize preferences by category | Open category | Back |
| About | Explain the product and offline behavior | Back | — |

## Navigation rules

Every secondary screen has a visible Back/Close action and Android back-safe escape route. Destructive or state-changing actions use Cancel and Confirm where needed. Screen transitions use 160–220ms opacity/translate motion only; no continuous decorative animation is used in menus.

## Design system

| Token | Decision |
|---|---|
| Display font | Cormorant Garamond for brand moments only |
| UI font | Tajawal for Arabic and Latin labels |
| Background | Deep graphite `#17131d` and blue-hour `#242137` |
| Surface | Translucent graphite with a subtle pearl border |
| Accent | Dusty mauve `#c48fa7`, copper `#d2a28e`, sea-glass `#9ec6c0` |
| Text | Pearl `#f6f0ea`, muted `#b8adb8` |
| Radius | 14px cards, 999px pills, 10px controls |
| Touch target | Minimum 48 CSS px; 56–72px for accelerator/brake |
| Motion | 160–220ms ease-out; reduced-motion respected |
| Feedback | Press scale, selected border + tint, short toast/status copy |

## Responsive strategy

The game is landscape-first and uses `env(safe-area-inset-*)`, CSS clamp sizes, grid/flex layout, and percentage-based control zones. The HUD reserves the middle 48–58% of the viewport for visibility. Left thumb controls occupy the lower-start zone; pedals occupy the lower-end zone. The portrait warning is a dedicated full-screen state, not a compressed gameplay layout.

## Dynamic controls

Buttons mode shows left/right plus pedals. Steering-wheel mode replaces left/right with one large semi-transparent wheel. Motion mode hides wheel and direction buttons, leaving pedals and a sensor status hint. Settings contain wheel side, sensitivity, and size; gameplay does not.

## Validation checklist

A new user can reach Start Drive in three deliberate steps, return from every screen, identify the primary action, see the road in cockpit/chase views, distinguish accelerator from brake, switch Arabic/English without layout breakage, and pause without simulation updates.
