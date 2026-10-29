const { tokenize, parse, evaluate, evalTable } = require('./exprEngine');

const DAX_FUNCTIONS = {
  SUM: (args, env) => {
    const ref = args[0];
    if (ref.type !== 'ColumnRef') throw new Error('SUM expects a Table[Column] reference');
    const table = env.tables[ref.table];
    if (!table) throw new Error(`Unknown table '${ref.table}'`);
    return table.reduce((s, row) => s + Number(row[ref.col] || 0), 0);
  },
  AVERAGE: (args, env) => {
    const ref = args[0];
    if (ref.type !== 'ColumnRef') throw new Error('AVERAGE expects a Table[Column] reference');
    const table = env.tables[ref.table];
    if (!table.length) return 0;
    return table.reduce((s, row) => s + Number(row[ref.col] || 0), 0) / table.length;
  },
  COUNTROWS: (args, env) => evalTable(args[0], env).length,
  DISTINCTCOUNT: (args, env) => {
    const ref = args[0];
    const table = env.tables[ref.table];
    return new Set(table.map((r) => r[ref.col])).size;
  },
  SUMX: (args, env) => {
    const table = evalTable(args[0], env);
    const exprAst = args[1];
    return table.reduce((s, row) => s + Number(evaluate(exprAst, { ...env, row }) || 0), 0);
  },
  AVERAGEX: (args, env) => {
    const table = evalTable(args[0], env);
    if (!table.length) return 0;
    const exprAst = args[1];
    return table.reduce((s, row) => s + Number(evaluate(exprAst, { ...env, row }) || 0), 0) / table.length;
  },
  COUNTX: (args, env) => evalTable(args[0], env).length,
  FILTER: (args, env) => {
    const table = evalTable(args[0], env);
    const cond = args[1];
    return table.filter((row) => evaluate(cond, { ...env, row }));
  },
  ALL: (args, env) => env.tables[env.primaryTable],
  SAMEPERIODLASTYEAR: (args, env) => {
    const full = env.tables[env.primaryTable];
    const maxYear = Math.max(...full.map((r) => r.Year));
    return full.filter((r) => r.Year === maxYear - 1);
  },
  CALCULATE: (args, env) => {
    const exprAst = args[0];
    const filterAsts = args.slice(1);
    const baseName = env.primaryTable;
    let table = env.tables[baseName];
    for (const f of filterAsts) {
      if (f.type === 'Call' && f.name.toUpperCase() === 'SAMEPERIODLASTYEAR') {
        const full = env.tables[baseName];
        const maxYear = Math.max(...full.map((r) => r.Year));
        table = table.filter((r) => r.Year === maxYear - 1);
      } else if (f.type === 'Call' && f.name.toUpperCase() === 'ALL') {
        table = env.tables[baseName];
      } else {
        table = table.filter((row) => evaluate(f, { ...env, row }));
      }
    }
    const newEnv = { ...env, tables: { ...env.tables, [baseName]: table } };
    return evaluate(exprAst, newEnv);
  },
  DIVIDE: (args, env) => {
    const num = evaluate(args[0], env);
    const den = evaluate(args[1], env);
    if (!den) return args[2] ? evaluate(args[2], env) : 0;
    return num / den;
  },
  IF: (args, env) => (evaluate(args[0], env) ? evaluate(args[1], env) : args[2] ? evaluate(args[2], env) : false),
  AND: (args, env) => evaluate(args[0], env) && evaluate(args[1], env),
  OR: (args, env) => evaluate(args[0], env) || evaluate(args[1], env),
  MAX: (args, env) => {
    const ref = args[0];
    if (ref.type === 'ColumnRef') {
      const table = env.tables[ref.table];
      return Math.max(...table.map((r) => Number(r[ref.col] || 0)));
    }
    return Math.max(evaluate(args[0], env), evaluate(args[1], env));
  },
  MIN: (args, env) => {
    const ref = args[0];
    if (ref.type === 'ColumnRef') {
      const table = env.tables[ref.table];
      return Math.min(...table.map((r) => Number(r[ref.col] || 0)));
    }
    return Math.min(evaluate(args[0], env), evaluate(args[1], env));
  },
};

function runDax(code, mockData, primaryTable) {
  try {
    const tokens = tokenize(code);
    const ast = parse(tokens);
    const env = {
      tables: { [primaryTable]: JSON.parse(JSON.stringify(mockData)) },
      primaryTable,
      row: null,
      vars: {},
      functions: DAX_FUNCTIONS,
    };
    const result = evaluate(ast, env);
    return { success: true, result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

module.exports = { runDax };
