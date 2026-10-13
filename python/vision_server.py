"""Local, in-memory landmark service. Bind only to this computer's loopback."""
import io
import json
import math
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import mediapipe as mp
import numpy as np
from PIL import Image, ImageOps, UnidentifiedImageError
from mediapipe.tasks import python
from mediapipe.tasks.python import vision

MODELS = Path(__file__).resolve().parents[1] / 'public' / 'mediapipe'
Image.MAX_IMAGE_PIXELS = 24_000_000


def points(landmarks):
    return [dict(index=i, x=float(p.x), y=float(p.y), z=float(p.z),
                 **{key: float(getattr(p, key)) for key in ('visibility', 'presence')
                    if getattr(p, key, None) is not None}) for i, p in enumerate(landmarks)]


class Scanner:
    def __init__(self):
        options = lambda name: python.BaseOptions(model_asset_path=str(MODELS / f'{name}.task'))
        self.face = vision.FaceLandmarker.create_from_options(vision.FaceLandmarkerOptions(
            base_options=options('face'), num_faces=2, output_face_blendshapes=True,
            output_facial_transformation_matrixes=True))
        self.hands = vision.HandLandmarker.create_from_options(vision.HandLandmarkerOptions(
            base_options=options('hand'), num_hands=2))
        self.pose = vision.PoseLandmarker.create_from_options(vision.PoseLandmarkerOptions(
            base_options=options('pose'), num_poses=1))
        self.lock = threading.Lock()

    def analyze(self, data):
        with Image.open(io.BytesIO(data)) as original:
            if original.width * original.height > 24_000_000:
                raise ValueError('Choose an image smaller than 24 megapixels.')
            image = ImageOps.exif_transpose(original).convert('RGB')
            image.thumbnail((1200, 1200))
            width, height = image.size
            frame = mp.Image(image_format=mp.ImageFormat.SRGB, data=np.array(image))
        with self.lock:
            face, hands, pose = self.face.detect(frame), self.hands.detect(frame), self.pose.detect(frame)
        result = dict(engine='python-mediapipe', width=width, height=height,
            faces=[points(p) for p in face.face_landmarks],
            faceExpressions=[[dict(name=c.category_name, score=float(c.score)) for c in group]
                             for group in face.face_blendshapes],
            faceTransforms=[matrix.tolist() for matrix in face.facial_transformation_matrixes],
            hands=[dict(landmarks=points(p), worldLandmarks=points(hands.hand_world_landmarks[i]),
                        handedness=[dict(label=c.category_name, score=float(c.score))
                                    for c in hands.handedness[i]]) for i, p in enumerate(hands.hand_landmarks)],
            poses=[dict(landmarks=points(p), worldLandmarks=points(pose.pose_world_landmarks[i]))
                   for i, p in enumerate(pose.pose_landmarks)],
            note='Coordinates and expression scores are model estimates. Pixel distances do not determine jewellery size.')
        return result

    def close(self):
        self.face.close()
        self.hands.close()
        self.pose.close()


class Handler(BaseHTTPRequestHandler):
    scanner = None

    def log_message(self, *args):
        pass  # Never log photos or recognition results.

    def reply(self, status, data):
        payload = json.dumps(data, allow_nan=False).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Cache-Control', 'no-store')
        self.send_header('Content-Length', str(len(payload)))
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self):
        self.reply(200 if self.path == '/health' else 404,
                   {'ready': self.path == '/health', 'engine': 'python-mediapipe'})

    def do_POST(self):
        if self.path != '/analyze':
            return self.reply(404, {'error': 'Endpoint not found.'})
        if self.headers.get('Origin') or self.headers.get('X-Lumiere-Vision') != 'local-next':
            return self.reply(403, {'error': 'Use the local storefront scanner.'})
        try:
            self.connection.settimeout(20)
            size = int(self.headers.get('Content-Length', '0'))
            if not 0 < size <= 2 * 1024 * 1024:
                return self.reply(413, {'error': 'Scan image must be under 2 MB.'})
            data = self.rfile.read(size)
            if len(data) != size:
                raise ValueError('The image upload was incomplete.')
            self.reply(200, self.scanner.analyze(data))
        except (ValueError, UnidentifiedImageError, Image.DecompressionBombError):
            self.reply(400, {'error': 'Choose a valid JPEG, PNG or WebP image under 24 megapixels.'})
        except Exception:
            self.reply(500, {'error': 'Local tracking failed. Try a clearer photo.'})


if __name__ == '__main__':
    Handler.scanner = Scanner()
    server = ThreadingHTTPServer(('127.0.0.1', 8765), Handler)
    print('Lumiere Python vision ready: http://127.0.0.1:8765', flush=True)
    try:
        server.serve_forever()
    finally:
        server.server_close()
        Handler.scanner.close()
