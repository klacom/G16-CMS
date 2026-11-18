export const root: string;
export const cli: string;
export function localCliEnv(): NodeJS.ProcessEnv;
export type LocalStackStatus = {
  API_URL?: string;
  PUBLISHABLE_KEY?: string;
  SECRET_KEY?: string;
  SERVICE_ROLE_KEY?: string;
  [key: string]: unknown;
};
export function localStatus(): LocalStackStatus;
