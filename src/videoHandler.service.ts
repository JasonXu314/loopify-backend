import { Injectable, Logger } from '@nestjs/common';
import { GridFSBucket, GridFSBucketReadStream, MongoClient, ObjectId } from 'mongodb';
import * as ytdl from 'ytdl-core';
import { rawNumberToTime } from './utils/utils';

@Injectable()
export class VideoHandlerService {
	private readonly logger: Logger;
	private mongoClient: MongoClient;
	private gridFS: GridFSBucket;
	private queue: Record<string, Promise<Video>> = {};
	public connect: Promise<void> | null;

	constructor() {
		this.logger = new Logger('Video Handler');
		if (typeof process.env.MONGODB_URL === 'undefined') {
			this.logger.log('MongoDB URL undefined');
			throw new Error();
		} else {
			this.logger.log(process.env.MONGODB_URL);
			this.connect = new Promise((resolve) => {
				MongoClient.connect(process.env.MONGODB_URL, { useUnifiedTopology: true, useNewUrlParser: true }).then((client) => {
					this.mongoClient = client;
					const audioDb = client.db('audio');
					this.gridFS = new GridFSBucket(audioDb);
					this.connect = null;
					resolve();
				});
			});
			process.on('SIGTERM', async () => {
				await this.mongoClient.close();
			});
		}
	}

	public inQueue(id: string): boolean {
		return id in this.queue;
	}

	public getQueueItem(id: string): Promise<Video> {
		return this.queue[id];
	}

	public getQueueState(): Record<string, Promise<Video>> {
		return this.queue;
	}

	async saveVideo(id: string): Promise<Video> {
		const videos = (await this.mongoClient.db('audio').collection('metadata').find({ _id: id }).toArray()) as Video[];
		const exists = videos.length !== 0;
		if (!exists && !(id in this.queue)) {
			const promise = new Promise<Video>(async (resolve, reject) => {
				try {
					this.logger.log(`Saving video with id ${id}`);
					const url = `https://www.youtube.com/watch?v=${id}`;

					const dlStream = ytdl(url);
					const {
						player_response: {
							videoDetails: { title, lengthSeconds, shortDescription, author }
						}
					} = await ytdl.getBasicInfo(url);
					const duration = rawNumberToTime(parseInt(lengthSeconds));

					const writeStream = this.gridFS.openUploadStreamWithId(id, title);
					dlStream.pipe(writeStream);
					await new Promise((resolve) => {
						dlStream.on('finish', resolve);
						dlStream.on('close', resolve);
					});

					this.logger.log(`Video id ${id} written to db`);

					const video = {
						_id: id,
						url,
						title,
						duration,
						description: shortDescription,
						author,
						thumb: `https://i.ytimg.com/vi/${id}/1.jpg`,
						audio: `${process.env.LOCATION || process.env.QOVERY_ROUTER_MAIN_URL!}/audio/${id}`
					};

					await this.mongoClient.db('audio').collection('metadata').insertOne(video);

					delete this.queue[id];

					resolve(video);
				} catch (err) {
					reject(err);
					delete this.queue[id];
				}
			});
			this.queue[id] = promise;

			this.logger.log(`Video id ${id} in queue`);

			return promise;
		} else {
			const video = videos[0];

			return video;
		}
	}

	public async getMetadata(id: string): Promise<Video | null> {
		return this.mongoClient.db('audio').collection<Video>('metadata').findOne({ _id: id });
	}

	public getAudio(id: string): GridFSBucketReadStream {
		const readStream = this.gridFS.openDownloadStream(id as unknown as ObjectId);
		return readStream;
	}
}
