import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

// Middleware
app.use(helmet()); // Security headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON bodies

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Leetcodle API' });
});

// Start server
app.listen(3000, () => {
  console.log("Server is running on port http://localhost:3000");
}); 