declare module 'untis-api' {
    type Session = {
        klasseId?: number;
        personId?: number;
        sessionId?: string;
        personType?: number;
        jwt_token?: string;
    };
    type Result = {
        id: string;
        result: Object;
    };

    export { Session, Result };
}