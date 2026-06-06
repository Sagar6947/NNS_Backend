const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const pool = require('./db');

const app = express();
const port = process.env.PORT || 5000;

app.use(cors({
    origin: ['https://nns.seagullventure.in', 'http://localhost:3000', 'http://localhost:5173'],
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const settingsRoutes = require('./routes/settings');
const ingestionRoutes = require('./routes/ingestion');
const articleRoutes = require('./routes/articles');
const reportRoutes = require('./routes/reports');

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api', ingestionRoutes);
app.use('/api', articleRoutes);

app.get('/', (req, res) => {
    res.send('News Monitoring System API');
});

// Health Check Endpoint (T0)
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Node.js Backend is running' });
});

// DB Health Check Endpoint
app.get('/api/health/db', async (req, res) => {
    try {
        const connection = await pool.getConnection();
        await connection.query('SELECT 1');
        connection.release();
        res.status(200).json({ status: 'OK', message: 'Database is connected' });
    } catch (error) {
        console.error('Database connection error:', error);
        res.status(500).json({ status: 'ERROR', message: 'Database connection failed', error: error.message });
    }
});

const scheduler = require('./services/scheduler');

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    scheduler.start();
});
