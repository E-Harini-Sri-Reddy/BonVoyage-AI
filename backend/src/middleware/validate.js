import { AppError } from './errorHandler.js';

/**
 * Express middleware factory for Zod schema validation.
 * @param {import('zod').ZodSchema} schema
 * @param {'body' | 'query' | 'params'} source
 */
export function validate(schema, source = 'body') {
  return (req, res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const messages = result.error.issues.map((issue) => issue.message).join('; ');
      return next(new AppError(messages, 400));
    }

    req[source] = result.data;
    next();
  };
}
