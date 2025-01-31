import mongoose from 'mongoose';

mongoose.set('strictQuery', true);
const mongoUri = process.env.MONGO_URL;

const conn = async () => {
  await mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true });
};

// Call it to connect
conn();

// Handle the database connection and retry as needed
const db = mongoose.connection;
export default db;