export function formatTime(seconds: number): string {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const hStr = hrs > 0 ? hrs.toString().padStart(2, '0') + ':' : '';
    const mStr = mins.toString().padStart(2, '0');
    const sStr = secs.toString().padStart(2, '0');

    return `${hStr}${mStr}:${sStr}`;
}

export function formatFullTime(date: Date): string {
    const hrs = date.getHours().toString().padStart(2, '0');
    const mins = date.getMinutes().toString().padStart(2, '0');
    const secs = date.getSeconds().toString().padStart(2, '0');
    return `${hrs}:${mins}:${secs}`;
}
