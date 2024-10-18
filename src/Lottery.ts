import { Field, SmartContract, state, State, method, Poseidon } from 'o1js';

export class Lottery extends SmartContract {
  events = {
    'Lottery Status': Field,
    'Amount Transferred': Field,
  };

  @state(Field) x = State<Field>();
  @state(Field) status = State<Field>();

  @method async initState(salt: Field, secret: Field) {
    this.x.set(Poseidon.hash([salt, secret]));
    this.status.set(Field(0));
  }

  @method async tryLottery(salt: Field, secret: Field) {
    this.status.requireEquals(Field(0));

    const x = this.x.get();
    this.x.requireEquals(x);
    Poseidon.hash([salt, secret]).assertEquals(x);

    this.account.balance.requireEquals(this.account.balance.get());

    this.send({
      to: this.sender.getUnconstrained(),
      amount: this.account.balance.get(),
    });

    this.emitEvent('Amount Transferred', Field(1));

    this.status.set(Field(1));

    this.emitEvent('Lottery Status', this.status.get());
  }
}
