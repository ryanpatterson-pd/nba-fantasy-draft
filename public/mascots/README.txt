MANAGER PHOTOS

Drop a file here named <managerId>.png and it appears everywhere that manager
is shown: the champion plate on a season page, the bracket, season tables,
ladders, rosters and profile headers. No code change is needed.

The ids are:

  ryan.png      andrew.png    luke.png      dylan.png
  laven.png     aaron.png     izzy.png      tuan.png
  daniel.png    tyler.png     jason.png     nathan.png
  titian.png    imran.png

Notes:

- Square images work best. They are cropped to fill a rounded tile, so
  anything wildly non-square will lose its edges. 256x256 is plenty.
- Until a file exists, the manager's initial is shown on a tile in their
  colours. The initial is always drawn underneath, and the photo fades in
  only once it has loaded, so a missing file never shows a broken image.
- Filenames are lowercase and must match the id exactly.
