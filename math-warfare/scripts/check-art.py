"""Verify the actual imported pixels, including the direction order."""
from pathlib import Path
from PIL import Image
import os
root=Path(__file__).resolve().parents[1]
downloads=Path(os.environ.get('MATH_ASSET_HOME',str(Path.home()/'Downloads')))
for n in range(1,12):
 sheet=Image.open(downloads/'moderninteriors-win'/'2_Characters'/'Character_Generator'/'0_Premade_Characters'/'16x16'/('Premade_Character_%02d.png'%n)).convert('RGBA')
 actual=Image.open(root/'.licensed-art'/('person'+str(n)+'.png')).convert('RGBA')
 assert actual.size==(448,32)
 for direction,original in enumerate([2,1,0,3]):
  assert actual.crop((direction*112,0,direction*112+16,32)).tobytes()==sheet.crop((original*16,0,original*16+16,32)).tobytes()
  assert actual.crop((direction*112+16,0,direction*112+112,32)).tobytes()==sheet.crop((original*96,32,original*96+96,64)).tobytes()
for name,file in [('fungus','Fungus - red'),('king','Fungus - King'),('cleric','Cleric'),('scout','Refugee 1')]:
 sheet=Image.open(downloads/'Fungus Cave [16x16]'/'Characters'/(file+'.png')).convert('RGBA')
 actual=Image.open(root/'.licensed-art'/(name+'.png')).convert('RGBA')
 for direction,original in enumerate([1,3,2,0]):
  assert actual.crop((0,direction*32,48,direction*32+32)).tobytes()==sheet.crop((0,original*32,48,original*32+32)).tobytes()
print('Verified actual left/up/right/down pixels for 11 villagers and 4 cave characters; idle and walking frames match the owned originals.')
