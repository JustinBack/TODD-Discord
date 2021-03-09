import { Permissions } from '../models';

/**
 * Load all commands in the `commands/` folder and return a collection of
 * commands.
 */
export function bitmaskNames(Bitmask: any) {
    let _arr:any = [];
    for(var i in Permissions){
        if(Bitmask & Permissions[i]){
            _arr.push(i);
        }
    }
    return _arr;
}