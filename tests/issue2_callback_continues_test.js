/**
 * Issue 2: txSql must fail even when callback continues after CONNECTION_DESTROYED
 *
 * JavaScript can't cancel promises, so callbacks continue running after
 * begin() rejects. The fix ensures txSql fails immediately, preventing
 * accidental queries on a newly replaced transaction connection.
 
 */
import postgres from '../src/index.js'

const sql = postgres(process.env.DATABASE_URL || 'postgres://localhost/testing')

let txSqlFailed = false

await sql.begin(async (txSql) => {
    await txSql`SET LOCAL idle_in_transaction_session_timeout = '1s'`
    await new Promise(r => setTimeout(r, 2000))

    // After timeout, txSql must fail
    try {
        await txSql`SELECT 1`
    } catch (e) {
        txSqlFailed = e.code === 'CONNECTION_DESTROYED' || e.code === 'CONNECTION_CLOSED'
    }
}).catch(() => { })

await new Promise(r => setTimeout(r, 1000))
await sql.end()

console.log(txSqlFailed ? 'PASS' : 'FAIL', '- txSql failed after timeout in continued callback')
process.exit(txSqlFailed ? 0 : 1)
