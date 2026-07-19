import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import Cairo from 'gi://cairo';
import Meta from 'gi://Meta';
import * as Config from 'resource:///org/gnome/shell/misc/config.js';

export default class ParalineCompanionExtension extends Extension {
    enable() {
        try {
            console.warn(`[Paraline Extension Diagnostic] ==================================================`);
            console.warn(`[Paraline Extension Diagnostic] Extension enabled successfully.`);
            console.warn(`[Paraline Extension Diagnostic] GNOME Shell version: ${Config.PACKAGE_VERSION}`);

            // Wayland session check
            const isWayland = typeof Meta.is_wayland_compositor === 'function' && Meta.is_wayland_compositor();
            console.warn(`[Paraline Extension Diagnostic] Wayland session confirmation: ${isWayland ? "YES (Native Wayland Compositor)" : "NO (X11)"}`);

            // Workspace and window statistics
            const workspaceManager = global.workspace_manager;
            if (workspaceManager) {
                const activeWs = workspaceManager.get_active_workspace();
                const activeIndex = activeWs ? activeWs.index() : "unknown";
                console.warn(`[Paraline Extension Diagnostic] Workspaces: total=${workspaceManager.n_workspaces}, active_index=${activeIndex}`);
            } else {
                console.warn(`[Paraline Extension Diagnostic] WARNING: workspaceManager is null!`);
            }

            // Track window creations
            this._windowCreatedId = global.display.connect('window-created', (display, window) => {
                try {
                    console.warn(`[Paraline Extension Diagnostic] Signal 'window-created' received.`);
                    this._handleWindow(window, "window-created signal");
                } catch (err) {
                    console.warn(`[Paraline Extension Diagnostic] EXCEPTION in window-created callback: ${err}\nStack: ${err.stack}`);
                }
            });

            // Scan existing windows
            if (workspaceManager) {
                const numWorkspaces = workspaceManager.n_workspaces;
                for (let i = 0; i < numWorkspaces; i++) {
                    const ws = workspaceManager.get_workspace_by_index(i);
                    if (ws) {
                        const windows = ws.list_windows();
                        if (windows) {
                            for (const win of windows) {
                                try {
                                    this._handleWindow(win, `initial scan (workspace ${i})`);
                                } catch (err) {
                                    console.warn(`[Paraline Extension Diagnostic] EXCEPTION processing window in initial scan: ${err}\nStack: ${err.stack}`);
                                }
                             }
                          }
                      }
                  }
              }
        } catch (err) {
            console.warn(`[Paraline Extension Diagnostic] EXCEPTION enabling extension: ${err}\nStack: ${err.stack}`);
        }
    }

    disable() {
        try {
            console.warn(`[Paraline Extension Diagnostic] Disabling extension.`);
            if (this._windowCreatedId) {
                global.display.disconnect(this._windowCreatedId);
                this._windowCreatedId = null;
            }
        } catch (err) {
            console.warn(`[Paraline Extension Diagnostic] EXCEPTION disabling extension: ${err}\nStack: ${err.stack}`);
        }
    }

    _handleWindow(window, source) {
        try {
            if (!window) {
                console.warn(`[Paraline Extension Diagnostic] Received null window reference from source: ${source}`);
                return;
            }

            // Check MetaWindow validity
            console.warn(`[Paraline Extension Diagnostic] --------------------------------------------------`);
            console.warn(`[Paraline Extension Diagnostic] Discovered window from source: ${source}`);
            console.warn(`[Paraline Extension Diagnostic] MetaWindow validity check: object is defined (constructor: ${window.constructor ? window.constructor.name : "unknown"})`);

            // Extract window properties
            const title = typeof window.get_title === 'function' ? window.get_title() : "n/a (no get_title)";
            const wmClass = typeof window.get_wm_class === 'function' ? window.get_wm_class() : "n/a (no get_wm_class)";
            const wmClassInstance = typeof window.get_wm_class_instance === 'function' ? window.get_wm_class_instance() : "n/a (no get_wm_class_instance)";
            const role = typeof window.get_role === 'function' ? window.get_role() : "n/a (no get_role)";
            
            let gtkAppId = "n/a";
            if (typeof window.get_gtk_application_id === 'function') {
                gtkAppId = window.get_gtk_application_id();
            } else if (typeof window.get_description === 'function') {
                gtkAppId = `desc: ${window.get_description()}`;
            }

            let clientTypeStr = "unknown";
            if (typeof window.get_client_type === 'function') {
                const ct = window.get_client_type();
                if (ct === Meta.WindowClientType.WAYLAND) {
                    clientTypeStr = "WAYLAND";
                } else if (ct === Meta.WindowClientType.X11) {
                    clientTypeStr = "X11 (XWayland)";
                } else {
                    clientTypeStr = `OTHER (${ct})`;
                }
            }

            console.warn(`[Paraline Extension Diagnostic] Window properties:`);
            console.warn(`  - Title: "${title}"`);
            console.warn(`  - WM_CLASS: "${wmClass}"`);
            console.warn(`  - WM_CLASS_instance: "${wmClassInstance}"`);
            console.warn(`  - Window Role: "${role}"`);
            console.warn(`  - Application ID: "${gtkAppId}"`);
            console.warn(`  - Client Type: ${clientTypeStr}`);

            // Connect to destroy listener to monitor window recreation/lifecycle
            if (typeof window.connect === 'function' && !window._paralineDestroyConnected) {
                window.connect('unmanaged', () => {
                    console.warn(`[Paraline Extension Diagnostic] Window DESTROYED: title="${title}" wm_class="${wmClass}"`);
                });
                window._paralineDestroyConnected = true;
            }

            // Check if this matches our visualizer
            const isVisualizer = title === 'Paraline Visualizer';
            const isActiveVisualizer = title === 'Paraline Visualizer (Active)';
            const isMatch = isVisualizer || isActiveVisualizer;

            console.warn(`[Paraline Extension Diagnostic] Window match test: isMatch=${isMatch} (title match)`);

            if (isMatch) {
                console.warn(`[Paraline Extension Diagnostic] Paraline Visualizer MATCHED. Starting compositor verification pipeline.`);

                // Verify Clutter Actor
                let actor = null;
                if (typeof window.get_compositor_private === 'function') {
                    actor = window.get_compositor_private();
                }
                
                const actorValid = !!actor;
                console.warn(`[Paraline Extension Diagnostic] Clutter actor validity check: actorValid=${actorValid} (address: ${actor ? actor.toString() : "null"})`);

                // 1. Stick check
                if (typeof window.stick === 'function' && typeof window.is_on_all_workspaces === 'function') {
                    const prevStick = window.is_on_all_workspaces();
                    console.warn(`[Paraline Extension Diagnostic] Executing stick(). Previous is_on_all_workspaces: ${prevStick}`);
                    window.stick();
                    const nextStick = window.is_on_all_workspaces();
                    console.warn(`[Paraline Extension Diagnostic] Resulting is_on_all_workspaces: ${nextStick}`);
                    if (nextStick === prevStick && !nextStick) {
                        console.warn(`[Paraline Extension Diagnostic] WARNING: stick() operation was IGNORED or REJECTED by Mutter.`);
                    }
                } else {
                    console.warn(`[Paraline Extension Diagnostic] WARNING: window.stick or window.is_on_all_workspaces is not a function!`);
                }

                // 2. Make Above check
                if (typeof window.make_above === 'function' && typeof window.is_above === 'function') {
                    const prevAbove = window.is_above();
                    console.warn(`[Paraline Extension Diagnostic] Executing make_above(). Previous is_above: ${prevAbove}`);
                    window.make_above();
                    const nextAbove = window.is_above();
                    console.warn(`[Paraline Extension Diagnostic] Resulting is_above: ${nextAbove}`);
                    if (nextAbove === prevAbove && !nextAbove) {
                        console.warn(`[Paraline Extension Diagnostic] WARNING: make_above() operation was IGNORED or REJECTED by Mutter.`);
                    }
                } else {
                    console.warn(`[Paraline Extension Diagnostic] WARNING: window.make_above or window.is_above is not a function!`);
                }

                // 3. Skip Taskbar check
                let getSkipTaskbar = (win) => {
                    if (typeof win.get_skip_taskbar === 'function') return win.get_skip_taskbar();
                    if ('skip_taskbar' in win) return win.skip_taskbar;
                    return "unknown";
                };

                const prevSkip = getSkipTaskbar(window);
                console.warn(`[Paraline Extension Diagnostic] Executing set_skip_taskbar(true). Previous skip_taskbar: ${prevSkip}`);
                try {
                    if (typeof window.set_skip_taskbar === 'function') {
                        window.set_skip_taskbar(true);
                    } else {
                        window.skip_taskbar = true;
                    }
                } catch (skipErr) {
                    console.warn(`[Paraline Extension Diagnostic] EXCEPTION setting skip_taskbar: ${skipErr}`);
                }

                // Polyfill/override the JS wrapper methods to ensure GNOME Shell JS components (Alt-Tab, Dash, WindowTracker) filter this window out
                try {
                    window.is_skip_taskbar = () => true;
                    window.get_skip_taskbar = () => true;
                    window.skip_taskbar = true;
                    console.warn(`[Paraline Extension Diagnostic] Overrode/patched JavaScript getters for skip_taskbar on window wrapper.`);
                } catch (patchErr) {
                    console.warn(`[Paraline Extension Diagnostic] EXCEPTION overriding skip_taskbar wrapper properties: ${patchErr}`);
                }

                const nextSkip = getSkipTaskbar(window);
                console.warn(`[Paraline Extension Diagnostic] Resulting skip_taskbar: ${nextSkip}`);
                if (nextSkip === prevSkip && !nextSkip) {
                    console.warn(`[Paraline Extension Diagnostic] WARNING: set_skip_taskbar(true) was IGNORED or REJECTED by Mutter.`);
                }

                // 4. Input Region / Reactivity check
                if (actorValid) {
                    const prevReactive = actor.reactive;
                    console.warn(`[Paraline Extension Diagnostic] Modifying actor reactivity. Previous actor.reactive: ${prevReactive}`);
                    
                    try {
                        actor.reactive = false;
                        const nextReactive = actor.reactive;
                        console.warn(`[Paraline Extension Diagnostic] Resulting actor.reactive: ${nextReactive}`);
                        console.warn(`[Paraline Extension Diagnostic] actor reactivity modification: ${nextReactive === false ? "SUCCESS" : "FAILED"}`);
                    } catch (reactivityErr) {
                        console.warn(`[Paraline Extension Diagnostic] EXCEPTION modifying actor reactivity: ${reactivityErr}\nStack: ${reactivityErr.stack}`);
                    }

                    try {
                        if (typeof actor.set_input_region === 'function') {
                            if (isVisualizer) {
                                const region = new Cairo.Region();
                                actor.set_input_region(region);
                                console.warn(`[Paraline Extension Diagnostic] Called actor.set_input_region(empty Cairo.Region).`);
                            } else {
                                actor.set_input_region(null);
                                console.warn(`[Paraline Extension Diagnostic] Called actor.set_input_region(null).`);
                            }
                        } else {
                            console.warn(`[Paraline Extension Diagnostic] actor.set_input_region is not a function.`);
                        }
                    } catch (regionErr) {
                        console.warn(`[Paraline Extension Diagnostic] EXCEPTION modifying input region: ${regionErr}\nStack: ${regionErr.stack}`);
                    }
                } else {
                    console.warn(`[Paraline Extension Diagnostic] WARNING: Clutter actor input region modification skipped because actor is missing.`);
                }
            }

            // Setup observer for asynchronous title updates if not already connected
            if (typeof window.connect === 'function' && !window._paralineTitleConnected) {
                window.connect('notify::title', () => {
                    try {
                        console.warn(`[Paraline Extension Diagnostic] Signal 'notify::title' received for window.`);
                        this._handleWindow(window, "notify::title signal");
                    } catch (err) {
                        console.warn(`[Paraline Extension Diagnostic] EXCEPTION in notify::title handler: ${err}\nStack: ${err.stack}`);
                    }
                });
                window._paralineTitleConnected = true;
            }
        } catch (err) {
            console.warn(`[Paraline Extension Diagnostic] EXCEPTION in _handleWindow: ${err}\nStack: ${err.stack}`);
        }
    }
}
