import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as _ from 'lodash';

@Component({
  selector: 'app-value-analysis',
  templateUrl: './value-analysis.component.html',
  styleUrls: ['./value-analysis.component.scss']
})
export class ValueAnalysisComponent implements OnInit, OnChanges {
  @Input() values: string;
  // str = '3,3,1,2,2,1,3,4,3,1,2,3,0,0,3,0,12,5,0,2,1,3,10,1,8,3,4,4,5,3,2,5,8,2,4,7,5,2,2,3,1,9,2,6,4,6,1,8,6,4,6,1,1,4,5,2,2,3,3,2,5,2,10,2,3,6,4,5,7,0,6,3,6,4,6,8,2,3,6,2,3,2,2,5,8,1,3,5,9,3,6,5,2,4,2,8,3,2,5,6,4,5,0,3,11,4,5,4,2,12,4,4,6,8,6,4,2,6,6,3,5,3,9,2,4,4,5,1,5,2,2,1,4,4,3,4,2,2,1,6,0,2,2,5,2,4,2,2,3,4,1,5,9,4,4,2,1,7,1,4,1,2,2,3,12,3,7,3,3,6,2,4,7,3,3,6,4,8,2,5,5,4,3,7,3,2,3,5,2,6,1,12,9,4,1,5,1,2,7,1,4,2,3,2,4,7,4,5,5,2,2,3,9,5,3,1,2,0,5,5,1,1,3,1,3,3,3,8,5,4,5,9,12,3,12,3,8,5,5,5,3,8,2,1,3,7,3,4,6,7,7,4,2,3,6,7,4,1,4,2,3,3,4,2,3,3,3,4,11,5,5,3,6,6,2,5,3,0,4,2,8,7,8,7,3,10,4,5,8,5,3,3,3,2,4,3,7,7,11,4,6,7,5,8,1,9,2,2,7,4,5,5,2,5,5,4,2,4,4,4,3,7,5,3,1,4,4,1,4,4,8,5,3,1,4,5,7,4,1,3,3,7,2,5,0,8,7,4,4,5,3,5,3,9,4,1,7,1,1,2,6,3,7,1,2,8,1,1,4,2,4,2,4,1,3,2,13,2,4,11,4,1,3,7,4,5,3,2,10,2,1,5,2,0,4,2,9,3,2,7,7,3,5,5,5,0,6,3,4,3,11,2,3,2,5,4,3,2,0,2,5,7,2,6,3,2,3,6,5,6,6,0,3,2,2,4,5,3,7,2,1,0,2,0,1,3,3,6,3,1,2,3,4,8,6,1,9,3,2,1,6,0,2,4,3,1,3,0,7,3,5,3,1,5,3,5,1,0,1,0,7,4,1,0,2,8,0,0,1,2,1,2,8,4,3,7,5,5,2,3,2,5,4,2,1,8,3,3,3,3,2,0,2,2,6,0,7,3,3,4,2,0,4,5,2,3,1,2,0,4,1,3,1,6,3,1,6,5,0,0,6,10,5,1,7,2,2,2,2,0,2,1,4,2,4,1,7,3,0,2,2,3,6,4,3,8,5,4,6,3,4,2,2,6,3,8,1,2,2,1,2,2,3,6,2,3,1,3,1,1,3,7,7,3,3,5,0,6,0,3,3,5,2,3,2,1,0,0,2,2,1,8,0,1,4,0,12,4,6,3,9,0,8,2,2,1,2,0,1,0,0,0,1,8,4,2,2,8,8,1,1,4,2,5,2,2,1,3,3,1,1,2,4,4,3,3,5,1,3,2,4,3,2,3,3,5,4,2,1,2,3,7,1,5,3,4,5,0,2,3,3,2,2,2,7,2,2,8,1,4,1,9,0,0,5,1,3,1,7,0,4,2,1,0,0,4,0,2,5,2,3,2,2,5,0,0,7,3,1,2,4,4,5,3,5,7,3,2,1,8,3,1,9,0,6,1,2,1,3,4,2,3,3,3,2,4,4,1,0,3,0,3,3,11,4,3,3,7,5,6,6,0,5,6,4,5,2,7,1,8,1,5,5,3,2,7,4,3,3,1,8,1,2,2,0,2,7,2,2,2,2,0,3,0,2,2,1,6,2,2,7,5,0,6,2,2,4,2,2,0,4,2,2,2,1,1,4,2,7,1,4,3,1,2,1,3,2,2,9,2,2,5,3,11,6,3,2,5,4,4,0,6,1,4,1,1,4,11,3,2,2,3,2,5,3,2,0,8,5,8,3,3,6,6,5,4,3,4,3,3,3,6,2,3,2,2,7,5,8,2,5,5,5,2,5,3,1,10,5,3,6,4,7,5,6,6,2,5,5,3,1,4,0,1,1,9,6,2,4,5,6,4,5,5,2,5,2,2,6,2,3,1,3,4,3,3,6,8,3,1,5,6,3,7,2,4,1,6,2,2,1,9,4,4,5,1,0,1,7,8,3,8,3,3,4,6,3,2,5,5,5,0,5,0,3,4,3,5,1,4,2,3,0,0,7,8,0,5,3,4,2,4,1,8,4,3,2,2,6,4,4,2,6,4,4,1,6,1,1,3';
  result = '';
  constructor() { }

  ngOnInit() {
    this.analyze(this.values);
  }

  analyze(str) {
    const numbers = (str.match(/\d+/g) || []).map(n => Number(n));
    if (!numbers.length) {
      return this.result = '';
    }
    const length = numbers.length;
    const count = _.countBy(numbers);
    const values = _.keys(count).map(n => Number(n)).sort(numberASCSortOperator);
    const percent = values.map(v => (count[v] * 100 / length).toFixed(1));
    const loss = values.map(v => (numbers.map(n => n === v ? 1 : 0).join('').match(/0+/g).map(s => s.length) || [0]).sort(numberDESCSortOperator));
    const gtLoss = values.map(v => (numbers.map(n => n > v ? 1 : 0).join('').match(/0+/g).map(s => s.length) || [0]).sort(numberDESCSortOperator));
    const ltLoss = values.map(v => (numbers.map(n => n < v ? 1 : 0).join('').match(/0+/g).map(s => s.length) || [0]).sort(numberDESCSortOperator));

    this.result = [
      ' values: ' + JSON.stringify(values),
      '  count: ' + JSON.stringify(count),
      'percent: ' + JSON.stringify(percent),
      ...loss.map((l, i) => `loss(= ${values[i].toString().padStart(2, ' ')}): ${JSON.stringify(l.slice(0, 15))}`),
      ...gtLoss.map((l, i) => `loss(> ${values[i].toString().padStart(2, ' ')}): ${JSON.stringify(l.slice(0, 15))}`),
      ...ltLoss.map((l, i) => `loss(< ${values[i].toString().padStart(2, ' ')}): ${JSON.stringify(l.slice(0, 15))}`),
      // '   loss: ' + JSON.stringify(loss),
    ].join('\n');
  }

  ngOnChanges(changes: SimpleChanges) {
    this.analyze(this.values);
  }

}

function numberASCSortOperator(a, b) {
  return a - b;
}

function numberDESCSortOperator(a, b) {
  return b - a;
}
