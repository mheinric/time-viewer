const express = require('express');
const multer = require('multer');
const fs = require('fs');
const yaml = require('yaml');
const app = express();

// Read configuration from yaml config file
const configFile = fs.readFileSync('./config.yaml', 'utf8');
const config = yaml.parse(configFile);

const PORT = config["port"];
const BASE_URL = config["base_url"];
//Maximum size of the uploaded file in MB.
const MAX_DB_SIZE = config["max_db_size"];

// Make the public directory accessible
app.use(BASE_URL, express.static(__dirname + '/public'));

// Set up Multer for handling file uploads
const upload = multer({
    dest: __dirname + '/temp',
    limits: { fileSize: MAX_DB_SIZE * 1024 * 1024 }, //Convert MB to octets.
});

// Route for handling file uploads
app.post(BASE_URL + '/upload', upload.single('dbFile'), (req, res) => {
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
    console.log(`Serving at http://localhost:${PORT}${BASE_URL}`);
});