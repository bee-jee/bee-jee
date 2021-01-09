import 'react';
import DefaultLayout from './layouts/defaultLayout';

const EmailConfirm = (props: any) => (
  <DefaultLayout>
    <p>
      Thank you for registering at BeeJee. Click the below link to confirm your account.
    </p>
    <p>
      <a href={props.confirmLink}>{props.confirmLink}</a>
    </p>
  </DefaultLayout>
);

export default EmailConfirm;
