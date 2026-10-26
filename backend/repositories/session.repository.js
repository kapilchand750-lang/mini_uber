const db = require("../config/db");

function createSession(userId, refreshTokenHash, expiresAt) {
    return new Promise((resolve, reject) => {
        const sql = `INSERT INTO USER_SESSION (user_id, refresh_token_hash, expires_at) VALUES (?, ?, ?)`;

        db.query(sql, [userId, refreshTokenHash, expiresAt], (error, results) => {
            if(error) {
                return reject(error);
            }

            resolve({
                session_id: results.insertId,
                user_id:  userId,
                expires_at: expiresAt
            });
        }
    );
    });
}

function findActiveSessionByTokenHash(refreshTokenHash) {
    return new Promise ((resolve, reject) => {
        const sql = `SELECT session_id, user_id, refresh_token_hash, 
            expires_at, created_at, revoked_at
            FROM USER_SESSION
            WHERE refresh_token_hash = ?
                AND revoked_at IS NULL
                AND expires_at > NOW()
            LIMIT 1`;

        db.query(sql, [refreshTokenHash], (error, results) => {
        if(error){
            return reject(error);
        }

        resolve(results.length > 0 ? results[0] : null);
    });
    });
}

function revokeSession(sessionId){
    return new Promise((resolve, reject) => {
        const sql = `UPDATE USER_SESSION 
                    SET revoked_at = NOW()
                    WHERE session_id = ?
                        AND revoked_at IS NULL`;
        db.query(sql, [sessionId], (error, results) => {
            if(error) {
                return reject(error);
            }

            resolve(results.affectedRows > 0);
        });
    });
}

function rotateSession(oldSession, oldTokenHash, newTokenHash, expiresAt){
    return new Promise((resolve, reject) => {
        db.getConnection((connectionError, connection) => {
            if(connectionError) return reject(connectionError);

            let finished = false;

            function releaseOnce() {
                if(!finished){
                    finished = true;
                    connection.release();
                }
            }

            function rollbackAndReject(error) {
                if(finished) return;

                connection.rollback(() => {
                    releaseOnce();
                    reject(error);
                });
            }
            connection.beginTransaction((transactionError) => {
                if(transactionError) {
                    releaseOnce();
                    return reject(transactionError);
                }

                const revokeSql = `UPDATE USER_SESSION 
                                    SET revoked_at = NOW()
                                    WHERE session_id = ?
                                        AND refresh_token_hash = ?
                                        AND revoked_at IS NULL
                                        AND expires_at > NOW()`;
                
                connection.query(revokeSql, [oldSession.session_id, oldTokenHash], (revokeError, revokeResults) => {
                    if(revokeError) return rollbackAndReject(revokeError);

                    if(revokeResults.affectedRows !== 1){
                        return rollbackAndReject(new Error) (
                            "Refresh session is no longer active."
                        );
                    }

                    const insertSql = `INSERT INTO USER_SESSION(
                                        user_id, refresh_token_hash, expires_at)
                                        VALUES(?, ?, ?)`;

                    connection.query(insertSql, [oldSession.user_id, newTokenHash, expiresAt], (insertError, insertResults) => {
                        if(insertError) return rollbackAndReject(insertError);
                        connection.commit((commitError) => {
                            if(commitError) return rollbackAndReject(commitError);
                            releaseOnce();
                            resolve({
                                session_id: insertResults.insertId,
                                user_id: oldSession.user_id,
                                expires_at: expiresAt
                            });
                        });
                    }
                );
            }
        );

                // function rollback(error) {
                //     connection.rollback(() => {
                //         connection.release();
                //         reject(error);
                //     });
                // }
            });
        });
    });
}

module.exports = {
    createSession,
    findActiveSessionByTokenHash,
    revokeSession,
    rotateSession
};