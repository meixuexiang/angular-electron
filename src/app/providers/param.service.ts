import { Injectable } from '@angular/core';
import { ParamGroup } from '../classes/param-group';
import { Kjhm, Draw } from '../classes/interface';
import { Dict } from './dict.service';
import { Observable, from, zip } from 'rxjs';
import { map, switchMap, bufferCount, groupBy, mergeMap, tap, reduce, flatMap, filter } from 'rxjs/operators';

import * as Highcharts from 'highcharts/highstock.src';

@Injectable({
  providedIn: 'root'
})
export class ParamService {
  paramGroups: ParamGroup[];

  emaGetValue: (series: Object, params: Object) => { values: number[][]; xData: number[]; yData: number[]; } = Highcharts.seriesTypes.ema.prototype.getValues;

  constructor() {
    this.paramGroups = [
      ...[1, 2, 3, 4, 5/*, 6, 7, 8*/].map(n => {
        const name = `C${n}`;
        return new ParamGroup({
          name,
          getValFactory: () => {
            return Dict[name].map((d: Kjhm) => {
              const set = new Set(d);
              const fn = ([k0, k1, k2, k3, k4]) => {
                return +set.has(k0) + +set.has(k1) + +set.has(k2) + +set.has(k3) + +set.has(k4);
              };
              fn['pname'] = d.join('');
              return fn;
            });
          }
        });
      }),

      new ParamGroup({
        name: 'KD',
        getValFactory: () => {
          const fn = (kjhm: Kjhm) => {
            const ar = kjhm.map(s => +s);
            return Math.max(...ar) - Math.min(...ar) - 4;
          };
          fn['pname'] = 'kd';
          return [fn];
        }
      }),

      new ParamGroup({
        name: 'BIN',
        getValFactory: () => {
          return [5, 6, 7, 8, 9, 10, 11].map(n => {
            const fn = (kjhm: Kjhm) => {
              const set = new Set(kjhm.map(s => +s));
              const ar = new Array(11).fill(0).map((_, i) => set.has(i + 1) ? 1 : 0);
              return parseInt(ar.join(''), 2) % n;
            };
            fn['pname'] = 'bin';
            return fn;
          });
        }
      }),

      new ParamGroup({
        name: 'HW',
        getValFactory: () => {
          return [5, 6, 7, 8, 9, 10, 11].map(n => {
            const fn = (kjhm: Kjhm) => {
              const ar = kjhm.map(s => +s);
              return kjhm.reduce((acc, s) => +s + acc, 0) % n;
            };
            fn['pname'] = 'hw' + n;
            return fn;
          });
        }
      }),

    ];
  }

  cal(obsDraws: Observable<Draw[]>, issueCount: number, bufferSize: number, odds: number = 0.95, rebate: number = 0) {
    const obsSliceDraws = obsDraws.pipe(switchMap(draws => from(draws.slice(-Math.min(Math.max(issueCount, 0), draws.length)))));
    const obs = [].concat(...this.paramGroups.map(pg =>
      [].concat(...pg.params.map(p =>
        p.values.map(v => {
          let money = 0;
          const num = p.valNumMap[v].length,
            pos = (Dict.C5.length * odds) - num,
            neg = -num + num * rebate;

          return obsSliceDraws.pipe(
            map(draw => [this.issueToDate(draw.issue), money = Number((money + (p.getVal(draw.kjhm).toString() === v ? pos : neg)).toFixed(2))]),
            bufferCount(bufferSize, bufferSize - 1),
            map(buffer => {
              const issue = buffer[0][0], arPrice = buffer.map(ar => ar[1]);
              return [issue, arPrice[0], Math.max(...arPrice), Math.min(...arPrice), arPrice[arPrice.length - 1]];
            }),
            groupBy(buffer => 1),
            // tap(group => console.log('group', group)),
            flatMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
            map((ks: number[][]) => ({ pg, p, v, ks })),
            // tslint:disable-next-line:no-shadowed-variable
            map(({ pg, p, v, ks }) => {
              const [xData, yData] = [ks.map(k => k[0]), ks.map(k => k.slice(1))];
              return { pg, p, v, ks, ema: [this.emaGetValue({ xData, yData }, { period: 5 }).yData.reverse(), this.emaGetValue({ xData, yData }, { period: 9 }).yData.reverse()] };
            }),
            // tslint:disable-next-line:no-shadowed-variable
            // filter(([pg, p, v, ema]) => {
            //   console.log(123123123, ema);
            //   return ema[0][0] > ema[1][0];
            // }),
            // tslint:disable-next-line:no-shadowed-variable
            map(({ pg, p, v, ks, ema }) => ({ pg, p, v, ks, ema, weight: this.weight(ema[0], ema[1]) }))
          );
        })
      ))
    ));
    return zip(...obs);
  }

  weight(emaFast: number[], emaSlow: number[]) {
    return emaFast[0] >= emaSlow[0] ? emaFast.findIndex((n, i) => n < emaSlow[i]) : -emaFast.findIndex((n, i) => n >= emaSlow[i]);
  }

  issueToDate(issue) {
    issue = '20' + issue;
    const date = Date.parse(issue.slice(0, -2).replace(/^(\d{4})(\d{2})(\d{2})$/, '$1/$2/$3')), issueNo = parseInt(issue.slice(-2), 10);
    return date + 9 * 3600 * 1000 + 10 * 60 * 1000 * issueNo;
  }

}
