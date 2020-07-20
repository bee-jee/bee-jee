import HttpException from './HttpException';

export type ValidationErrors = {[error: string]: string[]};

export class ValidationException extends HttpException {
  constructor(public errors: ValidationErrors) {
    super(400, 'The submitted data contains invalid information');
  }
}
