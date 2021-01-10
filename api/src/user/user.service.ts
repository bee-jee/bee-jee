import { Document } from 'mongoose';
import { injectable } from 'tsyringe';
import sendMail from '../mailer/transporter';
import { frontEndUrl } from '../utils/url';
import { renderViewToMarkup } from '../utils/view';
import { User } from './user.interface';

@injectable()
export class UserService {
  public async sendUserConfirmEmail(user: (User & Document)): Promise<any> {
    const escapedUsername = encodeURIComponent(user.username);

    await sendMail({
      subject: 'BeeJee: Confirm your account',
      to: user.email,
      html: renderViewToMarkup('emailConfirm', {
        confirmLink: frontEndUrl(`/login/email-confirm/${escapedUsername}/${user.secret}`),
      }),
    });

    user.lastConfirmSend = new Date();
    user.updated = new Date();
    await user.save();
  }
}
