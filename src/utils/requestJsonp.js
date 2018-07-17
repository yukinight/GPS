import { VtxUtil } from './util';
/**
 * Requests a URL, returning a promise.
 *
 * @param  {string} url       The URL we want to request
 * @param  {object} [options] The options we want to pass to "fetch"
 * @return {object}           An object containing either "data" or "err"
 */
// export default function request(url, options) {
//   return fetch(url, options)
//     .then(checkStatus)
//     .then(parseJSON)
//     .then((data) => ({ data }))
//     .catch((err) => ({ err }));
// }
export default function request(url, options) {
    let ajaxPropmise = new Promise((resolve, reject) => {
        $.ajax({
            type: options.method,
            url: url,
            data: options.body || null,
            dataType: 'jsonp',
            jsonp: 'gpsback',
            async: true,
            success: function (data) {
                resolve(data);
            },
            error: function (XMLHttpRequest, textStatus, errorThrown) {
                reject(textStatus);
            }
        });
    });
    return ajaxPropmise.then(data => ({ data }))
        .catch(err => {
            console.error("请求数据失败")
            return { data: null };
        });
}