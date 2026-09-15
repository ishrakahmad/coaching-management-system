import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DatabaseExceptionFilter } from './common/filters/database-exception.filter';

function assertProductionSecrets() {
  if (process.env.NODE_ENV !== 'production') return;
  for (const key of ['JWT_ACCESS_SECRET', 'JWT_REFRESH_SECRET']) {
    const value = process.env[key];
    if (!value || value.startsWith('change_this') || value.length < 32) {
      throw new Error(`${key} must be set to a strong secret (32+ chars) in production`);
    }
  }
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  assertProductionSecrets();

  const corsOrigins = process.env.CORS_ORIGIN?.split(',').map((o) => o.trim());
  app.enableCors({ origin: corsOrigins?.length ? corsOrigins : true, credentials: true });

  app.useGlobalPipes(
    new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
  );
  // Applies @Exclude() on entities — without this, password hashes leak in responses.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new DatabaseExceptionFilter());
  app.setGlobalPrefix('api/v1');

  const config = new DocumentBuilder()
    .setTitle('Coaching Management System API')
    .setDescription('REST API for the Coaching Management System')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`API running on http://localhost:${port}/api/v1`);
  console.log(`Swagger docs on http://localhost:${port}/api/docs`);
}
bootstrap();
