export class TimerModel {
    private duration = 0;
    private remainingTime = 0;
    private isRunning = false;
    private startTime = 0;
    private intervalId: any = null;
    private onFinishedCallback: (() => void) | null = null;

    setDuration(seconds: number) {
        this.duration = seconds;
        this.remainingTime = seconds;
        this.stopTick();
        this.isRunning = false;
    }

    setOnFinished(callback: () => void) {
        this.onFinishedCallback = callback;
    }

    start() {
        if (this.isRunning) return;
        if (this.remainingTime <= 0) return;

        this.isRunning = true;
        this.startTime = Date.now();
        this.startTick();
    }

    pause() {
        if (!this.isRunning) return;

        this.updateRemaining();
        this.isRunning = false;
        this.stopTick();
    }

    reset() {
        this.isRunning = false;
        this.remainingTime = this.duration;
        this.stopTick();
    }

    addSeconds(seconds: number) {
        if (this.isRunning) {
            this.updateRemaining();
            this.startTime = Date.now();
        }

        this.remainingTime += seconds;
        this.duration += seconds;
    }

    private updateRemaining() {
        const elapsed = (Date.now() - this.startTime) / 1000;
        this.remainingTime -= elapsed;
        if (this.remainingTime < 0) this.remainingTime = 0;
    }

    private startTick() {
        this.stopTick();

        this.intervalId = setInterval(() => {
            if (!this.isRunning) return;

            const remaining = this.getRemainingSeconds();
            if (remaining <= 0) {
                this.remainingTime = 0;
                this.isRunning = false;
                this.stopTick();

                // Fire callback immediately when timer expires
                if (this.onFinishedCallback) {
                    this.onFinishedCallback();
                }
            }
        }, 500);
    }

    private stopTick() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    getRemainingSeconds(): number {
        if (!this.isRunning) {
            return Math.floor(this.remainingTime);
        }

        const elapsed = (Date.now() - this.startTime) / 1000;
        return Math.max(0, Math.floor(this.remainingTime - elapsed));
    }

    getIsRunning(): boolean {
        return this.isRunning;
    }

    getDuration(): number {
        return this.duration;
    }
}

export const timerModel = new TimerModel();