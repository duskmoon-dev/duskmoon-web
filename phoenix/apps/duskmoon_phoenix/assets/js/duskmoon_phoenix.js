/** Lightweight behavior for native Duskmoon Phoenix components. */

const DIALOG_SELECTOR = 'dialog[data-dm-confirm-dialog="true"]';
const DIALOG_CONFIRM_SELECTOR = '[data-dm-confirm-action="true"]';
const DIALOG_BEHAVIOR_LISTENERS = Symbol.for("duskmoon-phoenix.dialog-behavior-listeners");

/** Close before other actions, leaving native close commands to the browser. */
export function handleDialogConfirmClick(event) {
  const path = event.composedPath?.() ?? [];
  const action = path.find((node) => node.matches?.(DIALOG_CONFIRM_SELECTOR));
  const dialog = path.find((node) => node.matches?.(DIALOG_SELECTOR));

  if (!action || !dialog?.open) return;

  const formAction = action.form && ["submit", "reset"].includes(action.type);
  const nativeClose = action.command === "close" && action.commandForElement === dialog;

  if (!nativeClose || formAction) dialog.close();
}

/** Install CSP-safe delegated behavior for LiveView-patched confirm dialogs. */
export function installDialogBehavior(root = globalThis.document) {
  if (!root?.addEventListener || root[DIALOG_BEHAVIOR_LISTENERS]) return;

  root.addEventListener("click", handleDialogConfirmClick, true);
  root[DIALOG_BEHAVIOR_LISTENERS] = handleDialogConfirmClick;
}

installDialogBehavior();
