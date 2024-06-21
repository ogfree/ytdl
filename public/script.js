document.getElementById('urlForm').addEventListener('submit', async function (e) {
    e.preventDefault();
    const url = document.getElementById('url').value;
    const response = await fetch('/getQualities', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ url })
    });

    if (response.ok) {
        const data = await response.json();
        const qualityList = document.getElementById('qualityList');
        qualityList.innerHTML = '';
        data.formats.forEach(format => {
            const listItem = document.createElement('li');
            const link = document.createElement('a');
            link.href = `/download?videoUrl=${encodeURIComponent(url)}&formatId=${format.format_id}`;
            link.textContent = `${format.format_note} (${(format.filesize / (1024 * 1024)).toFixed(2)} MB)`;
            link.download = data.title;
            listItem.appendChild(link);
            qualityList.appendChild(listItem);
        });
        document.getElementById('qualities').style.display = 'block';
    } else {
        alert('Error fetching video qualities');
    }
});
