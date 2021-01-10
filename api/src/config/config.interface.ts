import { CleanEnv } from 'envalid';

type Configuration = Readonly<{
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_PATH: string;
  API_PORT: number;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
  VUE_APP_URL: string;
  SMTP_HOST: string;
  SMTP_PORT: number;
  SMTP_SECURE: boolean;
  SMTP_USERNAME: string;
  SMTP_PASSWORD: string;
  MAIL_FROM_ADDRESS: string;
  MAIL_FROM_NAME: string;
}> & CleanEnv & {
  readonly [varName: string]: string | undefined
};

export default Configuration;
