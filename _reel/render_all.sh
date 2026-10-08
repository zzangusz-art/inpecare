#!/bin/bash
set -e
cd "$(dirname "$0")"
CRF=24 node render.js 1920 1080 ../assets/video/inpecare-reel-1080p.mp4
CRF=24 node render.js 1280 720 ../assets/video/inpecare-reel-720p.mp4
CRF=25 node render.js 720 1520 ../assets/video/inpecare-reel-mobile.mp4
cd ../assets/video
ffmpeg -y -loglevel error -ss 14.95 -i inpecare-reel-1080p.mp4 -frames:v 1 -q:v 3 poster-desktop.jpg
ffmpeg -y -loglevel error -ss 14.95 -i inpecare-reel-mobile.mp4 -frames:v 1 -q:v 3 poster-mobile.jpg
for f in *.mp4; do ffprobe -v error -show_entries stream=width,height,nb_frames -show_entries format=duration,size -of compact "$f"; done
echo RENDER_DONE
