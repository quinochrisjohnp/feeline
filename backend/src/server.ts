import express from 'express';
import 'dotenv/config';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';
import detectionRoutes from './routes/detection.routes.js';
import catsRoutes from './routes/cats.routes.js';
import { notFound, errorHandler } from './middleware/error.middleware.js';

const app = express();

const PORT = process.env.PORT ?? 4000;

app.use(cors());

app.use(express.json());

// Test route - confirms the API is running when you hit the root URL
app.get('/', (_, res) => {
  res.json({
    status: 'ok',
    message: 'API is running',
  });
});


//Google OAuth
app.use('/api/auth', authRoutes);

//Detection
app.use('/api/detection', detectionRoutes);

//Cats
app.use('/api/cats', catsRoutes);

// These must stay after all the routes
app.use(notFound);
app.use(errorHandler);

// Start the server and listen on the given port
app.listen(PORT, () => console.log(`API running on http://localhost:${PORT}`));