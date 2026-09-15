import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Institute } from '../../institutes/entities/institute.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';

async function seed() {
  await AppDataSource.initialize();

  const instituteRepo = AppDataSource.getRepository(Institute);
  const userRepo = AppDataSource.getRepository(User);

  let institute = await instituteRepo.findOne({ where: { slug: 'demo-coaching' } });
  if (!institute) {
    institute = await instituteRepo.save(
      instituteRepo.create({
        name: 'Demo Coaching Center',
        slug: 'demo-coaching',
        email: 'contact@democoaching.com',
        phone: '01700000000',
      }),
    );
    console.log('Created institute:', institute.name);
  }

  const adminEmail = 'admin@democoaching.com';
  let admin = await userRepo.findOne({ where: { email: adminEmail } });
  if (!admin) {
    const hashedPassword = await bcrypt.hash('Admin@123', 10);
    admin = await userRepo.save(
      userRepo.create({
        fullName: 'Institute Admin',
        email: adminEmail,
        password: hashedPassword,
        role: Role.INSTITUTE_ADMIN,
        instituteId: institute.id,
      }),
    );
    console.log('Created admin user:', admin.email, '(password: Admin@123)');
  }

  await AppDataSource.destroy();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
