import { Injectable } from '@angular/core';
import { Draw, Arg } from '../classes/interface';
import { ParamService } from './param.service';
import { Observable, from, of, throwError } from 'rxjs';
import { map, switchMap, groupBy, mergeMap, reduce, tap, skip, take, concatMap } from 'rxjs/operators';
import * as Highcharts from 'highcharts/highstock.src';
import * as _ from 'lodash';
import { Dict } from './dict.service';
import { ElectronService } from './electron.service';
import { Tolerant } from '../classes/tolerant';
import { Order } from '../classes/order';

@Injectable({
  providedIn: 'root'
})
export class PlayerService {
  cpus: Object[];
  rDate = /^(\d{4})(\d{2})(\d{2})$/;
  issueCache = {};
  emaGetValue: (series: Object, params: Object) => { values: number[][]; xData: number[]; yData: number[]; } = Highcharts.seriesTypes.ema.prototype.getValues;

  issueCount = 880;
  bufferSize = 11;

  odds = 0.90;
  rebate = 0.025;
  price = 0.1;

  balance: number;
  orderMap: { [label: string]: Order[] };

  constructor(
    private ps: ParamService,
    private es: ElectronService
  ) {
    if (this.es.isElectron()) {
      const os = window.require('os');
      this.cpus = os.cpus();
    }
  }

  reset() {
    this.balance = 100000;
    this.orderMap = {};
  }
  settle(draw: Draw) {
    const orders = this.orderMap[draw.issue];
    if (!orders || !orders.length) {
      return;
    }
    orders.forEach(order => {
      this.balance += order.onOpen(draw.kjhm);
    });
    console.log(draw.issue, ...orders.map(o => o.toString()), Math.round(this.balance));
  }
  produce({ draws, draw, nextIssue }) {
    const orders = [];
    const prevOrders = this.orderMap[draw.issue];
    if (prevOrders && prevOrders.length) {
      prevOrders.forEach(order => {
        if (order.isWin) {
          return;
        }
        if (order.mode === 'until') {
          order = order.next();
          if (order) {
            if (this.balance >= order.getCost()) {
              this.balance -= order.getCost();
              orders.push(order);
            }
          }
        }
      });
    }
    if (orders.length === 3) {
      return of(this.orderMap[nextIssue] = orders);
    }
    return this.cal(of(draws), 0)
      .pipe(
        mergeMap(({ pvs }) => {
          const newOrders = pvs
            .filter(({ p, v }) => !orders.find((o: Order) => o.p.name === p.name && o.v === v))
            .slice(0, 3 - orders.length)
            .map(({ p, v }) => {
              const mode = 'until',
                numbers = p.valNumMap[v],
                issues = 18,
                rate = 0.1,
                plan = this.makePlan(0, p.valNumMap[v].length, issues, this.price, 43.89, 200000, 1, new Array(issues).fill(rate), 0);
              // 0期数,1订单数,2单价,3倍数,4本期投入,5累计投入,6本期收益 ,7累计收益 ,8收益率%
              if (this.balance >= plan[0][4]) {
                const order = new Order({ mode, numbers, plan, p, v });
                this.balance -= order.getCost();
                // orders.push(order);
                return order;
              }
            }).filter(order => !!order);
          if (orders.length === 0 && newOrders.length === 0) {
            return throwError('余额不足！测试结束。');
          }
          return of(this.orderMap[nextIssue] = orders.concat(newOrders));
        })
      );
  }
  log({ draws, draw, orders }) {
    // if (orders.length) {
    //   console.log(...orders, this.balance);
    // }
  }
  report() {
    console.log(this.balance, this.orderMap);
  }

  getThreadsNumber() {
    return this.cpus.length > 1 ? this.cpus.length - 1 : 1;
  }

  job(methodName: string, obsDraws: Observable<Draw[]>, issueNumber: number) {
    if (this.es.isElectron() && issueNumber > this.getThreadsNumber() * 99) {
      const { BrowserWindow } = this.es.remote;
      const ipcRenderer = this.es.ipcRenderer;
      const windowID = BrowserWindow.getFocusedWindow().id;
      const invisPath = location.origin + '/';
      const BrowserWindowOptions = { width: 800, height: 600, show: !false };
      const numThread = this.getThreadsNumber();
      // const numThread = 2;

      return obsDraws.pipe(
        map((draws: Draw[]) => draws.slice(-this.issueCount - issueNumber)),
        switchMap((draws: Draw[]) => {
          const size = Math.ceil((draws.length - this.issueCount) / numThread);
          return from(new Array(numThread).fill(0).map((z, i) => draws.slice(size * i, this.issueCount + size * (i + 1))));
        }),
        mergeMap((draws: Draw[], i) => {
          return Observable.create(observer => {
            const win = new BrowserWindow(Object.assign({ x: i * 120 + 40, y: (numThread - 1 - i) * 60 + 40 }, BrowserWindowOptions));
            win.loadURL(invisPath);

            const channel = `cal-caled-${i}`;
            win.webContents.openDevTools();
            win.webContents.on('did-finish-load', () => {
              const args = [draws, issueNumber];
              win.webContents.send('cal-cal', methodName, args, channel, windowID);
            });

            ipcRenderer.on(channel, (event, output: { sizes: number[]; winIndex: number }[]) => {
              observer.next(output);
            });
            return () => ipcRenderer.removeAllListeners(channel);
          }).pipe(take(1));
        }),
      );
    } else {
      return this.cal(obsDraws, issueNumber);
    }
  }

  tolerant(obsDraws: Observable<Draw[]>, issueNumber: number) {
    return this.cal(obsDraws, issueNumber)
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

  loss(obsDraws: Observable<Draw[]>, issueNumber: number) {
    return this.cal(obsDraws, issueNumber).pipe(
      map(({ pvs }) => pvs.map(({ pg, p, v, ks, distance, weight }, col) => ({ total: p.valNumMap[v].length, distance, col }))),
      tap(results => console.log(...results)),
      groupBy((buffer: any) => 1),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
    );
  }

  cal(obsDraws: Observable<Draw[]>, issueNumber: number) {
    const clonePVS = this.ps.pvs.filter(({ pg, p, v }) => p.valNumMap[v].length > 99 && p.valNumMap[v].length < 200).map<Arg>(({ pg, p, v }) => {
      const num = p.valNumMap[v].length,
        delta = [(Dict.C5.length/* * this.odds*/) - num, -num /* + num * this.rebate*/];
      return { pg, p, v, delta };
    });
    const nextDraw = { issue: -1, kjhm: ['?', '?', '?', '?', '?'] };
    return obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-(this.issueCount + issueNumber))),
      tap((draws: Draw[]) => {
        clonePVS.forEach(pv => {
          const { p, v, delta } = pv;
          let balance = 0;
          pv.vs = draws.slice(0, this.issueCount).map(d => {
            const issue = this.issueToDate(d.issue), value = p.getVal(d.kjhm), money = balance = Number((balance + delta[+(value !== v)]).toFixed(2));
            return { issue, value, money };
          });
          pv.ks = _.chunk(pv.vs, this.bufferSize).map(buffer => {
            const issue = buffer[0].issue, arPrice = buffer.map(a => a.money);
            return [issue, arPrice[0], Math.max(...arPrice), Math.min(...arPrice), arPrice[arPrice.length - 1]];
          });
        });
      }),
      switchMap((draws: Draw[]) => from(draws.length > this.issueCount ? draws.slice(this.issueCount - draws.length) : [nextDraw]), (draws, draw) => {
        return { pvs: clonePVS, draws, draw };
      }),
      map(({ pvs, draws, draw }, i) => {
        // debugger;

        pvs.forEach(pv => {
          const loss = this.calLoss(pv.vs, pv.v);
          // pv.weight = this.weight(pv.ks, loss);
          // pv.weight = this.weight1(pv.ks, loss);
          pv.weight = this.weight2(pv.ks, loss);
          if (draw.issue !== -1) {
            const { p, v, delta } = pv;
            const issue = this.issueToDate(draw.issue), value = pv.p.getVal(draw.kjhm), money = pv.vs[pv.vs.length - 1].money + delta[+(value !== v)];
            pv.vs[pv.vs.length - this.issueCount] = void (0);
            pv.vs.push({ issue, value, money });
            const len = pv.vs.length;
            if (this.bufferSize === 1 || len % this.bufferSize === 1) {
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
        pvs = pvs.slice(0, 1);
        const futureDraws = draws.slice(i + this.issueCount);
        pvs.forEach(pv => {
          pv.distance = pv.p.getVal(draws[i + this.issueCount - 1].kjhm) === pv.v ? futureDraws.findIndex(o => pv.p.getVal(o.kjhm) === pv.v) : -1;
        });
        // pvs = pvs.slice(-22);
        // pvs = pvs.slice(0, 22).concat(pvs.slice(-22));
        // .slice(-22);
        return { pvs, draws, draw, i };
      }),
      // tap((...args) => console.log(4444, ...args)),
    );
  }
  // EMA 走高时间越长，权重越大
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
  // EMA 先走低幅度大，而后走高
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
        last2K = yData[yData.length - 2], isLast2KRed = last2K[3] > last2K[0],
        last3K = yData[yData.length - 3], isLast3KRed = last3K[3] > last3K[0],
        last4K = yData[yData.length - 4], isLast4KRed = last4K[3] > last4K[0];
      return isLast4KRed && isLast3KRed && !isLast2KRed && isLast1KRed ? (numDown) * (per <= point ? per / point : point / per) : 0; // / Math.pow(loss, loss)
      // return (numDown + (numDown * 0.05) * loss) * (per <= point ? per / point : point / per);
    } else {
      return 0;
    }
  }
  // EMA 持续走低，快线有抬头之势
  weight2(ks: number[][], loss?: number) {
    const [xData, yData] = [ks.map(k => k[0]), ks.map(k => k.slice(1))];
    const emaFast = this.emaGetValue({ xData, yData }, { period: 3 }).yData.reverse();
    const emaSlow = this.emaGetValue({ xData, yData }, { period: 7 }).yData.reverse();

    let numDown = 0, i = 0, down;
    while (emaFast[i] < emaSlow[i]) {
      i++;
    }
    if (i > 0) {
      down = i;
      numDown = Math.abs(emaFast[i]);
      const k = emaFast[0] - emaFast[1],
        last1K = yData[yData.length - 1], isLast1KRed = last1K[3] > last1K[0],
        last2K = yData[yData.length - 2], isLast2KRed = last2K[3] > last2K[0],
        last3K = yData[yData.length - 3], isLast3KRed = last3K[3] > last3K[0],
        last4K = yData[yData.length - 4], isLast4KRed = last4K[3] > last4K[0];
      return (numDown * down) * (-1 * last1K[3] + 462 * this.issueCount / 2);
      // * (k / 462);
      //  isLast4KRed && isLast3KRed && !isLast2KRed && isLast1KRed;
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

  /**
   * @param {Number} cost	已用成本
   * @param {Number} num	注数
   * @param {Number} issue	期数
   * @param {Number} price	单价
   * @param {Number} bonus	奖金
   * @param {Number} bonusLimit	奖金上限
   * @param {Number} incomeRate	收益率
   * @param {Number} income		总收益
   * @param {Number} rebate		返点比例
   */
  makePlan(cost: number, num: number, issue: number, price: number, bonus: number, bonusLimit: number, incomeType: number, income: any, rebate: number) {
    const mOnePrice = price * num;
    let totalPay = cost,
      totalIncome = 0,
      multiple, currIssue, currRate, currPrice, currPay, q, m1, currIncome, currIncomRate;
    if (incomeType === 1 && income[0] > (bonus - mOnePrice) / mOnePrice || incomeType === 2 && bonus <= mOnePrice || incomeType === 3 && bonus <= mOnePrice) {
      return [['不存在此种方案']];
    } else {
      if (incomeType === 3) {
        q = bonus / (bonus - mOnePrice);
        m1 = income / (((1 - Math.pow(q, issue)) / (1 - q)) * mOnePrice);
      }
      return new Array(issue).fill(0).map((z, index) => {
        currIssue = index + 1;
        if (incomeType === 1) {
          currRate = income[index];
          // 倍数  = (收益率 * 之前总投入 + 之前总投入) / (奖金 - 注数 * 单价 - 收益率 * 注数 * 单价)
          multiple = Math.ceil((currRate * totalPay + totalPay) / (bonus - mOnePrice - currRate * mOnePrice)) || 1;
        } else if (incomeType === 2) {
          // 倍数 = (累计收益 + 之前总投入) /  (奖金 - 注数 * 单价)
          multiple = Math.ceil((income + totalPay) / (bonus - mOnePrice)) || 1;
        } else if (incomeType === 3) {
          // 倍数 = 总资金 / ((Math.pow(倍率, 0) + Math.pow(倍率, 1) + Math.pow(倍率, 2) + ... + Math.pow(倍率, issue - 1)) * (奖金 - 注数 * 单价))
          multiple = Math.round(m1 * Math.pow(q, index)) || 1;
        }
        currPrice = price;
        currPay = multiple * mOnePrice * (100 - rebate) / 100;
        totalPay = totalPay + currPay;
        currIncome = multiple * bonus;
        totalIncome = currIncome - totalPay;
        currIncomRate = totalIncome * 100 / totalPay;
        // 0期数,1订单数,2单价,3倍数,4本期投入,5累计投入,6本期收益 ,7累计收益 ,8收益率%
        return [
          currIssue,
          Math.ceil(currIncome / bonusLimit),
          Math.round(currPrice * 1000) / 1000,
          multiple,
          Math.round(currPay * 1000) / 1000,
          Math.round(totalPay * 1000) / 1000,
          Math.round(currIncome * 1000) / 1000,
          Math.round(totalIncome * 1000) / 1000,
          Math.round(currIncomRate * 100) / 100 + '%'
        ];
      });
    }
  }
}

