const express = require('express');
const youtubedl = require('youtube-dl-exec');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { promisify } = require('util');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

app.post('/getQualities', async (req, res) => {
    const { url } = req.body;

    if (!url) {
        return res.status(400).send('Missing video URL');
    }

    try {
        const info = await youtubedl(url, { dumpJson: true });

        const formats = info.formats
            .filter(format => format.ext === 'mp4')
            .map(format => ({
                format_id: format.format_id,
                format_note: format.format_note,
                filesize: format.filesize,
                ext: format.ext,
            }));

        res.json({ title: info.title, formats });
    } catch (error) {
        console.error('Error fetching video info:', error);
        res.status(500).send('Error fetching video info');
    }
});

app.get('/download', async (req, res) => {
    const { videoUrl, formatId } = req.query;

    if (!videoUrl || !formatId) {
        return res.status(400).send('Missing videoUrl or formatId parameter');
    }

    try {
        const result = await youtubedl(videoUrl, {
            format: formatId,
            noCheckCertificate: true,
            quiet: true,
            noWarnings: true,
        });

        const filename = `${result.title}.${result.ext}`;
        const filePath = path.resolve(__dirname, 'downloads', filename);

        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.setHeader('Content-Type', 'video/mp4');

        const fileStream = fs.createReadStream(filePath);
        fileStream.pipe(res);

        fileStream.on('end', async () => {
            await promisify(fs.unlink)(filePath);
        });

        fileStream.on('error', (error) => {
            console.error('Error reading video file:', error);
            res.status(500).send('Error streaming video');
        });

    } catch (error) {
        console.error('Error downloading video:', error);
        res.status(500).send('Error downloading video');
    }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
});
