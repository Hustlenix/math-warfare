"""Bake the entire wardrobe from locally owned LimeZu layers. No runtime generation."""
from pathlib import Path
from PIL import Image, ImageDraw
import json,os,hashlib,colorsys
root=Path(__file__).resolve().parents[1]
assets=Path(os.environ.get('MATH_ASSET_HOME',str(Path.home()/'Downloads')))/'moderninteriors-win'/'2_Characters'/'Character_Generator'
out=root/'.licensed-art';out.mkdir(exist_ok=True)
data=json.loads((root/'src/adventure/wardrobe-data.json').read_text())
cache={}
def layer(category,name):
 key=(category,name)
 if key not in cache:
  im=Image.open(assets/category/'16x16'/name).convert('RGBA'); strip=Image.new('RGBA',(448,32))
  for direction,source in enumerate([2,1,0,3]):
   strip.paste(im.crop((source*16,0,source*16+16,32)),(direction*112,0))
   strip.paste(im.crop((source*96,32,source*96+96,64)),(direction*112+16,0))
  cache[key]=strip
 return cache[key].copy()
def rgb(hex):return tuple(bytes.fromhex(hex[1:]))
def tint(im,color,skin=False):
 target=rgb(color)
 for y in range(im.height):
  for x in range(im.width):
   r,g,b,a=im.getpixel((x,y))
   if not a or max(r,g,b)<76:continue
   # Preserve outlines and source pixel shading; the outfit covers underwear.
   shade=((r+g+b)/3)/155 if skin else ((r+g+b)/3)/114
   im.putpixel((x,y),tuple(min(255,int(v*shade)) for v in target)+(a,))
 return im
def extras(im,kind,look):
 for direction in range(4):
  for f in range(7):
   x=direction*112+f*16
   # Locate each head from the actual body silhouette: walking bob follows its source.
   crop=im.crop((x,0,x+16,20)); bounds=crop.getbbox(); top=bounds[1] if bounds else 6
   # Stock head starts at y=7; these authored pixels stay aligned with that frame.
   y=top; d=ImageDraw.Draw(im)
   if kind.get('curls'):
    color=look['hair']; shadow='#292a2d'; light=tuple(min(255,v+24) for v in rgb(color))
    circles=[(4,1),(7,0),(10,1),(3,3),(6,3),(9,3),(12,3),(3,5),(12,5)]
    if kind['curls']=='long':circles += [(2,7),(13,7),(2,10),(13,10),(3,12),(12,12)]
    if direction==1:circles += [(5,6),(8,6),(11,6),(5,9),(8,9),(11,9)]
    for cx,cy in circles:
     d.rectangle((x+cx-1,y+cy,x+cx+1,y+cy+2),fill=shadow)
     d.rectangle((x+cx,y+cy,x+cx+1,y+cy+1),fill=color)
     d.point((x+cx,y+cy),fill=light)
   if kind.get('hat'):
    hat='#282a29' if kind['hat']=='fedora' else '#86603c'
    highlight='#47433a' if kind['hat']=='fedora' else '#b88a56'
    # Wide brim with a pinched crown, and direction-specific asymmetric highlights.
    d.rectangle((x+3,y-1,x+12,y+3),fill=hat)
    d.rectangle((x+4,y-2,x+11,y-1),fill=highlight)
    d.rectangle((x+2,y+3,x+13,y+5),fill=hat)
    d.line((x+3,y+2,x+12,y+2),fill='#171f21')
    if kind['hat']=='cowboy':
     d.line((x,y+3,x+15,y+3),fill=hat);d.point((x,y+2),fill=highlight);d.point((x+15,y+2),fill=highlight)
    d.line((x+(10 if direction==0 else 4),y,x+(10 if direction==0 else 4),y+2),fill=highlight)
   # Tailored coat, visible boots and a collar; limbs keep the artist's walking pose.
   if kind['group']!='Neighbours':
    # Clothes were recoloured before compositing; add a direction-specific collar/bandana.
    if direction!=1:
     d.line((x+5,y+13,x+10,y+13),fill=look['scarf'])
     if kind.get('hat')=='cowboy':d.polygon([(x+6,y+13),(x+10,y+13),(x+8,y+17)],fill=look['scarf'])
   if kind.get('goatee') and direction!=1:
    if direction==3:
     d.line((x+6,y+9,x+10,y+9),fill='#48392f');d.rectangle((x+7,y+11,x+9,y+13),fill='#48392f')
    else:d.rectangle((x+(3 if direction==0 else 11),y+10,x+(5 if direction==0 else 13),y+12),fill='#48392f')
 return im
atlas=Image.new('RGBA',(448,32*324));faces=Image.new('RGBA',(320,544)); hashes=[]
for a,kind in enumerate(data['archetypes']):
 for s,skin in enumerate(data['skins']):
  for l,look in enumerate(data['looks']):
   idx=a*27+s*3+l
   body=layer('Bodies',f"Body_{skin['body']:02d}.png")
   if skin.get('tint'):body=tint(body,skin['color'],True)
   clothes=layer('Outfits',f"Outfit_{19 if kind['group']!='Neighbours' else 1:02d}_01.png")
   body.alpha_composite(tint(clothes,look['coat']))
   body.alpha_composite(layer('Eyes','Eyes_01.png'))
   if kind.get('hair'):
    hair=layer('Hairstyles',f"Hairstyle_{kind['hair']:02d}_01.png")
    body.alpha_composite(tint(hair,'#b5b2a6' if kind.get('silver') else look['hair']))
   if kind.get('beard'):body.alpha_composite(tint(layer('Accessories','Accessory_13_Beard_01.png'),look['hair']))
   if kind.get('glasses'):body.alpha_composite(layer('Accessories','Accessory_15_Glasses_01.png'))
   body=extras(body,kind,look)
   atlas.paste(body,(0,idx*32));face=body.crop((336,0,352,32));faces.paste(face,((idx%20)*16,(idx//20)*32))
   hashes.append(hashlib.sha256(body.tobytes()).hexdigest())
assert len(set(hashes))==324,'Every baked character must be visually distinct.'
# A shared pixel-art palette keeps all 324 looks compact. Verify uniqueness again
# after palette packing, and derive portraits from these exact final pixels.
packed=atlas.quantize(colors=256,method=Image.Quantize.FASTOCTREE,dither=Image.Dither.NONE)
atlas=packed.convert('RGBA');hashes=[]
for idx in range(324):
 body=atlas.crop((0,idx*32,448,idx*32+32));hashes.append(hashlib.sha256(body.tobytes()).hexdigest())
 faces.paste(body.crop((336,0,352,32)),((idx%20)*16,(idx//20)*32))
assert len(set(hashes))==324,'Palette packing must retain every unique look.'
packed.save(out/'heroAtlas.png',optimize=True);faces.save(out/'heroFaces.png',optimize=True)
(out/'wardrobe-manifest.json').write_text(json.dumps({'count':324,'directions':['left','up','right','down'],'framesPerDirection':7,'pixelHashes':hashes},indent=2))
print('Baked 324 unique four-direction characters and portraits:',sum((out/f).stat().st_size for f in ['heroAtlas.png','heroFaces.png']),'bytes. No artist originals copied.')
