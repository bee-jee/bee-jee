/* eslint @typescript-eslint/no-unused-vars: ["error", { "argsIgnorePattern": "^_" }] */
import { Response, NextFunction, Request } from 'express';

function errorMiddleware(
  err: any, _: Request, response: Response, _next: NextFunction,
) {
  const status = err.status || 500;
  const message = err.message || 'Unexpected error';
  const errors = err.errors || undefined;
  response.status(status).send({
    message, status, errors,
  });
}

export default errorMiddleware;
