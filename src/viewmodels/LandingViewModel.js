export class LandingViewModel {
    constructor() {
        this.appName = "Ghetto Riders";
        this.tagline = "Ride the Streets, Ghetto Style";
    }

    getContactInfo() {
        return {
        facebook: "https://www.facebook.com/profile.php?id=61582462506784",
        email: "ridersghetto@gmail.com",
        phone: "+639656121577"
        };
    }

    getTeamMembers() {
        return [
        {
            name: "James Andrew Oliver",
            role: "Founder and CEO",
            image: "/dreww.jpg",
            description: "Visionary behind Ghetto Riders, leading the mission to make transportation accessible for everyone."
        },
        {
            name: "Joaquin Cuenca",
            role: "Co-Founder and Developer",
            image: "/wakin.jpg",
            description: "Leads the development of Ghetto Riders technology, building reliable systems and creating seamless user experiences for both riders and customers."
        },
        {
            name: "Hanz Noldrich Puse",
            role: "Co-Founder and Operations Lead",
            image: "/hanz.jpg",
            description: "Oversees daily rider operations, ensures smooth workflows, and trains new riders to maintain top-tier service and safety standards."
        }
        ];
    }

    getServiceAreas() {
        return [
        "Daet",
        "Basud",
        "Mercedes",
        "Vinzons",
        "Talisay",
        "San Lorenzo Ruiz",
        "Paracale",
        "Jose Panganiban"
        ];
    }

    getAboutText() {
        return {
        primary: "Ghetto Riders is your go-to motorcycle booking service that connects riders and passengers seamlessly. Whether you are commuting to work, visiting friends, or exploring the city, we guarantee safe, fast, and budget-friendly rides.",
        secondary: "Our professional riders are trained and equipped to ensure your comfort and security. With our app, you can easily track your ride, estimate your fare, and get where you need to go — hassle-free."
        };
    }
}