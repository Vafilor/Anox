const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 60 * 60 * 24;

export default function formatDuration(duration: number): string {
    const days = Math.floor(duration / SECONDS_IN_DAY);
    const hours = Math.floor((duration - days * SECONDS_IN_DAY) / SECONDS_IN_HOUR);
    const minutes = Math.floor(duration / 60) % 60;
    const seconds = duration % 60;

    let result = "";

    if (days !== 0) {
        result += `${days}d `;
    }

    if (hours !== 0) {
        result += hours + 'h ';
    }

    if (minutes !== 0) {
        result += minutes + 'm ';
    }

    result += seconds + 's';

    return result;
}