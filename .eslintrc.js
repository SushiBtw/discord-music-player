module.exports = {
    env: {
        commonjs: true,
        es6: true,
        node: true
    },
    extends: [
        'standard'
    ],
    rules: {
        indent: ['error', 4],
        'no-async-promise-executor': 'off'
    },
    parserOptions: {
        ecmaVersion: 11
    },
}