# Quickstart: Storybook Component Showcase

**Branch**: `014-add-storybook`

## Start the Component Browser

```bash
just storybook
```

Opens at **http://localhost:6006** in your default browser. Runs independently of the backend and main dev server.

## What's Inside

| Category | Component | Stories |
|----------|-----------|---------|
| UI | Button | Primary, Secondary, Disabled, Loading |
| UI | Card | Default, Empty, Compact Padding |
| UI | Timer | Running, Paused, Urgent |
| Feature | EmojiPicker | Default Selection, No Selection |
| Feature | Leaderboard | Mid-game, Final Results, Empty |
| Feature | Podium | Full (3 players), Single Winner, Empty |

## Interactive Controls

Every story has a **Controls** panel at the bottom of the screen. Change any prop value to instantly see how the component responds — no code edit required. Actions (clicks, callbacks) are logged in the **Actions** panel.

## Hot Reload

Edit any `*.stories.tsx` file and save — the browser updates automatically within seconds.

## Adding a New Story

1. Create `ComponentName.stories.tsx` next to `ComponentName.tsx`
2. Use the CSF3 format:

```tsx
import type { Meta, StoryObj } from 'storybook-react-rsbuild'
import { MyComponent } from './MyComponent'

const meta = {
  component: MyComponent,
} satisfies Meta<typeof MyComponent>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
  args: { /* initial prop values */ },
}
```

3. Save — the component browser picks it up automatically via the `src/**/*.stories.tsx` glob.

## Key Files

| File | Purpose |
|------|---------|
| `frontend/.storybook/main.ts` | Builder, addons, stories glob |
| `frontend/.storybook/preview.ts` | Global styles, parameters |
| `frontend/rsbuild.config.ts` | Minimal Rsbuild config for Storybook |
| `frontend/src/components/**/*.stories.tsx` | Story files (collocated with components) |
