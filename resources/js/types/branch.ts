/** Where an ISUP terminal connects to: either the IP or the domain works. */
export interface IsupServer {
    ip: string;
    domain: string;
    port: number;
}

export interface BranchDevice {
    id: number;
    branch_id: number;
    branch?: Branch;
    name?: string | null;
    mac_address?: string | null;
    device_id?: string | null;
    connection_type: 'isup' | 'http_listening';
    status: boolean;
    is_online: boolean;
    last_seen_at?: string | null;
    encryption_key?: string | null;
    created_at?: string;
    updated_at?: string;
}

export interface Branch {
    id: number;
    name: string;
    description?: string | null;
    mac_address_list?: string[];
    devices?: BranchDevice[];
    shifts_count?: number;
    classes_count?: number;
    total_students?: number;
    present_students?: number;
    on_time_students?: number;
    late_students?: number;
    created_at?: string;
    updated_at?: string;
}
