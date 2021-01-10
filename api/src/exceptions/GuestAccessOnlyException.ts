import HttpException from './HttpException';

export class GuestAccessOnlyException extends HttpException {
  constructor(message?: string) {
    super(401, message || 'This function does not allow logged in users.');
  }
}
