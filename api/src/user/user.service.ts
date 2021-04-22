import { Document } from 'mongoose';
import { injectable } from 'tsyringe';
import cryptoRandomString from 'crypto-random-string';
import { PasswordReset } from '../authentication/passwordReset.interface';
import { PasswordResetModel } from '../authentication/passwordReset.model';
import PasswordResetTooFrequentException from '../exceptions/PasswordResetTooFrequentException';
import sendMail from '../mailer/transporter';
import { frontEndUrl } from '../utils/url';
import { renderViewToMarkup } from '../utils/view';
import { User } from './user.interface';
import InvalidSecretException from '../exceptions/InvalidSecretException';
import PasswordResetExpiredException from '../exceptions/PasswordResetExpiredException';

const PASSWORD_RESET_REQUEST_DURATION_IN_MILLIS = 15 * 60 * 1000;
const PASSWORD_RESET_EXPIRY_DURATION_IN_MILLIS = 60 * 60 * 1000;

@injectable()
export class UserService {
  public async sendUserConfirmEmail(user: User & Document): Promise<any> {
    const escapedUsername = encodeURIComponent(user.username);

    await sendMail({
      subject: 'BeeJee: Confirm your account',
      to: user.email,
      html: renderViewToMarkup('emailConfirm', {
        user,
        confirmLink: frontEndUrl(`/login/email-confirm/${escapedUsername}/${user.secret}`),
      }),
    });

    user.lastConfirmSend = new Date();
    user.updated = new Date();
    await user.save();
  }

  public async generatePasswordReset(user: User & Document): Promise<PasswordReset & Document> {
    let passwordReset = await PasswordResetModel.findOne({
      user,
    });

    if (passwordReset) {
      if (passwordReset.reRequestedAt.getTime()
        < Date.now() + PASSWORD_RESET_REQUEST_DURATION_IN_MILLIS) {
        throw new PasswordResetTooFrequentException();
      }

      passwordReset.reRequestedAt = new Date();
    } else {
      const now = new Date();

      passwordReset = new PasswordResetModel({
        userId: user._id,
        secret: await cryptoRandomString.async({ length: 15, type: 'url-safe' }),
        requestedAt: now,
        reRequestedAt: now,
      });
    }
    await passwordReset.save();

    return passwordReset as PasswordReset & Document;
  }

  public async sendPasswordReset(user: User & Document, passwordReset: PasswordReset & Document) {
    await sendMail({
      subject: 'BeeJee: Password reset',
      to: user.email,
      html: renderViewToMarkup('emailPasswordReset', {
        user,
        passwordResetLink: frontEndUrl(`/login/reset-password/${passwordReset.secret}`),
      }),
    });
  }

  public async retrievePasswordReset(secret: string): Promise<PasswordReset & Document> {
    const passwordReset = await PasswordResetModel.findOne({ secret }).populate('user');
    if (!passwordReset) {
      throw new InvalidSecretException();
    }

    if (passwordReset.requestedAt.getTime()
      >= (Date.now() + PASSWORD_RESET_EXPIRY_DURATION_IN_MILLIS)) {
      throw new PasswordResetExpiredException();
    }

    return passwordReset;
  }
}
