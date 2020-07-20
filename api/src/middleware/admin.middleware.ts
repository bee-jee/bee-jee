import { Response, NextFunction } from 'express';
import RequestWithUser from '../interfaces/requestWithUser.interface';
import NoPermissionException from '../exceptions/NoPermissionException';
import NotAuthorisedException from '../exceptions/NotAuthorisedException';

function adminMiddleware(request: RequestWithUser, _: Response, next: NextFunction) {
  if (!request.user) {
    next(new NotAuthorisedException());
    return;
  }
  if (request.user.role !== 'admin') {
    next(new NoPermissionException());
    return;
  }
  next();
}

export default adminMiddleware;
