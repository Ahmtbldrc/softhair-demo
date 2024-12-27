export type StaffType = {
  id: number,
  firstName: string,
  lastName: string,
  email: string,
  username: string,
  password: string,
  userId: string,
  image: string,
  status: boolean,
  services: ServiceType[],
  weeklyHours: WeeklyHours
}

export type WeeklyHours = {
  [key: string]: TimeSlot[];
}

export type TimeSlot = {
  start: string;
  end: string;
}

export type ServiceType = {
  service: {
    id: number,
    name: string
  }
}

export enum Roles {
  ADMIN = 'admin',
  STAFF = 'staff',
  USER = 'user'
}

export enum AnalyticType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export type Staff = {
  id: number;
  firstName: string;
  lastName: string;
  image: string;
  email: string;
  status: boolean; // true: active, false: passive
  weeklyHours: {
    [key: string]: { start: string; end: string }[];
  };
  services: {
    service: {
      id: number;
      name: string;
    };
  }[];
}

export interface Service {
  id: number;
  name: string;
  price: number;
  status: boolean;
  branchId: number;
  created_at?: string;
}

export interface Reservation {
  id: number;
  serviceId: number;
  staffId: number;
  branchId: number;
  start: Date;
  end: Date;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  status: boolean;
}

export type Branch = {
  id: number;
  created_at: Date;
  name: string;
  status: boolean;
}

