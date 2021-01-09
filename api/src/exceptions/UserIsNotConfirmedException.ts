import { Document } from 'mongoose';
import { User } from '../user/user.interface';
import HttpException from './HttpException';

type ConfirmUserParams = {
  _id: any;
};

class UserIsNotConfirmedException extends HttpException {
  public params: ConfirmUserParams = {
    _id: '',
  };

  constructor(user: (User & Document)) {
    super(401, 'Your account has not yet been confirmed.', 'user_is_not_confirmed');
    this.params = {
      _id: user._id,
    };
  }
}

export default UserIsNotConfirmedException;
