"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDependencyReport = void 0;
/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable @typescript-eslint/no-require-imports */
const path_1 = require("path");
const prism_media_1 = require("prism-media");
/**
 * Generates a report of the dependencies used by the \@discordjs/voice module.
 * Useful for debugging.
 */
function generateDependencyReport() {
    const report = [];
    const addVersion = (name) => report.push(`- ${name}: ${version(name)}`);
    // general
    report.push('Core Dependencies');
    addVersion('@discordjs/voice');
    addVersion('prism-media');
    report.push('');
    // opus
    report.push('Opus Libraries');
    addVersion('@discordjs/opus');
    addVersion('opusscript');
    report.push('');
    // encryption
    report.push('Encryption Libraries');
    addVersion('sodium');
    addVersion('libsodium-wrappers');
    addVersion('tweetnacl');
    report.push('');
    // ffmpeg
    report.push('FFmpeg');
    try {
        const info = prism_media_1.FFmpeg.getInfo();
        report.push(`- version: ${info.version}`);
        report.push(`- libopus: ${info.output.includes('--enable-libopus') ? 'yes' : 'no'}`);
    }
    catch (err) {
        report.push('- not found');
    }
    return ['-'.repeat(50), ...report, '-'.repeat(50)].join('\n');
}
exports.generateDependencyReport = generateDependencyReport;
/**
 * Tries to find the package.json file for a given module.
 *
 * @param dir - The directory to look in
 * @param packageName - The name of the package to look for
 * @param depth - The maximum recursion depth
 */
function findPackageJSON(dir, packageName, depth) {
    if (depth === 0)
        return undefined;
    const attemptedPath = path_1.resolve(dir, './package.json');
    try {
        const pkg = require(attemptedPath);
        if (pkg.name !== packageName)
            throw new Error('package.json does not match');
        return pkg;
    }
    catch (err) {
        return findPackageJSON(path_1.resolve(dir, '..'), packageName, depth - 1);
    }
}
/**
 * Tries to find the version of a dependency.
 *
 * @param name - The package to find the version of
 */
function version(name) {
    var _a;
    try {
        const pkg = name === '@discordjs/voice'
            ? require('../../package.json')
            : findPackageJSON(path_1.dirname(require.resolve(name)), name, 3);
        return (_a = pkg === null || pkg === void 0 ? void 0 : pkg.version) !== null && _a !== void 0 ? _a : 'not found';
    }
    catch (err) {
        return 'not found';
    }
}
//# sourceMappingURL=generateDependencyReport.js.map