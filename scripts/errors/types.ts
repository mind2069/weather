export const ErrorCodes = 
{
    UnknownError: 'UnknownError',
    ValidationError: 'ValidationError',
    NotFoundError: 'NotFoundError',
    UnauthorizedError: 'UnauthorizedError',
    DatabaseError: 'DatabaseError',
}

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];

export interface ErrorConfigurations 
{
    category: string;
    code: string;
    title: string;
    message: string;
    requireAuth?: boolean;
}

export interface ErrorResponse
{
    success: boolean;
    data: unknown | null;
    codes: string[];
    message: string;
}
