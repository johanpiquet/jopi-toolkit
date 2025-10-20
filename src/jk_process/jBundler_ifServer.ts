export const argv = process.argv;
export const env = process.env as Record<string, string>;
export const isProduction = process.env.NODE_ENV === 'production';
