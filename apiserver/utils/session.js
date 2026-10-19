const { createCipheriv, createDecipheriv, scryptSync } = require('crypto')
const AppError = require('./appError')
const key = scryptSync(process.env.SESSION_ENCRYPT_SECRET || 'default_session_encrypt_secret', 'salt', 24)
const iv = Buffer.alloc(16, 0) // Initialization crypto vector
const algorithm = process.env.SESSION_ALGORITHM || 'aes-192-cbc'


exports.encrypt = (token) => {
    const cipher = createCipheriv(process.env.SESSION_ALGORITHM || algorithm, key, iv)
    let encrypted = cipher.update(token, 'utf8', 'hex')
    encrypted += cipher.final('hex')
    return encrypted
}

exports.decrypt = (session) => {
    try {
        const decipher = createDecipheriv(process.env.SESSION_ALGORITHM, key, iv)
        let decrypted = decipher.update(session, 'hex', 'utf8')
        decrypted += decipher.final('utf8')
        return decrypted
    } catch (error) {
        throw new AppError(401, "Unauthorized")
    }
}