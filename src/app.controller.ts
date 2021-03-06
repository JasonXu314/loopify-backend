import { Body, Controller, Get, Header, Logger, NotFoundException, Param, Post, Response } from '@nestjs/common';
import * as contentDisposition from 'content-disposition';
import { ServerResponse } from 'http';
import { VideoHandlerService } from './videoHandler.service';

@Controller()
export class AppController {
	private readonly logger: Logger;

	constructor(private readonly videoHandler: VideoHandlerService) {
		this.logger = new Logger('Main');
	}

	@Post('/wakeup')
	wakeup(): void {}

	@Post('/load')
	async loadVideo(@Body('id') id: string): Promise<Video> {
		try {
			if (this.videoHandler.inQueue(id)) {
				return await this.videoHandler.getQueueItem(id);
			}

			if (this.videoHandler.connect) {
				await this.videoHandler.connect;
			}
			return this.videoHandler.saveVideo(id);
		} catch (err) {
			this.logger.log(`Encountered error on video of id ${id}`);
			this.logger.error(err);
		}
	}

	@Get('/audio/:id')
	@Header('Content-Type', 'audio/mpeg')
	async getAudio(@Param('id') id: string, @Response() res: ServerResponse): Promise<void> {
		this.logger.log(`Received request for video with id ${id}`);
		if (this.videoHandler.inQueue(id)) {
			this.logger.log('Found video in queue');
			if (this.videoHandler.connect) {
				await this.videoHandler.connect;
			}

			const video = await this.videoHandler.getQueueItem(id);

			if (!video) {
				this.logger.log('Audio somehow lost');
				throw new NotFoundException(`No audio exists with id ${id}`);
			}

			res.setHeader('Content-Disposition', contentDisposition(`${video.title}.mp3`));
			this.videoHandler.getAudio(id).pipe(res);
		} else {
			this.logger.log('Video not in queue');
			if (this.videoHandler.connect) {
				await this.videoHandler.connect;
			}

			const video = await this.videoHandler.getMetadata(id);

			if (!video) {
				this.logger.log('No video found');
				throw new NotFoundException(`No audio exists with id ${id}`);
			}

			res.setHeader('Content-Disposition', contentDisposition(`${video.title}.mp3`));
			this.videoHandler.getAudio(id).pipe(res);
		}
	}

	@Get('/status')
	@Header('Content-Type', 'text/html')
	getStatus(): string {
		const queue = this.videoHandler.getQueueState();
		return `
			<html>
				<head>
					<title>Loopify | Backend Status</title>
					<style>
					h4 { margin: 0; }
					</style>
				</head>
				<body>
					<h4>In Queue:</h4>
					<ul>
						${Object.keys(queue).map((id) => `<li>${id}</li>`)}
					</ul>
				</body>
			</html>
		`;
	}
}
