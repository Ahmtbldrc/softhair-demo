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

export type Service = {
  id: number;
  name: string;
  price: number;
}

export type Reservation = {
  id: number;
  serviceId: number;
  start: Date;
  end: Date;
  staffId: number;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}