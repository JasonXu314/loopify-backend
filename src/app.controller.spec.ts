import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { VideoHandlerService } from './videoHandler.service';

describe('AppController', () => {
	let appController: AppController;

	beforeEach(async () => {
		const app: TestingModule = await Test.createTestingModule({
			controllers: [AppController],
			providers: [VideoHandlerService]
		}).compile();

		appController = app.get<AppController>(AppController);
	});

	describe('root', () => {
		it('should return "Hello World!"', () => {
			expect(appController.wakeup()).toBe(undefined);
		});
	});
});
