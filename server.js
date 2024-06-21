const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/getQualities', async (req, res) => {
    const videoUrl = req.body.url;

    if (!videoUrl) {
        return res.status(400).send('Missing video URL');
    }

    try {
        const info = await youtubedl(videoUrl, { dumpJson: true });

        const formats = info.formats.map(format => ({
            format_id: format.format_id,
            format_note: format.format_note,
            filesize: format.filesize,
            ext: format.ext,
        })).filter(format => format.format_note && format.ext === 'mp4'); // Adjust the filter as needed

        res.json({ title: info.title, formats });
    } catch (error) {
        res.status(500).send('Error fetching video info');
    }
});

app.get('/download', async (req, res) => {
    const { videoUrl, formatId } = req.query;

    if (!videoUrl || !formatId) {
        return res.status(400).send('Missing videoUrl or formatId parameter');
    }

    try {
        const info = await youtubedl(videoUrl, {
            format: formatId,
            getFilename: true,
        });

        const filename = info;

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');

        const downloadStream = youtubedl(videoUrl, { format: formatId }).stdout;
        downloadStream.pipe(res);

        downloadStream.on('end', () => {
            res.end();
        });

        downloadStream.on('error', (error) => {
            res.status(500).send('Error downloading video');
        });

    } catch (error) {
        res.status(500).send('Error downloading video');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
