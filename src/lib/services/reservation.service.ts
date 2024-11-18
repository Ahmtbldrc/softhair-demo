import { supabase } from "../supabase"

export const getReservationCount = async (startDate: string, endDate: string) => {
    const { data, error } = await supabase
        .rpc('get_reservation_count', { start_date: startDate, end_date: endDate });

    if (error) {
        console.error('Error getting reservation count:', error);
        return;
    }

    return data[0];
}

export const deleteReservation = async (reservationId: number) => {
    supabase.from('reservations')
        .update({ status: false })
        .eq('id', reservationId)
        .then((result) => {
            if (result.error) {
                console.error('Error updating reservation status:', result.error.message)
                return result.error;
            }
        })

    return null;
}