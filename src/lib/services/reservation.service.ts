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
    
    const reservationPayload = {
        ...reservationData,
        start: formattedStart,
        end: formattedEnd,
        createdat: formattedCreatedAt
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
    let query = supabase
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
        // Günlük görünüm: Sadece seçili günün randevuları
        query = query
            .gte('start', params.startDate)
            .lt('start', params.endDate)
    } else if (params.view === 'week') {
        // Haftalık görünüm: Haftanın başlangıcı ile bitişi arasındaki randevular
        query = query
            .or(`start.gte.${params.startDate},end.lte.${params.endDate}`)
    } else {
        // Aylık görünüm: Ayın başlangıcı ile bitişi arasındaki randevular
        query = query
            .gte('start', params.startDate)
            .lt('start', params.endDate)
    }

    if (params.staffId) {
        query = query.eq('staffId', params.staffId)
    }

    if (params.status !== undefined) {
        query = query.eq('status', params.status)
    }

    const { data, error } = await query

    if (error) {
        console.error('Error fetching reservations:', error.message)
        return { error: error.message }
    }

    return { data: data as ReservationWithDetails[] }
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