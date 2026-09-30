'use strict';
/**
 * Seeds necessary studio catalog data: Plans, Trainers, and Classes.
 * Features certified Indian fitness coaches with custom studio portraits.
 * Does NOT touch client/member or booking data.
 */
const { run, get, all } = require('../src/db');

const now = Date.now();

// 1. Membership Plans
const plans = [
  {
    name: 'Starter Pass',
    price: 1999,
    duration_days: 30,
    features: [
      '8 Studio classes per month',
      'Full gym floor & equipment access',
      'Locker room & private shower access',
      'Free initial body & fitness assessment',
      'Online timetable & class booking',
    ].join('\n'),
    sort_order: 1,
  },
  {
    name: 'All-Access Pro',
    price: 3499,
    duration_days: 30,
    features: [
      'Unlimited studio classes (Strength, HIIT, Yoga)',
      'Unlimited gym floor access (6 AM - 10 PM)',
      'Infrared sauna & recovery zone access',
      '1 Complimentary 1-on-1 PT session per month',
      'Personalized nutrition & macro guidance',
      '7-Day priority class booking window',
    ].join('\n'),
    sort_order: 2,
  },
  {
    name: 'Quarterly Athlete',
    price: 8999,
    duration_days: 90,
    features: [
      'Everything in All-Access Pro included',
      '3x 1-on-1 Personal coaching sessions',
      'Bi-weekly InBody composition scans',
      '2 Complimentary guest passes per month',
      '15% Off all studio merchandise & supplements',
      'Dedicated towel & premium locker service',
    ].join('\n'),
    sort_order: 3,
  },
  {
    name: 'Annual Elite',
    price: 29999,
    duration_days: 365,
    features: [
      'Full 365-day unlimited studio & class access',
      'Monthly 1-on-1 PT review & programming updates',
      'Unlimited sauna & contrast therapy lounge access',
      'Exclusive ForgeFit athlete apparel & gym pack',
      'Unlimited weekend guest privileges',
      'Up to 60 days complimentary membership pause',
    ].join('\n'),
    sort_order: 4,
  },
];

console.log('Seeding plans...');
for (const p of plans) {
  const existing = get('SELECT id FROM plans WHERE name = ?', p.name);
  if (!existing) {
    run(
      `INSERT INTO plans (name, price, duration_days, features, is_active, sort_order, created_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`,
      p.name, p.price, p.duration_days, p.features, p.sort_order, now
    );
    console.log(`+ Added plan: ${p.name}`);
  } else {
    run(
      `UPDATE plans SET price = ?, duration_days = ?, features = ?, sort_order = ? WHERE id = ?`,
      p.price, p.duration_days, p.features, p.sort_order, existing.id
    );
    console.log(`  Updated plan: ${p.name}`);
  }
}

// 2. Indian Coaches & Trainers
const trainers = [
  {
    name: 'Coach Vikram Sen',
    specialty: 'Head Coach · Functional Strength & Conditioning',
    bio: 'Former national-level powerlifter with over 10 years of coaching experience. Specializes in barbell mechanics, functional hypertrophy, and athletic conditioning. Certified CSCS and Olympic lifting coach.',
    image: '/img/trainer-vikram.jpg',
    sort_order: 1,
  },
  {
    name: 'Coach Ananya Sharma',
    specialty: 'HIIT, Mobility & High-Performance Conditioning',
    bio: 'Ex-track athlete and certified mobility specialist. Ananya crafts high-octane conditioning circuits designed to maximize cardiovascular capacity, torch calories, and bulletproof joints against injury.',
    image: '/img/trainer-ananya.jpg',
    sort_order: 2,
  },
  {
    name: 'Coach Kabir Mehta',
    specialty: 'Yoga, Breathwork & Athletic Recovery',
    bio: 'Certified 500-hour Ashtanga and Vinyasa instructor who has coached competitive athletes and fighters across India. Combines mobility flows, breath regulation, and restorative practices for optimal muscular recovery.',
    image: '/img/trainer-kabir.jpg',
    sort_order: 3,
  },
];

console.log('Seeding Indian trainers...');
// Clean up any previously seeded trainer records to ensure clean sync
run('DELETE FROM trainers');
for (const t of trainers) {
  run(
    `INSERT INTO trainers (name, specialty, bio, image, is_active, sort_order, created_at)
     VALUES (?, ?, ?, ?, 1, ?, ?)`,
    t.name, t.specialty, t.bio, t.image, t.sort_order, now
  );
  console.log(`+ Added trainer: ${t.name}`);
}

// 3. Classes
const classes = [
  {
    title: 'Forge Strength & Hypertrophy',
    slug: 'forge-strength-hypertrophy',
    description: 'A focused barbell and kettlebell strength session targeting progressive overload on squat, hinge, push, and pull patterns. Perfect for building raw strength, lean muscle mass, and joint resilience under expert coaching.',
    trainer_name: 'Coach Vikram Sen',
    schedule: 'Mon / Wed / Fri · 06:30 AM & 06:00 PM',
    capacity: 16,
    duration_min: 60,
    level: 'Intermediate',
    price: 500,
    image: '/img/class-strength.jpg',
  },
  {
    title: 'HIIT & Metabolic Conditioning',
    slug: 'hiit-metabolic-conditioning',
    description: 'High-intensity interval training pairing assault bikes, ski ergs, kettlebell complexes, plyometrics, and functional turf drills. Engineered to elevate your lactate threshold and boost athletic stamina.',
    trainer_name: 'Coach Ananya Sharma',
    schedule: 'Tue / Thu / Sat · 07:00 AM & 07:00 PM',
    capacity: 20,
    duration_min: 45,
    level: 'All levels',
    price: 450,
    image: '/img/class-hiit.jpg',
  },
  {
    title: 'Athletic Yoga & Deep Recovery',
    slug: 'athletic-yoga-deep-recovery',
    description: 'Restorative dynamic flows, targeted hip and thoracic spine mobility, and guided downregulation breathwork. Specifically designed for active individuals to relieve tight muscles, prevent injury, and de-stress.',
    trainer_name: 'Coach Kabir Mehta',
    schedule: 'Wed / Sat / Sun · 08:30 AM & 05:30 PM',
    capacity: 18,
    duration_min: 60,
    level: 'All levels',
    price: 400,
    image: '/img/class-yoga.jpg',
  },
];

console.log('Seeding classes...');
for (const c of classes) {
  const existing = get('SELECT id FROM classes WHERE slug = ?', c.slug);
  if (!existing) {
    run(
      `INSERT INTO classes (title, slug, description, trainer_name, schedule, capacity, duration_min, level, price, image, is_active, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      c.title, c.slug, c.description, c.trainer_name, c.schedule, c.capacity, c.duration_min, c.level, c.price, c.image, now, now
    );
    console.log(`+ Added class: ${c.title}`);
  } else {
    run(
      `UPDATE classes SET title = ?, description = ?, trainer_name = ?, schedule = ?, capacity = ?, duration_min = ?, level = ?, price = ?, image = ?, updated_at = ? WHERE id = ?`,
      c.title, c.description, c.trainer_name, c.schedule, c.capacity, c.duration_min, c.level, c.price, c.image, now, existing.id
    );
    console.log(`  Updated class: ${c.title}`);
  }
}

console.log('\nCatalog Summary:');
console.log('Plans:', all('SELECT id, name, price FROM plans'));
console.log('Trainers:', all('SELECT id, name, specialty, image FROM trainers'));
console.log('Classes:', all('SELECT id, title, trainer_name FROM classes'));
console.log('Members preserved (untouched):', all('SELECT id, email, role FROM users'));
