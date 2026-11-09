import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient, EmploymentType, EducationLevel, JobStatus, WorkMode } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const db = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: process.env.DATABASE_URL,
  }),
});

// DEPARTEMENT
const seedDepartments = async () => {
  const departments = ['Technology', 'Sales', 'Marketing', 'Finance'];
  for (const name of departments) {
    await db.department.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Departments seeded');
};

// JOB CATEGORIES
const seedCategories = async () => {
  const categories = ['IT', 'Sales', 'Marketing', 'Finance'];
  for (const name of categories) {
    await db.jobCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
  console.log('✅ Job categories seeded');
};

// SUPER ADMIN
const seedUser = async () => {
  const passwordHash = await bcrypt.hash('admin12345', 10);

  await db.user.upsert({
    where: { email: 'admin@careerportal.com' },
    update: {},   
    create: {
      name: 'Super Admin',
      email: 'admin@careerportal.com',
      passwordHash,
    },
  });
  console.log('✅ Super Admin seeded');
};

type SeedJobInput = {
  title: string;
  description: string;
  qualifications: EducationLevel[];
  employmentType: EmploymentType;
  workMode: WorkMode;
  status?: JobStatus;
  departmentId: string;
  categoryId: string;
};

const createJobIfNotExists = async (data: SeedJobInput, postedById: string) => {
  const existing = await db.jobPosting.findFirst({ where: { title: data.title } });
  if (existing) {
    await db.jobPosting.update({
      where: { id: existing.id },
      data: { qualifications: data.qualifications },
    });
    return;
  }

  const deadline = new Date();
  deadline.setDate(deadline.getDate() + 30);
  await db.jobPosting.create({ data: { ...data, deadline, postedById } });
};

const createDemoResume = async () => {
  const resumeDirectory = path.join(process.cwd(), 'uploads', 'resumes');
  const resumePath = path.join(resumeDirectory, 'demo-candidate-resume.pdf');
  await mkdir(resumeDirectory, { recursive: true });

  const content = 'BT\n/F1 18 Tf\n72 720 Td\n(KarirID Demo Candidate Resume) Tj\nET';
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(content, 'ascii')} >>\nstream\n${content}\nendstream`,
  ];

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'ascii'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });

  const crossReferenceOffset = Buffer.byteLength(pdf, 'ascii');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets.slice(1).map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`).join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${crossReferenceOffset}\n%%EOF`;
  await writeFile(resumePath, pdf, 'ascii');

  return resumePath;
};

const seedJobs = async () => {
  const user = await db.user.findUnique({
    where: { email: 'admin@careerportal.com' },
  });
  if (!user) throw new Error('Admin tidak ditemukan. Jalankan seedAdmin dulu.');

  const deptTech  = await db.department.findUnique({ where: { name: 'Technology' } });
  const deptSales = await db.department.findUnique({ where: { name: 'Sales' } });
  const deptMkt   = await db.department.findUnique({ where: { name: 'Marketing' } });
  const deptFin   = await db.department.findUnique({ where: { name: 'Finance' } });
  const catIT     = await db.jobCategory.findUnique({ where: { name: 'IT' } });
  const catSales  = await db.jobCategory.findUnique({ where: { name: 'Sales' } });
  const catMkt    = await db.jobCategory.findUnique({ where: { name: 'Marketing' } });
  const catFin    = await db.jobCategory.findUnique({ where: { name: 'Finance' } });

  if (!deptTech || !deptSales || !deptMkt || !deptFin ||
      !catIT || !catSales || !catMkt || !catFin) {
    throw new Error('Department/category belum ada. Jalankan seed sebelumnya dulu.');
  }

  const jobs: SeedJobInput[] = [
    {
      title: 'Frontend Developer',
      description: 'Bertanggung jawab membangun dan memelihara antarmuka pengguna produk web perusahaan.',
      qualifications: ['BACHELOR'],
      employmentType: 'FULL_TIME',
      workMode: 'HYBRID',
      status: 'PUBLISHED',
      departmentId: deptTech.id,
      categoryId: catIT.id,
    },
    {
      title: 'Backend Developer',
      description: 'Membangun dan memelihara REST API serta layanan bisnis untuk produk utama perusahaan.',
      qualifications: ['BACHELOR'],
      employmentType: 'FULL_TIME',
      workMode: 'WFO',
      status: 'PUBLISHED',
      departmentId: deptTech.id,
      categoryId: catIT.id,
    },
    {
      title: 'Sales Executive',
      description: 'Mencari dan mengelola klien perusahaan serta mencapai target penjualan tim.',
      qualifications: ['DIPLOMA', 'BACHELOR'],
      employmentType: 'FULL_TIME',
      workMode: 'WFO',
      status: 'PUBLISHED',
      departmentId: deptSales.id,
      categoryId: catSales.id,
    },
    {
      title: 'Marketing Intern',
      description: 'Membantu tim marketing menjalankan kampanye media sosial dan konten promosi.',
      qualifications: ['DIPLOMA', 'BACHELOR'],
      employmentType: 'INTERNSHIP',
      workMode: 'HYBRID',
      status: 'PUBLISHED',
      departmentId: deptMkt.id,
      categoryId: catMkt.id,
    },
    {
      title: 'Finance Staff',
      description: 'Mengelola laporan keuangan, invoice, dan arus kas bulanan perusahaan.',
      qualifications: ['DIPLOMA', 'BACHELOR'],
      employmentType: 'FULL_TIME',
      workMode: 'WFO',
      status: 'CLOSED',
      departmentId: deptFin.id,
      categoryId: catFin.id,
    },
  ];

  for (const job of jobs) {
    await createJobIfNotExists(job, user.id);
  }
  console.log('✅ Jobs seeded');
};

type CandidateSeed = {
  name: string;
  email: string;
  major: string;
  skills: string[];
  experiences: {
    company: string;
    position: string;
    startDate: string;
    endDate: string | null;
    description: string;
  }[];
  certificates: {
    name: string;
    issuer: string;
    issueDate: string;
    expiryDate: string | null;
    description: string;
  }[];
};

const seedCandidateHistory = async (candidateId: string, candidate: CandidateSeed) => {
  for (const experience of candidate.experiences) {
    const existing = await db.candidateExperience.findFirst({
      where: {
        candidateId,
        company: experience.company,
        position: experience.position,
        startDate: new Date(experience.startDate),
      },
    });
    const data = {
      ...experience,
      startDate: new Date(experience.startDate),
      endDate: experience.endDate ? new Date(experience.endDate) : null,
    };

    if (existing) {
      await db.candidateExperience.update({ where: { id: existing.id }, data });
    } else {
      await db.candidateExperience.create({ data: { ...data, candidateId } });
    }
  }

  for (const certificate of candidate.certificates) {
    const existing = await db.candidateCertificate.findFirst({
      where: {
        candidateId,
        name: certificate.name,
        issuer: certificate.issuer,
      },
    });
    const data = {
      ...certificate,
      issueDate: new Date(certificate.issueDate),
      expiryDate: certificate.expiryDate ? new Date(certificate.expiryDate) : null,
    };

    if (existing) {
      await db.candidateCertificate.update({ where: { id: existing.id }, data });
    } else {
      await db.candidateCertificate.create({ data: { ...data, candidateId } });
    }
  }
};

const seedApplications = async () => {
  const passwordHash = await bcrypt.hash('candidate123', 10);
  const demoResumePath = await createDemoResume();
  const candidates: CandidateSeed[] = [
    {
      name: 'Alya Putri',
      email: 'alya.putri@example.com',
      major: 'Teknik Informatika',
      skills: ['React', 'TypeScript', 'Tailwind CSS'],
      experiences: [
        {
          company: 'Nusantara Digital',
          position: 'Frontend Developer',
          startDate: '2024-06-01',
          endDate: null,
          description: 'Mengembangkan dashboard operasional menggunakan React dan TypeScript, membangun komponen UI reusable, serta meningkatkan aksesibilitas dan performa halaman.',
        },
        {
          company: 'Kreasi Teknologi',
          position: 'Frontend Developer Intern',
          startDate: '2023-06-01',
          endDate: '2023-12-31',
          description: 'Membantu implementasi desain responsif, integrasi REST API, dan perbaikan bug pada aplikasi web internal.',
        },
      ],
      certificates: [
        {
          name: 'Meta Front-End Developer',
          issuer: 'Meta',
          issueDate: '2024-02-01',
          expiryDate: null,
          description: 'Program pengembangan front-end meliputi HTML, CSS, JavaScript, React, version control, dan aksesibilitas web.',
        },
        {
          name: 'Responsive Web Design',
          issuer: 'freeCodeCamp',
          issueDate: '2023-03-15',
          expiryDate: null,
          description: 'Sertifikasi praktik membangun halaman web responsif dengan HTML, CSS, Flexbox, Grid, dan prinsip desain mobile-first.',
        },
      ],
    },
    {
      name: 'Bima Pratama',
      email: 'bima.pratama@example.com',
      major: 'Sistem Informasi',
      skills: ['Node.js', 'PostgreSQL', 'Express'],
      experiences: [
        {
          company: 'DataKita',
          position: 'Backend Developer',
          startDate: '2024-03-01',
          endDate: null,
          description: 'Merancang REST API dengan Node.js dan Express, mengelola skema PostgreSQL, serta menambahkan validasi dan automated tests untuk layanan internal.',
        },
        {
          company: 'Solusi Aplikasi Indonesia',
          position: 'Software Engineer Intern',
          startDate: '2023-01-01',
          endDate: '2023-07-31',
          description: 'Mendukung pengembangan service backend, menulis query database, dan mendokumentasikan endpoint untuk integrasi frontend.',
        },
      ],
      certificates: [
        {
          name: 'Back End Development and APIs',
          issuer: 'freeCodeCamp',
          issueDate: '2023-08-20',
          expiryDate: null,
          description: 'Materi mencakup Node.js, Express, REST API, autentikasi, dan penggunaan database untuk aplikasi backend.',
        },
        {
          name: 'Database Design Fundamentals',
          issuer: 'Oracle Academy',
          issueDate: '2022-11-10',
          expiryDate: null,
          description: 'Pelatihan dasar pemodelan relasional, normalisasi, SQL, dan integritas data.',
        },
      ],
    },
    {
      name: 'Citra Maharani',
      email: 'citra.maharani@example.com',
      major: 'Manajemen',
      skills: ['Sales', 'Komunikasi', 'Negosiasi'],
      experiences: [
        {
          company: 'Mitra Niaga Sejahtera',
          position: 'Sales Representative',
          startDate: '2023-07-01',
          endDate: null,
          description: 'Mengelola prospek pelanggan, melakukan presentasi produk, menyiapkan penawaran, dan menjaga hubungan dengan klien bisnis.',
        },
        {
          company: 'Retail Nusantara',
          position: 'Sales Associate',
          startDate: '2022-02-01',
          endDate: '2023-05-31',
          description: 'Melayani kebutuhan pelanggan, membantu pencapaian target penjualan, serta menyusun rekap aktivitas penjualan mingguan.',
        },
      ],
      certificates: [
        {
          name: 'Professional Selling Skills',
          issuer: 'Dale Carnegie Training',
          issueDate: '2024-01-18',
          expiryDate: null,
          description: 'Pelatihan identifikasi kebutuhan pelanggan, presentasi solusi, penanganan keberatan, dan negosiasi penjualan.',
        },
        {
          name: 'Fundamentals of Digital Marketing',
          issuer: 'Google Digital Garage',
          issueDate: '2023-06-12',
          expiryDate: null,
          description: 'Dasar pemasaran digital, customer journey, analitik, dan strategi membangun kehadiran bisnis online.',
        },
      ],
    },
    {
      name: 'Daffa Ramadhan',
      email: 'daffa.ramadhan@example.com',
      major: 'Ilmu Komunikasi',
      skills: ['Content Marketing', 'SEO', 'Social Media'],
      experiences: [
        {
          company: 'Ruang Cerita Media',
          position: 'Content Marketing Specialist',
          startDate: '2024-01-01',
          endDate: null,
          description: 'Menyusun kalender konten, menulis artikel SEO, mengelola kanal media sosial, dan mengevaluasi performa konten berdasarkan engagement.',
        },
        {
          company: 'Kabar Kampus',
          position: 'Content Writer Intern',
          startDate: '2023-02-01',
          endDate: '2023-08-31',
          description: 'Melakukan riset topik, menulis dan menyunting artikel, serta berkoordinasi dengan editor untuk menjaga konsistensi gaya publikasi.',
        },
      ],
      certificates: [
        {
          name: 'SEO Fundamentals',
          issuer: 'Semrush Academy',
          issueDate: '2024-02-14',
          expiryDate: null,
          description: 'Pengenalan riset kata kunci, optimasi on-page, technical SEO, dan pengukuran performa pencarian organik.',
        },
        {
          name: 'Content Marketing Certification',
          issuer: 'HubSpot Academy',
          issueDate: '2023-09-21',
          expiryDate: null,
          description: 'Strategi perencanaan konten, storytelling, distribusi konten, dan evaluasi efektivitas kampanye.',
        },
      ],
    },
    {
      name: 'Intan Permata',
      email: 'intan.permata@example.com',
      major: 'Teknik Informatika',
      skills: ['React', 'JavaScript', 'CSS'],
      experiences: [
        {
          company: 'Aplikasi Bersama',
          position: 'Junior Frontend Engineer',
          startDate: '2024-08-01',
          endDate: null,
          description: 'Membangun fitur antarmuka menggunakan React, mengintegrasikan API, dan berkolaborasi dengan designer untuk memastikan pengalaman lintas perangkat.',
        },
        {
          company: 'Studio Web Kreatif',
          position: 'Web Developer Intern',
          startDate: '2023-07-01',
          endDate: '2024-01-31',
          description: 'Membuat landing page responsif, memperbaiki tampilan lintas browser, dan membantu pemeliharaan situs klien.',
        },
      ],
      certificates: [
        {
          name: 'JavaScript Algorithms and Data Structures',
          issuer: 'freeCodeCamp',
          issueDate: '2023-05-05',
          expiryDate: null,
          description: 'Pembelajaran JavaScript, struktur data, algoritma, pemrograman fungsional, dan pemecahan masalah.',
        },
        {
          name: 'React Basics',
          issuer: 'Meta',
          issueDate: '2024-03-10',
          expiryDate: null,
          description: 'Dasar React, komponen, props, state, event handling, dan pengembangan antarmuka interaktif.',
        },
      ],
    },
    {
      name: 'Rizky Aditya',
      email: 'rizky.aditya@example.com',
      major: 'Akuntansi',
      skills: ['Excel', 'Accounting', 'Financial Reporting'],
      experiences: [
        {
          company: 'Artha Konsultan',
          position: 'Accounting Staff',
          startDate: '2023-09-01',
          endDate: null,
          description: 'Mencatat transaksi, melakukan rekonsiliasi bank, menyiapkan laporan keuangan bulanan, dan mendukung proses penutupan buku.',
        },
        {
          company: 'Koperasi Sejahtera',
          position: 'Finance Intern',
          startDate: '2022-06-01',
          endDate: '2022-12-31',
          description: 'Membantu pengarsipan invoice, memeriksa dokumen pengeluaran, dan menyiapkan rekap kas menggunakan spreadsheet.',
        },
      ],
      certificates: [
        {
          name: 'Microsoft Office Specialist: Excel Associate',
          issuer: 'Microsoft',
          issueDate: '2023-04-22',
          expiryDate: null,
          description: 'Validasi kemampuan mengelola workbook, formula, tabel, grafik, dan analisis data menggunakan Microsoft Excel.',
        },
        {
          name: 'Accounting Fundamentals',
          issuer: 'Corporate Finance Institute',
          issueDate: '2022-12-15',
          expiryDate: null,
          description: 'Dasar siklus akuntansi, jurnal, rekonsiliasi, laporan laba rugi, neraca, dan arus kas.',
        },
      ],
    },
  ];

  const seededCandidates = [];
  for (const [index, candidate] of candidates.entries()) {
    const savedCandidate = await db.candidate.upsert({
      where: { email: candidate.email },
      update: {
        fullName: candidate.name,
        major: candidate.major,
        skills: candidate.skills,
        onboardedAt: new Date(),
      },
      create: {
        fullName: candidate.name,
        email: candidate.email,
        passwordHash,
        phone: `0812345678${String(index).padStart(2, '0')}`,
        gender: index % 2 === 0 ? 'FEMALE' : 'MALE',
        province: 'DKI Jakarta',
        city: 'Jakarta',
        address: `Jl. Karier No. ${index + 1}, Jakarta`,
        institution: 'Universitas Indonesia',
        major: candidate.major,
        graduationYear: '2025',
        educationLevel: 'BACHELOR',
        noticePeriod: 'ONE_MONTH',
        birthDate: new Date('2000-01-15T00:00:00.000Z'),
        onboardedAt: new Date(),
        skills: candidate.skills,
        languages: ['Bahasa Indonesia', 'English'],
      },
    });
    seededCandidates.push(savedCandidate);
    await seedCandidateHistory(savedCandidate.id, candidate);

    const existingResume = await db.candidateResume.findFirst({
      where: { candidateId: savedCandidate.id, isPrimary: true },
    });
    if (!existingResume) {
      await db.candidateResume.create({
        data: {
          candidateId: savedCandidate.id,
          fileUrl: demoResumePath,
          isPrimary: true,
        },
      });
    } else {
      await db.candidateResume.update({
        where: { id: existingResume.id },
        data: { fileUrl: demoResumePath },
      });
    }
  }

  const seededJobs = await db.jobPosting.findMany({
    where: {
      title: {
        in: [
          'Frontend Developer',
          'Backend Developer',
          'Sales Executive',
          'Marketing Intern',
        ],
      },
    },
    select: { id: true, title: true, postedById: true },
  });
  const jobByTitle = new Map(seededJobs.map((job) => [job.title, job]));
  const applications = [
    { candidate: 0, job: 'Frontend Developer', status: 'SCREENING' as const, daysAgo: 1 },
    { candidate: 1, job: 'Backend Developer', status: 'PROCESS' as const, daysAgo: 2 },
    { candidate: 2, job: 'Sales Executive', status: 'ACCEPTED' as const, daysAgo: 3 },
    { candidate: 3, job: 'Marketing Intern', status: 'REJECTED' as const, daysAgo: 4 },
    { candidate: 4, job: 'Frontend Developer', status: 'PROCESS' as const, daysAgo: 5 },
    { candidate: 5, job: 'Backend Developer', status: 'SCREENING' as const, daysAgo: 6 },
  ];

  for (const [index, application] of applications.entries()) {
    const candidate = seededCandidates[application.candidate];
    const job = jobByTitle.get(application.job);
    if (!candidate || !job) {
      throw new Error(`Data kandidat atau lowongan seed tidak ditemukan: ${application.job}`);
    }

    const resume = await db.candidateResume.findFirst({
      where: { candidateId: candidate.id, isPrimary: true },
    });
    if (!resume) {
      throw new Error(`Resume utama tidak ditemukan untuk ${candidate.email}`);
    }

    const appliedAt = new Date();
    appliedAt.setDate(appliedAt.getDate() - application.daysAgo);

    const savedApplication = await db.application.upsert({
      where: {
        candidateId_jobPostingId: {
          candidateId: candidate.id,
          jobPostingId: job.id,
        },
      },
      update: {
        status: application.status,
        appliedAt,
        resumeId: resume.id,
      },
      create: {
        candidateId: candidate.id,
        jobPostingId: job.id,
        resumeId: resume.id,
        status: application.status,
        appliedAt,
      },
    });

    const existingNotification = await db.notification.findFirst({
      where: {
        recipientId: job.postedById,
        applicationId: savedApplication.id,
        type: 'NEW_APPLICATION',
      },
      select: { id: true },
    });

    if (!existingNotification) {
      await db.notification.create({
        data: {
          recipientId: job.postedById,
          applicationId: savedApplication.id,
          type: 'NEW_APPLICATION',
          message: `Ada lamaran baru dari ${candidate.fullName?.trim() || candidate.email} untuk lowongan "${job.title}".`,
          isRead: index % 2 === 1,
          sentAt: appliedAt,
        },
      });
    }
  }

  console.log('✅ Demo candidates, applications, and notifications seeded');
};

const main = async () => {
  await seedDepartments();
  await seedCategories();
  await seedUser();
  await seedJobs();
  await seedApplications();
};

main()
  .then(async () => {
    await db.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });