import type { User } from './models';
import type { Branch } from './branch';

export interface SchoolSetting {
    id: number;
    school_id: number;
    webhook_url?: string | null;
    sms_sender?: string | null;
    telegram_bot_token?: string | null;
    telegram_channel_id?: string | null;
    timezone?: string;
    created_at?: string;
    updated_at?: string;
}

export interface UserSchool {
    id: number;
    user_id: number;
    school_id: number;
    user?: User;
    school?: School;
    created_at?: string;
    updated_at?: string;
}

export interface School {
    id: number;
    name: string;
    address?: string | null;
    comment?: string | null;
    branch_limit: number;
    branch_price: number | string;
    valid_date?: string | null;
    status: number;
    created_at?: string;
    updated_at?: string;
    branches_count?: number;
    branches?: Branch[];
    user_schools?: UserSchool[];
    school_setting?: SchoolSetting | null;
}

export interface SchoolPaginate {
    current_page: number;
    data: School[];
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: { url: string | null; label: string; active: boolean }[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}
