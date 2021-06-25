export function padNum(num: number): string {
	return num.toString().length < 2 ? '0' + num : num.toString();
}

export function rawNumberToTime(time: number): string {
	const hours = Math.floor(time / 3600);
	const minutes = Math.floor((time % 3600) / 60);
	const seconds = Math.floor(time % 60);

	return `${padNum(hours)}:${padNum(minutes)}:${padNum(seconds)}`;
}
