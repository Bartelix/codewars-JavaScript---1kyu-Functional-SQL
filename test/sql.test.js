const query = require('../sql');

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

  test('duplicate orderBy', () => {
    function id(value) {
      return value;
    }
    expect(() => query().select().from([]).orderBy(id).orderBy(id).execute()).toThrow('Duplicate ORDERBY');
  });

  test('duplicate groupBy', () => {
    function id(value) {
      return value;
    }
    expect(() => query().select().groupBy(id).from([]).groupBy(id).execute()).toThrow('Duplicate GROUPBY');
  });

  test('duplicate where is and filter', () => {
    expect(() => query().select().from([]).where([]).where([])).not.toThrow(Error);
  });
});
test('The methods are chainable and the query is executed by calling the execute() method, chaining select and from', () => {
  const numbers = [1, 2, 3];
  expect(query().select().from(numbers).execute()).toEqual(numbers);
});

test('Clauses order does not matter, from before select', () => {
  const numbers = [1, 2, 3];
  expect(query().from(numbers).select().execute()).toEqual(numbers);
});

describe('You can omit any SQL clause', () => {
  test('No FROM clause produces empty array', () => {
    expect(query().select().execute()).toEqual([]);
  });

  test('SELECT can be omited', () => {
    const numbers = [1, 2, 3];
    expect(query().from(numbers).execute()).toEqual([1, 2, 3]);
  });

  test('No FROM and omited SELECT should return empty array', () => {
    expect(query().execute()).toEqual([]);
  });
});

describe('Basic SELECT and WHERE over objects', () => {
  const persons = () => [
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
  function name(person) {
    return person.name;
  }

  test('You can make queries over object collections.', () => {
    expect(query().select().from(persons()).execute()).toEqual(persons());
  });

  test('You can select some fields.', () => {
    expect(query().select(profession).from(persons()).execute()).toEqual([
      'teacher',
      'teacher',
      'teacher',
      'scientific',
      'scientific',
      'scientific',
      'politician'
    ]);
  });

  test('No FROM clause produces empty array', () => {
    expect(query().select(profession).execute()).toEqual([]);
  });

  test('SELECT profession FROM persons WHERE profession="teacher"', () => {
    expect(query().select(profession).from(persons()).where(isTeacher).execute()).toEqual([
      'teacher',
      'teacher',
      'teacher'
    ]);
  });

  test('SELECT * FROM persons WHERE profession="teacher"', () => {
    expect(query().select().from(persons()).where(isTeacher).execute()).toEqual([
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
      { name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' },
      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
    ]);
  });

  test('SELECT name FROM persons WHERE profession="teacher"', () => {
    expect(query().select(name).from(persons()).where(isTeacher).execute()).toEqual(['Peter', 'Michael', 'Peter']);
  });

  test('SELECT name FROM persons WHERE profession="teacher" - where before from', () => {
    expect(query().where(isTeacher).from(persons()).select(name).execute()).toEqual(['Peter', 'Michael', 'Peter']);
  });
});

describe('GROUP BY tests', () => {
  const persons = () => [
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

  test('SELECT * FROM persons GROUP BY profession', () => {
    expect(query().select().from(persons()).groupBy(profession).execute()).toEqual([
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

  function isTeacher(person) {
    return person.profession === 'teacher';
  }

  test('You can mix where with groupBy', () => {
    // SELECT * FROM persons WHERE profession='teacher' GROUP BY profession
    expect(query().select().from(persons()).where(isTeacher).groupBy(profession).execute()).toEqual([
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

  function professionGroup(group) {
    return group[0];
  }

  test('You can mix select with groupBy', () => {
    // SELECT profession FROM persons GROUP BY profession
    expect(query().select(professionGroup).from(persons()).groupBy(profession).execute()).toEqual([
      'teacher',
      'scientific',
      'politician'
    ]);
  });

  function name(person) {
    return person.name;
  }
  test('Double grouping persons', () => {
    expect(query().select().from(persons()).groupBy(profession, name).execute()).toEqual([
      [
        'teacher',
        [
          [
            'Peter',
            [
              { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
              { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
            ]
          ],
          ['Michael', [{ name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' }]]
        ]
      ],
      [
        'scientific',
        [
          [
            'Anna',
            [
              { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' },
              { name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' }
            ]
          ],
          ['Rose', [{ name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' }]]
        ]
      ],
      ['politician', [['Anna', [{ name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }]]]]
    ]);
  });

  function age(person) {
    return person.age;
  }
  function maritalStatus(person) {
    return person.maritalStatus;
  }

  test('Many grouping fields', () => {
    expect(query().select().from(persons()).groupBy(profession, name, age, maritalStatus).execute()).toEqual([
      [
        'teacher',
        [
          [
            'Peter',
            [
              [
                20,
                [
                  [
                    'married',
                    [
                      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' },
                      { name: 'Peter', profession: 'teacher', age: 20, maritalStatus: 'married' }
                    ]
                  ]
                ]
              ]
            ]
          ],
          [
            'Michael',
            [[50, [['single', [{ name: 'Michael', profession: 'teacher', age: 50, maritalStatus: 'single' }]]]]]
          ]
        ]
      ],
      [
        'scientific',
        [
          [
            'Anna',
            [
              [
                20,
                [
                  ['married', [{ name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'married' }]],
                  ['single', [{ name: 'Anna', profession: 'scientific', age: 20, maritalStatus: 'single' }]]
                ]
              ]
            ]
          ],
          [
            'Rose',
            [[50, [['married', [{ name: 'Rose', profession: 'scientific', age: 50, maritalStatus: 'married' }]]]]]
          ]
        ]
      ],
      [
        'politician',
        [
          [
            'Anna',
            [[50, [['married', [{ name: 'Anna', profession: 'politician', age: 50, maritalStatus: 'married' }]]]]]
          ]
        ]
      ]
    ]);
  });

  function professionCount(group) {
    return [group[0], group[1].length];
  }

  test('SELECT profession, count(profession) FROM persons GROUPBY profession', () => {
    expect(query().select(professionCount).from(persons()).groupBy(profession).execute()).toEqual([
      ['teacher', 3],
      ['scientific', 3],
      ['politician', 1]
    ]);
  });

  function naturalCompare(value1, value2) {
    if (value1 < value2) {
      return -1;
    } else if (value1 > value2) {
      return 1;
    } else {
      return 0;
    }
  }

  test('SELECT profession, count(profession) FROM persons GROUPBY profession ORDER BY profession', () => {
    expect(
      query().select(professionCount).from(persons()).groupBy(profession).orderBy(naturalCompare).execute()
    ).toEqual([
      ['politician', 1],
      ['scientific', 3],
      ['teacher', 3]
    ]);
  });
});

describe('Numbers array tests', () => {
  const numbers = () => [1, 2, 3, 4, 5, 6, 7, 8, 9];

  test('SELECT * FROM numbers', () => {
    expect(query().select().from(numbers()).execute()).toEqual(numbers());
  });

  function isEven(number) {
    return number % 2 === 0;
  }
  function parity(number) {
    return isEven(number) ? 'even' : 'odd';
  }

  test('Grouping numbers by parity', () => {
    expect(query().select().from(numbers()).groupBy(parity).execute()).toEqual([
      ['odd', [1, 3, 5, 7, 9]],
      ['even', [2, 4, 6, 8]]
    ]);
  });

  function isPrime(number) {
    if (number < 2) {
      return false;
    }
    for (let i = 2; i <= Math.sqrt(number); i++) {
      if (number % i === 0) return false;
    }
    return true;
  }
  function prime(number) {
    return isPrime(number) ? 'prime' : 'divisible';
  }

  test('Multilevel grouping - SELECT * FROM numbers GROUP BY parity, isPrime', () => {
    expect(query().select().from(numbers()).groupBy(parity, prime).execute()).toEqual([
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

  function odd(group) {
    return group[0] === 'odd';
  }

  test('Filter groups with having', () => {
    expect(query().select().from(numbers()).groupBy(parity).having(odd).execute()).toEqual([['odd', [1, 3, 5, 7, 9]]]);
  });

  function descendentCompare(number1, number2) {
    return number2 - number1;
  }

  test('Descending order numbers', () => {
    expect(query().select().from(numbers()).orderBy(descendentCompare).execute()).toEqual([9, 8, 7, 6, 5, 4, 3, 2, 1]);
  });

  function lessThan3(number) {
    return number < 3;
  }
  function greaterThan4(number) {
    return number > 4;
  }

  test('SELECT * FROM number WHERE number < 3 OR number > 4', () => {
    expect(query().select().from(numbers()).where(lessThan3, greaterThan4).execute()).toEqual([1, 2, 5, 6, 7, 8, 9]);
  });
});

describe('Frequency tests', () => {
  const persons = [
    ['Peter', 3],
    ['Anna', 4],
    ['Peter', 7],
    ['Michael', 10]
  ];
  function nameGrouping(person) {
    return person[0];
  }
  function sumValues(value) {
    return [
      value[0],
      value[1].reduce(function (result, person) {
        return result + person[1];
      }, 0)
    ];
  }
  function naturalCompare(value1, value2) {
    if (value1 < value2) {
      return -1;
    } else if (value1 > value2) {
      return 1;
    } else {
      return 0;
    }
  }

  test('SELECT name, sum(value) FROM persons ORDER BY naturalCompare GROUP BY nameGrouping', () => {
    expect(query().select(sumValues).from(persons).orderBy(naturalCompare).groupBy(nameGrouping).execute()).toEqual([
      ['Anna', 4],
      ['Michael', 10],
      ['Peter', 10]
    ]);
  });

  const numbers = [1, 2, 1, 3, 5, 6, 1, 2, 5, 6];
  function id(value) {
    return value;
  }
  function frequency(group) {
    return { value: group[0], frequency: group[1].length };
  }

  test('SELECT number, count(number) FROM numbers GROUP BY number', () => {
    expect(query().select(frequency).from(numbers).groupBy(id).execute()).toEqual([
      { value: 1, frequency: 3 },
      { value: 2, frequency: 2 },
      { value: 3, frequency: 1 },
      { value: 5, frequency: 2 },
      { value: 6, frequency: 2 }
    ]);
  });

  function greatThan1(group) {
    return group[1].length > 1;
  }
  function isPair(group) {
    return group[0] % 2 === 0;
  }

  test('SELECT number, count(number) FROM numbers GROUP BY number HAVING count(number) > 1 AND isPair(number)', () => {
    expect(query().select(frequency).from(numbers).groupBy(id).having(greatThan1).having(isPair).execute()).toEqual([
      { value: 2, frequency: 2 },
      { value: 6, frequency: 2 }
    ]);
  });
});

describe('join tests', () => {
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

  test('from() supports multiple collections with join condition in where', () => {
    expect(query().select(student).from(teachers, students).where(teacherJoin).execute()).toEqual([
      { studentName: 'Michael', teacherName: 'Peter' },
      { studentName: 'Rose', teacherName: 'Anna' }
    ]);
  });
  test('from() supports multiple collections with join condition in where and other where condition', () => {
    expect(query().select(student).from(teachers, students).where(teacherJoin).where(tutor1).execute()).toEqual([
      { studentName: 'Michael', teacherName: 'Peter' }
    ]);
  });

  const numbers1 = [1, 2];
  const numbers2 = [4, 5];

  test('from() supports multiple collections', () => {
    expect(query().select().from(numbers1, numbers2).execute()).toEqual([
      [1, 4],
      [1, 5],
      [2, 4],
      [2, 5]
    ]);
  });
});
