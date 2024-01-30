import os from 'https://deno.land/x/dos@v0.11.0/mod.ts';
import * as blog from 'https://deno.land/x/blog@0.3.3/deps.ts';
import path from 'node:path';
import { error } from './terminal-logging.ts';

/**
 * Makes paths consistent across platforms
 * @date 1/9/2024 - 12:12:32 PM
 */
export const platformify = (path: string) => {
    switch (os.platform()) {
        case 'linux':
            return clean(path);
        case 'windows':
            return clean(path.replace(/\//g, '\\'));
        default:
            throw new Error('Unsupported platform: ' + os.platform());
    }
};

export const clean = (path: string) => {
    // remove all unnecessary slashes, etc.
    path = path.replace(/\/\//g, '/');
    path = path.replace(/\/\.\//g, '/');

    return path;
};

/**
 * Adds the file:// protocol to a path if the platform requires it
 * @date 1/9/2024 - 12:12:32 PM
 */
export const addFileProtocol = (path: string) => {
    switch (os.platform()) {
        case 'linux':
            return clean(path);
        case 'windows':
            return 'file://' + clean(path);
        default:
            throw new Error('Unsupported platform: ' + os.platform());
    }
};

/**
 * Unifies paths across platforms, removes file:// protocol, and removes duplicate slashes
 * @date 1/9/2024 - 12:12:32 PM
 */
export const unify = (path: string) => {
    return clean(
        path
            .replace(/\\/g, '/')
            .replace(/\/+/g, '/')
            .replace(/^(file:\/)/, '')
            .replace(/\/\//g, '/'),
    );
};

/**
 * Combines multiple paths into one
 * @date 1/9/2024 - 12:12:32 PM
 */
export const resolve = (...paths: string[]): string => {
    // replace resolve with this function
    const move = (path1: string, path2: string): string => {
        path1 = unify(path1);
        path2 = unify(path2);

        const path1Parts = path1.split('/');
        const path2Parts = path2.split('/');

        for (const part of path2Parts) {
            switch (part) {
                case '.':
                    break;
                case '..':
                    path1Parts.pop();
                    break;
                default:
                    path1Parts.push(part);
                    break;
            }
        }

        return path1Parts.join('/');
    };

    let result = paths[0];
    for (let i = 1; i < paths.length; i++) {
        result = move(result, paths[i]);
    }

    return platformify(result);
};
// export const resolve = (...paths: string[]): string => path.resolve(...paths.map(unify));

/**
 * Finds the relative path from one file to another
 * @date 1/9/2024 - 12:12:32 PM
 */
export const relative = (from: string, to: string): string =>
    clean(path.relative(unify(from), unify(to)));
// export const relative = (from: string, to: string): string => {
//     from = unify(from);
//     to = unify(to);

//     // replace path.relative with this function

//     const path1Parts = from.split('/');
//     const path2Parts = to.split('/');

//     while (path1Parts[0] === path2Parts[0]) {
//         path1Parts.shift();
//         path2Parts.shift();
//     }

//     let result = '';
//     for (const _ of path1Parts) {
//         result += '../';
//     }

//     return platformify('./' + result + path2Parts.join('/'));
// };

/**
 * Root directory of the project
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __root: string = platformify(
    (() => {
        switch (os.platform()) {
            case 'linux':
                return new URL('../../', import.meta.url).pathname;
            case 'windows':
                // change /c:/path/to/file/ to C:/path/to/file
                return new URL('../../', import.meta.url).pathname
                    .replace(/^\/([a-z]):\//i, '$1:/') // change /c:/ to c:/
                    .replace(/.$/, ''); // remove trailing slash
            default:
                throw new Error('Unsupported platform: ' + os.platform());
        }
    })(),
);

/**
 * Uploads directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __uploads: string = resolve(__root, './storage/uploads/');

/**
 * Logs directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {string}
 */
export const __logs: string = resolve(__root, './storage/logs/');

/**
 * Templates directory
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
export const __templates: string = resolve(__root, './public/templates/');

/**
 * Directory of the file that called this function
 * @date 10/12/2023 - 3:24:39 PM
 */
export const __dirname = () => {
    const site = blog.callsites()[1];
    let p = relative(
        __root,
        site.getFileName()?.replace('file://', '').substring(1) || '',
    );
    p = unify(p);
    const data = p.split('/');
    data.pop();
    return platformify(data.join('/'));
};

/**
 * Name of the file that called this function
 * @date 1/9/2024 - 12:16:52 PM
 */
export const __filename = () => {
    const site = blog.callsites()[1];
    let p = relative(
        __root,
        site.getFileName()?.replace('file://', '').substring(1) || '',
    );
    p = unify(p);
    return platformify(p);
};

/**
 * The name of the parent folder of the file
 * @date 1/9/2024 - 12:12:32 PM
 */
export const dirname = (path: string) => {
    path = unify(path);
    const data = path.split('/');
    data.pop();
    return platformify(data.join('/'));
};

/**
 * The name of the file at the end of the path
 * @date 1/9/2024 - 12:12:32 PM
 */
export const basename = (path: string) => {
    path = unify(path);
    const data = path.split('/');
    return data.pop() || '';
};

/**
 * The extension of the file at the end of the path
 * @date 1/9/2024 - 12:14:33 PM
 */
export const extname = (path: string) => {
    const dirs = path.split('/');
    const file = dirs.pop() || ''; // get the file name (last element)
    return file.split('.').pop() || '';
};

/**
 * Environment variables
 * @date 10/12/2023 - 3:24:39 PM
 *
 * @type {*}
 */
const env: {
    [key: string]: string | undefined;
} = Deno.env.toObject();

// force load from .env file because Deno.env.toObject() doesn't always read it the first time
try {
    const file = resolve(__root, './.env');
    const data = Deno.readTextFileSync(file);
    const lines = data.split('\n');
    for (const line of lines) {
        const [key, value] = line.split('=');
        env[key.trim()] = value.replace(/"/g, '').replace(/'/g, '').trim();
    }
} catch {
    error(
        'Unable to read .env file, please make sure it exists and is formatted correctly.',
    );
}

export default env;
