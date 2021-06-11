import { Logger, Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { VideoHandlerService } from './videoHandler.service';

@Module({
	imports: [],
	controllers: [AppController],
	providers: [VideoHandlerService, Logger]
})
export class AppModule {}
