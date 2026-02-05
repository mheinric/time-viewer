const express = require('express');
const multer = require('multer');
const fs = require('fs');
const app = express();
const PORT = 8000;

app.use('/letempsdalice', express.static(__dirname + '/public'));

// Set up Multer for handling file uploads
const upload = multer({
    dest: __dirname + '/temp',
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Route for handling file uploads
app.post('/letempsdalice/upload', upload.single('dbFile'), (req, res) => {
    if (!req.file) {
        res.status(400).send('No file part');
        return;
    }

    if (!req.file.originalname) {
        res.status(400).send('No selected file');
        return;
    }

    fs.rename(req.file.path, __dirname +  '/public/data.db', (err) => {
        if (err) {
            console.error(err);
            res.status(500).send('Error uploading file');
            return;
        }

        res.status(200).send('File uploaded successfully.');
    });
});

// Catch-all route for other requests
app.use((req, res) => {
    res.status(404).send('Not Found');
});

// Start the server
app.listen(PORT, () => {
    console.log(`Serving at http://localhost:${PORT}`);
});