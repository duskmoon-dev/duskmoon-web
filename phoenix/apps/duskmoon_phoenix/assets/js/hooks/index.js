/**
 * Phoenix Duskmoon UI v9 Hooks
 *
 * Import and export all LiveView hooks required by Phoenix Duskmoon UI components.
 *
 * ## Usage in your Phoenix app:
 *
 * ```javascript
 * import {LiveSocket} from "phoenix_live_view"
 * import * as DuskmoonHooks from "duskmoon_phoenix/hooks"
 *
 * let liveSocket = new LiveSocket("/live", Socket, {
 *   params: {_csrf_token: csrfToken},
 *   hooks: DuskmoonHooks
 * })
 * ```
 *
 * ## Available Hooks:
 *
 * - ThemeSwitcher: Theme toggle with localStorage persistence
 * - Spotlight: Keyboard shortcut (Cmd/Ctrl+K) for spotlight search
 * - PageHeader: Intersection observer for scroll-based effects
 * - DuskmoonPopover: Native dropdown expanded state and optional server-controlled popovers
 * - DuskmoonLeftMenu: Collapsible sidebar with persistent group and scroll state
 * - DuskmoonLeftMenuNavigation: Active-page synchronization for sticky left menus
 * - DuskmoonSplitPane: Accessible client-owned split-pane resizing
 */

// Registers the delegated handler for native confirmations.
import "../duskmoon_phoenix.js";

// Component-specific hooks
export { ThemeSwitcher } from "./theme_switcher.js";
export { Spotlight } from "./spotlight.js";
export { PageHeader } from "./page_header.js";
export { DuskmoonPopover } from "./duskmoon_popover.js";
export { DuskmoonLeftMenu } from "./left_menu.js";
export { DuskmoonLeftMenuNavigation } from "./left_menu_navigation.js";
export { DuskmoonSplitPane } from "./split_pane.js";
export { DuskmoonMenu, initMenu } from "./menu.js";
export { DuskmoonTabs, initTabs } from "./tabs.js";
