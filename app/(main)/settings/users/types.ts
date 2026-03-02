export interface UserRole {
    id: number;
    name: string;
    is_primary: boolean;
}

export interface User {
    id: number;
    username: string | null;
    name: string;
    email: string;
    employee_number: string | null;
    position: string | null;
    title: string | null;
    department_id: number | null;
    department_name: string | null;
    role_id: number | null;
    role_name: string | null;
    roles?: UserRole[];
    rank_id: number | null;
    rank_name: string | null;
    rank_code: string | null;
    grade: string | null;
    status: string;
    phone: string | null;
    address: string | null;
    address_detail: string | null;
    postcode: string | null;
    user_state: string | null;
    contract_type: string | null;
    joined_date: string | null;
    resignation_date: string | null;
    must_change_password: boolean;
}

export interface Department {
    id: number;
    name: string;
    parent_department_id: number | null;
}

export interface Role {
    id: number;
    name: string;
}

export interface CommonCode {
    id: number;
    code: string;
    name: string;
    display_order: number;
}
