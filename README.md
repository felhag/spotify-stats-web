## 🎶 Spotify stats
A small project to show some additional statistics for spotify: https://spotifystats.app.

**Duplicate from https://github.com/felhag/lastfm-stats-web**

## 🚀 Run locally
```
docker build -t spotify-stats .
docker run -p 4200:4200 spotify-stats
```
This will serve spotify-stats on http://localhost:4200

## 🔨 Prepare release (sync from lastfm-stats)
```
set TAGNAME=5.8
git fetch lastfm-stats-web & 
git merge lastfm-stats-web/master & 
git checkout --ours -- README.md & 
git add --ignore-errors -A -f -- README.md & 
git commit -m "Merge remote-tracking branch 'lastfm-stats-web/master'"
git tag -d %TAGNAME%
git tag %TAGNAME%
```
