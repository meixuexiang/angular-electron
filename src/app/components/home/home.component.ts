import { Component, OnInit } from '@angular/core';

import { map, publishReplay, refCount, tap, switchMap, filter, mergeMap, groupBy, reduce } from 'rxjs/operators';

import * as Highcharts from 'highcharts/highstock.src';
import * as HC_SMA from 'highcharts/indicators/indicators.src';
import * as HC_EMA from 'highcharts/indicators/ema.src';
import * as HC_BB from 'highcharts/indicators/bollinger-bands';
// import * as HC_MACD from 'highcharts/indicators/macd';
import * as HC_theme from 'highcharts/themes/gray';
// accumulation-distribution atr bollinger-bands cci cmf ema ichimoku-kinko-hyo indicators macd mfi momentum
// pivot-points price-envelopes psar roc rsi stochastic volume-by-price vwap wma zigzag

// avocado gray skies dark-unica sand-signika dark-green grid dark-blue grid-light sunset

import { ParamService } from '../../providers/param.service';
import { ApiService } from '../../providers/api.service';
import { Draw, Arg } from '../../classes/interface';
import { Observable, of, from } from 'rxjs';
import { ParamGroup } from '../../classes/param-group';
import { Param } from '../../classes/param';
import { Tolerant } from '../../classes/tolerant';
import { PlayerService } from '../../providers/player.service';
import { ElectronService } from '../../providers/electron.service';

HC_SMA(Highcharts);
HC_EMA(Highcharts);
HC_BB(Highcharts);
// HC_MACD(Highcharts);
HC_theme(Highcharts);

Highcharts.setOptions({
  title: {
    style: {
      color: 'orange'
    }
  }
});

// console.log(Highcharts);

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
  issueCount = 880;
  bufferSize = 11;
  offset = 100;

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
    public ps: ParamService,
    private api: ApiService,
    private player: PlayerService
  ) {
    // console.log(this.ps);
    if (this.es.isElectron()) {
      this.enableSubThread();
    }
  }

  enableSubThread() {
    const { BrowserWindow } = this.es.remote;
    const ipcRenderer = this.es.ipcRenderer;
    ipcRenderer.on('cal-cal', (event, args, channel, fromWindowId) => {
      const [draws, issueCount, bufferSize] = args;
      this.player.tolerant(of(draws), issueCount, bufferSize).subscribe(res => {
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
      map((draws: Draw[]) => draws.slice(0, -56000)),
      publishReplay(1),
      refCount()
    );

    // this.updateOffset(this.offset);
  }

  countLoss() {
    console['time']('countLoss');
    // const testIssue = 600;
    const testIssue = 2000;
    const obs = this.obsDraws.pipe(map((draws: Draw[]) => draws.slice(-(this.issueCount + testIssue))));

    this.player.cal(obs, this.issueCount, this.bufferSize).pipe(
      map(({ pvs }) => pvs.map(({ pg, p, v, ks, distance, weight }, col) => ({ total: p.valNumMap[v].length, distance, col, v, weight, pg, p, ks: ks.slice() }))),
      tap((...args) => console.log(4444, ...args[0].filter(o => o.distance > 11))),
      groupBy((buffer: any) => 1),
      mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
    )
      .subscribe((results) => {
        const pvs = results.reduceRight((acc, rs, i, that) => {
          const pre = that[i - 1] || [];
          return acc.concat(rs.filter(r => !pre.find(o => o.p.name === r.p.name && o.v === r.v && o.distance === r.distance + 1)));
        }, [])
          .filter(o => o.distance > 11)
          .sort((a, b) => b.distance - a.distance);
        console.log(JSON.stringify(pvs.map(({ total, distance, col, v }) => ({ total, distance, col, v }))));
        this.pvs = pvs;
        this.showChart(pvs[0]);
      }, (err) => { console.error(err); }, () => console['timeEnd']('countLoss'));
  }

  updateOffset(offset) {
    const obs = this.obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-this.issueCount - 11 - offset, -11 - offset))
    );
    this.lastTenKjhm = this.obsDraws.pipe(
      map((draws: Draw[]) => draws.slice(-11 - offset, Math.min(- offset + 11, -1)))
    );
    this.player.cal(obs, this.issueCount, this.bufferSize)
      .subscribe(({ pvs }) => {
        this.pvs = pvs;
        this.showChart(pvs[0]);
      });
  }

  startTolerant() {
    console['time']('startTolerant');
    const testIssue = (this.player.cpus.length - 1) * 8000;
    const obs = this.obsDraws.pipe(map((draws: Draw[]) => draws.slice(-(this.issueCount + testIssue))));
    this.testResult = this.player.job(obs, this.issueCount, this.bufferSize)
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
}

