import { Component, OnInit } from '@angular/core';

import { map, publishReplay, refCount, mergeMap, groupBy, reduce } from 'rxjs/operators';

import * as Highcharts from 'highcharts/highstock.src';
import * as HC_SMA from 'highcharts/indicators/indicators.src';
import * as HC_EMA from 'highcharts/indicators/ema.src';
// import * as HC_BB from 'highcharts/indicators/bollinger-bands';
// import * as HC_MACD from 'highcharts/indicators/macd';
import * as HC_theme from 'highcharts/themes/gray';
// accumulation-distribution atr bollinger-bands cci cmf ema ichimoku-kinko-hyo indicators macd mfi momentum
// pivot-points price-envelopes psar roc rsi stochastic volume-by-price vwap wma zigzag

// avocado gray skies dark-unica sand-signika dark-green grid dark-blue grid-light sunset

import { ApiService } from '../../providers/api.service';
import { Draw, Arg, Kjhm } from '../../classes/interface';
import { Observable, of } from 'rxjs';
import { ParamGroup } from '../../classes/param-group';
import { Param } from '../../classes/param';
import { PlayerService } from '../../providers/player.service';
import { ElectronService } from '../../providers/electron.service';
import { Dict } from '../../providers/dict.service';
import * as Combinatorics from 'js-combinatorics';
import { VerificationService } from '../../providers/verification.service';
const _ = require('lodash');

HC_SMA(Highcharts);
HC_EMA(Highcharts);
// HC_BB(Highcharts);
HC_theme(Highcharts);

Highcharts.setOptions({
  title: {
    style: {
      color: 'orange'
    }
  }
});

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {

  // For all demos:
  Highcharts = Highcharts;

  // starting values
  updateDemo2 = false;
  options = null;
  offset = 100;
  toleTimes = 100;
  lossTimes = 100;
  simTimes = 100;

  obsDraws: Observable<Draw[]>;
  currPg: ParamGroup;
  currParam: Param;
  currValue: string;

  allN1Options: Observable<any>[];

  pvs: any;
  testResult: any;

  lastTenKjhm: Observable<Draw[]>;

  str = '';

  constructor(
    private es: ElectronService,
    private api: ApiService,
    private vs: VerificationService,
    public player: PlayerService
  ) {
    // console.log(this.ps);
    if (this.es.isElectron()) {
      this.enableSubThread();
    }
  }

  enableSubThread() {
    const { BrowserWindow } = this.es.remote;
    const ipcRenderer = this.es.ipcRenderer;
    ipcRenderer.on('cal-cal', (event, methodName, args, channel, fromWindowId) => {
      const [draws, issueNumber] = args;
      this.player[methodName](of(draws), issueNumber).subscribe(res => {
        const fromWindow = BrowserWindow.fromId(fromWindowId);
        fromWindow.webContents.send(channel, res);
      }, err => console.error(err), () => {
        ipcRenderer.removeAllListeners('cal-cal');
        const fromWindow = BrowserWindow.fromId(fromWindowId);
        // fromWindow.webContents.send(channel, false);
        window.close();
      });
    });
  }

  ngOnInit() {
    this.obsDraws = this.api.loadGD().pipe(
      // map((draws: Draw[]) => draws.slice(0, -56000)),
      publishReplay(1),
      refCount()
    );
  }

  simulate() {
    this.vs.start(this.obsDraws, this.simTimes).subscribe((arg) => {
      this.player.log(arg);
    }, err => {
      console.error(err);
    }, () => {
      this.player.report();
    });
  }

  updateOffset() {
    const obs = this.obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-this.player.issueCount - 11 - this.offset, -11 - this.offset))
    );
    this.lastTenKjhm = this.obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-11 - this.offset, Math.min(- this.offset + 11, -1)))
    );
    this.player.cal(obs, 0)
      .subscribe(({ pvs }) => {
        this.pvs = pvs;
        this.showChart(pvs[0]);
      });
  }

  startTolerant() {
    console['time']('startTolerant');
    const testIssue = this.player.getThreadsNumber() * this.toleTimes;
    this.testResult = this.player.job('tolerant', this.obsDraws, testIssue)
      .pipe(
        groupBy((buffer: any) => 1),
        mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], [])))
      )
      .subscribe((res) => {
        const results = [].concat(...res);
        console.log(...results);
        this.str = results.map(r => r.winIndex).join(',');
      }, (err) => { console.error(err); }, () => console['timeEnd']('startTolerant'));
  }

  countLoss() {
    console['time']('countLoss');
    const testIssue = this.player.getThreadsNumber() * this.lossTimes;
    this.player.job('loss', this.obsDraws, testIssue).pipe(
      groupBy((buffer: any) => 1),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
    )
      .subscribe((res) => {
        console.log([].concat(...[].concat(...res)));
        const results = [].concat(...[].concat(...res)).filter(o => o.distance > -1).sort((a, b) => b.distance - a.distance);
        console.log(results, _.countBy(results, _.property('distance')));
      }, (err) => { console.error(err); }, () => console['timeEnd']('countLoss'));
  }

  getOption({ pg, p, v, ks }) {
    const uuid = `${pg.name}-${p.name}-${v}`;
    return of(ks).pipe(
      map(data => ({
        // title: { text: 'N1' },
        rangeSelector: {
          enabled: false
        },
        scrollbar: {
          height: 10
        },
        navigator: {
          enabled: true,
          height: 20
        },
        plotOptions: {
          candlestick: {
            color: '#06A969',
            upColor: '#ED394D'
          }
        },
        xAxis: {
          dateTimeLabelFormats: {
            millisecond: '%H:%M:%S.%L',
            second: '%H:%M:%S',
            minute: '%H:%M',
            hour: '%H:%M',
            day: '%m-%d',
            week: '%m-%d',
            month: '%y-%m',
            year: '%Y'
          }
        },
        // yAxis: [{
        //   height: '80%',
        //   resize: {
        //     enabled: true
        //   }
        // }, {
        //   top: '80%',
        //   height: '20%'
        // }],
        series: [{
          id: uuid,
          name: uuid,
          type: 'candlestick',
          turboThreshold: 0,
          data: data
        },
        {
          type: 'ema',
          name: 'EMA (5)',
          linkedTo: uuid,
          params: {
            period: 5
          }
        },
        {
          type: 'ema',
          name: 'EMA (9)',
          linkedTo: uuid,
          params: {
            period: 9
          }
        },
          // {
          //   type: 'bb',
          //   topLine: { // 上轨线
          //     styles: {
          //       lineColor: 'yellow'
          //     }
          //   },
          //   bottomLine: {  // 下轨线
          //     styles: {
          //       lineColor: 'purple'
          //     }
          //   },
          //   color: '#006cee', // 中轨颜色
          //   // tooltip: {
          //   //   pointFormat: '<span style="color:{point.color}">\u25CF</span>' +
          //   //     '<b> {series.name}</b><br/>' +
          //   //     'UP: {point.top}<br/>' +
          //   //     'MB: {point.middle}<br/>' +
          //   //     'DN: {point.bottom}<br/>'
          //   // },
          //   name: '布林（20,2）',
          //   linkedTo: uuid,
          // },
          // {
          //   yAxis: 1,
          //   // tooltip: {
          //   //   pointFormat: '<span style="color:{point.color}">\u25CF</span> <b> {series.name}</b><br/>' +
          //   //     'MACD 线：{point.MACD}<br/>' +
          //   //     '信号线：{point.signal}<br/>' +
          //   //     '振荡指标：{point.y}<br/>'
          //   // },
          //   type: 'macd',
          //   linkedTo: uuid,
          //   params: {
          //     shortPeriod: 12,
          //     longPeriod: 26,
          //     signalPeriod: 9,
          //     period: 26
          //   }
          // }
        ]
      }))
    );
  }

  showChart({ pg, p, v, ks }: Arg) {
    this.currPg = pg;
    this.currParam = p;
    this.currValue = v;
    // console.log(ks);

    this.getOption({ pg, p, v, ks }).subscribe(
      options => console.log(this.options = options)
    );
  }

  hcCallback() {

  }

  find() {
    const obs = this.obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-40000).map(draw => draw.kjhm.sort(numberASCSortOperator).join('')))
    );
    obs.subscribe(draws => {
      const CCS = Dict.C5.map((kjhm: Kjhm) => kjhm.join(''));
      // console.log(draws);

      // console.log(Dict.C5, CCS);

      // const arVector = CCS.map(m => draws.map((n, j) => n === m ? j : 0).filter(n => n).map((n, j, arr) => n - (arr[j - 1] || 0)));

      // const arVariance = arVector.map(v => jStat.variance(v));

      // console.log(arVector, arVariance);

      const chunkDraws = _.chunk(draws, 5);
      if (chunkDraws[chunkDraws.length - 1].length < 5) {
        chunkDraws.pop();
      }

      const gDraws = Combinatorics.cartesianProduct(...chunkDraws);

      // console.log(chunkDraws, gDraws);
      let count = 0;
      let n;
      let min = 462;

      while ((n = gDraws.next()) && count < 180000) {
        const drawSet = new Set(n);
        if (drawSet.size < min) {
          min = drawSet.size;
          console.log(Array.from(drawSet));
        }
        count++;
      }
      console.log(`Done!`);

      // do {
      //   n = gDraws.next();
      //   console.log(n);

      //   const drawSet = new Set(n.values);
      //   console.log(n.values, Array.from(drawSet));
      //   count++;
      // } while (n.done === false && count < 100);

      // for (const draw of gDraws) {
      //   const drawSet = new Set(draw);
      //   console.log(draw, Array.from(drawSet));
      //   count++;
      //   if (count > 100) { break; }
      // }

      // const s = Date.now();
      // console.log(
      //   Combinatorics.cartesianProduct(..._.chunk(new Array(30).fill(0), 5)),
      //   Date.now() - s
      // );



    });

  }
}


function numberASCSortOperator(a, b) {
  return a - b;
}
