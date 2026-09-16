import { Role } from '../../users/enums/role.enum';

// Staff who may see student/guardian personal data (names, phones, addresses).
export const STAFF_ROLES = [Role.INSTITUTE_ADMIN, Role.MANAGER, Role.ACCOUNTANT, Role.TEACHER];
// Staff who may create or change academic records.
export const MANAGE_ROLES = [Role.INSTITUTE_ADMIN, Role.MANAGER];
// Staff who may see salary figures.
export const FINANCE_VIEW_ROLES = [Role.INSTITUTE_ADMIN, Role.MANAGER, Role.ACCOUNTANT];
