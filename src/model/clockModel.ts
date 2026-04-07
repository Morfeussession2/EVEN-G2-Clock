export enum AppState {
    MENU = 'Menu',
    STOPWATCH = 'Stopwatch',
    TIMER_SELECT = 'TimerSelect',  // tela de seleção de duração
    TIMER = 'Timer',               // timer em execução/pausado
    ALARM = 'Alarm',
    ALARM_ACTIVE = 'AlarmActive',
    ALARM_TRIGGERED = 'AlarmTriggered'
}

export enum AppMode {
    CLOCK = 'Clock',
    ALARM = 'Alarm',
    STOPWATCH = 'Stopwatch',
    TIMER = 'Timer'
}

export interface Alarm {
    time: string; // HH:MM
    day: 'Today' | 'Tomorrow' | 'Daily';
    enabled: boolean;
}

class ClockModel {
    public state: AppState = AppState.MENU;
    public currentMode: AppMode = AppMode.CLOCK;
    public alarms: Alarm[] = [];

    // Sub-states for complex setting flows
    public menuIndex: number = 0;
    public timerSetting: { mins: number, secs: number } = { mins: 0, secs: 0 };
    public alarmSetting: { day: 'Today' | 'Tomorrow', hour: number, min: number, enabled: boolean } = { day: 'Today', hour: 8, min: 0, enabled: false };

    constructor() { }
}

export const clockModel = new ClockModel();
