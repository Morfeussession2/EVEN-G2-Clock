import {
    waitForEvenAppBridge,
    CreateStartUpPageContainer,
    TextContainerProperty,
    ListContainerProperty,
    ListItemContainerProperty,
    ImageContainerProperty,
    ImageRawDataUpdate,
    RebuildPageContainer,
    TextContainerUpgrade
} from '@evenrealities/even_hub_sdk';

import { AppState, clockModel } from '../model/clockModel';
import { stopwatchModel } from '../model/stopwatchModel';
import { timerModel } from '../model/timerModel';
import { formatTime } from '../utils/timeUtils';
import { convertImageToGrayscalePng } from '../utils/imageUtils';
import headerImage from '../Evenprojetoclock-01.png';

// ─── State ────────────────────────────────────────────────────────────────────
let isPageCreated = false;
let isProcessing = false;
let hasPendingUpdate = false;
let lastRenderedKey = "";

// Track individual parts for partial updates
let lastMainContent = "";
let lastState: AppState | null = null;
let lastListName = "";
let lastImageKey = "";

const MAX_WIDTH = 576;

// ─── Screen config ────────────────────────────────────────────────────────────

/**
 * Returns the visual content for the current app state.
 * All screens share the same 3 fixed containers (IDs 1, 2, 3).
 * Button lists always use 0-based indices:
 *   MENU             → [0] Cronometro  [1] Timer       [2] Alarm
 *   STOPWATCH        → [0] Inic/Pausar [1] Reiniciar   [2] Voltar Menu
 *   TIMER_SELECT     → [0] 1 min       [1] 5 min       [2] 10 min      [3] 30 min   [4] Cancelar
 *   TIMER            → [0] Pausar/Ret. [1] Reiniciar   [2] Sair
 *   ALARM            → [0] Hora +1     [1] Min +5      [2] Voltar Menu
 *   ALARM_TRIGGERED  → [0] OK
 */
function buildScreenConfig(state: AppState): {
    mainContent: string;
    listName: string;
    btnNames: string[];
} {
    switch (state) {
        case AppState.STOPWATCH:
            return {
                mainContent: formatTime(stopwatchModel.getElapsedSeconds()),
                listName: "swList",
                btnNames: ["Start/Stop", "Reset", "Back Menu"],
            };
        case AppState.TIMER_SELECT:
            return {
                mainContent: "Duration",
                listName: "timerSelectList",
                btnNames: ["1 min", "5 min", "10 min", "30 min", "Cancel"],
            };
        case AppState.TIMER: {
            const running = timerModel.getIsRunning();
            return {
                mainContent: formatTime(timerModel.getRemainingSeconds()),
                listName: "timerList",
                btnNames: [running ? "Pause" : "Resume", "Reset", "Exit"],
            };
        }
        case AppState.ALARM:
            const alarm = clockModel.alarmSetting;
            return {
                mainContent: `${String(alarm.hour).padStart(2, '0')}:${String(alarm.min).padStart(2, '0')} ${alarm.enabled ? '[ON]' : '[OFF]'}`,
                listName: "alarmList",
                btnNames: [alarm.enabled ? "Off" : "On", "+1h", "+5m", "Back Menu"],
            };
        case AppState.ALARM_TRIGGERED:
            return {
                mainContent: "!! Alarm !!",
                listName: "alarmTrigList",
                btnNames: ["OK"],
            };
        default: // MENU
            return {
                mainContent: "Select Mode",
                listName: "menuList",
                btnNames: ["Stopwatch", "Timer", "Alarm"],
            };
    }
}

function buildContainerPayload(mainContent: string, listName: string, btnNames: string[], mainY: number = 50, showImage: boolean = true) {
    return {
        containerTotalNum: showImage ? 3 : 2,
        textObject: [
            new TextContainerProperty({
                containerID: 2,
                containerName: 'mainDisplay',
                xPosition: 227, // (576 - 400) / 2
                yPosition: mainY,
                width: 400,
                height: 40,
                content: mainContent,
                isEventCapture: 0,
            }),
        ],
        listObject: [
            new ListContainerProperty({
                containerID: 3,
                containerName: listName,
                xPosition: 205, // (576 - 165) / 2
                yPosition: 60,
                width: 165,
                height: 200,
                isEventCapture: 1,
                itemContainer: new ListItemContainerProperty({
                    itemCount: btnNames.length,
                    itemWidth: 165,
                    itemName: btnNames,
                    isItemSelectBorderEn: 1,
                }),
            }),
        ],
        imageObject: showImage ? [
            new ImageContainerProperty({
                containerID: 1,
                containerName: 'headerImage',
                xPosition: 238, // (576 - 100) / 2
                yPosition: 0,
                width: 100,
                height: 50,
            }),
        ] : [],
    };
}

// ─── Core render function ─────────────────────────────────────────────────────

async function _doRender() {
    try {
        const bridge = await waitForEvenAppBridge();
        const state = clockModel.state;
        const { mainContent, listName, btnNames } = buildScreenConfig(state);

        // A unique key for this exact visual state — used to skip no-op renders
        const timerRunning = state === AppState.TIMER ? `|run:${timerModel.getIsRunning()}` : '';
        const renderKey = `${state}|${listName}|${mainContent}${timerRunning}`;

        if (renderKey === lastRenderedKey) return; // Nothing changed, skip

        // Special handling for TIMER_SELECT: move "Duração" to top and hide logo
        const isTimerSelect = state === AppState.TIMER_SELECT;
        const mainY = isTimerSelect ? 0 : 50;
        const showLogo = !isTimerSelect;

        // --- OPTIMIZATION: Partial Update ---
        // If the structure (state, list, logo) is the same, ONLY update the text.
        if (isPageCreated && state === lastState && listName === lastListName && mainContent !== lastMainContent) {
            console.log(`[view] Partial Update (Text) → ${mainContent}`);
            const success = await bridge.textContainerUpgrade(new TextContainerUpgrade({
                containerID: 2,
                containerName: 'mainDisplay',
                content: mainContent
            }));

            if (success) {
                lastMainContent = mainContent;
                lastRenderedKey = renderKey;
                return; // Efficiency win!
            }
            console.warn("[view] textContainerUpgrade failed, falling back to full rebuild");
        }

        const payload = buildContainerPayload(mainContent, listName, btnNames, mainY, showLogo);

        if (!isPageCreated) {
            console.log(`[view] First render → createStartUpPageContainer (${state})`);
            const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(payload));
            console.log(`[view] createStartUpPageContainer result: ${result}`);
            if (result === 0 || result === 1) isPageCreated = true;
        } else {
            console.log(`[view] Rebuild → ${state} | ${mainContent}`);
            const success = await bridge.rebuildPageContainer(new RebuildPageContainer(payload));
            console.log(`[view] rebuildPageContainer success: ${success}`);
            if (!success) {
                console.warn(`[view] Fallback → createStartUpPageContainer (${state})`);
                isPageCreated = false;
                const result = await bridge.createStartUpPageContainer(new CreateStartUpPageContainer(payload));
                console.log(`[view] Fallback result: ${result}`);
                if (result === 0 || result === 1) isPageCreated = true;
            }
        }

        // --- Handle Image Update ---
        if (isPageCreated && showLogo && lastImageKey !== headerImage) {
            try {
                console.log("[view] Updating header image...");
                const rawData = await convertImageToGrayscalePng(headerImage, 100, 50);
                await bridge.updateImageRawData(new ImageRawDataUpdate({
                    containerID: 1,
                    containerName: 'headerImage',
                    imageData: Array.from(rawData),
                }));
                lastImageKey = headerImage;
            } catch (err) {
                console.error("[view] Image update error:", err);
            }
        }

        // Update tracking values
        lastState = state;
        lastListName = listName;
        lastMainContent = mainContent;
        lastRenderedKey = renderKey;

    } catch (e) {
        console.error("[view] Error:", e);
        isPageCreated = false;
        lastRenderedKey = "";
    }
}

/**
 * Public entry point.
 * Uses a queue pattern: at most ONE concurrent render, with ONE pending slot.
 * This ensures button-triggered updates are never silently dropped.
 */
export async function createView() {
    if (isProcessing) {
        hasPendingUpdate = true;
        return;
    }

    isProcessing = true;
    hasPendingUpdate = false;

    try {
        await _doRender();
    } finally {
        isProcessing = false;

        if (hasPendingUpdate) {
            hasPendingUpdate = false;
            // Small delay to avoid immediately hammering the bridge
            setTimeout(() => createView(), 50);
        }
    }
}
