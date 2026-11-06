"""Exercise the actual PHP receiver in a temporary webroot. Requires PHP 8.1+."""
from pathlib import Path
from tempfile import TemporaryDirectory
import hashlib
import os
import secrets
import shutil
import socket
import subprocess
import time
import urllib.request
import urllib.error

ROOT = Path(__file__).resolve().parents[1]

def main():
    php = os.environ.get('PHP_EXECUTABLE', 'php')
    with TemporaryDirectory(prefix='htx-cpanel-test-') as temporary:
        base = Path(temporary)
        web = base / 'public_html'
        (web / 'uploads').mkdir(parents=True)
        shutil.copy2(ROOT / 'deploy/cpanel/image-upload.php', web / 'image-upload.php')
        shutil.copy2(ROOT / 'deploy/cpanel/uploads/.htaccess', web / 'uploads/.htaccess')
        token = secrets.token_hex(32)
        config = base / 'htx-upload-config.php'
        config.write_text("<?php return ['token' => '" + token + "'];", encoding='utf-8')
        with socket.socket() as listener:
            listener.bind(('127.0.0.1', 0))
            port = listener.getsockname()[1]
        server = subprocess.Popen([php, '-S', f'127.0.0.1:{port}', '-t', str(web)],
                                  stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL,
                                  creationflags=subprocess.CREATE_NO_WINDOW if os.name == 'nt' else 0)
        try:
            endpoint = f'http://127.0.0.1:{port}/image-upload.php'
            def request(data=None, key=None):
                headers = {'Content-Type': 'application/octet-stream'}
                if key is not None:
                    headers['X-Upload-Token'] = key
                req = urllib.request.Request(endpoint, data=data, headers=headers)
                try:
                    with urllib.request.urlopen(req, timeout=10) as response:
                        return response.status, response.read().decode()
                except urllib.error.HTTPError as error:
                    return error.code, error.read().decode()
            for attempt in range(50):
                try:
                    assert request()[0] == 405
                    break
                except urllib.error.URLError:
                    time.sleep(.1)
            else:
                raise RuntimeError('PHP server did not start')
            assert request(b'not an image')[0] == 403
            assert request(b'not an image', 'wrong')[0] == 403
            assert request(b'<svg onload="alert(1)"/>', token)[0] == 400
            assert request(b'', token)[0] == 400
            assert request(b'A' * (5 * 1024 * 1024 + 1), token)[0] == 413
            for filename, extension in [('logo.webp', 'webp'), ('be-brand.png', 'png'), ('grab-brand.jpg', 'jpg')]:
                data = (ROOT / 'src/main/resources/static/assets/images' / filename).read_bytes()
                expected = hashlib.sha256(data).hexdigest() + '.' + extension
                assert request(data, token) == (200, expected)
                assert request(data, token) == (200, expected), 'Identical uploads must reuse the same filename'
                assert (web / 'uploads' / expected).read_bytes() == data
                with urllib.request.urlopen(f'http://127.0.0.1:{port}/uploads/{expected}', timeout=10) as response:
                    assert response.read() == data
            assert len([p for p in (web / 'uploads').iterdir() if p.name != '.htaccess']) == 3
            config.unlink()
            assert request(b'image', token)[0] == 503
            print('PASS: actual PHP receiver: auth, missing config, invalid/oversized images, JPG/PNG/WebP, deduplication and image download.')
        finally:
            server.terminate()
            server.wait(timeout=10)

if __name__ == '__main__':
    main()
