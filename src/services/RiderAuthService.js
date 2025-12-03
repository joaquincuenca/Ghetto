const STATIC_RIDERS = [
    {
        id: 1,
        username: 'drew',
        password: 'ghettoriderdrew',
        name: 'Drew',
        contact: '+639123456789',
        vehicle: 'Motorcycle - Honda Click',
        plateNumber: 'ABC123',
        status: 'active'
    },
    {
        id: 2,
        username: 'jm',
        password: 'ghettoriderjm',
        name: 'JM',
        contact: '+639987654321',
        vehicle: 'Motorcycle - Suzuki Smash',
        plateNumber: 'DEF456',
        status: 'active'
    },
    {
        id: 3,
        username: 'joaquin',
        password: 'ghettoriderjoaquin',
        name: 'Joaquin',
        contact: '+639111223344',
        vehicle: 'Motorcycle - Yamaha Sniper',
        plateNumber: 'GHI789',
        status: 'active'
    },
    {
        id: 4,
        username: 'hanz',
        password: 'ghettoriderhanz',
        name: 'Hanz',
        contact: '+639555666777',
        vehicle: 'Motorcycle - Honda Wave',
        plateNumber: 'JKL012',
        status: 'active'
    }
    ];

    export class RiderAuthService {
    static login(username, password) {
        const rider = STATIC_RIDERS.find(
        r => r.username === username && r.password === password
        );
        
        if (rider) {
        // Remove password before storing
        const { password: _, ...riderData } = rider;
        localStorage.setItem('isRider', 'true');
        localStorage.setItem('riderData', JSON.stringify(riderData));
        return {
            success: true,
            rider: riderData
        };
        }
        
        return {
        success: false,
        message: 'Invalid username or password'
        };
    }
    
    static logout() {
        localStorage.removeItem('isRider');
        localStorage.removeItem('riderData');
    }
    
    static getCurrentRider() {
        const riderData = localStorage.getItem('riderData');
        return riderData ? JSON.parse(riderData) : null;
    }
    
    static isAuthenticated() {
        return localStorage.getItem('isRider') === 'true';
    }
    
    static getAllRiders() {
        return STATIC_RIDERS.map(rider => {
        const { password, ...riderData } = rider;
        return riderData;
        });
    }
    
    static getRiderById(id) {
        const rider = STATIC_RIDERS.find(r => r.id === id);
        if (rider) {
        const { password, ...riderData } = rider;
        return riderData;
        }
        return null;
    }
}