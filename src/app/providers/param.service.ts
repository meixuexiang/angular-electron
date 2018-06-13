import { Injectable } from '@angular/core';
import { ParamGroup } from '../classes/param-group';
import { Kjhm, Draw } from '../classes/interface';
import { Dict } from './dict.service';
import { Observable, from, zip, of } from 'rxjs';
import { map, switchMap, bufferCount, groupBy, mergeMap, tap, reduce, flatMap, filter, share } from 'rxjs/operators';

import * as Highcharts from 'highcharts/highstock.src';
import { Param } from '../classes/param';

import * as _ from 'lodash';

@Injectable({
  providedIn: 'root'
})
export class ParamService {
  rDate = /^(\d{4})(\d{2})(\d{2})$/;
  issueCache = {};
  paramGroups: ParamGroup[];

  emaGetValue: (series: Object, params: Object) => { values: number[][]; xData: number[]; yData: number[]; } = Highcharts.seriesTypes.ema.prototype.getValues;

  constructor() {
    this.paramGroups = [
      // ...[1, 2, 3, 4, 5/*, 6, 7, 8*/].map(n => {
      //   const name = `C${n}`;
      //   return new ParamGroup({
      //     name,
      //     getValFactory: () => {
      //       return Dict[name].map((d: Kjhm) => {
      //         const set = new Set(d);
      //         const fn = ([k0, k1, k2, k3, k4]) => {
      //           return String(+set.has(k0) + +set.has(k1) + +set.has(k2) + +set.has(k3) + +set.has(k4));
      //         };
      //         fn['pname'] = d.join('');
      //         return fn;
      //       });
      //     }
      //   });
      // }),

      // new ParamGroup({
      //   name: 'KD',
      //   getValFactory: () => {
      //     const fn = (kjhm: Kjhm) => {
      //       const ar = kjhm.map(s => +s);
      //       return String(Math.max(...ar) - Math.min(...ar) - 4);
      //     };
      //     fn['pname'] = 'kd';
      //     return [fn];
      //   }
      // }),

      new ParamGroup({
        name: 'BIN',
        getValFactory: () => {
          return [5, 6, 7, 8, 9, 10, 11].map(n => {
            const fn = (kjhm: Kjhm) => {
              const set = new Set(kjhm.map(s => +s));
              const ar = new Array(11).fill(0).map((z, i) => set.has(i + 1) ? 1 : 0);
              return String(parseInt(ar.join(''), 2) % n);
            };
            fn['pname'] = 'bin' + n;
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
              return String(kjhm.reduce((acc, s) => +s + acc, 0) % n);
            };
            fn['pname'] = 'hw' + n;
            return fn;
          });
        }
      }),

    ];
  }

  cal(obsDraws: Observable<Draw[]>, issueCount: number, bufferSize: number, odds: number = 0.95, rebate: number = 0) {
    return from(this.paramGroups).pipe(
      mergeMap(pg => from(pg.params), (pg, p) => ({ pg, p })),
      // tap((...args) => console.log(1111, ...args)),
      mergeMap(({ pg, p }) => obsDraws.pipe(map(draws => draws.map(draw => ({ issue: this.issueToDate(draw.issue), value: p.getVal(draw.kjhm) })))), (param, vs) => ({ ...param, vs })),
      // tap((...args) => console.log(2222, ...args)),
      mergeMap(({ pg, p, vs }) => from(p.values.filter(v => p.valNumMap[v].length > 15)), (param, v) => ({ ...param, v })),
      switchMap(({ pg, p, v, vs }) => {
        let balance = 0;
        const num = p.valNumMap[v].length,
          pos = (Dict.C5.length * odds) - num,
          neg = -num + num * rebate;
        const ims = vs.map(({ issue, value }) => [issue, balance = Number((balance + (value === v ? pos : neg)).toFixed(2))]);
        return of(ims);
      }, ({ pg, p, v }, ims) => ({ pg, p, v, ims })),
      groupBy((buffer: any) => 1),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
      mergeMap((pvs: { [propName: string]: any; }[]) => {
        return obsDraws.pipe(
          switchMap((draws: Draw[]) => from(draws.slice(- (draws.length - issueCount))), (allDraws, draw) => ({ allDraws, draw })),
        );
      }, (pvs, { allDraws, draw }) => ({ pvs, allDraws, draw })),



      map(({ pvs, draw }, i) => {
        // debugger;
        pvs = pvs.map(({ pg, p, /*vs, */v, ims }, j) => {
          ims = ims.slice(i, i + issueCount);
          const ks = _.chunk(ims, bufferSize).map(buffer => {
            const issue = buffer[0][0], arPrice = buffer.map(a => a[1]);
            return [issue, arPrice[0], Math.max(...arPrice), Math.min(...arPrice), arPrice[arPrice.length - 1]];
          });
          const [xData, yData] = [ks.map(k => k[0]), ks.map(k => k.slice(1))];
          const ema = [this.emaGetValue({ xData, yData }, { period: 5 }).yData.reverse(), this.emaGetValue({ xData, yData }, { period: 9 }).yData.reverse()];
          const obj = {
            pg,
            p,
            v,
            // vs,
            // ks,
            // ema,
            weight: this.weight(ema[0], ema[1])
          };
          return obj;
        }).sort((a, b) => a.weight < b.weight ? 1 : -1).slice(0, 22);
        return { pvs, draw, i };
      }),
      // tap((...args) => console.log(4444, ...args)),
    );
  }

  weight(emaFast: number[], emaSlow: number[]) {
    const f0 = emaFast[0], f1 = emaFast[1], f2 = emaFast[2];
    const s0 = emaSlow[0], s1 = emaSlow[1], s2 = emaSlow[2];
    return f0 >= s0 ?
      emaFast.findIndex((n, i) => n < emaSlow[i]) * ((f0 - s0) > (f1 - s1) && (f1 - s1) > (f2 - s2) ? 1 : 0.5)
      :
      -emaFast.findIndex((n, i) => n >= emaSlow[i]);
  }

  issueToDate(issue) {
    return this.issueCache[issue] || (this.issueCache[issue] = this._issueToDate(issue));
  }

  _issueToDate(issue) {
    issue = '20' + issue;
    const date = Date.parse(issue.slice(0, -2).replace(this.rDate, '$1/$2/$3')), issueNo = parseInt(issue.slice(-2), 10);
    return date + 9 * 3600 * 1000 + 10 * 60 * 1000 * issueNo;
  }

}

