import { PrismaClient, Operator, ActionType, StrategyBlockType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing existing data...');
  // Use your clearDB logic or deleteMany calls here first if needed
  await prisma.strategyBlock.deleteMany({}); // Delete blocks first due to hierarchy
  await prisma.action.deleteMany({});
  await prisma.condition.deleteMany({});
  await prisma.strategy.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('Existing data cleared.');

  const user = await prisma.user.create({ data: { email: 'blockuser@example.com', id:'9847342711' } });

  // 1. Create Strategy (without rootBlockId initially)
  const strategy = await prisma.strategy.create({
    data: {
      userId: user.id,
      name: 'Block-Based SMA Strategy',
      description: 'Test strategy using the block structure',
      isActive: true,
      // rootBlockId will be set later
    },
  });

  // 2. Create the Root Block
  const rootBlock = await prisma.strategyBlock.create({
    data: {
      strategyId: strategy.id,
      blockType: StrategyBlockType.ROOT,
      parameters: {}, // Root block might not need params
      order: 0,
    },
  });

  // 3. Update Strategy with Root Block ID
  await prisma.strategy.update({
    where: { id: strategy.id },
    data: { rootBlockId: rootBlock.id },
  });

  // 4. Create a Condition record
  const condition1 = await prisma.condition.create({
      data: {
          indicatorType: 'SMA',
          symbol: 'AAPL',
          interval: '1min',
          parameters: { time_period: 10, series_type: 'close' },
          operator: Operator.LESS_THAN,
          targetValue: 212,
      }
  });

  // 5. Create a CONDITION_IF block under the root, linking the condition
  const ifBlock = await prisma.strategyBlock.create({
      data: {
          strategyId: strategy.id,
          blockType: StrategyBlockType.CONDITION_IF,
          parameters: {}, // IF block might hold logic like THEN/ELSE child links if needed
          parentId: rootBlock.id, // Link to root
          conditionId: condition1.id, // Link the condition
          order: 0,
      }
  });

  // 6. Create an Action record
  const action1 = await prisma.action.create({
      data: {
          actionType: ActionType.LOG_MESSAGE, // Use your ActionType enum
          parameters: { message: 'Block Strategy Condition Met!' },
          order: 0,
      }
  });

 // 7. Create an ACTION block under the IF block (the "THEN" branch)
 const actionBlock = await prisma.strategyBlock.create({
     data: {
         strategyId: strategy.id,
         blockType: StrategyBlockType.ACTION,
         parameters: {},
         parentId: ifBlock.id, // Child of the IF block
         actionId: action1.id, // Link the action
         order: 0, // First action in the THEN branch
     }
 });

  // ... Add more blocks as needed to represent complex logic ...

  console.log('Seed data created successfully with block structure!');
  console.log('Strategy ID:', strategy.id);
  console.log('Root Block ID:', rootBlock.id);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });