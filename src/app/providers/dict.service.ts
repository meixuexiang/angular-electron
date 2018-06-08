import { Injectable } from '@angular/core';
import * as Combinatorics from 'js-combinatorics';
import { Kjhm } from '../classes/interface';

// @Injectable({
//   providedIn: 'root'
// })
// export class DictService {

//   digits = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
//   _CCS: Kjhm[];

//   constructor() {
//     console.error('DictService constructor');

//   }

//   get CCS() {
//     return this._CCS || (this._CCS = Combinatorics.combination(this.digits, 5));
//   }

// }
const Digits = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'];
const ds = Date.now();

export const Dict = {
  C1: Combinatorics.combination(Digits, 1).toArray(),
  C2: Combinatorics.combination(Digits, 2).toArray(),
  C3: Combinatorics.combination(Digits, 3).toArray(),
  C4: Combinatorics.combination(Digits, 4).toArray(),
  C5: Combinatorics.combination(Digits, 5).toArray(),
  C6: Combinatorics.combination(Digits, 6).toArray(),
  C7: Combinatorics.combination(Digits, 7).toArray(),
  C8: Combinatorics.combination(Digits, 8).toArray(),
};

console.log(Date.now() - ds, Dict);
