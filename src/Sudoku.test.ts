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
import { SudokuZkApp, Sudoku } from './Sudoku';
import { cloneSudoku, generateSudoku, solveSudoku } from './Sudoku-lib';

type ZkApp = SudokuZkApp;

const salt = Field.random();
let number = 16;

const sudoku = generateSudoku(0.5);
const solution = solveSudoku(sudoku);
if (solution == undefined) throw Error('Devcon1: shouldnt happen');

describe('SudokuZkApp', () => {
  let deployerAccount: Mina.TestPublicKey,
    deployerKey: PrivateKey,
    senderAccount: Mina.TestPublicKey,
    senderKey: PrivateKey,
    zkAppAddress: PublicKey,
    zkAppPrivateKey: PrivateKey,
    zkApp: ZkApp;

  beforeAll(async () => {
    if (PROOFS_ENABLED) await SudokuZkApp.compile();

    const Local = await Mina.LocalBlockchain({
      proofsEnabled: PROOFS_ENABLED,
    });
    Mina.setActiveInstance(Local);
    [deployerAccount, senderAccount] = Local.testAccounts;
    deployerKey = deployerAccount.key;
    senderKey = senderAccount.key;

    zkAppPrivateKey = PrivateKey.random();
    zkAppAddress = zkAppPrivateKey.toPublicKey();
    zkApp = new SudokuZkApp(zkAppAddress);

    await localDeploy();
  });

  beforeEach(async () => {
    // await localDeploy();
  });

  async function localDeploy() {
    const txn = await Mina.transaction(deployerAccount, async () => {
      AccountUpdate.fundNewAccount(deployerAccount);
      await zkApp.deploy();
      await zkApp.update(Sudoku.from(sudoku)); //init sudoku puzzle
    });
    await txn.prove();
    // this tx needs .sign(), because `deploy()` adds an account update that requires signature authorization
    await txn.sign([deployerKey, zkAppPrivateKey]).send();
  }

  it('init/update', async () => {
    // await localDeploy();

    const txn = await Mina.transaction(senderAccount, async () => {
      await zkApp.update(Sudoku.from(sudoku));
    });
    await txn.prove();
    await txn.sign([senderKey]).send();

    console.log(txn.toPretty());
  });

  const checkStatus = async (tag = 'status:') => {
    const status = await zkApp.isSolved.get();
    console.log(tag, 'is Solved=', status.toString());
  };

  it('submit wrong solution', async () => {
    const wrongSolution = await cloneSudoku(solution);
    wrongSolution[0][0] = (wrongSolution[0][0] % 9) + 1;

    try {
      const txn = await Mina.transaction(senderAccount, async () => {
        await zkApp.submitSolution(
          Sudoku.from(sudoku),
          Sudoku.from(wrongSolution)
        );
      });
      await txn.prove();
      await txn.sign([senderKey]).send();
    } catch {
      console.log('failed');
    }

    await checkStatus();

    assert(!(await zkApp.isSolved.get().toBoolean()), 'failed as expected');
  });
});
