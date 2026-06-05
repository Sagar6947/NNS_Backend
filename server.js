const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const ingestionRoutes = require('./routes/ingestion');
const articleRoutes = require('./routes/articles');

app.use('/api', ingestionRoutes);
app.use('/api', articleRoutes);

app.get('/', (req, res) => {
    res.send('News Monitoring System API');
});

app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
