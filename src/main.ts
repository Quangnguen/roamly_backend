import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Bật CORS mặc định (cho phép tất cả nguồn)
  app.useGlobalFilters(
    new (await import('./exception/http-exception.filter')).HttpExceptionFilter()
  );
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
