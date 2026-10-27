/**
 * CaseConnect — PostgreSQL Model Adapter
 * 
 * Provides a Mongoose-compatible query interface backed by pg (PostgreSQL).
 * Routes and services call the same .find(), .findOne(), .findById(), .create(),
 * .findByIdAndUpdate(), .countDocuments() etc. — no route files need to change.
 *
 * Column naming convention:  camelCase  (JS)  ↔  snake_case  (PostgreSQL)
 * The adapter auto-converts between the two.
 */

const { getPool } = require('../config/db');

// ── snake_case ↔ camelCase helpers ─────────────────────────────────────────

function toSnake(str) {
  if (typeof str !== 'string' || !/^[A-Za-z_][A-Za-z0-9_]*$/.test(str)) {
    throw new Error('Invalid database field name.');
  }
  if (str === '_id' || str === 'id') return 'id';
  return str.replace(/([A-Z])/g, m => '_' + m.toLowerCase());
}

function toCamel(str) {
  return str.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Convert a plain JS object's keys from camelCase → snake_case */
function rowToSnake(obj) {
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    out[toSnake(k)] = v;
  }
  return out;
}

/** Convert a DB row's keys from snake_case → camelCase, add _id alias */
function rowToCamel(row) {
  if (!row) return null;
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    out[toCamel(k)] = v;
  }
  // Mongoose compatibility: expose `_id` as alias for `id`
  if (out.id && !out._id) out._id = out.id;
  return out;
}

/** Wrap row with Mongoose-like document helper methods (.save(), .toObject()) */
function makeDocument(row, model) {
  if (!row) return null;
  const doc = rowToCamel(row);

  Object.defineProperty(doc, 'save', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: async function() {
      const id = this.id || this._id;
      if (!id) throw new Error('Cannot save document without id');
      const updated = await model.findByIdAndUpdate(id, this);
      if (updated) {
        Object.assign(this, updated);
      }
      return this;
    }
  });

  Object.defineProperty(doc, 'toObject', {
    enumerable: false,
    configurable: true,
    writable: true,
    value: function() {
      const copy = { ...this };
      if (this.id && !copy._id) copy._id = this.id;
      return copy;
    }
  });

  return doc;
}

// ── Filter → WHERE clause builder ──────────────────────────────────────────

/**
 * Converts a Mongoose-style filter object to a parameterized WHERE clause.
 * Supported operators: equality, $or, $nin, $in, $regex/$options, $gte, $lte, $gt, $lt, $ne
 */
function buildWhere(filter, startIdx = 1) {
  if (!filter || Object.keys(filter).length === 0) {
    return { clause: '', params: [], nextIdx: startIdx };
  }

  const parts = [];
  const params = [];
  let idx = startIdx;

  for (const [key, val] of Object.entries(filter)) {
    const col = key === '$or' ? null : ((key === '_id' || key === 'id') ? 'id' : toSnake(key));

    if (key === '$or') {
      if (!Array.isArray(val) || val.length === 0) throw new Error('$or must contain at least one filter.');
      const orParts = [];
      for (const branch of val) {
        const sub = buildWhere(branch, idx);
        orParts.push(`(${sub.clause})`);
        params.push(...sub.params);
        idx = sub.nextIdx;
      }
      parts.push(`(${orParts.join(' OR ')})`);
    } else if (val !== null && typeof val === 'object' && !Array.isArray(val)) {
      if ('$regex' in val) {
        // $regex with $options:'i' → ILIKE '%pattern%'
        const escapedPattern = String(val.$regex).replace(/[\\%_]/g, '\\$&');
        const pattern = `%${escapedPattern}%`;
        parts.push(`${col} ILIKE $${idx} ESCAPE E'\\\\'`);
        params.push(pattern);
        idx++;
      } else if ('$nin' in val) {
        parts.push(`${col} <> ALL($${idx})`);
        params.push(val.$nin);
        idx++;
      } else if ('$in' in val) {
        parts.push(`${col} = ANY($${idx})`);
        params.push(val.$in);
        idx++;
      } else if ('$gte' in val && '$lte' in val) {
        parts.push(`${col} >= $${idx} AND ${col} <= $${idx + 1}`);
        params.push(val.$gte, val.$lte);
        idx += 2;
      } else if ('$gte' in val) {
        parts.push(`${col} >= $${idx}`);
        params.push(val.$gte);
        idx++;
      } else if ('$lte' in val) {
        parts.push(`${col} <= $${idx}`);
        params.push(val.$lte);
        idx++;
      } else if ('$gt' in val) {
        parts.push(`${col} > $${idx}`);
        params.push(val.$gt);
        idx++;
      } else if ('$lt' in val) {
        parts.push(`${col} < $${idx}`);
        params.push(val.$lt);
        idx++;
      } else if ('$ne' in val) {
        parts.push(`${col} != $${idx}`);
        params.push(val.$ne);
        idx++;
      } else {
        throw new Error(`Unsupported filter operator for ${key}.`);
      }
    } else if (val === null) {
      parts.push(`${col} IS NULL`);
    } else {
      parts.push(`${col} = $${idx}`);
      params.push(val);
      idx++;
    }
  }

  return {
    clause: parts.join(' AND '),
    params,
    nextIdx: idx
  };
}

// ── Update SET builder ──────────────────────────────────────────────────────

/**
 * Converts { field: val, $set: {…}, $push: { arr: item }, $addToSet: { arr: item } } → SET clause.
 */
function buildUpdate(update, tableName, idParam, startIdx) {
  const setClauses = [];
  const params = [];
  let idx = startIdx;

  for (const [key, val] of Object.entries(update)) {
    if (key === '$set') {
      for (const [field, fval] of Object.entries(val)) {
        setClauses.push(`${toSnake(field)} = $${idx}`);
        params.push(typeof fval === 'object' && fval !== null && !(fval instanceof Date) ? JSON.stringify(fval) : fval);
        idx++;
      }
    } else if (key === '$push') {
      for (const [arrField, arrVal] of Object.entries(val)) {
        const col = toSnake(arrField);
        setClauses.push(`${col} = COALESCE(${col}, '[]'::jsonb) || $${idx}::jsonb`);
        params.push(JSON.stringify([arrVal]));
        idx++;
      }
    } else if (key === '$addToSet') {
      for (const [arrField, arrVal] of Object.entries(val)) {
        const col = toSnake(arrField);
        setClauses.push(`${col} = CASE WHEN COALESCE(${col}, '[]'::jsonb) @> $${idx}::jsonb THEN COALESCE(${col}, '[]'::jsonb) ELSE COALESCE(${col}, '[]'::jsonb) || $${idx}::jsonb END`);
        params.push(JSON.stringify([arrVal]));
        idx++;
      }
    } else if (key !== '_id' && key !== 'id' && key !== 'updatedAt' && key !== 'updated_at' && key !== 'createdAt' && key !== 'created_at') {
      const col = toSnake(key);
      const isJsonbArray = Array.isArray(val);
      const isJsonbObj = val !== null && typeof val === 'object' && !(val instanceof Date) && !isJsonbArray;
      setClauses.push(`${col} = $${idx}`);
      params.push(isJsonbArray || isJsonbObj ? JSON.stringify(val) : val);
      idx++;
    }
  }

  // Always update updated_at
  setClauses.push(`updated_at = NOW()`);

  let sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE id = $${idx} RETURNING *`;
  params.push(idParam);
  idx++;

  return { sql, params, nextIdx: idx };
}

// ── Query Builder (chainable, like Mongoose) ──────────────────────────────

class Query {
  constructor(model, tableName, filter = {}, options = {}) {
    this._model    = model;
    this._table    = tableName;
    this._filter   = filter;
    this._select   = options.select || null;
    this._sort     = null;
    this._skip     = 0;
    this._limit    = null;
    this._single   = options.single || false;
    this._executed = false;
  }

  select(fields) {
    this._select = fields;
    return this;
  }

  sort(sortObj) {
    this._sort = sortObj;
    return this;
  }

  skip(n) { this._skip = n; return this; }
  limit(n) { this._limit = n; return this; }
  lean()   { return this; }
  populate() { return this; }
  exec()   { return this._run(); }

  then(resolve, reject) {
    return this._run().then(resolve, reject);
  }

  async _run() {
    const pool = getPool();
    const { clause, params } = buildWhere(this._filter);

    let cols = '*';
    if (this._select) {
      const fields = this._select.trim().split(/\s+/).filter(Boolean);
      const included = fields.filter(field => !field.startsWith('-'));
      const excluded = new Set(fields.filter(field => field.startsWith('-')).map(field => toSnake(field.slice(1))));
      if (included.length && excluded.size) throw new Error('Cannot mix included and excluded query fields.');
      if (included.length) {
        const selected = new Set(included.map(field => toSnake(field)));
        selected.add('id');
        cols = [...selected].join(', ');
      } else if (excluded.size) {
        const meta = await pool.query('SELECT column_name FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = $1', [this._table]);
        const selected = meta.rows.map(row => row.column_name).filter(name => !excluded.has(name));
        if (!selected.includes('id')) selected.push('id');
        cols = selected.join(', ');
      }
    }

    let sql = `SELECT ${cols} FROM ${this._table}`;
    if (clause) sql += ` WHERE ${clause}`;

    if (this._sort) {
      const sortParts = Object.entries(this._sort).map(([k, v]) =>
        `${toSnake(k)} ${v === -1 || v === 'desc' ? 'DESC' : 'ASC'}`
      );
      sql += ` ORDER BY ${sortParts.join(', ')}`;
    }

    if (this._limit !== null) sql += ` LIMIT ${this._limit}`;
    if (this._skip)           sql += ` OFFSET ${this._skip}`;

    const result = await pool.query(sql, params);

    if (this._single) {
      return result.rows.length ? makeDocument(result.rows[0], this._model) : null;
    }
    return result.rows.map(r => makeDocument(r, this._model));
  }
}

// ── Model Factory ────────────────────────────────────────────────────────────

/**
 * createModel(tableName, jsonbCols)
 *  tableName  – PostgreSQL table name
 *  jsonbCols  – array of camelCase field names stored as JSONB (arrays/objects)
 */
function createModel(tableName, jsonbCols = []) {
  const jsonbSet = new Set(jsonbCols.map(toSnake));

  function prepareInsert(data) {
    const cols = [];
    const placeholders = [];
    const vals = [];
    let idx = 1;

    for (const [key, val] of Object.entries(data)) {
      if (key === '_id' || key === 'id') continue;
      const col = toSnake(key);
      cols.push(col);
      placeholders.push(`$${idx}`);
      if (jsonbSet.has(col) || Array.isArray(val) ||
          (val !== null && typeof val === 'object' && !(val instanceof Date))) {
        vals.push(JSON.stringify(val));
      } else {
        vals.push(val);
      }
      idx++;
    }

    return { cols, placeholders, vals };
  }

  const model = {
    tableName,

    find(filter = {}) {
      return new Query(model, tableName, filter);
    },

    findOne(filter = {}) {
      return new Query(model, tableName, filter, { single: true });
    },

    findById(id) {
      return new Query(model, tableName, { id }, { single: true });
    },

    async create(data) {
      const pool = getPool();
      const { cols, placeholders, vals } = prepareInsert(data);
      if (cols.length === 0) throw new Error('No data to insert');
      const sql = `INSERT INTO ${tableName} (${cols.join(', ')}) VALUES (${placeholders.join(', ')}) RETURNING *`;
      const result = await pool.query(sql, vals);
      return makeDocument(result.rows[0], model);
    },

    async findByIdAndUpdate(id, update, options = {}) {
      const pool = getPool();
      const { sql, params } = buildUpdate(update, tableName, id, 1);
      const result = await pool.query(sql, params);
      return result.rows[0] ? makeDocument(result.rows[0], model) : null;
    },

    async findOneAndUpdate(filter, update, options = {}) {
      const pool = getPool();
      const { clause, params: whereParams } = buildWhere(filter, 1);

      let selectSql = `SELECT id FROM ${tableName}`;
      if (clause) selectSql += ` WHERE ${clause}`;
      selectSql += ' LIMIT 1';
      const selectResult = await pool.query(selectSql, whereParams);

      if (!selectResult.rows.length) {
        if (options && options.upsert) {
          const insertData = { ...filter, ...(update.$set || update) };
          delete insertData.$set;
          delete insertData.$push;
          delete insertData.$addToSet;
          return this.create(insertData);
        }
        return null;
      }

      const id = selectResult.rows[0].id;
      return this.findByIdAndUpdate(id, update, options);
    },

    async findByIdAndDelete(id) {
      const pool = getPool();
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [id]);
      return result.rows.length ? makeDocument(result.rows[0], model) : null;
    },

    async deleteOne(filter = {}) {
      const pool = getPool();
      const { clause, params } = buildWhere(filter);
      let sql = `DELETE FROM ${tableName}`;
      if (clause) sql += ` WHERE ${clause}`;
      sql += ' RETURNING id';
      const result = await pool.query(sql, params);
      return { deletedCount: result.rowCount };
    },

    async countDocuments(filter = {}) {
      const pool = getPool();
      const { clause, params } = buildWhere(filter);
      let sql = `SELECT COUNT(*)::int AS count FROM ${tableName}`;
      if (clause) sql += ` WHERE ${clause}`;
      const result = await pool.query(sql, params);
      return result.rows[0].count;
    },

    async updateMany(filter, update) {
      const pool = getPool();
      const { clause, params: whereParams } = buildWhere(filter, 1);

      const setClauses = [];
      const setParams = [];
      let idx = whereParams.length + 1;

      const updateData = update.$set || update;
      for (const [key, val] of Object.entries(updateData)) {
        if (key === '$set' || key === '_id' || key === 'id' || key === 'updatedAt' || key === 'updated_at' || key === 'createdAt' || key === 'created_at') continue;
        setClauses.push(`${toSnake(key)} = $${idx}`);
        setParams.push(val);
        idx++;
      }
      setClauses.push('updated_at = NOW()');

      const allParams = [...whereParams, ...setParams];
      let sql = `UPDATE ${tableName} SET ${setClauses.join(', ')}`;
      if (clause) sql += ` WHERE ${clause}`;

      const result = await pool.query(sql, allParams);
      return { modifiedCount: result.rowCount };
    },

    async query(sql, params = []) {
      const pool = getPool();
      const result = await pool.query(sql, params);
      return result.rows.map(r => makeDocument(r, model));
    }
  };

  return model;
}

module.exports = { createModel, buildWhere, rowToCamel, makeDocument, toSnake };
