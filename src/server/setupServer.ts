import cors from 'cors';
import type { Application } from 'express';

export const setupServer = (app: Application) => {
  // Enable CORS for development
  app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));
  
  console.log('CORS enabled for development');
};
