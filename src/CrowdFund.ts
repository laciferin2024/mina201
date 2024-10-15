import { Field, SmartContract, state, State, method, Poseidon } from 'o1js';

export class CrowdFund extends SmartContract {
  @state(Field) goal = State<Field>();

  async init() {
    this.goal.set(Field(100))
  }

  @method async initState(goal:Field) {
    this.goal.set(goal)
  }
}
