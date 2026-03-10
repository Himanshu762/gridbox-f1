/**
 * Jolpica-F1 API Type Definitions (Ergast successor)
 * Docs: https://github.com/jolpica/jolpica-f1
 * Data fetching is centralized in f1-client.ts
 */

// Types
export interface DriverStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Driver: {
        driverId: string;
        permanentNumber: string;
        code: string;
        url: string;
        givenName: string;
        familyName: string;
        dateOfBirth: string;
        nationality: string;
    };
    Constructors: {
        constructorId: string;
        url: string;
        name: string;
        nationality: string;
    }[];
}

export interface ConstructorStanding {
    position: string;
    positionText: string;
    points: string;
    wins: string;
    Constructor: {
        constructorId: string;
        url: string;
        name: string;
        nationality: string;
    };
}

export interface RaceResult {
    season: string;
    round: string;
    url: string;
    raceName: string;
    Circuit: {
        circuitId: string;
        url: string;
        circuitName: string;
        Location: {
            lat: string;
            long: string;
            locality: string;
            country: string;
        };
    };
    date: string;
    time: string;
    Results: {
        number: string;
        position: string;
        positionText: string;
        points: string;
        Driver: {
            driverId: string;
            permanentNumber: string;
            code: string;
            givenName: string;
            familyName: string;
            nationality: string;
        };
        Constructor: {
            constructorId: string;
            name: string;
            nationality: string;
        };
        grid: string;
        laps: string;
        status: string;
        Time?: { millis: string; time: string };
        FastestLap?: {
            rank: string;
            lap: string;
            Time: { time: string };
            AverageSpeed: { units: string; speed: string };
        };
    }[];
}

export interface RaceSchedule {
    season: string;
    round: string;
    url: string;
    raceName: string;
    Circuit: {
        circuitId: string;
        circuitName: string;
        Location: { lat: string; long: string; locality: string; country: string };
    };
    date: string;
    time: string;
    FirstPractice?: { date: string; time: string };
    SecondPractice?: { date: string; time: string };
    ThirdPractice?: { date: string; time: string };
    Qualifying?: { date: string; time: string };
    Sprint?: { date: string; time: string };
}

export interface JolpicaDriver {
    driverId: string;
    permanentNumber: string;
    code: string;
    givenName: string;
    familyName: string;
    dateOfBirth: string;
    nationality: string;
    url: string;
}

export interface Circuit {
    circuitId: string;
    url: string;
    circuitName: string;
    Location: {
        lat: string;
        long: string;
        locality: string;
        country: string;
    };
}
