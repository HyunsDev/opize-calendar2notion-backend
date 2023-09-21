import { validate } from './env.validation';

export const env = validate(JSON.parse(JSON.stringify(process.env)));
