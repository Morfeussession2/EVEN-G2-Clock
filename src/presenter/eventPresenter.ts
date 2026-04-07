import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import { clockModel, AppState } from "../model/clockModel";
import { stopwatchModel } from "../model/stopwatchModel";
import { timerModel } from "../model/timerModel";
import { createView } from "../view/GlassesView";

/**
 * EventHandler: State-driven button handling.
 *
 * Button layout (0-based indices, no padding items):
 *   MENU         → [0] Cronometro  [1] Timer      [2] Alarm
 *   STOPWATCH    → [0] Inic/Pausar [1] Reiniciar  [2] Voltar Menu
 *   TIMER_SELECT → [0] 1 min       [1] 5 min      [2] 10 min  [3] 30 min  [4] Cancelar
 *   TIMER        → [0] Pausar/Ret  [1] Reiniciar  [2] Sair
 *   ALARM        → [0] Hora +1     [1] Min +5     [2] Voltar Menu
 */

/** Durações pré-definidas em segundos, alinhadas com btnNames do TIMER_SELECT */
const TIMER_DURATIONS_SECONDS = [60, 300, 600, 1800];

// Native hardware interactions handle double clicks.
export async function eventHandler() {
    console.log("EventHandler: Initializing state-driven button logic");
    const bridge = await waitForEvenAppBridge();

    bridge.onEvenHubEvent((event) => {
        let index: number | undefined;

        if (event.listEvent !== undefined) {
            // Treat undefined/null index in a valid list event as 0
            index = event.listEvent.currentSelectItemIndex ?? 0;
        } else if (event.jsonData?.listEvent?.currentSelectItemIndex !== undefined) {
            index = event.jsonData.listEvent.currentSelectItemIndex;
        } else if (event.jsonData?.listEvent !== undefined) {
            // Treat undefined/null index in a valid list event as 0
            index = 0;
        }

        const state = clockModel.state;

        // --- NATIVE DOUBLE CLICK HANDLER ---
        // Even SDK sysEvent.eventType === 3 represents TOUCH_DOUBLE_CLICK_EVENT
        if (event.sysEvent && event.sysEvent.eventType === 3) {
            if (state === AppState.ALARM_ACTIVE) {
                console.log("ALARM_ACTIVE: Native Double click -> back");
                clockModel.state = AppState.ALARM; // Voltar para configuração de alarme normal
                import("../view/WebView").then(mod => {
                    mod.webView.updateUI();
                });
                createView();
                return; // Early return to avoid List processing
            }
        }

        if (index === undefined) {
            return;
        }
        const itemName = event.listEvent?.currentSelectItemName || '?';
        console.log(`[EVENT] State: ${state} | Index: ${index} | Item: ${itemName}`);

        // ==========================================
        // 1. MENU PRINCIPAL
        // [0] Cronometro | [1] Timer | [2] Alarm
        // ==========================================
        if (state === AppState.MENU) {
            if (index === 0) clockModel.state = AppState.STOPWATCH;
            else if (index === 1) clockModel.state = AppState.TIMER_SELECT; // vai para seleção de duração
            else if (index === 2) clockModel.state = AppState.ALARM;
        }

        // ==========================================
        // 2. CRONOMETRO
        // [0] Inic/Pausar | [1] Reiniciar | [2] Voltar Menu
        // ==========================================
        else if (state === AppState.STOPWATCH) {
            if (index === 0) {
                console.log("STOPWATCH: Start/Pause");
                if (stopwatchModel.getIsRunning()) stopwatchModel.pause();
                else stopwatchModel.start();
            } else if (index === 1) {
                console.log("STOPWATCH: Reset");
                stopwatchModel.reset();
            } else if (index === 2) {
                console.log("STOPWATCH: Go Menu");
                clockModel.state = AppState.MENU;
            }
        }

        // ==========================================
        // 3. TIMER - SELEÇÃO DE DURAÇÃO
        // [0] 1 min | [1] 5 min | [2] 10 min | [3] 30 min | [4] Cancelar
        // ==========================================
        else if (state === AppState.TIMER_SELECT) {
            if (index === 0) {
                console.log("TIMER_SELECT: 1 min selected");
                timerModel.setDuration(60);
                timerModel.start();
                clockModel.state = AppState.TIMER;
            } else if (index === 1) {
                console.log("TIMER_SELECT: 5 min selected");
                timerModel.setDuration(300);
                timerModel.start();
                clockModel.state = AppState.TIMER;
            } else if (index === 2) {
                console.log("TIMER_SELECT: 10 min selected");
                timerModel.setDuration(600);
                timerModel.start();
                clockModel.state = AppState.TIMER;
            } else if (index === 3) {
                console.log("TIMER_SELECT: 30 min selected");
                timerModel.setDuration(1800);
                timerModel.start();
                clockModel.state = AppState.TIMER;
            } else if (index === 4) {
                console.log("TIMER_SELECT: Cancelled");
                clockModel.state = AppState.MENU;
            }
        }

        // ==========================================
        // 4. TIMER - EM EXECUÇÃO / PAUSADO
        // [0] Pausar/Retomar | [1] Reiniciar | [2] Sair
        // ==========================================
        else if (state === AppState.TIMER) {
            if (index === 0) {
                if (timerModel.getIsRunning()) {
                    console.log("TIMER: Pause");
                    timerModel.pause();
                } else {
                    console.log("TIMER: Resume");
                    timerModel.start();
                }
            } else if (index === 1) {
                console.log("TIMER: Restart — back to duration select");
                timerModel.pause();
                clockModel.state = AppState.TIMER_SELECT; // volta para re-selecionar
            } else if (index === 2) {
                console.log("TIMER: Exit to Menu");
                timerModel.pause();
                clockModel.state = AppState.MENU;
            }
        }

        // ==========================================
        // 5. Alarm
        // [0] Ligar/Desligar | [1] Hora +1 | [2] Min +5 | [3] Voltar Menu
        // ==========================================
        else if (state === AppState.ALARM) {
            if (index === 0) {
                console.log("ALARM: Toggle Enabled");
                clockModel.alarmSetting.enabled = !clockModel.alarmSetting.enabled;
                if (clockModel.alarmSetting.enabled) {
                    clockModel.state = AppState.ALARM_ACTIVE;
                }
            } else if (index === 1) {
                console.log("ALARM: +1 Hour");
                clockModel.alarmSetting.hour = (clockModel.alarmSetting.hour + 1) % 24;
            } else if (index === 2) {
                console.log("ALARM: +5 Min");
                clockModel.alarmSetting.min = (clockModel.alarmSetting.min + 5) % 60;
            } else if (index === 3) {
                console.log("ALARM: Go Menu");
                clockModel.state = AppState.MENU;
            }
        }

        // ==========================================
        // 6. ALARM ACTIVE
        // Toca num botao invisível. Detecta double click para voltar.
        // ==========================================
        else if (state === AppState.ALARM_ACTIVE) {
            // Wait for native system double tap instead of relying on discrete list clicks
            console.log("ALARM_ACTIVE: Single click ignored. Please use native double-tap on the temple to exit.");
        }

        // ==========================================
        // 7. Alarm DISPARADO → qualquer botão volta ao menu
        // ==========================================
        else if (state === AppState.ALARM_TRIGGERED) {
            console.log("ALARM_TRIGGERED: OK clicked, disabling alarm");
            clockModel.alarmSetting.enabled = false; // Disable to prevent re-triggering in the same minute
            clockModel.state = AppState.MENU;
        }

        // Update WebView to sync state
        import("../view/WebView").then(mod => {
            mod.webView.updateUI();
        });

        // Update display immediately after any interaction
        createView();
    });
}