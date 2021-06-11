import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as FormData from 'form-data';
import { GridFSBucket, GridFSBucketReadStream, MongoClient, ObjectId } from 'mongodb';

@Injectable()
export class VideoHandlerService {
	private mongoClient: MongoClient;
	private gridFS: GridFSBucket;
	private queue: Record<string, Promise<Video>> = {};

	constructor(private readonly logger: Logger) {
		this.logger = new Logger('Video Handler');
		if (typeof process.env.MONGODB_URL === 'undefined') {
			this.logger.log('MongoDB URL undefined');
			throw new Error();
		} else {
			MongoClient.connect(process.env.MONGODB_URL, { useUnifiedTopology: true }).then((client) => {
				this.mongoClient = client;
				const audioDb = client.db('audio');
				this.gridFS = new GridFSBucket(audioDb);
			});
		}
	}

	public inQueue(id: string): boolean {
		return id in this.queue;
	}

	public getQueueItem(id: string): Promise<Video> {
		return this.queue[id];
	}

	async saveVideo(id: string): Promise<Video> {
		const videos = (await this.mongoClient.db('audio').collection('metadata').find({ _id: id }).toArray()) as Video[];
		const exists = videos.length !== 0;
		if (!exists && !(id in this.queue)) {
			const promise = new Promise<Video>(async (resolve) => {
				this.logger.log(`Saving video with id ${id}`);
				const idReqData = new FormData();
				idReqData.append('url', `https://www.youtube.com/watch?v=${id}`);
				idReqData.append('q_auto', '1');
				idReqData.append('ajax', '1');

				const idRes: Y2MateRes = (
					await axios.post<Y2MateRes>('https://www.y2mate.com/mates/mp3/ajax', idReqData, {
						headers: { 'Content-Type': `multipart/form-data; boundary=${idReqData.getBoundary()}` }
					})
				).data;
				const title = idRes.result.match(/var k_data_vtitle = "(?<title>.*)"; var k__id/).groups.title;
				const y2mateId = idRes.result.match(/var k__id = "(?<id>.*)"; var video_service/).groups.id;
				const duration = idRes.result.match(/Duration: (?<duration>.*)<\/p>/).groups.duration;

				const audioReqData = new FormData();
				audioReqData.append('type', 'youtube');
				audioReqData.append('_id', y2mateId);
				audioReqData.append('v_id', id);
				audioReqData.append('ajax', '1');
				audioReqData.append('token', '');
				audioReqData.append('ftype', 'mp3');
				audioReqData.append('fquality', '128');

				const audioRes: Y2MateRes = (
					await axios.post<Y2MateRes>('https://www.y2mate.com/mates/mp3Convert', audioReqData, {
						headers: { 'Content-Type': `multipart/form-data; boundary=${audioReqData.getBoundary()}` }
					})
				).data;
				const mp3URL = audioRes.result.match(/<a href="(?<url>.*)" rel="nofollow" type="button" class="btn btn-success btn-file">/).groups.url;

				const writeStream = this.gridFS.openUploadStreamWithId(id, title);
				const dlStream = (await axios.get(mp3URL, { responseType: 'stream' })).data;
				dlStream.pipe(writeStream);
				await new Promise((resolve) => {
					dlStream.on('finish', resolve);
					dlStream.on('close', resolve);
				});

				const video = {
					_id: id,
					url: `https://www.youtube.com/watch?v=${id}`,
					title,
					duration,
					thumb: `https://i.ytimg.com/vi/${id}/1.jpg`,
					audio: `${process.env.LOCATION!}/audio/${id}`
				};

				await this.mongoClient.db('audio').collection('metadata').insertOne(video);

				delete this.queue[id];

				resolve(video);
			});
			this.queue[id] = promise;

			return promise;
		} else {
			const video = videos[0];

			return video;
		}
	}

	public async getMetadata(id: string): Promise<Video> {
		return this.mongoClient.db('audio').collection<Video>('metadata').findOne({ _id: id });
	}

	public getAudio(id: string): GridFSBucketReadStream {
		const readStream = this.gridFS.openDownloadStream(id as unknown as ObjectId);
		return readStream;
	}
}
