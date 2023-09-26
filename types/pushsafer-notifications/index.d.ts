declare module "pushsafer-notifications" {
    export default class Pushsafer {
        constructor(options: {httpOptions?: any, k: string, debug?: boolean});
        send(msg: any, callback: (err: Error?, data: string?) => void): void;
        errors(d: any): void;
    }
}