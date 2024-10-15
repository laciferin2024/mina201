import { PrivateInput } from './PrivateInput';
import {
  AccountUpdate,
  assert,
  Field,
  Mina,
  PrivateKey,
  PublicKey,
} from 'o1js';
import { PROOFS_ENABLED } from './config';
import { CrowdFund } from './CrowdFund';

type ZkApp = CrowdFund;

const salt = Field.random();
let goal = Field.random();

describe('CrowdFund', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ZkApp;

  beforeAll(async () => {
    if (PROOFS_ENABLED) await CrowdFund.compile();

    const Local = await Mina.LocalBlockchain({
      proofsEnabled: PROOFS_ENABLED,
    });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new CrowdFund(zkAppAddress);

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

  const printProgress = async () => {
    const curBal = await zkApp.account.balance;
    console.log(`${curBal}/${zkApp.goal.get().toString()}`);
  };

  it('init', async () => {
    // await localDeploy();

    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.initState(goal);
    });
    await txn.prove();
    await txn.sign([senderKey]).send();
    console.log(txn.toPretty());

    printProgress();
  });

  it('fund zkApp', async () => {
    const txn = await Mina.transaction(senderAccount, async () => {
      let senderUpdate = AccountUpdate.create(senderAccount);
      senderUpdate.requireSignature();
      senderUpdate.send({ to: zkAppAddress, amount: 100 });
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    await printProgress();
  });
});
