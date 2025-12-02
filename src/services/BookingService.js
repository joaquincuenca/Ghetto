// src/services/BookingService.js
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export class BookingService {
    /**
     * Save a booking to the database
     * @param {Booking} booking - The booking object to save
     * @returns {Promise<Object>} The saved booking data
     */
    static async saveBooking(booking) {
        try {
            // Debug: Log the booking object
            console.log('📦 Full booking object:', booking);
            console.log('📍 Pickup object:', booking.pickup);
            console.log('📍 Dropoff object:', booking.dropoff);

            // Handle both Location objects and plain objects with displayName or name
            const pickupName = booking.pickup?.displayName || booking.pickup?.name || 'Unknown Location';
            const dropoffName = booking.dropoff?.displayName || booking.dropoff?.name || 'Unknown Location';

            console.log('✅ Extracted names:', { pickupName, dropoffName });

            // Safely handle timestamp
            const getSafeTimestamp = (timestamp) => {
                if (!timestamp) {
                    return new Date().toISOString();
                }
                
                // If it's already a valid ISO string, return it
                if (typeof timestamp === 'string') {
                    // Check if it's a valid date string
                    const date = new Date(timestamp);
                    if (!isNaN(date.getTime())) {
                        return timestamp;
                    }
                }
                
                // If it's a Date object
                if (timestamp instanceof Date) {
                    return timestamp.toISOString();
                }
                
                // If it's a number (timestamp in ms)
                if (typeof timestamp === 'number') {
                    return new Date(timestamp).toISOString();
                }
                
                // Try to create a date from whatever it is
                const date = new Date(timestamp);
                if (!isNaN(date.getTime())) {
                    return date.toISOString();
                }
                
                // Fallback to current time
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
                status: booking.status || 'pending'
            };

            console.log('📤 Data being sent to Supabase:', bookingData);

            const { data, error } = await supabase
                .from('bookings')
                .insert([bookingData])
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Booking saved to database:', data);
            return data;
        } catch (error) {
            console.error('❌ Error saving booking:', error);
            throw new Error('Failed to save booking to database');
        }
    }

    /**
     * Fetch a booking by booking number
     * @param {string} bookingNumber - The booking number to search for
     * @returns {Promise<Object>} The booking data
     */
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

            console.log('✅ Booking fetched:', data);
            return data;
        } catch (error) {
            console.error('❌ Error fetching booking:', error);
            throw error;
        }
    }

    /**
     * Get all bookings (with optional pagination)
     * @param {number} limit - Number of bookings to fetch
     * @param {number} offset - Offset for pagination
     * @returns {Promise<Array>} Array of bookings
     */
    static async getAllBookings(limit = 50, offset = 0) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .order('timestamp', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ Error fetching bookings:', error);
            throw new Error('Failed to fetch bookings');
        }
    }

    /**
     * Update booking status
     * @param {string} bookingNumber - The booking number
     * @param {string} status - New status (pending, confirmed, completed, cancelled)
     * @returns {Promise<Object>} Updated booking data
     */
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

            console.log('✅ Booking status updated:', data);
            return data;
        } catch (error) {
            console.error('❌ Error updating booking status:', error);
            throw new Error('Failed to update booking status');
        }
    }

    /**
     * Delete a booking (soft delete by updating status)
     * @param {string} bookingNumber - The booking number to delete
     * @returns {Promise<boolean>} Success status
     */
    static async deleteBooking(bookingNumber) {
        try {
            const { error } = await supabase
                .from('bookings')
                .update({ status: 'cancelled' })
                .eq('booking_number', bookingNumber);

            if (error) throw error;

            console.log('✅ Booking cancelled:', bookingNumber);
            return true;
        } catch (error) {
            console.error('❌ Error cancelling booking:', error);
            throw new Error('Failed to cancel booking');
        }
    }

    /**
     * Search bookings by pickup or dropoff location
     * @param {string} searchTerm - Location to search for
     * @returns {Promise<Array>} Array of matching bookings
     */
    static async searchBookingsByLocation(searchTerm) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .or(`pickup_location.ilike.%${searchTerm}%,dropoff_location.ilike.%${searchTerm}%`)
                .order('timestamp', { ascending: false });

            if (error) throw error;

            return data;
        } catch (error) {
            console.error('❌ Error searching bookings:', error);
            throw new Error('Failed to search bookings');
        }
    }
}