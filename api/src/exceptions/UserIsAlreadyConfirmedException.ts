import HttpException from './HttpException';

class UserIsAlreadyConfirmed extends HttpException {
  constructor() {
    super(400, 'Your account is already confirmed, you do not need to confirm again.');
  }
}

export default UserIsAlreadyConfirmed;
