module.exports = (func, fallback=null) => {
    try {
        return func()
    } catch (e) {
        if (e instanceof TypeError) {
            return fallback
        } else {
            throw e
        }
    }
}