import HttpException from './HttpException';

class NoPermissionException extends HttpException {
  constructor() {
    super(403, 'You do not have permission');
  }
}

export default NoPermissionException;
