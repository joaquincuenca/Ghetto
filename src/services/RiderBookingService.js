// src/services/RiderBookingService.js
import { supabase } from '../utils/supabaseClient';

export class RiderBookingService {
    static async getRiderAssignedBookings(riderId) {
        try {
            console.log('🛵 RiderService: Fetching bookings for rider:', riderId);
            
            const { data, error } = await supabase
                .from('bookings')
                .select('*')
                .eq('assigned_rider_id', riderId)
                .order('assigned_at', { ascending: false });

            if (error) {
                console.error('❌ RiderService: Error fetching bookings:', error);
                throw error;
            }

            console.log('✅ RiderService: Found bookings:', data?.length || 0);
            
            return data.map(booking => ({
                ...booking,
                user_details: {
                    fullName: booking.user_name || '',
                    contactNumber: booking.user_phone || '',
                    name: booking.user_name || '',
                    phone: booking.user_phone || ''
                }
            })) || [];
        } catch (error) {
            console.error('❌ RiderService: Failed to fetch rider bookings:', error);
            return [];
        }
    }

    static async getRiderStats(riderId) {
        try {
            console.log('📊 RiderService: Getting stats for rider:', riderId);
            
            const { data: bookings, error } = await supabase
                .from('bookings')
                .select('status, created_at')
                .eq('assigned_rider_id', riderId);

            if (error) throw error;

            const total = bookings?.length || 0;
            const completed = bookings?.filter(b => b.status === 'completed')?.length || 0;
            const active = bookings?.filter(b => 
                b.status === 'assigned' || b.status === 'confirmed' || b.status === 'in_progress'
            )?.length || 0;
            const cancelled = bookings?.filter(b => b.status === 'cancelled')?.length || 0;
            
            // This month bookings
            const startOfMonth = new Date();
            startOfMonth.setDate(1);
            startOfMonth.setHours(0, 0, 0, 0);
            
            const thisMonth = bookings?.filter(b => 
                new Date(b.created_at) >= startOfMonth
            )?.length || 0;
            
            // Completion rate
            const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;

            const stats = {
                total,
                completed,
                active,
                cancelled,
                thisMonth,
                completionRate
            };

            console.log('📊 RiderService: Rider stats:', stats);
            return stats;
        } catch (error) {
            console.error('❌ RiderService: Failed to get rider stats:', error);
            return {
                total: 0,
                completed: 0,
                active: 0,
                cancelled: 0,
                thisMonth: 0,
                completionRate: 0
            };
        }
    }

    static async updateBookingStatus(bookingNumber, status) {
    try {
        console.log('🔄 ==== RiderService.updateBookingStatus START ====');
        console.log('📤 Input:', { bookingNumber, status });
        
        // SIMPLE UPDATE - try without handling assignments first
        console.log('📋 Simple update attempt...');
        const { data, error } = await supabase
            .from('bookings')
            .update({ 
                status: status,
                updated_at: new Date().toISOString()
            })
            .eq('booking_number', bookingNumber)
            .select()
            .single();

        if (error) {
            console.error('❌ Simple update failed:', error);
            
            // If it's a foreign key error, try to handle assignments
            if (error.message.includes('foreign key constraint')) {
                console.log('🔗 Foreign key constraint detected, trying to handle assignments...');
                
                // Try to delete assignments first (if that's allowed)
                const { error: deleteError } = await supabase
                    .from('rider_assignments')
                    .delete()
                    .eq('booking_number', bookingNumber);
                
                if (deleteError) {
                    console.error('❌ Could not delete assignments:', deleteError);
                    return {
                        success: false,
                        message: 'Foreign key constraint error: ' + error.message
                    };
                }
                
                // Try update again
                console.log('🔄 Retrying booking update after deleting assignments...');
                const { data: retryData, error: retryError } = await supabase
                    .from('bookings')
                    .update({ 
                        status: status,
                        updated_at: new Date().toISOString()
                    })
                    .eq('booking_number', bookingNumber)
                    .select()
                    .single();
                    
                if (retryError) {
                    console.error('❌ Retry also failed:', retryError);
                    return {
                        success: false,
                        message: 'Failed after handling constraint: ' + retryError.message
                    };
                }
                
                data = retryData;
            } else {
                return {
                    success: false,
                    message: 'Database update failed: ' + error.message
                };
            }
        }

        console.log('✅ Update successful:', {
            id: data.id,
            newStatus: data.status,
            bookingNumber: data.booking_number
        });
        
        return {
            success: true,
            data: {
                ...data,
                user_details: {
                    fullName: data.user_name || '',
                    contactNumber: data.user_phone || ''
                }
            },
            message: `Booking updated to ${status} successfully`
        };
    } catch (error) {
        console.error('❌ RiderService: Failed to update booking status', error);
        return {
            success: false,
            message: error.message || 'Failed to update booking status',
            data: null
        };
    }
}

    static async startRide(bookingNumber, riderId) {
        try {
            console.log('🏍️ RiderService: startRide called', { bookingNumber, riderId });
            
            // First update booking status to 'in_progress'
            const updateResult = await this.updateBookingStatus(bookingNumber, 'in_progress');
            
            if (!updateResult.success) {
                return updateResult;
            }

            // Try to update rider assignment if exists
            try {
                const { error } = await supabase
                    .from('rider_assignments')
                    .update({
                        status: 'in_progress',
                        started_at: new Date().toISOString()
                    })
                    .eq('booking_number', bookingNumber)
                    .eq('rider_id', riderId);

                if (error) {
                    console.warn('⚠️ RiderService: Could not update rider assignment:', error);
                    // Continue anyway - main booking update succeeded
                }
            } catch (assignError) {
                console.warn('⚠️ RiderService: Rider assignment update failed:', assignError);
            }

            console.log('✅ RiderService: Ride started successfully');
            return {
                success: true,
                message: 'Ride started successfully',
                data: updateResult.data
            };
        } catch (error) {
            console.error('❌ RiderService: Failed to start ride:', error);
            return {
                success: false,
                message: error.message || 'Failed to start ride'
            };
        }
    }

    static async updateRiderLocation(riderId, latitude, longitude) {
        try {
            console.log('📍 RiderService: Updating rider location', { riderId, latitude, longitude });
            
            const { error } = await supabase
                .from('rider_locations')
                .insert({
                    rider_id: riderId,
                    latitude: latitude,
                    longitude: longitude,
                    timestamp: new Date().toISOString()
                });

            if (error) {
                console.error('❌ RiderService: Location update error:', error);
                throw error;
            }

            console.log('✅ RiderService: Location updated successfully');
            return { success: true };
        } catch (error) {
            console.error('❌ RiderService: Failed to update rider location:', error);
            throw error;
        }
    }
}