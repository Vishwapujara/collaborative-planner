import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Clear existing data (optional - be careful in production!)
  console.log('🗑️  Cleaning up existing data...');
  await prisma.comment.deleteMany({});
  await prisma.task.deleteMany({});
  await prisma.project.deleteMany({});
  await prisma.teamMember.deleteMany({});
  await prisma.team.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('✅ Cleanup complete');

  // Create Users
  console.log('👤 Creating users...');
  const hashedPassword1 = await bcrypt.hash('password123', 10);
  const hashedPassword2 = await bcrypt.hash('password123', 10);

  const john = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: hashedPassword1,
    },
  });

  const jane = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: hashedPassword2,
    },
  });

  const tony = await prisma.user.create({
    data: {
      email: 'tony@example.com',
      name: 'Tony Stark',
      password: await bcrypt.hash('password123', 10),
    },
  });

  console.log(`✅ Created users: ${john.name}, ${jane.name}, ${tony.name}`);

  // Create Team A (Engineering Team)
  console.log('👥 Creating teams...');
  const teamA = await prisma.team.create({
    data: {
      name: 'Engineering Team',
      description: 'Our main development team',
      creatorId: john.id,
      members: {
        create: [
          {
            userId: john.id,
            role: 'admin',
          },
          {
            userId: jane.id,
            role: 'member',
          },
        ],
      },
    },
  });

  // Create Team B
  const teamB = await prisma.team.create({
    data: {
      name: 'Team B',
      description: 'Secondary team for testing',
      creatorId: john.id,
      members: {
        create: [
          {
            userId: john.id,
            role: 'admin',
          },
          {
            userId: jane.id,
            role: 'member',
          },
          {
            userId: tony.id,
            role: 'member',
          },
        ],
      },
    },
  });

  console.log(`✅ Created teams: ${teamA.name}, ${teamB.name}`);

  // Create Projects
  console.log('📂 Creating projects...');
  const project1 = await prisma.project.create({
    data: {
      name: 'Mobile App Development',
      description: 'Build our new mobile app',
      teamId: teamA.id,
      status: 'active',
    },
  });

  const project2 = await prisma.project.create({
    data: {
      name: 'Website Redesign',
      description: 'Modernize our company website',
      teamId: teamA.id,
      status: 'active',
    },
  });

  const project3 = await prisma.project.create({
    data: {
      name: 'ABC',
      teamId: teamB.id,
      status: 'active',
    },
  });

  console.log(`✅ Created projects: ${project1.name}, ${project2.name}, ${project3.name}`);

  // Create Tasks for Project 1
  console.log('✅ Creating tasks...');
  
  const task1 = await prisma.task.create({
    data: {
      title: 'Design landing page',
      description: 'Create mockups for the new landing page',
      projectId: project1.id,
      assigneeId: john.id,
      priority: 'high',
      status: 'TODO',
      dueDate: new Date('2025-12-31'),
    },
  });

  const task2 = await prisma.task.create({
    data: {
      title: 'Setup CI/CD pipeline',
      description: 'Configure GitHub Actions for deployment',
      projectId: project1.id,
      assigneeId: jane.id,
      priority: 'medium',
      status: 'IN_PROGRESS',
    },
  });

  const task3 = await prisma.task.create({
    data: {
      title: 'Database design',
      description: 'Design schema for user management',
      projectId: project1.id,
      assigneeId: john.id,
      priority: 'high',
      status: 'DONE',
    },
  });

  const task4 = await prisma.task.create({
    data: {
      title: 'Write documentation',
      projectId: project1.id,
      priority: 'low',
      status: 'TODO',
    },
  });

  // Tasks for Project 2
  const task5 = await prisma.task.create({
    data: {
      title: 'Choose color scheme',
      projectId: project2.id,
      assigneeId: jane.id,
      priority: 'medium',
      status: 'TODO',
    },
  });

  console.log(`✅ Created ${5} tasks`);

  // Create Comments
  console.log('💬 Creating comments...');
  
  await prisma.comment.create({
    data: {
      content: 'Great work on this task!',
      taskId: task1.id,
      authorId: jane.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'I will start working on this tomorrow.',
      taskId: task2.id,
      authorId: jane.id,
    },
  });

  await prisma.comment.create({
    data: {
      content: 'Schema looks good, moving to done!',
      taskId: task3.id,
      authorId: john.id,
    },
  });

  console.log('✅ Created comments');

  console.log('');
  console.log('🎉 DATABASE SEEDING COMPLETED!');
  console.log('');
  console.log('📊 Summary:');
  console.log(`   Users: 3 (john@example.com, jane@example.com, tony@example.com)`);
  console.log(`   Teams: 2 (${teamA.name}, ${teamB.name})`);
  console.log(`   Projects: 3`);
  console.log(`   Tasks: 5`);
  console.log(`   Comments: 3`);
  console.log('');
  console.log('🔐 Login credentials:');
  console.log('   john@example.com / password123 (admin)');
  console.log('   jane@example.com / password123 (member)');
  console.log('   tony@example.com / password123 (member)');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });