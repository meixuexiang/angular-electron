import { Injectable } from '@angular/core';
import { Draw, Arg } from '../classes/interface';
import { ParamService } from './param.service';
import { Observable, from, of } from 'rxjs';
import { map, switchMap, groupBy, mergeMap, reduce, tap, skip, take, concatMap } from 'rxjs/operators';
import * as Highcharts from 'highcharts/highstock.src';
import * as _ from 'lodash';
import { Dict } from './dict.service';
import { ElectronService } from './electron.service';
import { Tolerant } from '../classes/tolerant';

@Injectable({
  providedIn: 'root'
})

export class PlayerService {
  rDate = /^(\d{4})(\d{2})(\d{2})$/;
  issueCache = {};
  // odds = 0.95;
  odds = 1;
  rebate = 0;
  emaGetValue: (series: Object, params: Object) => { values: number[][]; xData: number[]; yData: number[]; } = Highcharts.seriesTypes.ema.prototype.getValues;

  balance = 100000;
  price = 1;

  cpus: Object[];

  constructor(
    private ps: ParamService,
    private es: ElectronService
  ) {
    if (this.es.isElectron()) {
      const os = window.require('os');
      this.cpus = os.cpus();
    }
  }

  settle(draw: Draw) {

  }
  produce(draws: Draw[], nextIssue: number) {

  }
  report() {

  }
  error(err: Error) {

  }

  job(obsDraws: Observable<Draw[]>, issueCount: number, bufferSize: number) {
    if (this.es.isElectron()) {
      const { BrowserWindow } = this.es.remote;
      const ipcRenderer = this.es.ipcRenderer;
      const windowID = BrowserWindow.getFocusedWindow().id;
      const invisPath = location.origin + '/';
      const BrowserWindowOptions = { width: 1024, height: 768, show: !false };
      const numThread = this.cpus.length > 1 ? this.cpus.length - 1 : 1;
      // const numThread = 2;

      return obsDraws.pipe(
        switchMap((draws: Draw[]) => {
          const size = Math.ceil((draws.length - issueCount) / numThread);
          return from(new Array(numThread).fill(0).map((z, i) => draws.slice(size * i, issueCount + size * (i + 1))));
        }),
        mergeMap((draws: Draw[], i) => {
          return Observable.create(observer => {
            const win = new BrowserWindow(BrowserWindowOptions);
            win.loadURL(invisPath);

            const channel = `cal-caled-${i}`;
            win.webContents.openDevTools();
            win.webContents.on('did-finish-load', () => {
              const args = [draws, issueCount, bufferSize];
              win.webContents.send('cal-cal', args, channel, windowID);
            });

            ipcRenderer.on(channel, (event, output: { sizes: number[]; winIndex: number }[]) => {
              observer.next(output);
            });
            return () => ipcRenderer.removeAllListeners(channel);
          }).pipe(take(1));
        }),
      );
    } else {
      return this.cal(obsDraws, issueCount, bufferSize);
    }
  }

  tolerant(obsDraws: Observable<Draw[]>, issueCount: number, bufferSize: number) {
    return this.cal(obsDraws, issueCount, bufferSize)
      .pipe(
        mergeMap(({ pvs }) => {
          const t = new Tolerant();
          pvs.forEach(({ p, v }) => t.add(p.valNumMap[v]));
          const result = t.genResult(), sizes = result.map(ar => ar.length);
          return of({ result, sizes });
        }, (param, { result, sizes }) => ({ ...param, result, sizes })
        ),
        mergeMap(({ result, draw }) => {
          const s = new Set(draw.kjhm);
          const idx = result.findIndex(ar => !!ar.find(hm => s.has(hm[0]) && s.has(hm[1]) && s.has(hm[2]) && s.has(hm[3]) && s.has(hm[4])));
          return of(idx);
        }, ({ sizes }, winIndex) => ({ sizes, winIndex })),
        tap(({ sizes, winIndex }) => {
          const output = sizes.map((n, i) => n.toString().padStart(3, ' ')).join(',');
          console.log(winIndex.toString().padStart(2, ' '), ': ', output);
        }),
        groupBy((buffer: any) => 1),
        mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
    );
  }

  cal(obsDraws: Observable<Draw[]>, issueCount: number, bufferSize: number) {
    const clonePVS = this.ps.pvs.filter(({ pg, p, v }) => p.valNumMap[v].length > 85 && p.valNumMap[v].length < 250).map<Arg>(({ pg, p, v }) => {
      const num = p.valNumMap[v].length,
        delta = [(Dict.C5.length * this.odds) - num, -num + num * this.rebate];
      return { pg, p, v, delta };
    });
    const nextDraw = { issue: -1, kjhm: ['?', '?', '?', '?', '?'] };
    return obsDraws.pipe(
      tap((draws: Draw[]) => {
        clonePVS.forEach(pv => {
          const { p, v, delta } = pv;
          let balance = 0;
          pv.vs = draws.slice(0, issueCount).map(d => {
            const issue = this.issueToDate(d.issue), value = p.getVal(d.kjhm), money = balance = Number((balance + delta[+(value !== v)]).toFixed(2));
            return { issue, value, money };
          });
          pv.ks = _.chunk(pv.vs, bufferSize).map(buffer => {
            const issue = buffer[0].issue, arPrice = buffer.map(a => a.money);
            return [issue, arPrice[0], Math.max(...arPrice), Math.min(...arPrice), arPrice[arPrice.length - 1]];
          });
        });
      }),
      switchMap((draws: Draw[]) => from(draws.length > issueCount ? draws.slice(issueCount - draws.length) : [nextDraw]), (draws, draw) => {
        return { pvs: clonePVS, draws, draw };
      }),
      map(({ pvs, draws, draw }, i) => {
        // debugger;

        pvs.forEach(pv => {
          const loss = this.calLoss(pv.vs, pv.v);
          // pv.weight = this.weight(pv.ks, loss);
          pv.weight = this.weight1(pv.ks, loss);
          if (draw.issue !== -1) {
            const { p, v, delta } = pv;
            const issue = this.issueToDate(draw.issue), value = pv.p.getVal(draw.kjhm), money = pv.vs[pv.vs.length - 1].money + delta[+(value !== v)];
            pv.vs[pv.vs.length - issueCount] = void (0);
            pv.vs.push({ issue, value, money });
            const len = pv.vs.length;
            if (bufferSize === 1 || len % bufferSize === 1) {
              pv.ks.push([issue, money, money, money, money]);
              pv.ks.shift();
            } else {
              const lastKData = pv.ks[pv.ks.length - 1];
              lastKData[2] = Math.max(lastKData[2], money);
              lastKData[3] = Math.min(lastKData[3], money);
              lastKData[4] = money;
            }
          }
        });
        pvs = pvs.sort((a, b) => a.weight < b.weight ? 1 : -1);
        pvs = pvs.slice(0, 22);
        const futureDraws = draws.slice(i + issueCount);
        pvs.forEach(pv => {
          pv.distance = futureDraws.findIndex(o => pv.p.getVal(o.kjhm) === pv.v);
        });
        // pvs = pvs.slice(-22);
        // pvs = pvs.slice(0, 22).concat(pvs.slice(-22));
        // .slice(-22);
        return { pvs, draws, draw, i };
      }),
      // tap((...args) => console.log(4444, ...args)),
    );
  }

  weight(ks: number[][], loss?: number) {
    const [xData, yData] = [ks.map(k => k[0]), ks.map(k => k.slice(1))];
    const emaFast = this.emaGetValue({ xData, yData }, { period: 5 }).yData.reverse();
    const emaSlow = this.emaGetValue({ xData, yData }, { period: 9 }).yData.reverse();
    const f0 = emaFast[0], f1 = emaFast[1], f2 = emaFast[2];
    const s0 = emaSlow[0], s1 = emaSlow[1], s2 = emaSlow[2];
    return f0 >= s0 ?
      emaFast.findIndex((n, i) => n < emaSlow[i]) * ((f0 - s0) > (f1 - s1) && (f1 - s1) > (f2 - s2) ? 1 : 0.5)
      :
      -emaFast.findIndex((n, i) => n >= emaSlow[i]);
  }

  weight1(ks: number[][], loss?: number) {
    const [xData, yData] = [ks.map(k => k[0]), ks.map(k => k.slice(1))];
    const emaFast = this.emaGetValue({ xData, yData }, { period: 3 }).yData.reverse();
    const emaSlow = this.emaGetValue({ xData, yData }, { period: 7 }).yData.reverse();

    let numUp = 0, numDown = 0, i = 0, up, down;
    while (emaFast[i] > emaSlow[i]) {
      i++;
    }
    if (i > 0) {
      up = i;
      numUp = emaFast[0] - emaFast[i];
      while (emaFast[i] < emaSlow[i]) {
        i++;
      }
      down = i - up;
      numDown = emaFast[i] - emaFast[0] + numUp;
      const per = numUp / numDown, point = 0.2, k = emaFast[0] - emaFast[1],
        last1K = yData[yData.length - 1], isLast1KRed = last1K[3] > last1K[0],
        last2K = yData[yData.length - 2], isLast2KRed = last2K[3] > last2K[0];
      return isLast1KRed && isLast2KRed ? (numDown) * (per <= point ? per / point : point / per) : 0; // / Math.pow(loss, loss)
      // return (numDown + (numDown * 0.05) * loss) * (per <= point ? per / point : point / per);
    } else {
      return 0;
    }
  }

  calLoss(vs: { issue: number; value: string; }[], v: string) {
    let i = vs.length - 1;
    while (i > 0 && vs[i].value !== v) {
      i--;
    }
    return vs.length - 1 - i;
  }

  issueToDate(issue): number {
    return this.issueCache[issue] || (this.issueCache[issue] = this._issueToDate(issue));
  }

  _issueToDate(issue): number {
    issue = '20' + issue;
    const date = Date.parse(issue.slice(0, -2).replace(this.rDate, '$1/$2/$3')), issueNo = parseInt(issue.slice(-2), 10);
    return date + 9 * 3600 * 1000 + 10 * 60 * 1000 * issueNo;
  }

}
