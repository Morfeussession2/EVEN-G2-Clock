import { AppState, clockModel } from "./clockModel";

class AlarmModel {
    checkAlarms() {
        const now = new Date();
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();

        const alarm = clockModel.alarmSetting;
        if (alarm.enabled && alarm.hour === currentHour && alarm.min === currentMin) {
            // Trigger notification state
            return true;
        }
        return false;
    }
}

export const alarmModel = new AlarmModel();
