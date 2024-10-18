import {
  AccountUpdate,
  assert,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
  UInt32,
} from 'o1js';
import { PROOFS_ENABLED } from './config';
import { Lottery } from './Lottery';

type ZkApp = Lottery;

const salt = Field.random();
let number = 16;

describe('Lottery', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ZkApp;

  beforeAll(async () => {
    if (PROOFS_ENABLED) await Lottery.compile();

    const Local = await Mina.LocalBlockchain({
      proofsEnabled: PROOFS_ENABLED,
    });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new Lottery(zkAppAddress);

    await localDeploy();
  });

  beforeEach(async () => {
    // await localDeploy();
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('init', async () => {
    // await localDeploy();

    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.initState(salt, Field(number));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    const secretHash = zkApp.x.get();
    console.log({ secretHash: secretHash.toString() });

    console.log(txn.toPretty());
  });

  const printBal = async (tag = 'bal:') => {
    const bal = zkApp.account.balance.get();
    console.log(tag, bal.toString());
  };

  it('fund zkApp', async () => {
    const txn = await Mina.transaction(senderAccount, async () => {
      let senderUpdate = AccountUpdate.create(senderAccount);
      senderUpdate.requireSignature();
      senderUpdate.send({ to: zkAppAddress, amount: 100 });
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    await printBal();
  });

  it('tryLottery:success', async () => {
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.tryLottery(salt, Field(number));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    await printBal('after try lottery success');

    const events = await zkApp.fetchEvents(UInt32.from(0));

    console.log(events);

    console.log('event 1:', events[0].type, events[0].event.data);
    console.log('event 2:', events[1].type, events[1].event.data);
  });
});
