interface Video {
	_id: string;
	url: string;
	audio: string;
	thumb: string;
	title: string;
	duration: string;
}

interface Y2MateRes {
	success: boolean;
	result: string;
}

interface RawVideoFile {
	_id: string;
	length: number;
	chunkSize: number;
	uploadDate: string;
	filename: string;
	me5: string;
}
