// src/services/BookingService.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class BookingService {

    static subscribeToNewBookings(callback) {
        // Placeholder for future WebSocket implementation
    }

    static async saveBooking(booking) {
        try {
            const pickupName =
                booking.pickup?.displayName ||
                booking.pickup?.name ||
                'Unknown Location';

            const dropoffName =
                booking.dropoff?.displayName ||
                booking.dropoff?.name ||
                'Unknown Location';

            const getSafeTimestamp = (timestamp) => {
                if (!timestamp) return new Date().toISOString();

                if (typeof timestamp === 'string') {
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) return timestamp;
                }

                if (timestamp instanceof Date) {
                    return timestamp.toISOString();
                }

                if (typeof timestamp === 'number') {
                    return new Date(timestamp).toISOString();
                }

                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }

                return new Date().toISOString();
            };

            const bookingData = {
                booking_number: booking.bookingNumber,
                pickup_location: pickupName,
                pickup_lat: booking.pickup?.lat || 0,
                pickup_lng: booking.pickup?.lng || 0,
                dropoff_location: dropoffName,
                dropoff_lat: booking.dropoff?.lat || 0,
                dropoff_lng: booking.dropoff?.lng || 0,
                distance: booking.distance || 0,
                duration: booking.duration || 0,
                fare: booking.fare || 0,
                timestamp: getSafeTimestamp(booking.timestamp),
                status: booking.status || 'pending',

                user_name: booking.userDetails?.fullName || '',
                user_phone: booking.userDetails?.contactNumber || ''
            };

            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();

            if (error) throw error;

            return {
                ...data,
                user_details: {
                    fullName: data.user_name || '',
                    contactNumber: data.user_phone || ''
                }
            };
        } catch (error) {
            throw new Error('Failed to save booking to database');
        }
    }

    static async getBookingByNumber(bookingNumber) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('booking_number', bookingNumber)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    throw new Error('Booking not found');
                }
                throw error;
            }

            return {
                ...data,
                user_details: {
                    fullName: data.user_name || '',
                    contactNumber: data.user_phone || ''
                }
            };
        } catch (error) {
            throw error;
        }
    }

    static async getAllBookings(limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('timestamp', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data.map((booking) => ({
                ...booking,
                user_details: {
                    fullName: booking.user_name || '',
                    contactNumber: booking.user_phone || ''
                }
            }));
        } catch (error) {
            throw new Error('Failed to fetch bookings');
        }
    }

    static async updateBookingStatus(bookingNumber, status) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .select()
                .single();

            if (error) throw error;

            return {
                ...data,
                user_details: {
                    fullName: data.user_name || '',
                    contactNumber: data.user_phone || ''
                }
            };
        } catch (error) {
            throw new Error('Failed to update booking status');
        }
    }

    static async cancelBooking(bookingNumber) {
        try {
            const { data: existingBooking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('booking_number', bookingNumber)
                .single();

            if (fetchError) throw new Error('Booking not found');

            if (existingBooking.status === 'cancelled') {
                throw new Error('Booking is already cancelled');
            }

            if (existingBooking.status === 'completed') {
                throw new Error('Cannot cancel a completed booking');
            }

            if (!['pending', 'confirmed'].includes(existingBooking.status)) {
                throw new Error(
                    `Cannot cancel booking with status: ${existingBooking.status}`
                );
            }

            const { data, error } = await supabase
                .from('bookings')
                .update({
                    status: 'cancelled',
                    updated_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .select()
                .single();

            if (error) throw error;

            return {
                success: true,
                data: {
                    ...data,
                    user_details: {
                        fullName: data.user_name || '',
                        contactNumber: data.user_phone || ''
                    }
                },
                message: 'Booking cancelled successfully'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message || 'Failed to cancel booking',
                data: null
            };
        }
    }

    static async deleteBooking(bookingNumber) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('booking_number', bookingNumber);

            if (error) throw error;

            return true;
        } catch (error) {
            throw new Error('Failed to cancel booking');
        }
    }

    static async searchBookingsByLocation(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .or(
                    `pickup_location.ilike.%${searchTerm}%,dropoff_location.ilike.%${searchTerm}%`
                )
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data.map((booking) => ({
                ...booking,
                user_details: {
                    fullName: booking.user_name || '',
                    contactNumber: booking.user_phone || ''
                }
            }));
        } catch (error) {
            throw new Error('Failed to search bookings');
        }
    }

    static async searchBookingsByCustomer(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .or(
                    `user_name.ilike.%${searchTerm}%,user_phone.ilike.%${searchTerm}%`
                )
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data.map((booking) => ({
                ...booking,
                user_details: {
                    fullName: booking.user_name || '',
                    contactNumber: booking.user_phone || ''
                }
            }));
        } catch (error) {
            throw new Error('Failed to search bookings by customer');
        }
    }
}
