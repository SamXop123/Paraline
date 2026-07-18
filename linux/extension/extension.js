import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Cairo from 'gi://cairo';

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

            const handleTitle = () => {
                const title = window.get_title();
                if (!title) return;

                const isVisualizer = title === 'Paraline Visualizer';
                const isActiveVisualizer = title === 'Paraline Visualizer (Active)';

                if (isVisualizer || isActiveVisualizer) {
                    // Stick window to all workspaces
                    if (typeof window.stick === 'function') {
                        window.stick();
                    }
                    // Keep window always on top
                    if (typeof window.make_above === 'function') {
                        window.make_above();
                    }

                    // Get compositor private window actor to handle click-through natively on Wayland
                    if (typeof window.get_compositor_private === 'function') {
                        const actor = window.get_compositor_private();
                        if (actor && typeof actor.set_input_region === 'function') {
                            if (isVisualizer) {
                                // Set input region to empty to make it click-through
                                const region = new Cairo.Region();
                                actor.set_input_region(region);
                            } else {
                                // Reset input region to default (null) to make it clickable
                                actor.set_input_region(null);
                            }
                        }
                    }
                }
            };

            // Process title immediately
            handleTitle();

            // Setup observer for asynchronous title updates (Wayland clients set title asynchronously)
            if (typeof window.connect === 'function') {
                window.connect('notify::title', () => {
                    try {
                        handleTitle();
                    } catch (err) {
                        console.error(`[Paraline Extension] Error in title notification callback: ${err}`);
                    }
                });
            }
        } catch (err) {
            console.error(`[Paraline Extension] Error in _handleWindow: ${err}`);
        }
    }
}
