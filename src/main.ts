import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: '*', // Hoặc cụ thể IP của mobile app
    credentials: true,
  });
  const { HttpExceptionFilter } = await import(
    './exception/http-exception.filter'
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Lắng nghe trên 0.0.0.0 để cho phép truy cập từ mạng cục bộ
  const port = process.env.PORT ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.log(`Server running on http://0.0.0.0:${port}`);
}
bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
});