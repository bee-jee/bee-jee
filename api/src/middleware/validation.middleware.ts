import { RequestHandler } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import HttpException from '../exceptions/HttpException';

function validationMiddleware(type: any, skipMissingProperties: boolean = false): RequestHandler {
  return (req, _, next) => {
    validate(plainToClass(type, req.body), { skipMissingProperties })
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const message = errors.map((error: ValidationError) => {
            if (typeof error.constraints === 'undefined') {
              return 'Unknown validation error';
            }
            return Object.values(error.constraints);
          }).join(', ');
          next(new HttpException(400, message));
        } else {
          next();
        }
      });
  };
}

export default validationMiddleware;
