const dotenv = require('dotenv');
dotenv.config({});

// Nodejs encryption with CTR
const crypto = require('crypto'),
    algorithm = 'aes-256-ctr',
    password = process.env.cryptoPassword,
    iv = process.env.iv;

export class Crypto {

    static encrypt(text) {
        const cipher = crypto.createCipheriv(algorithm, password, iv);
        let crypted = cipher.update(text, 'utf8', 'hex');
        crypted += cipher.final('hex');
    return crypted;
    }

    static decrypt(text) {
        const decipher = crypto.createDecipheriv(algorithm, password, iv);
        let  dec = decipher.update(text, 'hex', 'utf8');
        dec += decipher.final('utf8');
        return dec;
    }

}
