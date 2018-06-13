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
import { Draw } from '../../classes/interface';
import { Observable, of, from } from 'rxjs';
import { ParamGroup } from '../../classes/param-group';
import { Param } from '../../classes/param';
import { Tolerant } from '../../classes/tolerant';

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

  obsDraws: Observable<Draw[]>;
  currPg: ParamGroup;
  currParam: Param;
  currValue: string;

  allN1Options: Observable<any>[];

  pvs: any;
  testResult: any;

  str = '';

  constructor(
    public ps: ParamService,
    private api: ApiService
  ) {
    // console.log(this.ps);
  }

  ngOnInit() {
    this.obsDraws = this.api.loadGD().pipe(
      // map((draws: Draw[]) => draws.slice(0, -3000 * 14)),
      publishReplay(1),
      refCount()
    );
    // this.pvs =
    // this.ps.cal(this.obsDraws.pipe(map((draws: Draw[]) => draws.slice(-this.issueCount - 3))), this.issueCount, this.bufferSize)
    //   .subscribe();

    // this.showChart(this.ps.paramGroups[0], this.ps.paramGroups[0].params[0], this.ps.paramGroups[0].params[0].values[0]);
    // this.allN1Options = this.ps.paramGroups[0].params.map(p => this.getOption(this.ps.paramGroups[0], p, '1'));
    // console.log('obs: ', this.pvs);
    // this.pvs.subscribe(res => console.log('res', res));
    // const arObsOHLC = this.ps.cal(this.obsDraws, this.issueCount, this.bufferSize);
    // console.log(arObsOHLC);
    // arObsOHLC[0].subscribe(res => console.log(res));

  }

  startStatistic() {
    console['time']('start');
    this.testResult = this.start()
      .pipe(
        tap(({ pvs, result, sizes, winIndex }) => {
          const output = sizes.map((n, i) => n.toString().padStart(3, ' ')).join(',');
          console.log(winIndex.toString().padStart(2, ' '), ': ', output);
        }),
        groupBy((buffer: any) => 1),
        mergeMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
    )
      .subscribe((results) => {
        console.log(results);
        this.str = results.map(r => r.winIndex).join(',');
      }, (err) => { console.error(err); }, () => console['timeEnd']('start'));
  }

  start() {
    // const testIssue = 3;
    const testIssue = 10;
    // const testIssue = 3000;
    const obs = this.obsDraws.pipe(map((draws: Draw[]) => draws.slice(-(this.issueCount + testIssue))));
    return this.ps.cal(obs, this.issueCount, this.bufferSize).pipe(
      mergeMap(({ pvs }) => {
        const t = new Tolerant();
        pvs.forEach(({ p, v }) => t.add(p.valNumMap[v]));
        const result = t.genResult(), sizes = result.map(ar => ar.length);
        return of({ result, sizes });
      }
        , (param, { result, sizes }) => ({ ...param, result, sizes })
      ),
      mergeMap(({ result, draw }) => {
        const s = new Set(draw.kjhm);
        const idx = result.findIndex(ar => !!ar.find(hm => s.has(hm[0]) && s.has(hm[1]) && s.has(hm[2]) && s.has(hm[3]) && s.has(hm[4])));
        return of(idx);
      }, (param, winIndex) => ({ ...param, winIndex })),
    );

    // // const testIssue = 300;
    // const testIssue = 3000;
    // // const testIssue = 2;
    // let startIndex = 0;
    // let index = 0, arDraws;
    // return this.obsDraws.pipe(
    //   switchMap((draws: Draw[]) => {
    //     startIndex = Math.max(0, draws.length - testIssue - 1);
    //     // console.log('draws draws.length startIndex', draws, draws.length, startIndex);
    //     return from(arDraws = draws);
    //   }),
    //   tap(draw => index += 1),
    //   filter(() => index >= startIndex && index < arDraws.length - 1),
    //   mergeMap(() => this.ps.cal(of(arDraws.slice(index - this.issueCount, index)), this.issueCount, this.bufferSize)),
    //   map((pvs: { [propName: string]: any; }[]) => {
    //     const follow10 = arDraws.slice(index, index + 11);
    //     return pvs.map(({ pg, p, v, vs, ks, ema, weight }) => {
    //       const profit = follow10.map((draw: Draw) => p.getVal(draw.kjhm) === v ? 1 : 0);
    //       return {
    //         pg, p, v, vs, ks, ema, weight,
    //         profit,
    //         name: [pg.name, p.name, v].join('-'),
    //         num: p.valNumMap[v].length,
    //         theory: p.valNumMap[v].length / 462,
    //         actual: profit.filter(n => n === 1).length / profit.length
    //       };
    //     });
    //   }),
    //   tap((pvs: { [propName: string]: any; }[]) => {
    //     const result = pvs.map(({ name, num, theory, actual, profit }, i) => `${name.padStart(i < 10 ? 17 : 16, ' ')}, ${(num).toString().padStart(3, ' ')}注, 理论: ${theory.toFixed(2)}, 实际: ${actual.toFixed(2)}, ${profit}`);
    //     // console.log(result);
    //   }),
    //   tap((pvs: { [propName: string]: any; }[]) => {
    //     const gt = pvs.filter(({ theory, actual }) => actual > theory).length,
    //       eq = pvs.filter(({ theory, actual }) => actual === theory).length,
    //       lt = pvs.filter(({ theory, actual }) => actual < theory).length;
    //     // console.log(({ gt, eq, lt }));
    //   }),
    //   mergeMap((pvs: { [propName: string]: any; }[]) => {
    //     const t = new Tolerant();
    //     pvs.forEach(({ p, v }) => {
    //       t.add(p.valNumMap[v]);
    //     });
    //     const result = t.genResult(), sizes = result.map(ar => ar.length);
    //     return of({ result, sizes });
    //   }
    //     // , (pvs, { result, sizes }) => ({ pvs, result, sizes })
    //   ),
    //   mergeMap(({ result }) => {
    //     const s = new Set(arDraws[index].kjhm);
    //     const idx = result.findIndex(ar => !!ar.find(hm => s.has(hm[0]) && s.has(hm[1]) && s.has(hm[2]) && s.has(hm[3]) && s.has(hm[4])));
    //     return of(idx);
    //   }, (param, winIndex) => ({ ...param, winIndex })),
    // );
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

  showChart({ pg, p, v, ks }) {
    this.currPg = pg;
    this.currParam = p;
    this.currValue = v;
    // console.log(ks);

    this.getOption({ pg, p, v, ks }).subscribe(options => console.log(this.options = options)
    );
  }

  hcCallback() {

  }
}

