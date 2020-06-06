import {
  cleanEnv, str, port,
} from 'envalid';

export function validateEnv() {
  cleanEnv(process.env, {
    MONGO_USER: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    API_PORT: port(),
  });
}
