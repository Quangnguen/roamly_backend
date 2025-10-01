import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors(); // Bật CORS mặc định (cho phép tất cả nguồn)

  const { HttpExceptionFilter } = await import(
    './exception/http-exception.filter'
  );
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger Configuration
  const config = new DocumentBuilder()
    .setTitle('Roamly Travel Social Network API')
    .setDescription(
      'API documentation for Roamly - A travel social network platform',
    )
    .setVersion('1.0')
    .addTag('Auth', 'Authentication endpoints')
    .addTag('Users', 'User management endpoints')
    .addTag('Posts', 'Post management endpoints')
    .addTag('Trips', 'Trip planning endpoints')
    .addTag('Destinations', 'Destination discovery endpoints')
    .addTag('Comments', 'Comment management endpoints')
    .addTag('Likes', 'Like/Unlike endpoints')
    .addTag('Follows', 'Follow/Unfollow endpoints')
    .addTag('Notifications', 'Notification endpoints')
    .addTag('Chat', 'Chat messaging endpoints')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
    },
  });

  const port = process.env.PORT ?? 8686;
  await app.listen(port);
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}
bootstrap().catch((error) => {
  console.error('Error during bootstrap:', error);
});
