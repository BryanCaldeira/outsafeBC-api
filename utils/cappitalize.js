
const cappitalize = (text)=>{
    try {
        const [first, ...rest] = text
        return first.toUpperCase() + rest.join('')
    } catch (error) {
        return text
    }
}

module.exports = {
    cappitalize
};