/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';

@Injectable()
export class CustomValidationPipe implements PipeTransform {
  async transform(value: unknown, metadata: ArgumentMetadata) {
    if (!value) {
      throw new BadRequestException('Không có dữ liệu được gửi lên');
    }

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    const object = plainToClass(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const errorMessages = errors.reduce((acc, error: ValidationError) => {
        if (error.constraints) {
          const messages = Object.values(error.constraints);
          if (messages.length > 0) {
            acc[error.property] = messages[0]; // Lấy message đầu tiên
          }
        }
        return acc;
      }, {} as Record<string, string>);

      if (Object.keys(errorMessages).length === 0) {
        throw new BadRequestException({
          statusCode: 400,
          message: 'Dữ liệu không hợp lệ',
          errors: {},
        });
      }

      throw new BadRequestException({
        statusCode: 400,
        message: 'Dữ liệu không hợp lệ',
        errors: errorMessages,
      });
    }

    return value;
  }

  private toValidate(metatype: any): boolean {
    const types = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}