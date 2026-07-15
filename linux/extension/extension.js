import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

export default class ParalineCompanionExtension extends Extension {
    enable() {
        try {
            this._windowCreatedId = global.display.connect('window-created', (display, window) => {
                try {
                    this._handleWindow(window);
                } catch (err) {
                    console.error(`[Paraline Extension] Error handling window created: ${err}`);
                }
            });

            // Process any already open Paraline windows
            const workspaceManager = global.workspace_manager;
            if (workspaceManager) {
                const numWorkspaces = workspaceManager.n_workspaces;
                for (let i = 0; i < numWorkspaces; i++) {
                    const ws = workspaceManager.get_workspace_by_index(i);
                    if (ws) {
                        const windows = ws.list_windows();
                        if (windows) {
                            for (const win of windows) {
                                try {
                                    this._handleWindow(win);
                                } catch (err) {
                                    console.error(`[Paraline Extension] Error processing window: ${err}`);
                                }
                             }
                         }
                     }
                 }
             }
        } catch (err) {
            console.error(`[Paraline Extension] Error enabling extension: ${err}`);
        }
    }

    disable() {
        try {
            if (this._windowCreatedId) {
                global.display.disconnect(this._windowCreatedId);
                this._windowCreatedId = null;
            }
        } catch (err) {
            console.error(`[Paraline Extension] Error disabling extension: ${err}`);
        }
    }

    _handleWindow(window) {
        try {
            if (!window) return;
            
            // Safe type guard for Mutter window APIs
            if (typeof window.get_title !== 'function' || typeof window.get_wm_class !== 'function') {
                return;
            }

            const title = window.get_title();
            const wmClass = window.get_wm_class();
            
            const isParaline = (title && title.toLowerCase().includes('paraline')) ||
                               (wmClass && wmClass.toLowerCase().includes('paraline'));

            if (isParaline) {
                console.log(`[Paraline Extension] MATCHED Paraline window. Calling stick() and make_above().`);
                if (typeof window.stick === 'function') {
                    window.stick();
                }
                if (typeof window.make_above === 'function') {
                    window.make_above();
                }
            }
        } catch (err) {
            console.error(`[Paraline Extension] Error in _handleWindow: ${err}`);
        }
    }
}
