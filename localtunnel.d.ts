import {EventEmitter} from 'events';

declare interface Tunnel extends EventEmitter {
    url: string;
}

declare interface BootstrapOpts {
    port: number;
    allow_invalid_cert?: boolean;
    local_https?: boolean;
}

export default (opts: BootstrapOpts): Promise<Tunnel>;