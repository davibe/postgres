/**
 * Issue 1: txSql should fail with CONNECTION_DESTROYED after idle timeout
 *
 * When PostgreSQL kills a connection due to idle_in_transaction_session_timeout,
 * queries on txSql should fail immediately (not crash with uncatchable exception).
 */
import postgres from '../src/index.js'

const sql = postgres(process.env.DATABASE_URL || 'postgres://localhost/testing')

const error = await sql.begin(async (txSql) => {
  await txSql`SET LOCAL idle_in_transaction_session_timeout = '1s'`
  await new Promise(r => setTimeout(r, 2000))
  await txSql`SELECT 1`
}).catch(e => e)

await sql.end()

const valid = error.code === 'CONNECTION_DESTROYED' || error.code === 'CONNECTION_CLOSED'
console.log(valid ? 'PASS' : 'FAIL', '- txSql failed with:', error.code)
process.exit(valid ? 0 : 1)
