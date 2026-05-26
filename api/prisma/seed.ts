import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { seedTravelDatabase } from './seed-travel-database';

const prisma = new PrismaClient();

async function seedCore() {
  const adminPassword = await bcrypt.hash('Admin123!', 10);
  const userPassword = await bcrypt.hash('User12345!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@merutour.com' },
    update: {},
    create: {
      email: 'admin@merutour.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'Meru',
      role: 'ADMIN',
      emailVerified: true,
      phone: '+1 555 0100',
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'john@example.com' },
    update: {},
    create: {
      email: 'john@example.com',
      password: userPassword,
      firstName: 'John',
      lastName: 'Doe',
      emailVerified: true,
      phone: '+1 555 0199',
      address: '123 Travel Street, New York',
    },
  });

  await prisma.paymentMethod.deleteMany({ where: { userId: user.id } });
  await prisma.paymentMethod.create({
    data: { userId: user.id, brand: 'Visa', last4: '4321', expMonth: 12, expYear: 2028, isDefault: true },
  });

  const siteSettings = [
    { key: 'hero_image', value: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920' },
    { key: 'hero_title', value: 'Helping Others LIVE & TRAVEL' },
    { key: 'hero_subtitle', value: 'Special offers to suit your plan' },
    { key: 'contact_email', value: 'hello@merutour.com' },
    { key: 'contact_phone', value: '+7 (727) 123-4567' },
    { key: 'contact_address', value: 'Almaty, Kazakhstan' },
    {
      key: 'about_mission',
      value:
        'Meru Tour is a premium travel agency offering flights, hotels, resorts and tour packages worldwide — at the level of leading agencies in Kazakhstan and beyond.',
    },
    {
      key: 'about_why_choose',
      value: JSON.stringify([
        'Best price guarantee on flights and hotels',
        '24/7 customer support worldwide',
        'Curated tours by local experts',
        'Secure payments and easy cancellations',
        '10,000+ hotels and 1,000+ tours in our database',
      ]),
    },
  ];
  for (const s of siteSettings) {
    await prisma.siteSetting.upsert({ where: { key: s.key }, update: { value: s.value }, create: s });
  }

  const promoBanners = [
    {
      title: 'Flights',
      description: 'Search hundreds of flights worldwide.',
      image: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=800',
      href: '/flights',
      buttonText: 'Show Flights',
      icon: 'Plane',
      sortOrder: 1,
    },
    {
      title: 'Hotels',
      description: 'Discover amazing stays and resorts.',
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
      href: '/hotels',
      buttonText: 'Show Hotels',
      icon: 'Hotel',
      sortOrder: 2,
    },
    {
      title: 'Tours',
      description: 'Curated packages for every traveler.',
      image: 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=800',
      href: '/tours',
      buttonText: 'Show Tours',
      icon: 'Palmtree',
      sortOrder: 3,
    },
  ];
  for (const b of promoBanners) {
    const existing = await prisma.promoBanner.findFirst({ where: { title: b.title } });
    if (!existing) await prisma.promoBanner.create({ data: b });
  }

  const topDest = await prisma.destination.findMany({ where: { featured: true }, take: 3 });
  for (const [i, r] of [
    { title: 'A real sense of community', comment: 'Meru Tour made our family vacation seamless. Great deals and easy booking!', location: 'Sydney, Australia' },
    { title: 'Amazing flight deals', comment: 'Found the cheapest flights to Dubai. The booking process was incredibly smooth.', location: 'London, UK' },
    { title: 'Best hotel experience', comment: 'The resort we booked through Meru Tour exceeded all expectations.', location: 'Barcelona, Spain' },
  ].entries()) {
    const existing = await prisma.review.findFirst({ where: { title: r.title, userId: user.id } });
    if (!existing) {
      await prisma.review.create({
        data: {
          userId: user.id,
          destinationId: topDest[i]?.id,
          rating: 5,
          title: r.title,
          comment: r.comment,
          pros: ['Easy booking', 'Great support', 'Good prices'],
          cons: [],
          images: ['https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800'],
          location: r.location,
          imageUrl: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
          verified: true,
          featured: true,
        },
      });
    }
  }

  return { admin: admin.email, user: user.email };
}

async function main() {
  console.log('Seeding Meru Tour database...');
  const core = await seedCore();
  const travel = await seedTravelDatabase();
  console.log('\nDone:', { ...core, ...travel });
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
