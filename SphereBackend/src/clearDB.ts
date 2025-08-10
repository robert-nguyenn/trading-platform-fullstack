import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    // Delete all records from each table
    await prisma.strategyBlock.deleteMany({}); // Delete blocks first
    await prisma.action.deleteMany({});       // Actions can be deleted
    await prisma.condition.deleteMany({});    // Conditions can be deleted
    await prisma.strategy.deleteMany({});     // Then Strategies
    await prisma.user.deleteMany({});
     
    console.log('All records deleted from the database.');
  } catch (error) {
    console.error('Error clearing the database:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();