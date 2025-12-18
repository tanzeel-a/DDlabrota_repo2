import { MongoClient } from 'mongodb';

let clientPromise: Promise<MongoClient> | null = null;

if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    const options = {};

    let client: MongoClient;

    if (process.env.NODE_ENV === 'development') {
        // In development mode, use a global variable to preserve the client across hot reloads
        let globalWithMongo = global as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient>;
        };

        if (!globalWithMongo._mongoClientPromise) {
            client = new MongoClient(uri, options);
            globalWithMongo._mongoClientPromise = client.connect();
        }
        clientPromise = globalWithMongo._mongoClientPromise;
    } else {
        // In production mode, create a new client
        client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
}

export default clientPromise;
