import { Injectable } from '@angular/core';
import { Draw } from '../classes/interface';
import { ParamService } from './param.service';

@Injectable({
  providedIn: 'root'
})

export class PlayerService {
  balance = 100000;
  price = 1;

  constructor(
    private ps: ParamService
  ) { }

  settle(draw: Draw) {

  }
  produce(draws: Draw[], nextIssue: number) {

  }
  report() {

  }
  error(err: Error) {

  }
}
