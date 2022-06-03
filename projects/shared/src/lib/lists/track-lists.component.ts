import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { TempStats, Track, Constants, Month, MonthItem } from 'projects/shared/src/lib/app/model';
import { SettingsService } from 'projects/shared/src/lib/service/settings.service';
import { StatsBuilderService } from 'projects/shared/src/lib/service/stats-builder.service';
import { AbstractListsComponent, Top10Item } from 'projects/shared/src/lib/lists/abstract-lists.component';
import { AbstractUrlService } from '../service/abstract-url.service';

export interface TrackStats {
  betweenTracks: Top10Item[];
  ongoingBetweenTracks: Top10Item[];
  weeksPerTrack: Top10Item[];
  uniquePerMonth: Top10Item[];
  newPerMonth: Top10Item[];
  avgScrobbleDesc: Top10Item [];
  avgScrobbleAsc: Top10Item[];
  trackStreak: Top10Item[];
  climbers: Top10Item[];
  fallers: Top10Item[];
}

@Component({
  selector: 'app-track-lists',
  templateUrl: './track-lists.component.html',
  styleUrls: ['./lists.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackListsComponent extends AbstractListsComponent<TrackStats> implements OnInit {
  protected forcedThreshold = Constants.SCROBBLE_TRACK_THRESHOLD;

  constructor(builder: StatsBuilderService, settings: SettingsService, private url: AbstractUrlService) {
    super(builder, settings, url);
  }

  protected doUpdate(stats: TempStats, next: TrackStats): void {
    const seen = this.seenThreshold(stats.seenTracks);
    const gaps = this.calculateGaps(stats, seen, stats.betweenTracks, 'track', s => this.url.track(s.start.artist, s.start.track));
    next.betweenTracks = gaps[0];
    next.ongoingBetweenTracks = gaps[1];

    const seenNames = seen.map(s => s.name);
    const monthsValues = Object.values(stats.monthList);
    const tracks: { [month: string]: { [track: string]: MonthItem } } = {};
    monthsValues.forEach(m => {
      const curr: { [track: string]: MonthItem } = {};
      tracks[m.alias] = curr;
      m.artists.forEach(a => Object.values(a.tracks).filter(t => seenNames.indexOf(t.name) >= 0).forEach(t => curr[t.name] = t));
    });

    next.weeksPerTrack = this.getTrackTop10(seen, s => s.weeks.length, k => seen[+k], a => a.name, (i, v) => `${v} weeks`);
    next.uniquePerMonth = this.getMonthTop10(tracks, monthsValues, m => Object.keys(tracks[m]).length, (m, k) => `${m} (${k} unique tracks)`, m => this.including(tracks[m]));
    next.newPerMonth = this.getMonthTop10(tracks, monthsValues, m => Object.values(tracks[m]).filter(a => a.new).length, (m, k) => `${m} (${k} tracks)`, (m: string) => {
      // only show new artists in Including... text
      return this.including(Object.fromEntries(Object.entries(tracks[m]).filter(([, value]) => value.new)));
    });

    const seenThreshold = this.forceThreshold(seen);
    next.avgScrobbleDesc = this.getTrackTop10(seenThreshold, s => s.avgScrobble, k => seenThreshold[+k], a => `${a.name} (${a.scrobbles.length} scrobbles)`, (i, v) => new Date(v).toLocaleDateString());
    next.avgScrobbleAsc = this.getTrackTop10(seenThreshold, s => -s.avgScrobble, k => seenThreshold[+k], a => `${a.name} (${a.scrobbles.length} scrobbles)`, (i, v) => new Date(Math.abs(v)).toLocaleDateString());
    next.trackStreak = this.consecutiveStreak(stats, stats.trackStreak, s => `${s.start.artist} - ${s.start.track} (${s.length} times)`);

    const rankings = this.getRankings(seen, monthsValues, (i, m) => this.url.trackMonth(i.artist, i.shortName, m));
    next.climbers = rankings.climbers;
    next.fallers = rankings.fallers;
  }

  private getMonthTop10(tracks: { [month: string]: { [track: string]: MonthItem } },
                        months: Month[],
                        getValue: (k: string) => number,
                        buildName: (item: string, value: number) => string,
                        buildDescription: (item: string, value: number) => string): Top10Item[] {
    return this.getTop10<string>(tracks, getValue, k => k, buildName, buildDescription, m => this.url.month(m), m => months.find(x => x.alias === m)!.date).filter(m => m.amount > 0);
  }

  private getTrackTop10(countMap: { [key: string]: any },
                        getValue: (k: Track) => number,
                        getItem: (k: string) => Track,
                        buildName: (item: Track, value: number) => string,
                        buildDescription: (item: Track, value: number) => string): Top10Item[] {
    const trackUrl = (item: Track) => this.url.track(item.artist, item.shortName);
    const trackDate = (item: Track) => new Date(item.avgScrobble);
    return this.getTop10<Track>(countMap, getValue, getItem, buildName, buildDescription, trackUrl, trackDate);
  }

  private including(tracks: { [p: string]: MonthItem }): string {
    const keys = Object.keys(tracks);
    keys.sort((a, b) => tracks[b].count - tracks[a].count);
    return 'Including ' + keys.splice(0, 3).join(', ');
  }

  protected emptyStats(): TrackStats {
    return {
      betweenTracks: [],
      ongoingBetweenTracks: [],
      weeksPerTrack: [],
      uniquePerMonth: [],
      newPerMonth: [],
      avgScrobbleDesc: [],
      avgScrobbleAsc: [],
      trackStreak: [],
      climbers: [],
      fallers: [],
    };
  }
}
