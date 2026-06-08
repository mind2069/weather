import { Session } from '@/scripts/types/session';

export function SessionEmpty(): Session
{
    const data: Session = 
    {
        token: 
        {
            access: '',
            refresh: ''
        },
        language:
        {
            id: '',
            code: ''
        },
        tracking:
        {
            ip_address: '0.0.0.0',
            pathname: '',
            section: '',
            page: '',
            filename: '',
            code: ''
        },
        user: 
        {
            id: 0,
            ui: '0',
            auth_users_id: '',
            first_name: '',
            last_name: '',
            email: '',
            phone: '',
            unit: 'metric',
            locale: 'en-CA',
            location:
            {
                name: '',
                latitude: -999999,
                longitude: -999999,
            }
        },
        mode: 'application'
    };

    return data;
}