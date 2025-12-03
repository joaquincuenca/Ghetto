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
            console.log('🔄 Service: Updating booking status', { bookingNumber, status });
            
            const { data, error } = await supabase
                .from('bookings')
                .update({
                    status,
                    updated_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .select()
                .single();

            if (error) {
                console.error('❌ Service: Update error', error);
                throw error;
            }

            console.log('✅ Service: Update successful', data);
            
            return {
                ...data,
                user_details: {
                    fullName: data.user_name || '',
                    contactNumber: data.user_phone || '',
                    name: data.user_name || '',
                    phone: data.user_phone || ''
                }
            };
        } catch (error) {
            console.error('❌ Service: Failed to update booking status', error);
            throw new Error('Failed to update booking status: ' + error.message);
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

    static async deleteBooking(bookingId) {
        try {
            console.log('Deleting booking with ID:', bookingId);
            
            const { error } = await supabase
                .from('bookings')
                .delete()
                .eq('id', bookingId);

            if (error) {
                console.error('Supabase delete error:', error);
                throw error;
            }

            console.log('Booking deleted successfully:', bookingId);
            return { success: true, message: 'Booking deleted successfully' };
        } catch (error) {
            console.error('Error in deleteBooking:', error);
            throw new Error(error.message || 'Failed to delete booking');
        }
    }

    static async deleteBookings(bookingIds) {
    try {
        console.log('🗑️ Service: Deleting multiple bookings:', bookingIds);
        
        if (!Array.isArray(bookingIds) || bookingIds.length === 0) {
            throw new Error('No booking IDs provided');
        }

        // FIRST: Get booking numbers for these IDs
        console.log('🔍 Service: Getting booking numbers for IDs...');
        const { data: bookingsData, error: fetchError } = await supabase
            .from('bookings')
            .select('id, booking_number')
            .in('id', bookingIds);

        if (fetchError) {
            console.error('❌ Service: Error fetching booking numbers:', fetchError);
            throw new Error('Failed to fetch booking details: ' + fetchError.message);
        }

        const bookingNumbers = bookingsData.map(b => b.booking_number);
        console.log('📋 Service: Found booking numbers:', bookingNumbers);

        // SECOND: Delete rider assignments for these bookings
        console.log('🗑️ Service: Deleting rider assignments first...');
        const { error: deleteAssignmentsError } = await supabase
            .from('rider_assignments')
            .delete()
            .in('booking_number', bookingNumbers);

        if (deleteAssignmentsError) {
            console.error('❌ Service: Error deleting assignments:', deleteAssignmentsError);
            // Don't throw here - try to continue with booking deletion
            // Some bookings might not have assignments
        }

        // THIRD: Now delete the bookings
        console.log('🗑️ Service: Deleting bookings...');
        const { error } = await supabase
            .from('bookings')
            .delete()
            .in('id', bookingIds);

        if (error) {
            console.error('❌ Service: Supabase bulk delete error:', error);
            
            // If it's a foreign key error, try a different approach
            if (error.message.includes('foreign key constraint')) {
                console.log('🔗 Service: Foreign key error detected, trying alternative approach...');
                
                // Try to delete bookings one by one with error handling
                const results = [];
                for (const id of bookingIds) {
                    try {
                        // First try to delete any assignments
                        await supabase
                            .from('rider_assignments')
                            .delete()
                            .eq('booking_number', 
                                bookingsData.find(b => b.id === id)?.booking_number
                            );
                        
                        // Then delete booking
                        const { error: singleError } = await supabase
                            .from('bookings')
                            .delete()
                            .eq('id', id);
                        
                        if (singleError) {
                            console.error(`❌ Service: Failed to delete booking ${id}:`, singleError);
                            results.push({ id, success: false, error: singleError.message });
                        } else {
                            console.log(`✅ Service: Booking ${id} deleted successfully`);
                            results.push({ id, success: true });
                        }
                    } catch (singleErr) {
                        console.error(`❌ Service: Error deleting booking ${id}:`, singleErr);
                        results.push({ id, success: false, error: singleErr.message });
                    }
                }
                
                const successfulDeletes = results.filter(r => r.success).length;
                const failedDeletes = results.filter(r => !r.success);
                
                if (failedDeletes.length > 0) {
                    console.error('❌ Service: Some bookings failed to delete:', failedDeletes);
                    return { 
                        success: false, 
                        message: `Successfully deleted ${successfulDeletes} booking(s), but failed to delete ${failedDeletes.length} booking(s). Check console for details.` 
                    };
                }
                
                console.log('✅ Service: All bookings deleted successfully');
                return { 
                    success: true, 
                    message: `${successfulDeletes} booking(s) deleted successfully` 
                };
            }
            
            throw error;
        }

        console.log('✅ Service: Bookings deleted successfully:', bookingIds);
        return { 
            success: true, 
            message: `${bookingIds.length} booking(s) deleted successfully` 
        };
    } catch (error) {
        console.error('❌ Service: Error in deleteBookings:', error);
        throw new Error(error.message || 'Failed to delete bookings');
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
    
    static async getBookingById(bookingId) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('id', bookingId)
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

    // ================== RIDER ASSIGNMENT METHODS ==================
    
    static async assignBookingToRider(bookingNumber, riderId) {
        try {
            console.log('🛵 Service: Assigning booking to rider', { bookingNumber, riderId });
            
            // First, check if booking exists and is in confirmed status
            const { data: existingBooking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('booking_number', bookingNumber)
                .single();

            if (fetchError) {
                console.error('❌ Service: Booking not found', fetchError);
                throw new Error('Booking not found');
            }

            if (existingBooking.status !== 'confirmed') {
                console.error('❌ Service: Booking not in confirmed status', existingBooking.status);
                throw new Error(`Cannot assign booking with status: ${existingBooking.status}. Must be 'confirmed'.`);
            }

            // Update booking status to 'assigned' and set rider ID
            const { data: updatedBooking, error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    status: 'assigned',
                    assigned_rider_id: riderId,
                    assigned_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .select()
                .single();

            if (updateError) {
                console.error('❌ Service: Update booking error', updateError);
                throw updateError;
            }

            // Create rider assignment record
            const { error: assignError } = await supabase
                .from('rider_assignments')
                .insert({
                    rider_id: riderId,
                    booking_number: bookingNumber,
                    status: 'active',
                    assigned_at: new Date().toISOString()
                });

            if (assignError) {
                console.error('❌ Service: Create assignment error', assignError);
                
                // Rollback booking update
                await supabase
                    .from('bookings')
                    .update({ 
                        status: 'confirmed',
                        assigned_rider_id: null,
                        assigned_at: null 
                    })
                    .eq('booking_number', bookingNumber);
                
                throw assignError;
            }

            console.log('✅ Service: Booking assigned successfully');
            
            return {
                success: true,
                message: 'Booking assigned to rider successfully',
                data: {
                    ...updatedBooking,
                    user_details: {
                        fullName: updatedBooking.user_name || '',
                        contactNumber: updatedBooking.user_phone || ''
                    }
                }
            };
        } catch (error) {
            console.error('❌ Service: Error assigning booking:', error);
            throw error;
        }
    }

    static async unassignBookingFromRider(bookingNumber) {
        try {
            console.log('🛵 Service: Unassigning booking from rider', { bookingNumber });
            
            // Get current booking to check status
            const { data: existingBooking, error: fetchError } = await supabase
                .from('bookings')
                .select('*')
                .eq('booking_number', bookingNumber)
                .single();

            if (fetchError) throw new Error('Booking not found');

            if (existingBooking.status !== 'assigned') {
                throw new Error(`Cannot unassign booking with status: ${existingBooking.status}. Must be 'assigned'.`);
            }

            // Update booking status back to 'confirmed'
            const { data: updatedBooking, error: updateError } = await supabase
                .from('bookings')
                .update({ 
                    status: 'confirmed',
                    assigned_rider_id: null,
                    assigned_at: null,
                    updated_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .select()
                .single();

            if (updateError) throw updateError;

            // Update rider assignment status to 'cancelled'
            const { error: assignError } = await supabase
                .from('rider_assignments')
                .update({ 
                    status: 'cancelled',
                    completed_at: new Date().toISOString()
                })
                .eq('booking_number', bookingNumber)
                .eq('status', 'active');

            if (assignError) {
                console.error('❌ Service: Update assignment error, rolling back...', assignError);
                
                // Rollback booking update
                await supabase
                    .from('bookings')
                    .update({ 
                        status: 'assigned',
                        assigned_rider_id: existingBooking.assigned_rider_id,
                        assigned_at: existingBooking.assigned_at 
                    })
                    .eq('booking_number', bookingNumber);
                
                throw assignError;
            }

            console.log('✅ Service: Booking unassigned successfully');
            
            return {
                success: true,
                message: 'Booking unassigned successfully',
                data: {
                    ...updatedBooking,
                    user_details: {
                        fullName: updatedBooking.user_name || '',
                        contactNumber: updatedBooking.user_phone || ''
                    }
                }
            };
        } catch (error) {
            console.error('❌ Service: Error unassigning booking:', error);
            throw error;
        }
    }

    static async getRiderAssignments(bookingNumber) {
        try {
            const { data, error } = await supabase
                .from('rider_assignments')
                .select('*')
                .eq('booking_number', bookingNumber)
                .order('assigned_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('❌ Service: Error fetching rider assignments:', error);
            throw error;
        }
    }

    static async getAvailableRiders() {
        try {
            // Static rider data - you can fetch from database later
            const riders = [
                { id: 1, name: 'Rider One', username: 'rider1', contact: '+639123456789', vehicle: 'Honda Beat', plateNumber: 'ABC123', status: 'active' },
                { id: 2, name: 'Rider Two', username: 'rider2', contact: '+639987654321', vehicle: 'Yamaha Mio', plateNumber: 'DEF456', status: 'active' },
                { id: 3, name: 'Rider Three', username: 'rider3', contact: '+639111223344', vehicle: 'Suzuki Raider', plateNumber: 'GHI789', status: 'active' },
                { id: 4, name: 'Rider Four', username: 'rider4', contact: '+639555666777', vehicle: 'Kawasaki Rouser', plateNumber: 'JKL012', status: 'active' }
            ];
            
            // Get currently assigned bookings to find busy riders
            const { data: assignments, error } = await supabase
                .from('rider_assignments')
                .select('rider_id')
                .eq('status', 'active');

            if (error) {
                console.warn('⚠️ Could not fetch assignments, using all riders:', error);
                return riders; // Return all riders if error
            }

            // Get active rider IDs
            const activeRiderIds = assignments?.map(a => a.rider_id) || [];
            
            // Filter out busy riders
            const availableRiders = riders.filter(rider => 
                !activeRiderIds.includes(rider.id)
            );

            console.log('🛵 Service: Available riders:', availableRiders.length);
            return availableRiders;
        } catch (error) {
            console.error('❌ Service: Error fetching available riders:', error);
            throw error;
        }
    }

    static async getBookingWithRider(bookingNumber) {
        try {
            const { data, error } = await supabase
                .from('bookings')
                .select(`
                    *,
                    rider_assignments!inner (
                        rider_id,
                        assigned_at,
                        status
                    )
                `)
                .eq('booking_number', bookingNumber)
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
            console.error('❌ Service: Error fetching booking with rider:', error);
            throw error;
        }
    }
}