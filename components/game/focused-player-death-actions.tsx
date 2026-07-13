// Barrel kept for back-compat — the actual implementations now live in
// @/components/game/death-actions. The FocusedPlayerDeathActions wrapper that
// used to live here has been removed; the death-action row is composed in
// @/components/game/death-actions/index.tsx as FocusedDeathActionPanel.
export { ReviveButton as FocusedPlayerReviveButton } from '@/components/game/death-actions/revive-button';
export { UndoDeathButton as FocusedPlayerUndoDeathButton } from '@/components/game/death-actions/undo-death-button';
