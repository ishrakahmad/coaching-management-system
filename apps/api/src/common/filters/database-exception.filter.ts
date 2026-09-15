import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus, Logger } from '@nestjs/common';
import { Response } from 'express';
import { QueryFailedError } from 'typeorm';

// Turns raw Postgres errors into proper HTTP responses instead of a generic 500.
const PG_ERRORS: Record<string, { status: number; message: string }> = {
  '23505': { status: HttpStatus.CONFLICT, message: 'A record with this value already exists' },
  '23503': { status: HttpStatus.BAD_REQUEST, message: 'Referenced record does not exist' },
  '22P02': { status: HttpStatus.BAD_REQUEST, message: 'Invalid identifier format' },
};

@Catch(QueryFailedError)
export class DatabaseExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(DatabaseExceptionFilter.name);

  catch(exception: QueryFailedError, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const code: string | undefined = (exception as any).driverError?.code ?? (exception as any).code;
    const mapped = code ? PG_ERRORS[code] : undefined;

    if (!mapped) {
      this.logger.error(exception.message, exception.stack);
      return response
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .json({ statusCode: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Internal server error' });
    }
    return response.status(mapped.status).json({ statusCode: mapped.status, message: mapped.message });
  }
}
