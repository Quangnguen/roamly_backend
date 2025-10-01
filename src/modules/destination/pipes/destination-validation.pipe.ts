/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class DestinationValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('No data provided');
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Transform with type conversion enabled for query params and form data
    const object = plainToClass(metatype, value, {
      enableImplicitConversion: true, // Auto convert string -> number, boolean
      exposeDefaultValues: true,
    });

    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.reduce(
        (acc, error: ValidationError) => {
          if (error.constraints) {
            const messages = Object.values(error.constraints);
            if (messages.length > 0) {
              acc[error.property] = messages[0];
            }
          }
          return acc;
        },
        {} as Record<string, string>,
      );

      throw new BadRequestException({
        statusCode: 400,
        message: 'Validation failed',
        errors: errorMessages,
      });
    }

    return object; // Return transformed object with correct types
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}
