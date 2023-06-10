import 'dotenv/config';
import { validate } from './env.validation';

const env = validate(JSON.parse(JSON.stringify(process.env)));

export const ENV = env;
