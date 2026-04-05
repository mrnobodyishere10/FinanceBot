export function isEmail(email) {
    const re = /^[a-zA-Z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,4}$/;
    return re.test(email);
}

export function isPositiveNumber(value) {
    return typeof value === 'number' && value > 0;
}
