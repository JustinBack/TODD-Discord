import { Permissions } from '../models';

export function bitmaskNames(Bitmask: any) {
    let _arr: any = [];
    for (var i in Permissions) {
        if (Bitmask & Permissions[i]) {
            _arr.push(i);
        }
    }
    return _arr;
}