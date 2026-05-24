import { NextRequest } from 'next/server';
import { LocationsSearchParameters, LocationsSearchResponse } from '@/services/locations/types';
import { LocationsServiceServer } from '@/services/locations/server';
import { ErrorHandler } from '@/scripts/errors/handler';

export async function POST(request: NextRequest) 
{
    return ErrorHandler.ApiRoute<LocationsSearchResponse>(
        request,
        {
            category: 'LocationsSearch',
            code: 'olo09d',
            title: 'Locations search failed API',
            message: 'An error occurred during locations search',
        },
        async (req) => 
        {
            const parameters: LocationsSearchParameters = await req.json();

            return await LocationsServiceServer.Search(parameters);
        }
    );
}
