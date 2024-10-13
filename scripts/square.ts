import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Mina,
  PrivateKey,
  PublicKey,
  AccountUpdate,
} from 'o1js';

import { Square } from '../src/Square.js';

let deployerAccount: Mina.TestPublicKey,
  deployerKey: PrivateKey,
  senderAccount: Mina.TestPublicKey,
  senderKey: PrivateKey,
  zkAppAddress: PublicKey,
  zkAppPrivateKey: PrivateKey,
  zkApp: Square;

const useProof = false;

if (useProof) await Square.compile();

const Local = await Mina.LocalBlockchain({ proofsEnabled: useProof });

Mina.setActiveInstance(Local);

[deployerAccount, senderAccount] = Local.testAccounts;
deployerKey = deployerAccount.key;
senderKey = senderAccount.key;

zkAppPrivateKey = PrivateKey.random();
zkAppAddress = zkAppPrivateKey.toPublicKey();

console.log('Init zkapp setup');

zkApp = new Square(zkAppAddress);

const txn = await Mina.transaction(deployerAccount, async () => {
  AccountUpdate.fundNewAccount(deployerAccount);
  await zkApp.deploy();
});
await txn.prove();
// this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
await txn.sign([deployerKey, zkAppPrivateKey]).send();

const tx1 = await Mina.transaction(senderAccount, async () => {
  await zkApp.update(Field(9));
});

await tx1.prove();
await tx1.sign([senderKey, zkAppPrivateKey]).send();

const num = zkApp.num.get();
console.log(`Number is ${num.toString()}`);
