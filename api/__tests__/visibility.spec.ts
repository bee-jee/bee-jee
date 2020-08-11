import { RequestHandler, Response } from 'express';
import sinon from 'sinon';
import { expect } from 'chai';
import visiMiddleware from '../src/middleware/visibility.middleware';
import RequestWithUser from '../src/interfaces/requestWithUser.interface';
import { Visibility } from '../src/share/share.interface';
import NoteModel from '../src/note/note.model';
import NoPermissionException from '../src/exceptions/NoPermissionException';

describe('Note visibility', () => {
  let middleware: RequestHandler | null = null;

  beforeEach(() => {
    [, middleware] = visiMiddleware();
  });

  it('should call next without error', async () => {
    const nextSpy = sinon.spy();
    const personB = {
      _id: 'b',
    };
    const aNote1 = {
      _id: 'an1',
      visibility: Visibility.AnyOneWithLink,
      populate: async () => { },
    };

    NoteModel.findById = (): any => aNote1;
    await (middleware as RequestHandler)({
      user: personB,
      params: {
        id: 'an1',
      } as any,
    } as RequestWithUser, {} as Response, nextSpy);
    expect(nextSpy.calledOnce).equal(true);
    expect(nextSpy.getCall(0).args.length).equal(0);

    nextSpy.resetHistory();
    aNote1.visibility = Visibility.Private;
    await (middleware as RequestHandler)({
      user: personB,
      params: {
        id: 'an1',
      } as any,
    } as RequestWithUser, {} as Response, nextSpy);
    expect(nextSpy.calledOnce).equal(true);
    expect(nextSpy.getCall(0).args.length).equal(1);
    expect(nextSpy.getCall(0).args[0]).to.be.instanceOf(NoPermissionException);
  });
});
