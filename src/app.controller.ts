import { Body, Controller, Get, Header, Logger, Param, Post, Response } from '@nestjs/common';
import { ServerResponse } from 'http';
import { VideoHandlerService } from './videoHandler.service';

@Controller()
export class AppController {
	constructor(private readonly videoHandler: VideoHandlerService, private readonly logger: Logger) {}

	@Post('/wakeup')
	wakeup(): void {}

	@Post('/load')
	async loadVideo(@Body('id') id: string): Promise<Video> {
		try {
			if (this.videoHandler.inQueue(id)) {
				return await this.videoHandler.getQueueItem(id);
			}

			return await this.videoHandler.saveVideo(id);
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
			const video = await this.videoHandler.getQueueItem(id);

			res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp3"; filename*=utf-8"${video.title}.mp3`);
			this.videoHandler.getAudio(id).pipe(res);
		} else {
			const video = await this.videoHandler.getMetadata(id);

			res.setHeader('Content-Disposition', `attachment; filename="${video.title}.mp3"; filename*=utf-8"${video.title}.mp3`);
			this.videoHandler.getAudio(id).pipe(res);
		}
	}
}
