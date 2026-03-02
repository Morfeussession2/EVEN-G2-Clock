import { clockModel, AppState } from '../model/clockModel';
import { stopwatchModel } from '../model/stopwatchModel';
import { timerModel } from '../model/timerModel';
import { formatTime } from '../utils/timeUtils';
import { createView } from './GlassesView';

class WebView {
    private clockEl: HTMLElement | null = null;
    private modeEl: HTMLElement | null = null;
    private controlsArea: HTMLElement | null = null;

    constructor() {
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.init());
        } else {
            this.init();
        }
    }

    private init() {
        this.clockEl = document.getElementById('web-clock');
        this.modeEl = document.getElementById('mode-title');
        this.controlsArea = document.getElementById('functional-controls');

        // Cards de navegação + Bottom Nav
        [
            { id: 'mode-stopwatch', state: AppState.STOPWATCH },
            { id: 'mode-timer', state: AppState.TIMER_SELECT },
            { id: 'mode-alarm', state: AppState.ALARM },
            { id: 'mode-menu', state: AppState.MENU },
            { id: 'nav-stopwatch', state: AppState.STOPWATCH },
            { id: 'nav-timer', state: AppState.TIMER_SELECT },
            { id: 'nav-alarm', state: AppState.ALARM },
            { id: 'nav-menu', state: AppState.MENU }
        ].forEach(({ id, state }) => {
            const el = document.getElementById(id);
            if (!el) return;

            el.onclick = (e) => {
                e.preventDefault();
                clockModel.state = state;
                this.updateUI();
                createView();
            };
        });

        this.updateUI();
    }

    public updateUI() {
        const state = clockModel.state;

        if (this.modeEl) {
            this.modeEl.innerText = this.getStateLabel(state);
        }

        let displayTime = '00:00:00';

        if (state === AppState.STOPWATCH) {
            displayTime = formatTime(stopwatchModel.getElapsedSeconds());
        } else if (state === AppState.TIMER) {
            displayTime = formatTime(timerModel.getRemainingSeconds());
        } else if (state === AppState.ALARM) {
            displayTime =
                `${clockModel.alarmSetting.hour.toString().padStart(2, '0')}:` +
                `${clockModel.alarmSetting.min.toString().padStart(2, '0')}`;
        }

        if (this.clockEl) {
            this.clockEl.innerText = displayTime;
        }

        const stateKey = this.getStateKey(state);
        document.querySelectorAll('.mode-card').forEach(card => {
            card.classList.toggle('active', card.id === `mode-${stateKey}`);
        });

        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.toggle('active', item.id === `nav-${stateKey}`);
        });

        this.renderControls(state);
    }

    private renderControls(state: AppState) {
        if (!this.controlsArea) return;
        this.controlsArea.innerHTML = '';

        /* ───────── Stopwatch ───────── */
        if (state === AppState.STOPWATCH) {
            this.controlsArea.innerHTML = `
                <div class="controls soft">
                    <button class="soft-btn" id="sw-btn-toggle">
                        ${stopwatchModel.getIsRunning() ? 'Pause' : 'Start'}
                    </button>
                    <button class="soft-btn outline" id="sw-btn-reset">
                        Reset
                    </button>
                </div>
            `;

            document.getElementById('sw-btn-toggle')!.onclick = () => {
                stopwatchModel.getIsRunning()
                    ? stopwatchModel.pause()
                    : stopwatchModel.start();
                this.updateUI();
                createView();
            };

            document.getElementById('sw-btn-reset')!.onclick = () => {
                stopwatchModel.reset();
                this.updateUI();
                createView();
            };
        }

        /* ───────── TIMER ───────── */
        else if (state === AppState.TIMER) {
            this.controlsArea.innerHTML = `
                <div class="input-row minimal">
                    <input type="number" id="web-timer-m" min="0"
                        value="${Math.floor(timerModel.getDuration() / 60)}">
                    :
                    <input type="number" id="web-timer-s" min="0" max="59"
                        value="${timerModel.getDuration() % 60}">
                </div>

                <div class="controls soft">
                    <button class="soft-btn" id="web-timer-toggle">
                        ${timerModel.getIsRunning() ? 'Stop' : 'Start'}
                    </button>
                </div>
            `;

            document.getElementById('web-timer-toggle')!.onclick = () => {
                if (timerModel.getIsRunning()) {
                    timerModel.pause();
                    timerModel.reset();
                } else {
                    const m = Number(
                        (document.getElementById('web-timer-m') as HTMLInputElement).value
                    ) || 0;
                    const s = Number(
                        (document.getElementById('web-timer-s') as HTMLInputElement).value
                    ) || 0;

                    timerModel.setDuration(m * 60 + s);
                    timerModel.start();
                }
                this.updateUI();
                createView();
            };
        }

        /* ───────── Alarm ───────── */
        else if (state === AppState.ALARM) {
            this.controlsArea.innerHTML = `
                <div class="input-row minimal">
                    <input type="number" id="web-alarm-h" min="0" max="23"
                        value="${clockModel.alarmSetting.hour}">
                    :
                    <input type="number" id="web-alarm-m" min="0" max="59"
                        value="${clockModel.alarmSetting.min}">
                </div>

                <div class="controls soft">
                    <button class="soft-btn" id="web-alarm-save">
                        Salvar Alarm
                    </button>
                </div>
            `;

            document.getElementById('web-alarm-save')!.onclick = () => {
                const h = Number(
                    (document.getElementById('web-alarm-h') as HTMLInputElement).value
                ) || 0;
                const m = Number(
                    (document.getElementById('web-alarm-m') as HTMLInputElement).value
                ) || 0;

                clockModel.alarmSetting.hour = Math.min(23, Math.max(0, h));
                clockModel.alarmSetting.min = Math.min(59, Math.max(0, m));
                clockModel.alarmSetting.enabled = true; // Auto-enable when saving

                this.updateUI();
                createView();
            };
        }
    }

    private getStateLabel(state: AppState): string {
        switch (state) {
            case AppState.STOPWATCH: return 'Stopwatch';
            case AppState.TIMER: return 'Timer';
            case AppState.ALARM: return 'Alarm';
            default: return '';
        }
    }

    private getStateKey(state: AppState): string {
        switch (state) {
            case AppState.STOPWATCH: return 'stopwatch';
            case AppState.TIMER: return 'timer';
            case AppState.ALARM: return 'alarm';
            default: return 'menu';
        }
    }
}

export const webView = new WebView();