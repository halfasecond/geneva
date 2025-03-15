import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), 'src/server/.env') });

mongoose.set('strictQuery', true);
const mongoUri = process.env.MONGODB_URI || 'mongodb://geneva-mongo:27017/geneva'

// Debug environment variables
console.log('DB Config - Environment variables:', {
  MONGODB_URI: process.env.MONGODB_URI,
  cwd: process.cwd()
});

if (!mongoUri) {
  throw new Error('MONGODB_URI environment variable is required');
}

const conn = async (): Promise<void> => {
  await mongoose.connect(mongoUri);
};

// Call it to connect
conn();

// Handle the database connection and retry as needed
const db = mongoose.connection;
export default db;
