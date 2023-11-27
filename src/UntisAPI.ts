import Logger from "./logger";

export default class UntisAPI {
    public readonly school: string;
    public readonly webuser: string;
    public readonly password: string;
    public readonly weburl: string;

    private readonly logger = new Logger('Untis');

    constructor(school: string, weburl: string, webuser: string, password: string) {
        this.school = school;
        this.webuser = webuser;
        this.password = password;
        this.weburl = weburl;
    }
}