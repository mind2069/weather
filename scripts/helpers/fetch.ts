export class FetchHelper
{
    public static async Get(url: string): Promise<Response>
    {
        const response = await fetch(url, 
        {
            method: 'GET',
        });

        return response;
    }

    public static async Post(url: string, body: any): Promise<Response>
    {
        const response = await fetch(url, 
        {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        return response;
    }
}