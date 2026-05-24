export interface Session
{
    token: SessionToken;
    language: SessionLanguage;
    tracking: SessionTracking;
    user: SessionUser;
    mode: string;
}

export interface SessionToken
{
    access: string;
    refresh: string;
}

export interface SessionLanguage
{
    id: string;
    code: string;
}

export interface SessionTracking
{
    ip_address: string;
    pathname: string;
    filename: string;
    code: string;
    page: string;
}

export interface SessionUser
{
    id: number;
    ui: string;
    auth_users_id: string;
    first_name: string;
    last_name: string;
    email: string;
    phone: string;
    unit: string;
    locale: string;
    location:
    {
        name: string;
        latitude: number;
        longitude: number;
    };
}