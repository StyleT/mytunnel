import {EventEmitter} from 'events';

declare interface Tunnel extends EventEmitter {
    url: string;
}

declare interface BootstrapOpts {
    port: number;
    host: string;
    subdomain?: string;
    local_host?: string;
    local_https?: boolean;
    local_cert?: string;
    local_key?: string;
    local_ca?: string;
    allow_invalid_cert?: boolean;
}

export default (opts: BootstrapOpts): Promise<Tunnel>;