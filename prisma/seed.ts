import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Hash passwords
  const userPassword = await bcrypt.hash('password123', 12);
  const adminPassword = await bcrypt.hash('admin@123', 12);

  // Create Admin user with new credentials
  const admin = await prisma.user.upsert({
    where: { email: 'admin@buconnect.com' },
    update: {
      password: adminPassword,
      name: 'Admin User',
    },
    create: {
      email: 'admin@buconnect.com',
      name: 'Admin User',
      password: adminPassword,
      role: Role.ADMIN,
      bio: 'Platform administrator',
      course: 'Computer Science',
      batch: 2020,
      profession: 'Software Engineer',
    },
  });
  console.log('✅ Created admin:', admin.email);

  // Delete old admin if exists
  await prisma.user.deleteMany({
    where: { email: 'priya.s@example.com' },
  });

  // Create Student user
  const student = await prisma.user.upsert({
    where: { email: 'rohan@example.com' },
    update: {},
    create: {
      email: 'rohan@example.com',
      name: 'Rohan Kumar',
      password: userPassword,
      role: Role.STUDENT,
      bio: 'Final year Computer Science student',
      course: 'Computer Science',
      batch: 2024,
      profession: 'Student',
    },
  });
  console.log('✅ Created student:', student.email);

  // Create Alumni user
  const alumni = await prisma.user.upsert({
    where: { email: 'alisha.s@example.com' },
    update: {},
    create: {
      email: 'alisha.s@example.com',
      name: 'Alisha Singh',
      password: userPassword,
      role: Role.ALUMNI,
      bio: 'Software Engineer at Google',
      course: 'Computer Science',
      batch: 2019,
      profession: 'Software Engineer',
    },
  });
  console.log('✅ Created alumni:', alumni.email);

  // Create additional test users
  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'amit.p@example.com' },
      update: {},
      create: {
        email: 'amit.p@example.com',
        name: 'Amit Patel',
        password: userPassword,
        role: Role.STUDENT,
        bio: 'Machine Learning enthusiast',
        course: 'Data Science',
        batch: 2025,
        profession: 'Student',
      },
    }),
    prisma.user.upsert({
      where: { email: 'sneha.r@example.com' },
      update: {},
      create: {
        email: 'sneha.r@example.com',
        name: 'Sneha Reddy',
        password: userPassword,
        role: Role.ALUMNI,
        bio: 'Product Manager at Microsoft',
        course: 'Electronics',
        batch: 2018,
        profession: 'Product Manager',
      },
    }),
    prisma.user.upsert({
      where: { email: 'vikram.k@example.com' },
      update: {},
      create: {
        email: 'vikram.k@example.com',
        name: 'Vikram Kapoor',
        password: userPassword,
        role: Role.STUDENT,
        bio: 'Full stack developer',
        course: 'Computer Science',
        batch: 2024,
        profession: 'Student',
      },
    }),
  ]);
  console.log('✅ Created additional users:', users.map(u => u.email).join(', '));

  // Create sample posts
  const posts = await Promise.all([
    prisma.post.create({
      data: {
        title: 'Welcome to BUConnect! 🎓',
        content: 'Hey everyone! Welcome to BUConnect - the platform connecting BML Munjal University students and alumni. This is a space to share opportunities, ask questions, and build meaningful connections. Feel free to introduce yourself in the comments!',
        authorId: admin.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Looking for Internship Opportunities 💼',
        content: 'Hi all! I\'m a final year CS student looking for summer internship opportunities in backend development. I have experience with Node.js, PostgreSQL, and AWS. If anyone knows of openings or can refer me, please let me know!',
        authorId: student.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Career Advice: Transitioning from Student to Professional 🚀',
        content: 'As someone who graduated a few years ago, I wanted to share some thoughts on making the transition smoother:\n\n1. Start building your portfolio early\n2. Network with alumni (that\'s what this platform is for!)\n3. Don\'t be afraid to apply to roles where you don\'t meet 100% of requirements\n4. Practice system design interviews\n5. Keep learning - tech moves fast!\n\nHappy to answer any questions in the comments.',
        authorId: alumni.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Hackathon Announcement: BMU Hack 2024 🏆',
        content: 'Excited to announce BMU Hack 2024! Registration opens next week. This year\'s themes:\n- FinTech Innovation\n- HealthTech Solutions\n- EdTech for Accessibility\n- Sustainable Tech\n\nPrizes worth ₹2,00,000! Stay tuned for more details.',
        authorId: admin.id,
      },
    }),
    prisma.post.create({
      data: {
        title: 'Study Group for System Design Interviews 📚',
        content: 'Starting a weekly study group for system design interview prep. We\'ll cover:\n- Distributed systems fundamentals\n- Scalability patterns\n- Database design\n- Caching strategies\n- Message queues\n\nMeeting every Saturday 10 AM IST on Discord. DM me if interested!',
        authorId: users[0].id, // Amit
      },
    }),
  ]);
  console.log('✅ Created sample posts:', posts.length);

  // Create some likes
  await Promise.all([
    prisma.like.create({ data: { postId: posts[0].id, userId: student.id } }),
    prisma.like.create({ data: { postId: posts[0].id, userId: alumni.id } }),
    prisma.like.create({ data: { postId: posts[1].id, userId: alumni.id } }),
    prisma.like.create({ data: { postId: posts[2].id, userId: student.id } }),
    prisma.like.create({ data: { postId: posts[2].id, userId: users[0].id } }),
  ]);
  console.log('✅ Created sample likes');

  // Create some comments
  await Promise.all([
    prisma.comment.create({
      data: {
        text: 'Thanks for creating this platform! Really needed something like this.',
        authorId: student.id,
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'Great initiative! Looking forward to connecting with alumni.',
        authorId: users[0].id,
        postId: posts[0].id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'I can refer you to a few companies. DM me your resume!',
        authorId: alumni.id,
        postId: posts[1].id,
      },
    }),
    prisma.comment.create({
      data: {
        text: 'This is gold advice! Especially point #3 - imposter syndrome is real.',
        authorId: users[1].id,
        postId: posts[2].id,
      },
    }),
  ]);
  console.log('✅ Created sample comments');

  // Create some connections (use upsert to avoid duplicates)
  await Promise.all([
    prisma.connection.upsert({
      where: { followerId_followingId: { followerId: student.id, followingId: alumni.id } },
      update: {},
      create: { followerId: student.id, followingId: alumni.id },
    }),
    prisma.connection.upsert({
      where: { followerId_followingId: { followerId: student.id, followingId: admin.id } },
      update: {},
      create: { followerId: student.id, followingId: admin.id },
    }),
    prisma.connection.upsert({
      where: { followerId_followingId: { followerId: users[0].id, followingId: alumni.id } },
      update: {},
      create: { followerId: users[0].id, followingId: alumni.id },
    }),
    prisma.connection.upsert({
      where: { followerId_followingId: { followerId: users[0].id, followingId: student.id } },
      update: {},
      create: { followerId: users[0].id, followingId: student.id },
    }),
    prisma.connection.upsert({
      where: { followerId_followingId: { followerId: users[1].id, followingId: alumni.id } },
      update: {},
      create: { followerId: users[1].id, followingId: alumni.id },
    }),
  ]);
  console.log('✅ Created sample connections');

  // Create accepted connection requests (for the connections UI)
  await Promise.all([
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: student.id, followingId: alumni.id } },
      update: { status: 'ACCEPTED' },
      create: { followerId: student.id, followingId: alumni.id, status: 'ACCEPTED' },
    }),
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: student.id, followingId: admin.id } },
      update: { status: 'ACCEPTED' },
      create: { followerId: student.id, followingId: admin.id, status: 'ACCEPTED' },
    }),
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: users[0].id, followingId: alumni.id } },
      update: { status: 'ACCEPTED' },
      create: { followerId: users[0].id, followingId: alumni.id, status: 'ACCEPTED' },
    }),
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: users[0].id, followingId: student.id } },
      update: { status: 'ACCEPTED' },
      create: { followerId: users[0].id, followingId: student.id, status: 'ACCEPTED' },
    }),
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: users[1].id, followingId: alumni.id } },
      update: { status: 'ACCEPTED' },
      create: { followerId: users[1].id, followingId: alumni.id, status: 'ACCEPTED' },
    }),
    // Add some pending requests for demo
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: users[2].id, followingId: student.id } },
      update: { status: 'PENDING' },
      create: { followerId: users[2].id, followingId: student.id, status: 'PENDING' },
    }),
    prisma.connectionRequest.upsert({
      where: { followerId_followingId: { followerId: users[2].id, followingId: alumni.id } },
      update: { status: 'PENDING' },
      create: { followerId: users[2].id, followingId: alumni.id, status: 'PENDING' },
    }),
  ]);
  console.log('✅ Created sample connection requests');

  // Create some notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        userId: alumni.id,
        type: 'new_follower',
        title: 'New Follower',
        message: 'Rohan Kumar started following you',
        actorId: student.id,
        link: `/profile/${student.id}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: alumni.id,
        type: 'new_comment',
        title: 'New Comment',
        message: 'Alisha Singh commented on your post',
        actorId: alumni.id,
        link: `/post/${posts[1].id}`,
      },
    }),
    prisma.notification.create({
      data: {
        userId: student.id,
        type: 'new_like',
        title: 'New Like',
        message: 'Alisha Singh liked your post',
        actorId: alumni.id,
        link: `/post/${posts[1].id}`,
      },
    }),
  ]);
  console.log('✅ Created sample notifications');

  // Create sample messages between connected users
  await Promise.all([
    // Student -> Alumni
    prisma.message.create({
      data: {
        content: 'Hi Alisha! I saw your post about career advice. Really helpful insights!',
        senderId: student.id,
        recipientId: alumni.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Thanks Rohan! Glad you found it helpful. Let me know if you have any specific questions.',
        senderId: alumni.id,
        recipientId: student.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Actually, I was wondering about the system design interview prep. Do you have any resources to recommend?',
        senderId: student.id,
        recipientId: alumni.id,
      },
    }),
    // Amit -> Student
    prisma.message.create({
      data: {
        content: 'Hey Rohan! Interested in joining the system design study group?',
        senderId: users[0].id,
        recipientId: student.id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Sure! When does it meet?',
        senderId: student.id,
        recipientId: users[0].id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Every Saturday 10 AM IST on Discord. I\'ll send you the link!',
        senderId: users[0].id,
        recipientId: student.id,
      },
    }),
    // Alumni -> Sneha (Alumni to Alumni)
    prisma.message.create({
      data: {
        content: 'Hi Sneha! Great to connect with another alum. How\'s Microsoft treating you?',
        senderId: alumni.id,
        recipientId: users[1].id,
      },
    }),
    prisma.message.create({
      data: {
        content: 'Hey Alisha! It\'s amazing. The culture is great. How\'s Google?',
        senderId: users[1].id,
        recipientId: alumni.id,
      },
    }),
  ]);
  console.log('✅ Created sample messages');

  console.log('\n🎉 Database seeded successfully!');
  console.log('\n📝 Login Credentials:');
  console.log('   Admin:   admin@buconnect.com / admin@123');
  console.log('   Student: rohan@example.com / password123');
  console.log('   Alumni:  alisha.s@example.com / password123');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });