import { Injectable } from '@angular/core';
import { Draw } from '../classes/interface';
import { from } from 'rxjs';
import { tap, switchMap, mergeMap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class VerificationService {
  constructor(private draws: Draw[]) { }

  start(player) {
    let index = 0, nextIssue = 0;
    return from(this.draws).pipe(
      tap(draw => nextIssue = this.draws[index + 1] ? this.draws[index + 1].issue : 0),
      tap(draw => player.settle(draw)),
      mergeMap(draw => player.produce(this.draws.slice(0, index + 1), nextIssue)),
      tap(draw => index += 1),
    ).subscribe(_ => {
      player.report();
    }, err => {
      player.error(err);
    }, () => {

    });
  }
}
