/** Closes native confirmation dialogs before submit/reset actions. */
export declare function handleDialogConfirmClick(event: Event): void;

/** Installs the delegated native confirmation handler once per root. */
export declare function installDialogBehavior(root?: EventTarget): void;
