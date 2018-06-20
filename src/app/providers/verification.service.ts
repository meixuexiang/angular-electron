import { Injectable } from '@angular/core';
import { Draw } from '../classes/interface';
import { from, Observable, throwError } from 'rxjs';
import { tap, switchMap, mergeMap, map } from 'rxjs/operators';
import { PlayerService } from './player.service';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  constructor(
    private player: PlayerService
  ) { }

  start(obsDraws: Observable<Draw[]>, issueNumber: number) {
    return obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-this.player.issueCount - issueNumber)),
      tap(() => this.player.reset()),
      switchMap((draws: Draw[]) =>
        draws.length >= this.player.issueCount + issueNumber ? from(draws.slice(-issueNumber)) : throwError('Not enough draws.'),
        (draws, draw, i, j) => {
          return { draws: draws.slice(j, j + this.player.issueCount), draw, nextIssue: draws[j + 1 + this.player.issueCount] ? draws[j + 1 + this.player.issueCount].issue : 0 };
        }),
      tap(({ draw }) => this.player.settle(draw)),
      mergeMap(arg => this.player.produce(arg), (arg, orders) => ({ ...arg, orders })),
    );
  }
}
