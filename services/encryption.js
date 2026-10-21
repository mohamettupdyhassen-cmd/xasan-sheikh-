const CryptoJS = require('crypto-js');

const SECRET_KEY = process.env.ENCRYPTION_KEY || 'default_key_change_this';

function encrypt(text) {
    if (!text) return null;
    return CryptoJS.AES.encrypt(text, SECRET_KEY).toString();
}

function decrypt(cipherText) {
    if (!cipherText) return null;
    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    return bytes.toString(CryptoJS.enc.Utf8);
}

module.exports = { encrypt, decrypt };
