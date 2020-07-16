import {
  cleanEnv, str, port,
} from 'envalid';

export default function validateEnv() {
  return cleanEnv(process.env, {
    MONGO_USER: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    API_PORT: port(),
    OAUTH_CLIENT_ID: str(),
    OAUTH_CLIENT_SECRET: str(),
  });
}
