import readline from 'readline';
import { Writable } from 'stream';
import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import 'dotenv/config';
import UserModel from '../user/user.model';
import validateEnv from '../utils/env';

const {
  MONGO_USER,
  MONGO_PASSWORD,
  MONGO_PATH,
} = validateEnv();
let uri = `mongodb://${MONGO_USER}:${MONGO_PASSWORD}@${MONGO_PATH}`;
if (typeof MONGO_USER === 'undefined' || MONGO_USER === '') {
  uri = `mongodb://${MONGO_PATH}`;
}
mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

interface MutableStdout extends Writable {
  muted: boolean;
}

const mutableStdout = (new Writable({
  write(
    this: MutableStdout,
    chunk: any,
    encoding: BufferEncoding,
    callback: (error?: Error | null | undefined) => void,
  ) {
    if (!this.muted) {
      process.stdout.write(chunk, encoding);
    }
    callback();
  },
})) as MutableStdout;

const rl = readline.createInterface({
  input: process.stdin,
  output: mutableStdout,
  terminal: true,
});

rl.question('Password: ', (answer: string) => {
  mutableStdout.muted = false;
  process.stdout.write('\n');
  process.stdin.pause();
  rl.close();
  UserModel
    .findOne({ username: 'admin' })
    .then((user) => {
      const hashedPassword = bcrypt.hashSync(answer, 10);

      if (user !== null) {
        process.stdout.write('User with username admin exists, changing the password only\n');
        return UserModel.updateOne({ _id: user._id }, {
          password: hashedPassword,
          role: 'admin',
        }, { upsert: true });
      }

      return UserModel.create({
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        role: 'admin',
        confirm: true,
        password: hashedPassword,
        created: new Date(),
        updated: new Date(),
      });
    })
    .then(() => {
      process.stdout.write('Done\n');
    })
    .catch((err) => {
      console.error(err);
    })
    .finally(() => {
      process.exit(0);
    });
});

mutableStdout.muted = true;
