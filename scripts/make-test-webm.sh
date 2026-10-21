#!/usr/bin/env bash
# Crée des copies WebM de test des 12 vidéos, hors dépôt (dans test-results/).
# Sert uniquement à valider la logique du lecteur dans un Chromium sans H.264.
# Les fichiers originaux MP4 ne sont jamais modifiés.
set -euo pipefail
cd "$(dirname "$0")/.."
OUT="${1:-test-results/webm}"
mkdir -p "$OUT"
for f in site/assets/videos/realisation-*.mp4; do
  b=$(basename "$f" .mp4)
  ffmpeg -v error -y -i "$f" -t 3 -vf scale=320:-2 -c:v libvpx -b:v 150k -an "$OUT/$b.webm"
done
echo "$(ls "$OUT" | wc -l) fichiers WebM de test dans $OUT"
