export class StopwatchModel {
    private startTime: number = 0;
    private runningTime: number = 0;
    private isRunning: boolean = false;
    private laps: number[] = [];

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.startTime = Date.now() - this.runningTime;
    }

    pause() {
        if (!this.isRunning) return;
        this.isRunning = false;
        this.runningTime = Date.now() - this.startTime;
    }

    reset() {
        this.isRunning = false;
        this.runningTime = 0;
        this.laps = [];
    }

    lap() {
        if (!this.isRunning) return;
        const currentTotal = Date.now() - this.startTime;
        this.laps.push(currentTotal);
    }

    getElapsedSeconds(): number {
        if (this.isRunning) {
            return (Date.now() - this.startTime) / 1000;
        }
        return this.runningTime / 1000;
    }

    getIsRunning(): boolean {
        return this.isRunning;
    }
}

export const stopwatchModel = new StopwatchModel();
