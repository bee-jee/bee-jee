import HttpException from './HttpException';

class NotAuthorisedException extends HttpException {
  constructor() {
    super(401, 'You are not authorised');
  }
}

export default NotAuthorisedException;
