import { ReservationWithDetails } from "../types";
import { supabase } from "../supabase"
import dayjs from 'dayjs';

export const getReservationCount = async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
        .rpc('get_reservation_count', { start_date: startDate, end_date: endDate });

    if (error) {
        console.error('Error getting reservation count:', error);
        return;
    }

    return data[0];
}

export const getReservationCountFromView = async (branchId: number) => {
    if (branchId <= 0) return { data: null };

    const { data, error } = await supabase
        .from('reservation_count_view')
        .select('*')
        .eq('branchId', branchId)
        .single();

    if (error) {
        console.error('Error getting reservation count:', error);
        return { data: null };
    }

    return { data };
}

export const createReservation = async (reservationData: {
    serviceId: number;
    staffId: number;
    branchId: number;
    start: string | dayjs.Dayjs;
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
    };
    status: boolean;
}) => {
    const startDayjs = dayjs(reservationData.start);
    
    // Get service duration
    const { data: serviceData, error: serviceError } = await supabase
        .from('services')
        .select('duration')
        .eq('id', reservationData.serviceId)
        .single();

    if (serviceError || !serviceData) {
        console.error('Error getting service duration:', serviceError);
        return { error: 'Failed to get service duration' };
    }

    const endDayjs = startDayjs.add(serviceData.duration, 'minute');
    const now = dayjs();
    
    const formattedStart = startDayjs.format('YYYY-MM-DD HH:mm:ss');
    const formattedEnd = endDayjs.format('YYYY-MM-DD HH:mm:ss');
    const formattedCreatedAt = now.format('YYYY-MM-DD HH:mm:ss');

    // First, check if customer exists
    const { data: existingCustomer, error: existingCustomerError } = await supabase
        .from('customers')
        .select('*')
        .eq('email', reservationData.customer.email)
        .single();

    let customerData;

    if (existingCustomer) {
        // Use existing customer
        customerData = existingCustomer;
    } else {
        // Create new customer if doesn't exist
        const { data: newCustomer, error: customerError } = await supabase
            .from('customers')
            .insert({
                name: reservationData.customer.firstName,
                surname: reservationData.customer.lastName,
                email: reservationData.customer.email,
                phone: reservationData.customer.phone,
                gender: 'male', // Default gender
                updatedAt: formattedCreatedAt
            })
            .select()
            .single();

        if (customerError) {
            console.error('Error creating customer:', customerError);
            return { error: 'Failed to create customer' };
        }

        customerData = newCustomer;
    }
    
    const reservationPayload = {
        serviceId: reservationData.serviceId,
        staffId: reservationData.staffId,
        branchId: reservationData.branchId,
        start: formattedStart,
        end: formattedEnd,
        createdat: formattedCreatedAt,
        customerId: customerData.id,
        status: reservationData.status
    };
   
    const { data, error } = await supabase
        .from('reservations')
        .insert([reservationPayload])
        .select()

    if (error) {
        console.error('Error creating reservation:', error.message)
        return { error: error.message }
    }

    return { data: data[0] as ReservationWithDetails }
}

export const deleteReservation = async (reservationId: number) => {
    const { error } = await supabase
        .from('reservations')
        .update({ status: false })
        .eq('id', reservationId)

    if (error) {
        console.error('Error updating reservation status:', error.message)
        return { error: error.message }
    }

    return null
}

export const getReservations = async (params: {
    branchId: number;
    startDate: string;
    endDate: string;
    staffId?: number;
    status?: boolean;
    view?: 'day' | 'week' | 'month';
}) => {
    // Önce rezervasyonları al
    let reservationsQuery = supabase
        .from('reservations')
        .select(`
            *,
            service:services (*),
            staff:staff (*),
            branch:branches (*)
        `)
        .eq('branchId', params.branchId)

    // Görünüme göre tarih aralığı kontrolü
    if (params.view === 'day') {
        reservationsQuery = reservationsQuery
            .gte('start', params.startDate)
            .lt('start', params.endDate)
    } else if (params.view === 'week') {
        reservationsQuery = reservationsQuery
            .or(`start.gte.${params.startDate},end.lte.${params.endDate}`)
    } else {
        reservationsQuery = reservationsQuery
            .gte('start', params.startDate)
            .lt('start', params.endDate)
    }

    if (params.staffId) {
        reservationsQuery = reservationsQuery.eq('staffId', params.staffId)
    }

    if (params.status !== undefined) {
        reservationsQuery = reservationsQuery.eq('status', params.status)
    }

    const { data: reservations, error: reservationsError } = await reservationsQuery

    if (reservationsError) {
        console.error('Error fetching reservations:', reservationsError.message)
        return { error: reservationsError.message }
    }

    // Müşteri bilgilerini ayrı bir sorgu ile al
    const { data: customers, error: customersError } = await supabase
        .from('customers')
        .select('*')

    if (customersError) {
        console.error('Error fetching customers:', customersError.message)
        return { error: customersError.message }
    }

    // Rezervasyonları ve müşteri bilgilerini birleştir
    const transformedData = reservations.map(reservation => {
        const customer = customers.find(c => c.id === reservation.customerId) || {
            id: 0,
            name: 'Unknown',
            surname: 'Customer',
            email: '',
            phone: '',
            gender: ''
        }

        return {
            ...reservation,
            customer: {
                id: customer.id,
                name: customer.name,
                surname: customer.surname,
                email: customer.email,
                phone: customer.phone,
                gender: customer.gender
            }
        }
    })

    return { data: transformedData as ReservationWithDetails[] }
}

export const getDailyIncomeForWeeks = async (branchId: number) => {
    const { data, error } = await supabase
        .from('daily_income_for_weeks_by_branch_view')
        .select('*')
        .eq('branchId', branchId);

    if (error) {
        console.error('Error getting daily income for weeks:', error);
        return null;
    }

    const mappedData = data.map((item) => ({
        day: item.day?.trim() ?? '',
        thisWeek: item.this_week ?? 0,
        lastWeek: item.last_week ?? 0,
    }));

    return mappedData;
}

export const getRecentTransactions = async (branchId: number) => {
    if (branchId <= 0) return { data: [] };

    const { data, error } = await supabase
        .from('recent_transactions_view')
        .select('*')
        .eq('branchId', branchId);

    if (error) {
        console.error('Error getting recent transactions:', error);
        return { data: [] };
    }

    return { data: data || [] };
}