import * as pathToRegexp from 'path-to-regexp';
import {
  STATUS,
  getStatusText,
  RequestInfo
} from 'angular-in-memory-web-api';

const MOCK_META = '__mock__';

/**
 * Utility for matching mock URL decorators to the corresponding method
 * and creating a HTTP response.
 *
 * Invoke it like this:
 *     matchRoute(myInMemoryDbInstance)(typeOfReq, reqInfo);
 */
export function matchRoute(ctrl) {
  const routes = ctrl[MOCK_META];

  return (type, req) => {
    console.log(`[HTTP] Request override`, type, req.url);

    for (const {
        method,
        path,
        name
      } of routes) {
      if (path) {
        const keys = [];
        const re = pathToRegexp(path, keys);

        // strip query params
        const [url] = req.url.split('?');
        const match = re.test(url);

        if (match) {
          if (method === type) {
            // attach our mapped params to the reqinfo
            req.route = mapParams(re, keys, req.url);
            // invoke our method wrapping the response
            return req.utils.createResponse$(() => finishOptions(ctrl[name](req), req));
          }
        }
      }
    }

    // if we didn't match a URL, call the generic type
    for (const {
        method,
        path,
        name
      } of routes) {
      if (path === undefined && type === method) {
        return req.utils.createResponse$(() => finishOptions(ctrl[name](req), req));
      }
    }

    throw new Error(`Route not matched ${type}:${req.url}`);
  };
}

/**
 * Given a regex-path-map expression and a url, it returns
 * the parameters for the given url.
 *
 * Example:
 *    /api/foo/:bar/:car
 *
 * with the following url invoked:
 *    api/foo/100/porche
 *
 * would return:
 *    { bar: '100', car: 'porche' }
 *
 * Adapted from: https://github.com/pillarjs/path-match
 */
function mapParams(re, keys, pathname, params = {}) {
  const m = re.exec(pathname);
  if (!m) {
    return false;
  }

  let key;
  let param;
  for (let i = 0; i < keys.length; i++) {
    key = keys[i];
    param = m[i + 1];

    if (!param) {
      continue;
    }

    params[key.name] = decodeURIComponent(param);

    if (key.repeat) {
      params[key.name] = params[key.name].split(key.delimiter);
    }
  }

  return params;
}

/**
 * Method to polish out the http req info.
 */
export function finishOptions(options, {
  headers,
  url
}: RequestInfo) {
  options.status = options.status || STATUS.OK;
  options.statusText = getStatusText(options.status);
  options.headers = headers;
  options.url = url;
  return options;
}

/**
 * Creates metadata object.
 * https://github.com/angular/angular/blob/master/packages/core/src/util/decorators.ts#L60
 */
export function ensureStoreMetadata(target: any) {
  if (!target.hasOwnProperty(MOCK_META)) {
    Object.defineProperty(target, MOCK_META, {
      value: []
    });
  }
  return target[MOCK_META];
}

/**
 * Decorator for defining a mock method.
 *
 * Example:
 *    @Mock('get', 'api/foo/:bar')
 *    myFn(reqInfo) { ... }
 */
export function Mock(method: string, path ? : string) {
  return (target: any, name: string, descriptor: TypedPropertyDescriptor < any > ) => {
    const metadata = ensureStoreMetadata(target);
    metadata.push({
      method,
      path,
      name
    });
  };
}

/**
 * Decorator shortcut for calling `Mock` decorator with 'get' parameter.
 */
export const MockGet = (path ? : string) => Mock('get', path);

/**
 * Decorator shortcut for calling `Mock` decorator with 'post' parameter.
 */
export const MockPost = (path ? : string) => Mock('post', path);

/**
 * Decorator shortcut for calling `Mock` decorator with 'put' parameter.
 */
export const MockPut = (path ? : string) => Mock('put', path);

/**
 * Decorator shortcut for calling `Mock` decorator with 'delete' parameter.
 */
export const MockDelete = (path ? : string) => Mock('delete', path);