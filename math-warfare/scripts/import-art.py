"""Build game-only crops from locally owned LimeZu packs. Originals stay untouched."""
import os,json,hashlib
from pathlib import Path
from PIL import Image

root=Path(__file__).resolve().parents[1]
downloads=Path(os.environ.get('MATH_ASSET_HOME', str(Path.home()/'Downloads')))
out=root/'.licensed-art'; out.mkdir(parents=True,exist_ok=True)
modern=downloads/'moderninteriors-win'
cave=downloads/'Fungus Cave [16x16]'
battlers=downloads/'Fantasy Battlers - Complete'/'Fantasy Battlers - Complete'/'Original size'
manifest={}
def save(name,path,box=None):
 im=Image.open(path).convert('RGBA')
 if box:im=im.crop(box)
 im.save(out/(name+'.png'),optimize=True)
 manifest[name]={'width':im.width,'height':im.height,'source':str(path.relative_to(downloads)), 'sha256':hashlib.sha256((out/(name+'.png')).read_bytes()).hexdigest()}
for n in range(1,9):
 save('person'+str(n),modern/'2_Characters'/'Character_Generator'/'0_Premade_Characters'/'16x16'/('Premade_Character_%02d.png'%n),(0,32,384,64))
 save('person'+str(n)+'Face',modern/'2_Characters'/'Character_Generator'/'0_Premade_Characters'/'16x16'/('Premade_Character_%02d.png'%n),(288,32,304,64))
for name,file in [('cat','animated_cat'),('frog','animated_frog_idle'),('butterfly','animated_butterfly')]:
 save(name,modern/'3_Animated_objects'/'16x16'/'spritesheets'/(file+'.png'))
interior=modern/'1_Interiors'/'16x16'/'Interiors_16x16.png'
for name,box in {'desk':(112,208,160,240),'books':(80,224,112,288),'sofa':(128,288,176,320),'plant':(160,416,192,464),'rug':(112,256,160,288),'chair':(64,336,80,368),'cabinet':(176,608,224,640)}.items():save(name,interior,box)
for name,file in [('fungus','Fungus - red'),('king','Fungus - King'),('cleric','Cleric'),('scout','Refugee 1')]:
 save(name,cave/'Characters'/(file+'.png'))
 save(name+'Face',cave/'Characters'/(file+'.png'),(16,96,32,128))
tiles=cave/'Tilesets'/'Tileset - Fungus cave and Refugee outpost 16x16.png'
for name,box in {'stone':(112,0,128,16),'caveWall':(16,16,32,32),'mushrooms':(0,400,48,432),'throne':(0,336,48,400),'chest':(64,240,96,256),'crates':(32,480,64,512),'bed':(0,432,32,464),'caveSteps':(48,288,96,336)}.items():save(name,tiles,box)
for name,file in [('owl','01'),('slime','16'),('boss','31'),('beetle','19')]:save(name,battlers/(file+'.png'))
(out/'manifest.json').write_text(json.dumps(manifest,indent=2))
print('Prepared',len(manifest),'game resources;',sum(p.stat().st_size for p in out.glob('*.png')),'bytes. No original packs copied.')
