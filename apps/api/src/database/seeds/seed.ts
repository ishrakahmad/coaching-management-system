import * as bcrypt from 'bcrypt';
import { AppDataSource } from '../data-source';
import { Institute } from '../../institutes/entities/institute.entity';
import { User } from '../../users/entities/user.entity';
import { Role } from '../../users/enums/role.enum';
import { AcademicSession } from '../../academic-sessions/entities/academic-session.entity';
import { AcademicClass } from '../../classes/entities/academic-class.entity';

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

  // Demo academic structure — only added when the institute has none yet.
  const sessionRepo = AppDataSource.getRepository(AcademicSession);
  if (!(await sessionRepo.exists({ where: { instituteId: institute.id } }))) {
    const year = new Date().getFullYear();
    await sessionRepo.save(
      sessionRepo.create({
        name: String(year),
        startDate: `${year}-01-01`,
        endDate: `${year}-12-31`,
        isCurrent: true,
        instituteId: institute.id,
      }),
    );
    console.log(`Created current session: ${year}`);
  }

  const classRepo = AppDataSource.getRepository(AcademicClass);
  if (!(await classRepo.exists({ where: { instituteId: institute.id } }))) {
    const names = ['Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10', 'HSC 1st Year', 'HSC 2nd Year'];
    await classRepo.save(names.map((name, i) => classRepo.create({ name, sortOrder: (i + 1) * 10, instituteId: institute.id })));
    console.log(`Created ${names.length} classes`);
  }

  await AppDataSource.destroy();
  console.log('Seeding complete.');
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
