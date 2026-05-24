import { NextRequest, NextResponse } from 'next/server';
// import { LogsServiceServer } from '@/services/logs/server';
// import { LogsInsertParameters } from '@/services/logs/types';
// import { SessionEmpty } from '@/scripts/models/session';
// import { Session } from '@/scripts/types/session';
import { ErrorCodes, ErrorConfigurations, ErrorResponse } from '@/scripts/errors/types';
import { RouteAuthorized } from '@/scripts/middleware/authentification';

export class ErrorHandler 
{
    public static async ApiRoute<T extends ErrorResponse>(request: NextRequest, configurations: ErrorConfigurations, handler: (request: NextRequest) => Promise<T>): Promise<NextResponse<ErrorResponse>> 
    {
        const requireAuth = configurations.requireAuth !== false;

        if (requireAuth)
        {
            const isAuthorized = await RouteAuthorized(request);

            if (!isAuthorized)
            {
                const response = 
                {
                    success: false,
                    data: null,
                    codes: [ErrorCodes.UnauthorizedError],
                    message: 'Unauthorized',
                } as T;

                return NextResponse.json(response, { status: 401 });
            }
        }

        let body: unknown = null;
        //let session: Session = SessionEmpty();

        try 
        {
            body = await request.json();
            
            if (body && typeof body === 'object' && 'session' in body) 
            {
                //session = (body as { session: Session }).session;
            }
        } 
        catch 
        {
        }

        try 
        {
            const requestWithBody = new NextRequest(request.url, 
            {
                method: request.method,
                headers: request.headers,
                body: body ? JSON.stringify(body) : undefined,
            });

            const response = await handler(requestWithBody);

            return NextResponse.json(response);
        } 
        catch (error: unknown) 
        {
            const message = error instanceof Error ? error.message : configurations.message;

            // const meta = 
            // {
            //     parameters: body,
            //     error: 
            //     {
            //         message: message,
            //         stack: error instanceof Error ? error.stack : undefined,
            //     },
            //     url: request.url,
            //     method: request.method,
            // };

            // const parametersLogs: LogsInsertParameters = 
            // {
            //     session: session,
            //     project: 'Logistics',
            //     category: configurations.category,
            //     code: configurations.code,
            //     title: configurations.title,
            //     description: message,
            //     meta: JSON.stringify(meta)
            // };

            // LogsServiceServer.Insert(parametersLogs).catch(() => {});

            const response = 
            {
                success: false,
                data: null,
                codes: [ErrorCodes.UnknownError],
                message: message,

            } as T;

            return NextResponse.json(response, { status: 500 });
        }
    }
}