import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

/**
 * Environment enum for type safety
 */
export enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

/**
 * Application configuration interface
 */
interface Config {
  port: number;
  nodeEnv: Environment;
  corsOrigin: string;
}

/**
 * Parse environment variable as number with validation
 */
function parseNumber(value: string | undefined, defaultValue: number): number {
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Parse environment as Environment enum
 */
function parseEnvironment(value: string | undefined): Environment {
  if (!value) return Environment.Development;
  const normalized = value.toLowerCase();

  if (normalized === 'production') return Environment.Production;
  if (normalized === 'test') return Environment.Test;
  return Environment.Development;
}

/**
 * Application configuration
 * Loaded from environment variables with sensible defaults
 */
export const config: Readonly<Config> = {
  port: parseNumber(process.env.PORT, 3000),
  nodeEnv: parseEnvironment(process.env.NODE_ENV),
  corsOrigin: process.env.CORS_ORIGIN || '*',
};

/**
 * Environment check helpers
 */
export const isDevelopment = (): boolean => config.nodeEnv === Environment.Development;
export const isProduction = (): boolean => config.nodeEnv === Environment.Production;
export const isTest = (): boolean => config.nodeEnv === Environment.Test;
