import { supabase } from "../supabase"

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