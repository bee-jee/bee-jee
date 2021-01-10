import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { syncIndexesForModels } from '../src/app';

const mongod = new MongoMemoryServer();

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  const uri = await mongod.getUri();

  const mongooseOpts = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
    useCreateIndex: true,
  };

  await mongoose.connect(uri, mongooseOpts);

  try {
    await syncIndexesForModels();
  } catch (err) {
    console.error(err);
  }
};

const close = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  await mongod.stop();
};

const clear = async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.keys(collections).map((key) => collections[key].deleteMany({})));
};

export default {
  connect,
  clear,
  close,
};
