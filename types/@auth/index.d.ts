
import type { DefaultJWT } from '@auth/core/jwt';
import type {User as BaseUser } from '@auth/core/types';

type ExtendedUserFields = {
    student_id: string;
    group_list: string[];
    access_token: string | undefined;
    id_token: string | undefined;
}

declare module '@auth/core/jwt' {
    interface JWT extends ExtendedUserFields, DefaultJWT {}
}

declare module '@auth/core/types' {
    interface User extends ExtendedUserFields, BaseUser {}
    interface Session extends DefaultSession {
        user: ExtendedUserFields & DefaultSession['user']; 
    }
}