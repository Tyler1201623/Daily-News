const express = require('express');
const cors = require('cors');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Routes
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/style.css', (req, res) => {
    res.sendFile(path.join(__dirname, 'style.css'));
});

app.get('/main.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'main.js'));
});

app.get('/api/news', async (req, res) => {
    const { category, pageSize } = req.query;
    const API_KEY = process.env.PRIMARY_API_KEY || '159fd6b862ae4251999890aca2260530';
    
    try {
        const apiUrl = `https://newsapi.org/v2/top-headlines?category=${category}&language=en&apiKey=${API_KEY}&pageSize=${pageSize}`;
        console.log('Fetching from:', apiUrl);
        
        const response = await fetch(apiUrl);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`NewsAPI responded with status: ${response.status}, message: ${JSON.stringify(data)}`);
        }
        
        res.json(data);
    } catch (error) {
        console.error('Server error:', error.message);
        res.status(500).json({ 
            error: 'Failed to fetch news',
            details: error.message
        });
    }
});

// Handle favicon
app.get('/favicon.ico', (req, res) => {
    res.status(204).end();
});

// Error handling
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('API Key being used:', process.env.PRIMARY_API_KEY);
});
