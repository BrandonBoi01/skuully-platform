// src/main.ts
import "dotenv/config";

import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AllExceptionsFilter } from "./common/filters/all-exceptions.filter";
import { AppModule } from "./app.module";

function parseCorsOrigins(raw?: string): string[] {
  if (!raw?.trim()) {
    return ["http://localhost:3000", "http://localhost:3001", "http://localhost:5173"];
  }

  return raw
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

async function bootstrap() {
  if (!process.env.DATABASE_URL) {
    console.warn(
      "⚠️ DATABASE_URL is not set. Prisma will fail to connect. Check your .env file."
    );
  }

  if (!process.env.JWT_SECRET) {
    console.warn("⚠️ JWT_SECRET is not set. Auth will fail. Check your .env file.");
  }

  const app = await NestFactory.create(AppModule, {
    logger: ["log", "error", "warn", "debug", "verbose"],
  });

  const allowedOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  app.enableCors({
    origin: (origin, callback) => {
      // allow server-to-server tools / curl / Postman / mobile clients without browser origin
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`), false);
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
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

  process.on("unhandledRejection", (reason) => {
    console.error("UNHANDLED REJECTION:", reason);
  });

  process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:", err);
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);

  console.log(`✅ API running on http://localhost:${port}`);
  console.log(`✅ CORS origins: ${allowedOrigins.join(", ")}`);
}

bootstrap();