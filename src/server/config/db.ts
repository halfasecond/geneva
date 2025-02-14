import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
const mongoUri = process.env.MONGO_URL;

if (!mongoUri) {
  throw new Error('MONGO_URL environment variable is required');
}

const conn = async (): Promise<void> => {
  await mongoose.connect(mongoUri);
};

// Call it to connect
conn();

// Handle the database connection and retry as needed
const db = mongoose.connection;
export default db;
