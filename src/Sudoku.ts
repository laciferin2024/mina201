import {
  Field,
  SmartContract,
  state,
  State,
  method,
  Poseidon,
  Provable,
  Struct,
  Bool,
} from 'o1js';

export class Sudoku extends Struct({
  value: Provable.Array(Provable.Array(Field, 9), 9),
}) {
  static from(value: number[][]) {
    return new Sudoku({ value: value.map((row) => row.map(Field)) });
  }

  hash() {
    return Poseidon.hash(this.value.flat());
  }
}

export class SudokuZkApp extends SmartContract {
  @state(Field) sudokuHash = State<Field>();
  @state(Bool) isSolved = State<Bool>();

  @method async init() {
    super.init();
  }

  @method async update(sudokuInstance: Sudoku) {
    this.sudokuHash.set(sudokuInstance.hash());
    this.isSolved.set(Bool(false));
  }

  @method async submitSolution(
    sudokuInstance: Sudoku,
    solutionInstance: Sudoku
  ) {}
}
