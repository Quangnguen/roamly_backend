import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { swaggerConfig, swaggerOptions } from './common/swagger/swagger-config';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Bật CORS mặc định (cho phép tất cả nguồn)

  const { HttpExceptionFilter } = await import(
    './exception/http-exception.filter'
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger configuration
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, swaggerOptions);

  await app.listen(process.env.PORT ?? 8686);
  console.log(
    `🚀 Server running on: http://localhost:${process.env.PORT ?? 8686}`,
  );
  console.log(
    `📚 Swagger UI: http://localhost:${process.env.PORT ?? 8686}/api`,
  );
}
bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
});
