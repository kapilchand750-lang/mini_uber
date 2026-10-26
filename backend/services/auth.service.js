const db = require("../config/db");
const passwordService = require("./password.service");
const authRepository = require("../repositories/auth.repository");

function executeQuery(connection, sql, values) {
    return new Promise((resolve, reject) => {
        connection.query(sql, values, (error, results) => {
            if(error){
                reject(error);
            }else{
                resolve(results);
            }
        });
    });
}


function getConnection(){
    return new Promise((resolve, reject) => {
        db.getConnection((error, connection) => {
            if(error){
                reject(error);
            } else {
                resolve(connection);
            }
        });
    });
}

function beginTransaction(connection) {
    return new Promise((resolve, reject) => {
        connection.beginTransaction(error => {
            if(error) reject(error);
            else resolve();
        });
    });
}

function commitTransaction(connection){
    return new Promise((resolve, reject) => {
        connection.commit(error => {
            if(error) reject(error);
            else resolve();
        });
    });
}

function rollbackTransaction(connection) {
    return new Promise(resolve => {
        connection.rollback(() => resolve());
    });
}

async function registerUser(userData) {
    const {name, email, phone, username, password} = userData;

    const passwordHash = await passwordService.hashPassword(password);

    const connection = await getConnection();
    let transactionStarted = false;

    try {
        await beginTransaction(connection);
        transactionStarted = true;

        // Insert the user's profile.
        const sql = `INSERT INTO \`USER\` (name, email, phone) VALUES(?, ?, ?)`;
        const userResult = await executeQuery(connection, sql, [name, email, phone]);

        const userId = userResult.insertId;

        // Insert login credentials linked to the profile.
        const sql2 = `INSERT INTO USER_CREDENTIAL (user_id, username, password_hash) VALUES (?, ?, ?)`;
        await executeQuery(connection, sql2, [userId, username, passwordHash]);

        await commitTransaction(connection);
        transactionStarted = false;

        return {
            user_id: userId, name, email, phone, username
        };
    } catch(error){
        console.error("Registration database error:", {
        code: error.code,
        message: error.message,
        sqlMessage: error.sqlMessage,
        sql: error.sql
    });

        if(transactionStarted){
            await rollbackTransaction(connection);
        }

        throw error;
    } finally {
        connection.release();
    }
}


//login
async function loginUser(username, password) {
    // Step 1: Retrieve the account from the repository.
    const user = await authRepository.findByUsername(username);

    // Step 2: Reject unknown usernames.
    if(!user) return null;

    // Step 3: Verify the submitted password.
    const passwordMatches = await passwordService.verifyPassword(user.password_hash, password);
    if(!passwordMatches) {return null;}

    // Step 4: Return only safe user fields.
    return{
        user_id : user.user_id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        username: user.username
    };
}


module.exports = {
    registerUser,
    loginUser
};
