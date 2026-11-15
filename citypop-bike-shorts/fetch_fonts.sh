#!/bin/bash
# Google Fonts(OFL)から使用フォントを取得する
mkdir -p fonts && cd fonts
for u in ofl/delagothicone/DelaGothicOne-Regular.ttf ofl/rocknrollone/RocknRollOne-Regular.ttf ofl/kaiseidecol/KaiseiDecol-Bold.ttf ofl/reggaeone/ReggaeOne-Regular.ttf ofl/yuseimagic/YuseiMagic-Regular.ttf ofl/monoton/Monoton-Regular.ttf ofl/vt323/VT323-Regular.ttf ofl/pacifico/Pacifico-Regular.ttf ofl/zenantique/ZenAntique-Regular.ttf ofl/dotgothic16/DotGothic16-Regular.ttf; do
  curl -sSL -o "$(basename $u)" "https://raw.githubusercontent.com/google/fonts/main/$u"
done
