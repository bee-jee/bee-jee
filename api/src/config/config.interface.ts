import { CleanEnv } from 'envalid';

type Configuration = Readonly<{
  MONGO_USER: string;
  MONGO_PASSWORD: string;
  MONGO_PATH: string;
  API_PORT: number;
  OAUTH_CLIENT_ID: string;
  OAUTH_CLIENT_SECRET: string;
}> & CleanEnv & {
  readonly [varName: string]: string | undefined
};

export default Configuration;
