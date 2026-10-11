"""Checks the baked atlas, rather than trusting catalogue metadata."""
from PIL import Image
from pathlib import Path
import hashlib,json
root=Path(__file__).resolve().parents[1];folder=root/'.licensed-art'
atlas=Image.open(folder/'heroAtlas.png').convert('RGBA');faces=Image.open(folder/'heroFaces.png').convert('RGBA')
assert atlas.size==(448,10368);assert faces.size==(320,544)
hashes=[]
for i in range(324):
 strip=atlas.crop((0,i*32,448,i*32+32));hashes.append(hashlib.sha256(strip.tobytes()).hexdigest())
 assert len(set(strip.crop((d*112,0,d*112+16,32)).tobytes() for d in range(4)))==4,'Every facing direction must have its own actual pixels.'
 assert strip.crop((336,0,352,32)).tobytes()==faces.crop(((i%20)*16,(i//20)*32,(i%20)*16+16,(i//20)*32+32)).tobytes()
 for d in range(4):
  frames=[strip.crop((d*112+f*16,0,d*112+(f+1)*16,32)) for f in range(7)]
  assert all(f.getbbox() for f in frames)
  assert len(set(f.tobytes() for f in frames))>=3,'Walking frames must animate.'
assert len(set(hashes))==324
assert hashes==json.loads((folder/'wardrobe-manifest.json').read_text())['pixelHashes']
print('Verified 324 visually unique prebuilt characters, all 9,072 directional frames, and matching front portraits.')
