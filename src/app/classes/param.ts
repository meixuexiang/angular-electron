import { Injector } from '@angular/core';
import { Kjhm } from './interface';
import { Dict } from '../providers/dict.service';

export class Param {
  values: string[];
  valNumMap: { [key: string]: Kjhm[] } = {};

  name: string;
  getVal: (kjhm: Kjhm) => number | string;

  constructor(options) {
    options = options || {};
    if (!options.getVal) {
      throw new Error('Missing the method :  "getVal"');
    }
    if (!options.name) {
      throw new Error('Missing the property :  "name"');
    }
    this.getVal = options.getVal;
    this.name = options.name;
    this.init();
  }

  init() {
    Dict.C5.forEach((kjhm: Kjhm) => {
      const v = this.getVal(kjhm).toString();
      if (!this.valNumMap[v]) {
        this.valNumMap[v] = [];
      }
      this.valNumMap[v].push(kjhm);
    });
    this.values = Object.keys(this.valNumMap).sort((a, b) => Number(a) - Number(b));
  }

}
