import {
  cleanEnv, str, port, num, bool,
} from 'envalid';

export default function validateEnv() {
  return cleanEnv(process.env, {
    MONGO_USER: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    API_PORT: port(),
    OAUTH_CLIENT_ID: str(),
    OAUTH_CLIENT_SECRET: str(),
    NOTE_CONTENT_PATH: str(),
    VUE_APP_URL: str(),
    SMTP_HOST: str(),
    SMTP_PORT: num({
      default: 587,
    }),
    SMTP_SECURE: bool(),
    SMTP_USERNAME: str(),
    SMTP_PASSWORD: str(),
    MAIL_FROM_ADDRESS: str(),
    MAIL_FROM_NAME: str(),
  });
}
