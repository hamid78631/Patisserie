import mongoose from 'mongoose';

/**
 * Base de test : MONGODB_TEST_URI si défini (ex. MongoDB local ou Docker),
 * sinon une instance MongoDB en mémoire téléchargée automatiquement.
 */
let memoryServer;

export async function connectTestDb() {
  let uri = process.env.MONGODB_TEST_URI;
  if (!uri) {
    const { MongoMemoryServer } = await import('mongodb-memory-server');
    memoryServer = await MongoMemoryServer.create();
    uri = memoryServer.getUri();
  }
  const dbName = `patisserie_test_${process.pid}_${Date.now()}`;
  await mongoose.connect(uri, { dbName });
}

export async function resetDb() {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase().catch(() => {});
  await mongoose.disconnect();
  if (memoryServer) await memoryServer.stop();
}
