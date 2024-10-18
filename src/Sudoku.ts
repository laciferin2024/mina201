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
  ) {
    let sudoku = sudokuInstance.value;
    let solution = solutionInstance.value;

    let range9 = Array.from({ length: 9 }, (_, i) => i);
    let oneTo9 = range9.map((i) => Field.from(i + 1));

    function assertHas1To9(array: Field[]) {
      oneTo9
        .map((k) => range9.map((i) => array[i].equals(k)).reduce(Bool.or))
        .reduce(Bool.and)
        .assertTrue('array contains the number 1...9');
    }

    //check all rows

    for (let i = 0; i < 9; i++) {
      let row = solution[i];
      assertHas1To9(row);
    }

    //check all clns

    for (let j = 0; j < 9; j++) {
      let cln = solution.map((row) => row[j]);
      assertHas1To9(cln);
    }

    //check 3x3 squares

    for (let k = 0; k < 9; k++) {
      let [i0, j0] = divmod(k, 3);
      let square = range9.map((m) => {
        let [i1, j1] = divmod(m, 3);
        return solution[3 * i0 + i1][3 * j0 + j1];
      });

      assertHas1To9(square);
    }
  }
}
