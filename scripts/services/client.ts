import { FetchHelper } from '@/scripts/helpers/fetch';
import { ErrorClient } from '@/scripts/errors/client';

export class ServiceClient
{
    public static async Execute<T>(path: string, parameters: unknown, messageDefault: string, code: string): Promise<T>
    {
        try
        {
            const response = await FetchHelper.Post(path, parameters);
            
            return (await response.json()) as T;
        }
        catch (error: unknown)
        {
            return ErrorClient.ApiRoute<T>(error, parameters, messageDefault, code);
        }
    }
}