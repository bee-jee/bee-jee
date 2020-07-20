import { RequestHandler } from 'express';
import { validate, ValidationError } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { ValidationErrors, ValidationException } from '../exceptions/ValidationException';

function validationMiddleware(type: any, skipMissingProperties: boolean = false): RequestHandler {
  return (req, _, next) => {
    validate(plainToClass(type, req.body), { skipMissingProperties })
      .then((errors: ValidationError[]) => {
        if (errors.length > 0) {
          const errorsObject = errors.reduce((acc: ValidationErrors, err: ValidationError) => {
            let errorList: string[] = [];
            if (err.property in acc) {
              errorList = acc[err.property];
            }
            if (err.constraints === undefined) {
              errorList.push('Unknown validation error');
            } else {
              errorList = errorList.concat(Object.values(err.constraints));
            }
            acc[err.property] = errorList;
            return acc;
          }, {});
          next(new ValidationException(errorsObject));
        } else {
          next();
        }
      });
  };
}

export default validationMiddleware;
