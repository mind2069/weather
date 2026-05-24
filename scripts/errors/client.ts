// import { LogsServiceClient } from "@/services/logs/client";
// import { LogsInsertParameters } from "@/services/logs/types";
// import { SessionEmpty } from "@/scripts/models/session";
// import { Session } from "@/scripts/types/session";

export class ErrorClient
{
    public static ApiRoute<T>(error: unknown, parameters: unknown, messageDefault: string, code: string): T
    {
        const message = error instanceof Error ? error.message : messageDefault;

        // let session: Session = SessionEmpty();

        // try
        // {
        //     if (parameters instanceof Object && 'session' in parameters)
        //     {
        //         session = parameters.session as Session;
        //     }
        // }
        // catch
        // {
        // }

        // const parametersLogs: LogsInsertParameters = 
        // {
        //     session: session,
        //     project: 'Logistics',
        //     category: 'Error',
        //     code: code,
        //     title: 'Error API Client',
        //     description: message,
        //     meta: JSON.stringify(error),
        // };

        // LogsServiceClient.Insert(parametersLogs).catch(() => {});

        return { success: false, data: null, codes: ['UnknownError'], message: message } as T;
    }
}