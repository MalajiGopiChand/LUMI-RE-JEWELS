# Python landmark scanning

Run `Start-Python-Vision.cmd` alongside `npm run dev`. The isolated `.venv-vision` environment contains MediaPipe, NumPy and Pillow. The Python service binds only to 127.0.0.1:8765. Next.js proxies frames through `/api/vision/analyze` with origin checks, rate limiting, a 2 MB upload limit and a 30-second timeout. It decodes images in memory, checks pixel limits and uses the three local model files. Nothing is saved or included in request logs. Browser face scan remains available without this service.

Choose **Scan face & hands → Python**, then upload a portrait/hand photo, use a sample, or capture one camera frame. It returns indexed face, hand and pose coordinates, estimated hand/body world coordinates, handedness scores, face transforms and expression scores. The preview uses the appropriate Python landmarks directly. The overlay toggle shows all detected points. Every point can be inspected in the table, and the full result can be downloaded as JSON. A hand-only scan selects a ring; a face scan creates the styling edit. Measurements are estimates and cannot establish physical jewellery size. Python mode analyzes captured frames; continuous camera preview uses the browser tracker.

Python mode sends the frame to the website backend. This is the same computer in the local preview; a deployed website processes it on its server. Deploy the Python service alongside Next.js on the same host, or choose browser mode. Update merchant privacy disclosures before production.

Run `.venv-vision\Scripts\python.exe python\test_vision.py` with both servers running. Verified: the face sample yielded 478 points and 33 body points; the hand sample yielded 21 hand points. Face transforms/expression scores, finite coordinates, invalid-image rejection and cross-origin rejection passed.

Implementation follows the official [MediaPipe Python face guide](https://developers.google.com/edge/mediapipe/solutions/vision/face_landmarker/python), [hand guide](https://developers.google.com/edge/mediapipe/solutions/vision/hand_landmarker/python) and [pose guide](https://developers.google.com/edge/mediapipe/solutions/vision/pose_landmarker/python).

