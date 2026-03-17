import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const isHttpException = exception instanceof HttpException;

    const status = isHttpException
      ? exception.getStatus()
      : HttpStatus.INTERNAL_SERVER_ERROR;

    const exceptionResponse = isHttpException
      ? exception.getResponse()
      : null;

    const path = req.originalUrl || req.url;
    const timestamp = new Date().toISOString();

    const message = this.resolveMessage(exceptionResponse, status, path);

    if (status >= 500) {
      console.error("UNHANDLED EXCEPTION:", exception);
    } else {
      console.warn("HTTP EXCEPTION:", {
        method: req.method,
        path,
        status,
        message,
      });
    }

    res.status(status).json({
      statusCode: status,
      message,
      timestamp,
      path,
    });
  }

  private resolveMessage(
    exceptionResponse: string | object | null,
    status: number,
    path: string
  ) {
    if (status >= 500) {
      if (this.isAuthPath(path)) {
        return "Something went wrong while processing this auth request.";
      }

      return "Internal server error";
    }

    if (typeof exceptionResponse === "string") {
      return exceptionResponse;
    }

    if (
      exceptionResponse &&
      typeof exceptionResponse === "object" &&
      "message" in exceptionResponse
    ) {
      const raw = (exceptionResponse as any).message;

      if (Array.isArray(raw)) {
        return raw[0] ?? "Request failed";
      }

      if (typeof raw === "string") {
        return raw;
      }
    }

    if (status === 401) {
      return "Unauthorized";
    }

    if (status === 403) {
      return "Forbidden";
    }

    if (status === 404) {
      return "Not found";
    }

    if (status === 429) {
      return "Too many requests. Please wait and try again.";
    }

    return "Request failed";
  }

  private isAuthPath(path: string) {
    return path.startsWith("/auth");
  }
}