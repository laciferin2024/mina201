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

type ZkApp = PrivateInput;

const salt = Field.random();
let number = 16;

describe('PrivateInput', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ZkApp;

  beforeAll(async () => {
    if (PROOFS_ENABLED) await PrivateInput.compile();

    const Local = await Mina.LocalBlockchain({
      proofsEnabled: PROOFS_ENABLED,
    });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new PrivateInput(zkAppAddress);

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
  });

  it('incrementSecret', async () => {
    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.incrementSecret(salt, Field(number));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    // const secretHash = zkApp.x.get();
    // console.log({ secretHash: secretHash.toString() });
  });
});
