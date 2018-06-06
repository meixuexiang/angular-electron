import { Component, OnInit } from '@angular/core';

import { of } from 'rxjs';
import { catchError, map, tap, share, switchMap, reduce, scan, bufferCount, publishReplay, refCount } from 'rxjs/operators';

import * as Highcharts from 'highcharts/highstock';
// import * as HC_map from 'highcharts/modules/map';
// import * as HC_exporting from 'highcharts/modules/exporting';
// import * as HC_ce from 'highcharts-custom-events';
import * as HC_SMA from 'highcharts/indicators/indicators';
import * as HC_BB from 'highcharts/indicators/bollinger-bands';
import * as HC_MACD from 'highcharts/indicators/macd';
import * as HC_theme from 'highcharts/themes/gray';
// accumulation-distribution atr bollinger-bands cci cmf ema ichimoku-kinko-hyo indicators macd mfi momentum
// pivot-points price-envelopes psar roc rsi stochastic volume-by-price vwap wma zigzag

// avocado gray skies dark-unica sand-signika dark-green grid dark-blue grid-light sunset

import { ParamService } from '../../providers/param.service';
import { ApiService } from '../../providers/api.service';
import { Draw } from '../../classes/interface';
import { Observable } from 'rxjs';
import { ParamGroup } from '../../classes/param-group';
import { Param } from '../../classes/param';
import { Dict } from '../../providers/dict.service';

// HC_map(Highcharts);
// require('./worldmap')(Highcharts);

// HC_exporting(Highcharts);
// HC_ce(Highcharts);
HC_SMA(Highcharts);
HC_BB(Highcharts);
HC_MACD(Highcharts);
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
  bufferSize = 11;

  obsDraws: Observable<Draw[]>;
  currPg: ParamGroup;
  currParam: Param;
  currValue: string;

  allN1Options: Observable<any>[];


  constructor(
    public ps: ParamService,
    private api: ApiService
  ) {
    console.log(this.ps);
  }
  hcCallback() {

  }

  ngOnInit() {
    this.obsDraws = this.api.loadGD().pipe(publishReplay(1), refCount());
    this.showChart(this.ps.paramGroups[0], this.ps.paramGroups[0].params[0], this.ps.paramGroups[0].params[0].values[0]);
    // this.allN1Options = this.ps.paramGroups[0].params.map(p => this.getOption(this.ps.paramGroups[0], p, '1'));
  }

  getOption(pg: ParamGroup, p: Param, v: string) {
    let acc = 0;
    const num = p.valNumMap[v].length,
      pos = Dict.CCS.length - num,
      neg = -num;
    const uuid = `${pg.name}-${p.name}-${v}`;

    return this.obsDraws.pipe(
      map(draws => {
        const ar = draws.map(draw => {
          const curr = p.getVal(draw.kjhm).toString();
          return acc += (curr === v ? pos : neg);
        });
        return new Array(Math.ceil(ar.length / this.bufferSize)).fill(0)
          .map((_, i) => ar.slice(i * this.bufferSize, (i + 1) * this.bufferSize))
          .map((buffer, i) => {
            console.log(buffer);

            return {
              open: buffer[0],
              high: Math.max(...buffer),
              low: Math.min(...buffer),
              close: buffer[buffer.length - 1],
              // dataLabels: draws[i * this.bufferSize].issue
            };
          });
      }),
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
          type: 'sma',
          linkedTo: uuid,
          zIndex: 1,
          params: {
            period: 5
          },
          marker: {
            enabled: false
          }
        }, {
          type: 'sma',
          linkedTo: uuid,
          zIndex: 1,
          params: {
            period: 10
          },
          marker: {
            enabled: false
          }
        }, {
          type: 'sma',
          linkedTo: uuid,
          zIndex: 1,
          params: {
            period: 20
          },
          marker: {
            enabled: false
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

  showChart(pg: ParamGroup, p: Param, v: string) {
    this.currPg = pg;
    this.currParam = p;
    this.currValue = v;

    this.getOption(pg, p, v).subscribe(options => this.options = options);
  }
}

