import { Field, SmartContract, state, State, method, assert } from 'o1js';

export class Square extends SmartContract {
  @state(Field) num = State<Field>();

  init() {
    super.init();
    this.num.set(Field(3));
  }

  @method async update(square: Field) {
    const curNum = this.num.getAndRequireEquals();
    square.assertEquals(curNum.mul(curNum));
    this.num.set(square);
  }
}
