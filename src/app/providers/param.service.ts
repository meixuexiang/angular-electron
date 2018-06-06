import { Injectable } from '@angular/core';
import { ParamGroup } from '../classes/param-group';
import { Kjhm } from '../classes/interface';
import { Dict } from './dict.service';

@Injectable({
  providedIn: 'root'
})
export class ParamService {
  paramGroups: ParamGroup[];

  constructor() {
    this.paramGroups = [
      new ParamGroup({
        name: 'M1',
        getValFactory: () => {
          return Dict.digits.map((d, i) => {
            const fn = (kjhm: Kjhm) => {
              return kjhm[0] === d || kjhm[1] === d || kjhm[2] === d || kjhm[3] === d || kjhm[4] === d ? 1 : 0;
            };
            fn['pname'] = d;
            return fn;
          });
        }
      }),

      new ParamGroup({
        name: 'D2',
        getValFactory: () => {
          return Dict.CCS.map((d: Kjhm, i: number) => {
            const set = new Set(d);
            const fn = (kjhm: Kjhm) => {
              return +set.has(kjhm[0]) + +set.has(kjhm[1]) + +set.has(kjhm[2]) + +set.has(kjhm[3]) + +set.has(kjhm[4]);
            };
            fn['pname'] = d.join('');
            return fn;
          });
        }
      }),

    ];
  }


}
