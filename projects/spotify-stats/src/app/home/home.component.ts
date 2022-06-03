import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Validators, FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import * as JSZip from 'jszip';
import { Scrobble } from 'projects/shared/src/lib/app/model';
import { AbstractItemRetriever } from 'projects/shared/src/lib/service/abstract-item-retriever.service';
import { InfoDialogComponent } from 'projects/spotify-stats/src/app/info-dialog/info-dialog.component';
import { BehaviorSubject, map, shareReplay, Observable, throttleTime, asyncScheduler } from 'rxjs';

interface JSONEntry {
  endTime: string;
  artistName: string,
  trackName: string,
  msPlayed: number
}

interface ParsedEntry {
  first: Date;
  last: Date;
  name: string;
  total: number;
  plays: Scrobble[];
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  username = new FormControl('', Validators.required);
  files = new BehaviorSubject<ParsedEntry[]>([]);
  deduplicated: Observable<number>;
  submitted = false;

  constructor(private router: Router, private retriever: AbstractItemRetriever, private dialog: MatDialog) {
    this.deduplicated = this.files.pipe(
      throttleTime(0, asyncScheduler, { trailing: true }),
      map(files => files.flatMap(file => file.plays).map(p => JSON.stringify(p))),
      map(plays => plays.length - new Set(plays).size),
      shareReplay(),
    );
  }

  onSelect(event: any): void {
    const fileList: File[] = event.addedFiles;
    fileList.forEach(file => {
      const name = file.name.toLowerCase();
      if (name.endsWith('.zip')) {
        this.unzip(file);
      } else if (name.endsWith('.json')) {
        const reader = new FileReader();
        reader.onloadend = () => this.addJson(file.name, reader.result as string);
        reader.readAsText(file);
      } else {
        // fail
      }
    });
  }

  private unzip(file: File): void {
    new JSZip().loadAsync(file).then(zip => {
      Object.keys(zip.files).forEach(filename => {
          if (filename.startsWith('MyData/StreamingHistory')) {
            zip.files[filename].async('string').then(data => this.addJson(filename.substring('MyData/'.length), data));
          } else if (filename.startsWith('MyData/Userdata')) {
            zip.files[filename].async('string').then(data => this.username.setValue(JSON.parse(data).username));
          }
        });
    });
  }

  private addJson(name: string, json: string): void {
    const parsed: JSONEntry[] = JSON.parse(json);
    const plays: Scrobble[] = parsed.map(s => ({
      artist: s.artistName,
      track: s.trackName,
      album: '',
      date: new Date(s.endTime + ' UTC')
    }));
    const first = plays[0].date;
    const last = plays[plays.length - 1].date;
    const current = this.files.value;
    current.push({name, first, last, plays, total: plays.length});
    current.sort((a, b) => a.first.getTime() - b.first.getTime());
    this.files.next(current);
  }

  onRemove(event: any, $event: MouseEvent) {
    const current = this.files.value;
    current.splice(current.indexOf(event), 1);
    this.files.next(current);
    $event.stopPropagation();
  }

  go(): void {
    const plays = this.files.value.flatMap(f => f.plays);
    if (this.username.valid && plays.length) {
      const handled = new Set();
      this.retriever.imported = plays.filter(p => {
        const json = JSON.stringify(p);
        if (handled.has(json)) {
          return false;
        } else {
          handled.add(json);
          return p;
        }
      });
      this.router.navigate([`/user/${this.username.value}`]);
    } else {
      this.submitted = true;
      this.username.markAsTouched();
    }
  }

  openInfoDialog(): void {
    this.dialog.open(InfoDialogComponent);
  }
}
