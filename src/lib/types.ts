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