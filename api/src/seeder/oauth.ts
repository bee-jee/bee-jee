import mongoose from 'mongoose';
import crypto from 'crypto';
import 'dotenv/config';
import validateEnv from '../utils/env';
import { OAuthClientModel } from '../authentication/authentication.model';

validateEnv();
const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_PATH,
} = process.env;
let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
  uri = `mongodb://${MONGO_PATH}`;
}
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const appClient = new OAuthClientModel({
  id: 'bee-jee',
  redirectUris: [],
  grants: [
    'password',
    'refresh_token',
  ],
  clientSecret: crypto.randomBytes(32).toString('hex'),
});

appClient.save()
  .then((result) => {
    console.log(result);
  })
  .catch((err) => {
    console.error(err);
  })
  .finally(() => {
    process.exit(0);
  });
