import "dotenv/config";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import cookieParser from "cookie-parser";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { AppModule } from "./app.module";

function parseCorsOrigins(raw?: string): string[] {
  const defaults = [
    "http://localhost:3000",
    "http://localhost:3001",
    "http://localhost:5173",
    "https://skuully.app",
    "https://www.skuully.app",
    "https://api.skuully.app",
  ];

  if (!raw?.trim()) {
    return defaults;
  }

  const configured = raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return Array.from(new Set([...defaults, ...configured]));
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  app.use(cookieParser());

  app.enableCors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-CSRF-Token"],
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    })
  );

  app.useGlobalFilters(new AllExceptionsFilter());

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  console.log(`✅ API running on port ${port}`);
  console.log(`✅ Allowed CORS origins: ${allowedOrigins.join(", ")}`);
}

bootstrap();