import db from '../config/db';

export const getStats = async () => {
  const [
    totalJobs,
    activeJobs,
    totalApplications,
    applicationsByStatus,
    recentApplications,
    popularJobs,
  ] = await Promise.all([
    db.jobPosting.count(),
    db.jobPosting.count({ where: { status: 'PUBLISHED' } }),
    db.application.count(),
    db.application.groupBy({ by: ['status'], _count: { _all: true } }),
    db.application.findMany({
      take: 5,
      orderBy: { appliedAt: 'desc' },
      include: {
        candidate: { select: { fullName: true } },
        jobPosting: { select: { title: true } },
      },
    }),
    db.jobPosting.findMany({
      take: 5,
      orderBy: { applications: { _count: 'desc' } },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        _count: { select: { applications: true } },
      },
    }),
  ]);

  return {
    totalJobs,
    activeJobs,
    totalApplications,
    acceptedApplications: applicationsByStatus.find(
      ({ status }) => status === 'ACCEPTED',
    )?._count._all ?? 0,
    applicationsByStatus: applicationsByStatus.map(({ status, _count }) => ({
      status,
      count: _count._all,
    })),
    recentApplications: recentApplications.map((application) => ({
      id: application.id,
      status: application.status,
      appliedAt: application.appliedAt,
      candidateName: application.candidate.fullName ?? 'Nama belum diisi',
      position: application.jobPosting.title,
    })),
    popularJobs: popularJobs.map((job) => ({
      id: job.id,
      title: job.title,
      field: job.category?.name ?? job.department?.name ?? 'Belum dikategorikan',
      applicantCount: job._count.applications,
    })),
  };
};