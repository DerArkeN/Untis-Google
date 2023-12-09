import { Session, Result } from 'untis-api';
import Logger from "./logger";
import Axios, { AxiosInstance } from 'axios';

export default class UntisAPI {
    public readonly school: string;
    public readonly webuser: string;
    public readonly password: string;
    public readonly weburl: string;

    private readonly logger = new Logger('Untis');
    private readonly axios: AxiosInstance;

    constructor(school: string, weburl: string, webuser: string, password: string) {
        this.school = school;
        this.webuser = webuser;
        this.password = password;
        this.weburl = weburl;

        this.axios = Axios.create({
            baseURL: 'https://' + weburl + '/',
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
                'X-Requested-With': 'XMLHttpRequest'
            },
            validateStatus: function(status) {
                return status >= 200 && status < 303;
            },
        });
    }

    private async request(method: string, params: []): Promise<Result> {
        const response = await this.axios({
            method: 'POST',
            url: `/WebUntis/jsonrpc.do`,
            params: {
                school: this.school
            },
            data: {
                id: 'Goontis',
                method: method,
                params: params,
                jsonrpc: '2.0'
            }
        });
        return response.data.result;
    }
}