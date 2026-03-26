import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Export, Scrobble } from 'projects/shared/src/lib/app/model';
import { ScrobbleStore } from '../../../shared/src/lib/service/scrobble.store';
import { SpotifyItemService } from './spotify-item.service';

import * as scrobbles from '../../../../projects/lastfmstats-TestUser.json';

@Injectable({
  providedIn: 'root'
})
export class MockSpotifyItemService extends SpotifyItemService {
  data: Export = scrobbles;

  constructor(router: Router) {
    super(router);
  }

  override retrieveFor(username: string, imported: Scrobble[], store: ScrobbleStore): void {
    if (username.toLowerCase() !== 'testuser') {
      super.retrieveFor(username, imported, store);
    } else {
      store.page(this.data.scrobbles.map(s => ({track: s.track, artist: s.artist, album: s.album, albumId: '', date: new Date(s.date)})));
      store.updateUser({
        name: username,
        url: 'https://open.spotify.com/user/' + username,
        playcount: '1891',
        registered: {unixtime: "1083442051"},
        image: []
      });
      store.finish('COMPLETED');
    }
  }
}
