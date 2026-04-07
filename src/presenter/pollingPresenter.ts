import { waitForEvenAppBridge } from "@evenrealities/even_hub_sdk";
import { timerModel } from "../model/timerModel";
import { alarmModel } from "../model/alarmModel";
import { stopwatchModel } from "../model/stopwatchModel";
import { clockModel, AppState } from "../model/clockModel";
import { createView } from "../view/GlassesView";
import { webView } from "../view/WebView";

class PollingPresenter {
    private isPolling = false;
    private timeout: number | undefined;

    async startPolling() {
        if (this.isPolling) return;
        this.isPolling = true;

        // When the timer expires, force an immediate re-render
        timerModel.setOnFinished(() => {
            console.log("[polling] Timer finished – forcing immediate view update");
            createView();
        });

        // Ensure the FIRST screen renders immediately on app start
        await createView();

        this.schedule();
    }

    stopPolling() {
        this.isPolling = false;
        if (this.timeout) clearTimeout(this.timeout);
        this.timeout = undefined;
    }

    private schedule() {
        if (!this.isPolling) return;
        this.timeout = window.setTimeout(() => this.tick(), 200); // Increased polling rate for smoother updates
    }

    private lastState = clockModel.state;

    private async tick() {
        if (!this.isPolling) return;

        try {
            // 1. Alarm check (always check alarms regardless of state)
            if (clockModel.state !== AppState.ALARM_TRIGGERED) {
                if (alarmModel.checkAlarms()) {
                    console.log("[polling] Alarm triggered!");
                    clockModel.state = AppState.ALARM_TRIGGERED;

                    (async () => {
                        try {
                            const bridge = await waitForEvenAppBridge();
                            // Use exitMode=1 para mostrar o popup nativo perguntando se deseja sair.
                            // Funciona como um aviso visual intrusivo para o alarme.
                            bridge.shutDownPageContainer(1); 
                            console.log("[polling] Native popup triggered via shutDownPageContainer");
                        } catch (err) {
                            console.error("[polling] Native popup error:", err);
                        }
                    })();
                }
            }

            // 2. Conditional render:
            // - If something is moving (Stopwatch/Timer/AlarmTriggered)
            // - OR if the state just changed
            const state = clockModel.state;
            const needsUpdate =
                (state === AppState.STOPWATCH && stopwatchModel.getIsRunning()) ||
                (state === AppState.TIMER && timerModel.getIsRunning()) ||
                (state === AppState.ALARM_TRIGGERED) ||
                (state !== this.lastState);

            if (needsUpdate) {
                this.lastState = state;
                await createView();
                webView.updateUI();
            }
        } catch (error) {
            console.error("[polling] Error:", error);
        }

        this.schedule();
    }
}

const pollingPresenter = new PollingPresenter();
export default pollingPresenter;
