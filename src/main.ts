import { NestFactory } from '@nestjs/core';
import * as dotenv from 'dotenv';
import { AppModule } from './app.module';

dotenv.config({ path: './.env' });

async function bootstrap() {
	const app = await NestFactory.create(AppModule);

	app.enableCors({ origin: ['https://loopify.vercel.app', 'http://localhost:3000'] });

	await app.listen(process.env.PORT || 5000);
}

bootstrap();
