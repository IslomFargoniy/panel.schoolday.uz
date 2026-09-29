import type { Branch } from './branch';

export interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

export interface PaginatedResponse<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number | null;
    last_page: number;
    last_page_url: string;
    links: PaginationLink[];
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number | null;
    total: number;
}

export interface Shift {
    id: number;
    name: string;
    start_time: string;
    end_time: string;
    branch_id?: number | null;
    branch?: Branch;
    classes_count?: number;
    students_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface SchoolClass {
    id: number;
    name: string;
    shift_id: number;
    shift?: Shift;
    telegram_group_id?: string | null;
    students_count?: number;
    present_today_count?: number;
    created_at?: string;
    updated_at?: string;
}

export interface Student {
    id: number;
    name: string;
    phone?: string | null;
    address?: string | null;
    comment?: string | null;
    employeeNoString: string;
    status: 'active' | 'inactive' | string;
    telegram_id?: string | null;
    class_id: number;
    face_image?: string | null;
    gender?: string | null;
    user_verify_mode?: string | null;
    local_ui_right?: boolean;
    door_right?: string | null;
    plan_template_no?: string | null;
    valid_enabled?: boolean;
    valid_begin?: string | null;
    valid_end?: string | null;
    school_class?: SchoolClass;
    schoolClass?: SchoolClass;
    attendances?: DailyAttendance[];
    created_at?: string;
    updated_at?: string;
}

export interface DailyAttendance {
    id: number;
    student_id: number;
    student?: Student;
    date: string;
    first_check_in?: string | null;
    last_check_out?: string | null;
    is_late?: boolean;
    is_left_early?: boolean;
    start_time?: string | null;
    end_time?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface HikvisionAccessEvent {
    id: number;
    deviceName?: string | null;
    majorEventType?: number | null;
    subEventType?: number | null;
    name?: string | null;
    cardReaderNo?: number | null;
    employeeNoString?: string | null;
    serialNo?: number | null;
    userType?: string | null;
    currentVerifyMode?: string | null;
    mask?: string | null;
    pictureURL?: string | null;
    hikvision_access_id?: number;
    created_at?: string;
    updated_at?: string;
}
