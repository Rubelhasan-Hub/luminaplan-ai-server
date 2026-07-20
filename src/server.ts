import app from './app';
import { connectDB } from './config/db';

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // Try to connect to DB first (with automatic local fallback)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`🚀 LuminaPlan Backend Server running locally on http://localhost:${PORT}`);
  });
};

startServer().catch((error) => {
  console.error('Fatal error starting local server:', error);
  process.exit(1);
});
