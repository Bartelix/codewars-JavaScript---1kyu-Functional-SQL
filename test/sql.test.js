const query = require('../sql');

test('The methods are chainable and the query is executed by calling the execute() method, chaining select and from', () => {
  const numbers = [1, 2, 3];
  expect(query().select().from(numbers).execute()).toEqual([1, 2, 3]);
});

test('Clauses order does not matter, from before select', () => {
  const numbers = [1, 2, 3];
  expect(query().from(numbers).select().execute()).toEqual([1, 2, 3]);
});

test('You can make queries over object collections.', () => {
  const persons = [
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
    { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
    { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
  ];
  expect(query().select().from(persons).execute()).toEqual([
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
    { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
    { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
  ]);
});

test('You can select some fields.', () => {
  const persons = [
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
    { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
    { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
    { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
    { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
  ];
  function profession(person) {
    return person.profession;
  }
  expect(query().select(profession).from(persons).execute()).toEqual([
    'teacher',
    'teacher',
    'teacher',
    'scientific',
    'scientific',
    'scientific',
    'politician'
  ]);
});

describe('You can omit any SQL clause', () => {
  test('Omit from', () => {
    expect(query().select().execute()).toEqual([]);
  });

  test('Omit select', () => {
    const numbers = [1, 2, 3];
    expect(query().from(numbers).execute()).toEqual([1, 2, 3]);
  });

  test('Omit from and select', () => {
    expect(query().execute()).toEqual([]);
  });
});

describe('If you repeat a SQL clause (except where() or having()), an exception will be thrown', () => {
  test('duplicate select', () => {
    expect(() => query().select().select().execute()).toThrow('Duplicate SELECT');
  });

  test('duplicate select with from among', () => {
    expect(() => query().select().from([]).select().execute()).toThrow('Duplicate SELECT');
  });

  test('duplicate from', () => {
    expect(() => query().select().from([]).from([]).execute()).toThrow('Duplicate FROM');
  });

  test('duplicate where is and filter', () => {
    expect(() => query().select().from([]).where([]).where([])).not.toThrow(Error);
  });
});

describe('You can apply filters', () => {
  test('SELECT profession FROM persons WHERE profession="teacher"', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function profession(person) {
      return person.profession;
    }
    function isTeacher(person) {
      return person.profession === 'teacher';
    }
    expect(query().select(profession).from(persons).where(isTeacher).execute()).toEqual([
      'teacher',
      'teacher',
      'teacher'
    ]);
  });
  test('SELECT * FROM persons WHERE profession="teacher"', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function isTeacher(person) {
      return person.profession === 'teacher';
    }
    expect(query().select().from(persons).where(isTeacher).execute()).toEqual([
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
    ]);
  });
  test('SELECT name FROM persons WHERE profession="teacher"', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function name(person) {
      return person.name;
    }
    function isTeacher(person) {
      return person.profession === 'teacher';
    }
    expect(query().select(name).from(persons).where(isTeacher).execute()).toEqual(['Peter', 'Michael', 'Peter']);
  });
});

describe('A groupations are possible', () => {
  test('SELECT * FROM persons GROUP BY profession', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function profession(person) {
      return person.profession;
    }
    expect(query().select().from(persons).groupBy(profession).execute()).toEqual([
      [
        'teacher',
        [
          { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
          { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
          { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
        ]
      ],
      [
        'scientific',
        [
          { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
          { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
          { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' }
        ]
      ],
      ['politician', [{ name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }]]
    ]);
  });

  test('You can mix where with groupBy', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function profession(person) {
      return person.profession;
    }
    function isTeacher(person) {
      return person.profession === 'teacher';
    }
    // SELECT * FROM persons WHERE profession='teacher' GROUP BY profession
    expect(query().select().from(persons).where(isTeacher).groupBy(profession).execute()).toEqual([
      [
        'teacher',
        [
          { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
          { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
          { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
        ]
      ]
    ]);
  });

  test('You can mix select with groupBy', () => {
    const persons = [
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
      { name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' },
      { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' },
      { name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }
    ];
    function profession(person) {
      return person.profession;
    }
    function professionGroup(group) {
      return group[0];
    }
    // SELECT profession FROM persons GROUP BY profession
    expect(query().select(professionGroup).from(persons).groupBy(profession).execute()).toEqual([
      'teacher',
      'scientific',
      'politician'
    ]);
  });

  test('Grouping numbers by parity', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    function isEven(number) {
      return number % 2 === 0;
    }
    function parity(number) {
      return isEven(number) ? 'even' : 'odd';
    }
    expect(query().select().from(numbers).groupBy(parity).execute()).toEqual([
      ['odd', [1, 3, 5, 7, 9]],
      ['even', [2, 4, 6, 8]]
    ]);
  });

  test('Multilevel grouping', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    function isEven(number) {
      return number % 2 === 0;
    }
    function parity(number) {
      return isEven(number) ? 'even' : 'odd';
    }
    function isPrime(number) {
      if (number < 2) {
        return false;
      }
      for (let i = 2; i < Math.sqrt(number); i++) {
        if (number % i === 0) return true;
      }
      return false;
    }
    function prime(number) {
      return isPrime(number) ? 'prime' : 'divisible';
    }
    expect(query().select().from(numbers).groupBy(parity, prime).execute()).toEqual([
      [
        'odd',
        [
          ['divisible', [1, 9]],
          ['prime', [3, 5, 7]]
        ]
      ],
      [
        'even',
        [
          ['prime', [2]],
          ['divisible', [4, 6, 8]]
        ]
      ]
    ]);
  });

  test('Filter groups with having', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    function odd(group) {
      return group[0] === 'odd';
    }
    function isEven(number) {
      return number % 2 === 0;
    }
    function parity(number) {
      return isEven(number) ? 'even' : 'odd';
    }
    expect(query().select().from(numbers).groupBy(parity).having(odd).execute()).toEqual([['odd', [1, 3, 5, 7, 9]]]);
  });
});

describe('You can order the results', () => {
  test('Descending order numbers', () => {
    const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    function descendentCompare(number1, number2) {
      return number2 - number1;
    }
    expect(query().select().from(numbers).orderBy(descendentCompare).execute()).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });
});

test('from() supports multiple collections', () => {
  const teachers = [
    { teacherId: '1', teacherName: 'Peter' },
    { teacherId: '2', teacherName: 'Anna' }
  ];
  const students = [
    { studentName: 'Michael', tutor: '1' },
    { studentName: 'Rose', tutor: '2' }
  ];
  function teacherJoin(join) {
    return join[0].teacherId === join[1].tutor;
  }
  function student(join) {
    return { studentName: join[1].studentName, teacherName: join[0].teacherName };
  }
  expect(query().select(student).from(teachers, students).where(teacherJoin).execute()).toEqual([
    { studentName: 'Michael', teacherName: 'Peter' },
    { studentName: 'Rose', teacherName: 'Anna' }
  ]);
});

describe('where() and having() admit multiple AND and OR filters', () => {
  test('where() multiple AND', () => {
    const teachers = [
      { teacherId: '1', teacherName: 'Peter' },
      { teacherId: '2', teacherName: 'Anna' }
    ];
    const students = [
      { studentName: 'Michael', tutor: '1' },
      { studentName: 'Rose', tutor: '2' }
    ];
    function teacherJoin(join) {
      return join[0].teacherId === join[1].tutor;
    }
    function student(join) {
      return { studentName: join[1].studentName, teacherName: join[0].teacherName };
    }
    function tutor1(join) {
      return join[1].tutor === '1';
    }
    expect(query().select(student).from(teachers, students).where(teacherJoin).where(tutor1).execute()).toEqual([
      { studentName: 'Michael', teacherName: 'Peter' }
    ]);
  });
  test('where() multiple AND on numbers', () => {
    const numbers = [1, 2, 3, 4, 5, 7];
    function lessThan6(number) {
      return number < 6;
    }
    function greaterThan2(number) {
      return number > 2;
    }
    expect(query().select().from(numbers).where(lessThan6).where(greaterThan2).execute()).toEqual([3, 4, 5]);
  });
  test('where() multiple OR', () => {
    const numbers = [1, 2, 3, 4, 5, 7];
    function lessThan3(number) {
      return number < 3;
    }
    function greaterThan4(number) {
      return number > 4;
    }
    expect(query().select().from(numbers).where(lessThan3, greaterThan4).execute()).toEqual([1, 2, 5, 7]);
  });
  test('having() multiple AND', () => {
    const numbers = [1, 2, 1, 3, 5, 6, 1, 2, 5, 6];
    function greatThan1(group) {
      return group[1].length > 1;
    }
    function isPair(group) {
      return group[0] % 2 === 0;
    }
    function id(value) {
      return value;
    }
    function frequency(group) {
      return { value: group[0], frequency: group[1].length };
    }
    expect(query().select(frequency).from(numbers).groupBy(id).having(greatThan1).having(isPair).execute()).toEqual([
      { value: 2, frequency: 2 },
      { value: 6, frequency: 2 }
    ]);
  });
});
