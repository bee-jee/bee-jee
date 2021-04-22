import { Document } from 'mongoose';
import { User } from '../user/user.interface';
import DefaultLayout from './layouts/defaultLayout';

type EmailPasswordResetProps = {
  user: User & Document;
  passwordResetLink: string;
};

const EmailPasswordReset = ({ user, passwordResetLink }: EmailPasswordResetProps) => (
  <DefaultLayout>
    <p>Hi {user.fullName},</p>
    <p>
      You have requested to reset your password at BeeJee. Please click on the below link to
      set up a new password.
    </p>
    <p>
      <a href={passwordResetLink}>{passwordResetLink}</a>
    </p>
    <p>The link is only valid for 1 hour, after that you will need to
      request for a password reset again.</p>
  </DefaultLayout>
);

export default EmailPasswordReset;
