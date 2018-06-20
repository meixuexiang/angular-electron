import { Kjhm } from './interface';
import { Param } from './param';

export class Order {
  static _id = 0;
  id: number;
  mode: 'until' | 'times' | 'once'; // until 直到出 times 复利模式N次 once 单独订单行为
  price: number;
  multiple: number;
  numbers: Kjhm[];
  isWin = false;
  plan: any[]; // 0期数,1订单数,2单价,3倍数,4本期投入,5累计投入,6本期收益 ,7累计收益 ,8收益率%
  planStep = 0;
  profit = -1;
  p: Param;
  v: string;

  static uuid() {
    return Order._id++;
  }

  constructor({ mode, numbers, plan, p, v }) {
    this.id = Order.uuid();
    this.mode = mode;
    this.numbers = numbers;
    this.plan = plan;
    this.p = p;
    this.v = v;
  }

  onOpen(m: Kjhm) {
    m = m.sort(numberASCSortOperator);
    this.isWin = !!this.numbers.find(n => m[0] === n[0] && m[1] === n[1] && m[2] === n[2] && m[3] === n[3] && m[4] === n[4]);
    return this.profit = this.isWin ? this.plan[this.planStep][6] : 0;
  }

  getCost() {
    return this.plan[this.planStep][4];
  }

  next() {
    if (this.planStep < this.plan.length - 1) {
      const order = new Order({
        mode: this.mode,
        numbers: this.numbers,
        plan: this.plan,
        p: this.p,
        v: this.v,
      });
      order.planStep = this.planStep + 1;
      return order;
    }
  }

  toString() {
    return `${this.id}_${this.planStep}_${this.numbers.length}_${this.getCost()}`;
  }

}


function numberASCSortOperator(a, b) {
  return a - b;
}
