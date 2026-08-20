import express from 'express';
import { env } from './env.js';
import dotenv from 'dotenv';

dotenv.config();

const app = express();

app.listen(env.PORT, () => {
  console.log(`Cosmot API listening on http://localhost:${env.PORT}`);
  console.log(`the cosmot database is running on ${env.DATABASE_URL}`);
});