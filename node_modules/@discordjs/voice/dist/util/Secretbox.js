"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.methods = void 0;
const libs = {
    sodium: (sodium) => ({
        open: sodium.api.crypto_secretbox_open_easy,
        close: sodium.api.crypto_secretbox_easy,
        random: (n, buffer) => {
            if (!buffer)
                buffer = Buffer.allocUnsafe(n);
            sodium.api.randombytes_buf(buffer);
            return buffer;
        },
    }),
    'libsodium-wrappers': (sodium) => ({
        open: sodium.crypto_secretbox_open_easy,
        close: sodium.crypto_secretbox_easy,
        random: (n) => sodium.randombytes_buf(n),
    }),
    tweetnacl: (tweetnacl) => ({
        open: tweetnacl.secretbox.open,
        close: tweetnacl.secretbox,
        random: (n) => tweetnacl.randomBytes(n),
    }),
};
const fallbackError = () => {
    throw new Error(`Cannot play audio as no valid encryption package is installed.
- Install sodium, libsodium-wrappers, or tweetnacl.
- Use the generateDependencyReport() function for more information.\n`);
};
const methods = {
    open: fallbackError,
    close: fallbackError,
    random: fallbackError,
};
exports.methods = methods;
void (async () => {
    for (const libName of Object.keys(libs)) {
        try {
            // eslint-disable-next-line
            const lib = require(libName);
            if (libName === 'libsodium-wrappers' && lib.ready)
                await lib.ready; // eslint-disable-line no-await-in-loop
            Object.assign(methods, libs[libName](lib));
            break;
        }
        catch { } // eslint-disable-line no-empty
    }
})();
//# sourceMappingURL=Secretbox.js.map