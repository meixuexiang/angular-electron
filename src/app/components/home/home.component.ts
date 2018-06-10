import { Component, OnInit } from '@angular/core';

import { map, publishReplay, refCount, groupBy, flatMap, reduce, tap, switchMap } from 'rxjs/operators';

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
import { Dict } from '../../providers/dict.service';

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

console.log(Highcharts);
const emaGetValue = Highcharts.seriesTypes.ema.prototype.getValues;

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


  constructor(
    public ps: ParamService,
    private api: ApiService
  ) {
    console.log(this.ps);
  }

  ngOnInit() {
    this.obsDraws = this.api.loadGD().pipe(publishReplay(1), refCount());
    // this.showChart(this.ps.paramGroups[0], this.ps.paramGroups[0].params[0], this.ps.paramGroups[0].params[0].values[0]);
    // this.allN1Options = this.ps.paramGroups[0].params.map(p => this.getOption(this.ps.paramGroups[0], p, '1'));
    this.pvs = this.ps.cal(this.obsDraws, this.issueCount, this.bufferSize)
      .pipe(
        // groupBy(buffer => 1),
        // flatMap(group$ => group$.pipe(reduce((acc, cur) => [...acc, cur], []))),
        map((pvs: { pg: ParamGroup, p: Param, v: string, ks: number[][], ema: any, weight: number }[]) => pvs.sort((a, b) => a.weight < b.weight ? 1 : -1)),
        tap(pvs => console.log('pvs', pvs)),
      // switchMap(pvs => from(pvs)),
      // tap(pv => console.log('pv', pv)),
    );
    // console.log('obs: ', this.pvs);
    // this.pvs.subscribe(res => console.log('res', res));


    // const arObsOHLC = this.ps.cal(this.obsDraws, this.issueCount, this.bufferSize);
    // console.log(arObsOHLC);
    // arObsOHLC[0].subscribe(res => console.log(res));
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
          name: 'EMA (7)',
          linkedTo: uuid,
          params: {
            period: 5
          }
        },
        {
          type: 'ema',
          name: 'EMA (14)',
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
    console.log(ks);

    this.getOption({ pg, p, v, ks }).subscribe(options => console.log(this.options = options)
    );
  }

  hcCallback(chart) {

  }
}

