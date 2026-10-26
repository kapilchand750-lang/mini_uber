const argon2 = require("argon2");

async function hashPassword(password){
    return argon2.hash(password, {
        types: argon2.argon2id
    });
}

async function verifyPassword(passwordHash, password) {
    return argon2.verify(passwordHash, password);
}

module.exports = {
    hashPassword,
    verifyPassword
};