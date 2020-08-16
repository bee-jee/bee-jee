import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

const mongod = new MongoMemoryServer();

/**
 * Connect to the in-memory database.
 */
const connect = async () => {
  const uri = await mongod.getConnectionString();

  const mongooseOpts = {
    useNewUrlParser: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  };

  await mongoose.connect(uri, mongooseOpts);
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
