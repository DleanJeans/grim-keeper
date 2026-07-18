// Barrel kept for back-compat — the actual implementations now live in
// @/components/game/deaths-tab/death-actions. The FocusedPlayerDeathActions wrapper
// that used to live here has been removed; the death-action row is composed in
// @/components/game/deaths-tab/death-actions/index.tsx as FocusedDeathActionPanel.
export { ReviveButton as FocusedPlayerReviveButton } from './death-actions/revive-button';
export { UndoDeathButton as FocusedPlayerUndoDeathButton } from './death-actions/undo-death-button';
