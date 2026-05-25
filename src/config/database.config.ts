import { registerAs } from '@nestjs/config';
import * as Joi from 'joi';

export const databaseConfig = registerAs('database', () => ({
  url: process.env.DATABASE_URL,
}));

export const databaseConfigValidationSchema = {
  DATABASE_URL: Joi.string().required(),
};
