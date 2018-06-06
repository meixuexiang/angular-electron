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


export const Dict = {
  _CCS: null,
  digits: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11'],
  get CCS(): Kjhm[] {
    return this._CCS || (this._CCS = Combinatorics.combination(this.digits, 5));
  }
};
