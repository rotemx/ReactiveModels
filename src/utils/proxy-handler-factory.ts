import {Log} from "./log";

type ProxyHandlerFn = (key: string, updateFn: (data:{[key:string]: any}) => void) => { get: (target, property) => any, set: (target, property, value, reciever) => any };

export const proxyHandlerFactory: ProxyHandlerFn =
    (key, updateFn) => {
    return {
        get: (target, property) => {
            return target[property];
        },
        set: (target, property, value, receiver) => {
            Log('Proxy: setting ' + property + ' for ' + target + ' with value ' + value);
            target[property] = value;
            updateFn({[key]: target})
            return true;
        }
    }
}
