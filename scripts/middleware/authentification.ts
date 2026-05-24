import { NextRequest } from 'next/server';

export async function RouteAuthorized(request: NextRequest): Promise<boolean>
{
    return true;
}

export function RouteProtected(pathname: string): boolean
{
    const isProtected = pathname.includes('/public/') == false;

    return isProtected;
}
