import HttpException from './HttpException';

class NotAuthorisedException extends HttpException {
  constructor() {
    super(403, 'You are not authorised');
  }
}

export default NotAuthorisedException;
