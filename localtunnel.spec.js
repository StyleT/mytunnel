/* eslint-disable no-console */

const crypto = require('crypto');
const http = require('http');
const https = require('https');
const url = require('url');
const supertest = require('supertest');
const chai = require('chai');
chai.use(require('chai-string'));
const expect = chai.expect;
const assert = require('assert');

const localtunnel = require('./localtunnel');

let fakePort;
let testServer;

describe('localtunnel', () => {

    before(done => {
        testServer = http.createServer();
        testServer.on('request', (req, res) => {
            res.write(req.headers.host);
            res.end();
        });
        testServer.listen(() => {
            const { port } = testServer.address();
            fakePort = port;
            done();
        });
    });

    after(() => {
        testServer.close();
    });

    it('query localtunnel server w/ ident', async () => {
        const tunnel = await localtunnel({ port: fakePort });

        try {
            await supertest(tunnel.url)
                .get('/')
                .expect(200)
                .expect(res => {
                    expect(tunnel.url).to.endsWith(res.text);
                });
        } finally {
            tunnel.close();
        }
    });

    it('request specific domain', async () => {
        const subdomain = Math.random()
            .toString(36)
            .substr(2);
        const tunnel = await localtunnel({ port: fakePort, subdomain });
        tunnel.close();

        expect(tunnel.url).to.startsWith(`https://${subdomain}.`);
    });

    describe('--local-host localhost', () => {
        it('override Host header with local-host', async () => {
            const tunnel = await localtunnel({ port: fakePort, local_host: 'localhost' });

            try {
                await supertest(tunnel.url)
                    .get('/')
                    .expect(200)
                    .expect(res => {
                        expect(res.text).to.equal('localhost');
                    });
            } finally {
                tunnel.close();
            }
        });
    });

    describe('--local-host 127.0.0.1', () => {
        it('override Host header with local-host', async () => {
            const tunnel = await localtunnel({ port: fakePort, local_host: '127.0.0.1' });

            try {
                await supertest(tunnel.url)
                    .get('/')
                    .expect(200)
                    .expect(res => {
                        expect(res.text).to.equal('127.0.0.1');
                    });
            } finally {
                tunnel.close();
            }
        });

        it('send chunked request', async () => {
            const tunnel = await localtunnel({ port: fakePort, local_host: '127.0.0.1' });

            const parsed = url.parse(tunnel.url);
            const opt = {
                host: parsed.host,
                port: 443,
                headers: {
                    host: parsed.hostname,
                    'Transfer-Encoding': 'chunked',
                },
                path: '/',
            };

            await new Promise((resolve, reject) => {
                const req = https.request(opt, res => {
                    res.setEncoding('utf8');
                    let body = '';

                    res.on('data', chunk => {
                        body += chunk;
                    });

                    res.on('end', () => {
                        try {
                            assert.strictEqual(body, '127.0.0.1');
                        } catch (e) {
                            reject(e);
                        } finally {
                            tunnel.close();
                        }
                        resolve();
                    });
                });

                req.end(crypto.randomBytes(1024 * 8).toString('base64'));
            });
        });
    });
});