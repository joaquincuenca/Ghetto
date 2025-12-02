// src/views/admin/AdminChatPage.jsx
import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL,
    import.meta.env.VITE_SUPABASE_ANON_KEY
    );

    export default function AdminChatPage() {
    const [activeChat, setActiveChat] = useState(null);
    const [bookingsWithChats, setBookingsWithChats] = useState([]);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadBookingsWithChats();
    }, []);

    useEffect(() => {
        if (activeChat) {
        loadMessages(activeChat);
        subscribeToMessages(activeChat);
        }
    }, [activeChat]);

    const loadBookingsWithChats = async () => {
        try {
        const { data, error } = await supabase
            .from('booking_messages')
            .select('booking_number')
            .group('booking_number');
        
        if (error) throw error;
        
        setBookingsWithChats(data.map(item => item.booking_number));
        } catch (err) {
        console.error('Error loading bookings:', err);
        } finally {
        setLoading(false);
        }
    };

    const loadMessages = async (bookingNumber) => {
        const { data, error } = await supabase
        .from('booking_messages')
        .select('*')
        .eq('booking_number', bookingNumber)
        .order('created_at', { ascending: true });
        
        if (error) {
        console.error('Error loading messages:', error);
        return;
        }
        
        setMessages(data || []);
    };

    const subscribeToUpdates = () => {
        if (!bookingNumber) return;
        
        try {
            const channel = supabase
                .channel(`booking-${bookingNumber}`)
                .on(
                    'postgres_changes',
                    {
                        event: 'UPDATE',
                        schema: 'public',
                        table: 'bookings',
                        filter: `booking_number=eq.${bookingNumber}`
                    },
                    (payload) => {
                        console.log('Real-time update received:', payload.new);
                        const updatedBooking = {
                            ...payload.new,
                            user_details: payload.new.user_details || {}
                        };
                        setBooking(updatedBooking);
                    }
                )
                .subscribe();
            return () => {
                supabase.removeChannel(channel);
            };
        } catch (err) {
            console.error('Error subscribing to updates:', err);
        }
    };

    const sendMessage = async () => {
        if (!newMessage.trim() || !activeChat) return;
        
        const messageData = {
        booking_number: activeChat,
        message: newMessage.trim(),
        sender_role: 'admin',
        sender_id: 'admin',
        is_read: false
        };
        
        const { error } = await supabase
        .from('booking_messages')
        .insert([messageData]);
        
        if (error) {
        console.error('Error sending message:', error);
        return;
        }
        
        setNewMessage('');
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-4">
        <h1 className="text-2xl font-bold mb-6">Admin Chat Dashboard</h1>
        
        <div className="flex gap-4 h-[80vh]">
            {/* Chat List */}
            <div className="w-1/3 bg-gray-800 rounded-xl p-4">
            <h2 className="text-lg font-bold mb-4">Active Chats</h2>
            <div className="space-y-2">
                {bookingsWithChats.map(bookingNumber => (
                <button
                    key={bookingNumber}
                    onClick={() => setActiveChat(bookingNumber)}
                    className={`w-full text-left p-3 rounded-lg ${activeChat === bookingNumber ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}
                >
                    <div className="font-semibold">#{bookingNumber}</div>
                    <div className="text-sm text-gray-300">Click to chat</div>
                </button>
                ))}
            </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 bg-gray-800 rounded-xl p-4 flex flex-col">
            {activeChat ? (
                <>
                <div className="border-b border-gray-700 pb-4 mb-4">
                    <h2 className="text-xl font-bold">Chat for Booking #{activeChat}</h2>
                    <p className="text-gray-400 text-sm">Customer support chat</p>
                </div>
                
                <div className="flex-1 overflow-y-auto space-y-4 mb-4">
                    {messages.map(msg => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.sender_role === 'admin' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div className={`max-w-[70%] p-3 rounded-2xl ${
                        msg.sender_role === 'admin' ? 'bg-blue-600 rounded-br-none' : 'bg-gray-700 rounded-bl-none'
                        }`}>
                        <div className="font-semibold text-sm mb-1">
                            {msg.sender_role === 'admin' ? 'You' : 'Customer'}
                        </div>
                        <p>{msg.message}</p>
                        <div className="text-xs text-gray-300 mt-2">
                            {new Date(msg.created_at).toLocaleTimeString()}
                        </div>
                        </div>
                    </div>
                    ))}
                </div>

                <div className="flex gap-2">
                    <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder="Type your reply..."
                    className="flex-1 bg-gray-900 border border-gray-700 rounded-lg px-4 py-2"
                    />
                    <button
                    onClick={sendMessage}
                    className="bg-blue-600 hover:bg-blue-700 px-6 rounded-lg font-semibold"
                    >
                    Send
                    </button>
                </div>
                </>
            ) : (
                <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-6xl mb-4">💬</div>
                    <p className="text-gray-400">Select a chat from the left to start messaging</p>
                </div>
                </div>
            )}
            </div>
        </div>
        </div>
    );
}