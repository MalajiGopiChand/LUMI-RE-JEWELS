"""Integration checks against the running local Next and Python services."""
import io
import json
import math
import urllib.error
import urllib.request
from pathlib import Path
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
BASE='http://127.0.0.1:3000'

def request(data, origin=BASE):
    req=urllib.request.Request(BASE+'/api/vision/analyze',data=data,
        headers={'Content-Type':'image/jpeg','Origin':origin})
    try:
        with urllib.request.urlopen(req,timeout=40) as response:
            return response.status,json.load(response)
    except urllib.error.HTTPError as error:
        return error.code,json.load(error)

for name,kind,count in [('portrait-preview','faces',478),('hand-preview','hands',21)]:
    with Image.open(ROOT/'public'/'images'/'editorial'/f'{name}.png') as image:
        image=image.convert('RGB');image.thumbnail((1200,1200));buffer=io.BytesIO();image.save(buffer,format='JPEG',quality=90)
    status,result=request(buffer.getvalue())
    assert status==200,(status,result)
    assert result['engine']=='python-mediapipe'
    landmarks=result[kind][0] if kind=='faces' else result[kind][0]['landmarks']
    assert len(landmarks)==count,(name,len(landmarks))
    assert all(math.isfinite(p[key]) for p in landmarks for key in ['x','y','z'])
    if kind=='faces':
        assert len(result['poses'][0]['landmarks'])==33
        assert result['faceTransforms'] and result['faceExpressions']
    print(f'{name}: {len(landmarks)} indexed points; valid coordinates')
assert request(b'invalid image')[0]==400
assert request(b'invalid image','https://untrusted.example')[0]==403
print('Python integration checks passed: face, hands, body, detailed outputs, invalid image and origin protection.')
