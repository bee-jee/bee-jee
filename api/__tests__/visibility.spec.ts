import { RequestHandler, Response } from 'express';
import sinon from 'sinon';
import { expect } from 'chai';
import visiMiddleware from '../src/middleware/visibility.middleware';
import RequestWithUser from '../src/interfaces/requestWithUser.interface';
import { Visibility } from '../src/share/share.interface';
import NoPermissionException from '../src/exceptions/NoPermissionException';
import dbHandler from './dbHandler';
import UserModel from '../src/user/user.model';
import NoteModel from '../src/note/note.model';

describe('Note visibility', () => {
  let middleware: RequestHandler | null = null;

  beforeEach(() => {
    [, middleware] = visiMiddleware();
  });

  afterEach(async () => {
    await dbHandler.clear();
  });

  before(async () => {
    await dbHandler.connect();
  });

  after(async () => {
    await dbHandler.close();
  });

  it('should call next without error', async () => {
    const nextSpy = sinon.spy();
    const personB = await UserModel.create({
      username: 'personB',
      password: 'abcdefg',
      firstName: 'Person',
      lastName: 'B',
      role: 'user',
      created: new Date(),
      updated: new Date(),
    });
    const aNote1 = await NoteModel.create({
      visibility: Visibility.AnyOneWithLink,
      title: '',
      author: personB._id,
      created: new Date(),
      updated: new Date(),
      content: '',
      sharedUsers: [],
    });

    await (middleware as RequestHandler)({
      user: personB,
      params: {
        id: aNote1._id,
      } as any,
    } as RequestWithUser, {} as Response, nextSpy);
    expect(nextSpy.calledOnce).equal(true);
    expect(nextSpy.getCall(0).args.length).equal(0);

    nextSpy.resetHistory();
    aNote1.visibility = Visibility.Private;
    await aNote1.save();
    await (middleware as RequestHandler)({
      user: personB,
      params: {
        id: aNote1._id,
      } as any,
    } as RequestWithUser, {} as Response, nextSpy);
    expect(nextSpy.calledOnce).equal(true);
    expect(nextSpy.getCall(0).args.length).equal(1);
    expect(nextSpy.getCall(0).args[0]).to.be.instanceOf(NoPermissionException);
  });
});
