import { Injector } from '@angular/core';
import { Kjhm } from './interface';
import { Dict } from '../providers/dict.service';

export class Param {
  values: string[];
  valNumMap: { [key: string]: Kjhm[] } = {};
  // dict: DictService;

  name: string;
  getVal: (kjhm: Kjhm) => number | string;

  constructor(options) {

    // const injector = Injector.create({ providers: [{ provide: DictService, deps: [] }] });
    // this.dict = injector.get(DictService);
    // debugger;
    // const injector = ReflectiveInjector.resolveAndCreate([DictService]);
    // this.dict = injector.get(DictService);

    if (typeof options === 'function') {
      options = {
        getVal: options
      };
    }
    options = options || {};
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
