import { Body, Controller, Get, Header, Logger, NotFoundException, Param, Post, Response } from '@nestjs/common';
import * as contentDisposition from 'content-disposition';
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

			if (!video) {
				throw new NotFoundException(`No audio exists with id ${id}`);
			}

			res.setHeader('Content-Disposition', contentDisposition(video.title));
			this.videoHandler.getAudio(id).pipe(res);
		} else {
			const video = await this.videoHandler.getMetadata(id);

			if (!video) {
				throw new NotFoundException(`No audio exists with id ${id}`);
			}

			res.setHeader('Content-Disposition', contentDisposition(video.title));
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

	@Get('/')
	@Header('Content-Type', 'text/html')
	getIndex(): string {
		return `
			<html>
				<head>
					<title>Loopify | Test Page</title>
					<style>
					h1 { margin: 0; }
					</style>
				</head>
				<body>
					<h1>Hi, this page does nothing!</h1>
				</body>
			</html>
		`;
	}
}
