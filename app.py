from flask import Flask, jsonify, request, send_file
import youtube_dl
import os

app = Flask(__name__)

@app.route('/getQualities', methods=['POST'])
def get_qualities():
    data = request.json
    video_url = data.get('url')

    if not video_url:
        return jsonify({'error': 'Missing video URL'}), 400

    try:
        ydl_opts = {
            'format': 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best',
            'outtmpl': '%(title)s.%(ext)s',
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(video_url, download=False)
            formats = []
            for format in info_dict['formats']:
                if format.get('ext') == 'mp4':
                    formats.append({
                        'format_id': format['format_id'],
                        'format_note': format['format_note'],
                        'filesize': format['filesize'] if 'filesize' in format else None,
                        'ext': format['ext']
                    })

            return jsonify({'title': info_dict['title'], 'formats': formats})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download', methods=['GET'])
def download_video():
    video_url = request.args.get('videoUrl')
    format_id = request.args.get('formatId')

    if not video_url or not format_id:
        return jsonify({'error': 'Missing videoUrl or formatId parameter'}), 400

    try:
        ydl_opts = {
            'format': format_id,
            'outtmpl': '%(title)s.%(ext)s',
        }

        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            info_dict = ydl.extract_info(video_url, download=False)
            filename = f"{info_dict['title']}.{info_dict['ext']}"
            download_url = f"/download/{filename}"

            return jsonify({'downloadUrl': download_url})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/download/<filename>', methods=['GET'])
def serve_video(filename):
    try:
        return send_file(filename, as_attachment=True)
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
