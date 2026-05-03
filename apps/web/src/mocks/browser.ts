import { setupWorker } from 'msw/browser';
import { handlers } from './handler/handlers';

export const worker = setupWorker(...handlers);
