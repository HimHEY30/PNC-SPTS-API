import { Injectable } from '@nestjs/common';
import { DashboardRepository } from './dashboard.repository';

@Injectable()
export class DashboardService {
  constructor(private readonly repository: DashboardRepository) {}

  async getSummary() {
    const now = new Date();
    // Start of the current month
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Fetch current and historical values
    const [
      totalStudents,
      prevTotalStudents,
      studentsUnderFollowUp,
      prevStudentsUnderFollowUp,
      openCases,
      prevOpenCases,
      resolvedCases,
      prevResolvedCases,
      recentCases,
    ] = await Promise.all([
      this.repository.getStudentsCount(),
      this.repository.getStudentsCount(startOfCurrentMonth),
      this.repository.getStudentsUnderFollowUpCount(),
      this.repository.getStudentsUnderFollowUpCount(startOfCurrentMonth),
      this.repository.getOpenCasesCount(),
      this.repository.getOpenCasesCount(startOfCurrentMonth),
      this.repository.getResolvedCasesCount(),
      this.repository.getResolvedCasesCount(startOfCurrentMonth),
      this.repository.getRecentActivities(10),
    ]);

    const stats = [
      {
        label: 'Total Students',
        value: totalStudents.toLocaleString('en-US'),
        trend: this.calculateTrend(totalStudents, prevTotalStudents),
        color_key: 'blue',
      },
      {
        label: 'Students Under Follow-Up',
        value: studentsUnderFollowUp.toLocaleString('en-US'),
        trend: this.calculateTrend(studentsUnderFollowUp, prevStudentsUnderFollowUp),
        color_key: 'amber',
      },
      {
        label: 'Open Cases',
        value: openCases.toLocaleString('en-US'),
        trend: this.calculateTrend(openCases, prevOpenCases),
        color_key: 'rose',
      },
      {
        label: 'Resolved Cases',
        value: resolvedCases.toLocaleString('en-US'),
        trend: this.calculateTrend(resolvedCases, prevResolvedCases),
        color_key: 'emerald',
      },
    ];

    const recentActivity = recentCases.map((c) => {
      const teacherName = `${c.openedByTeacher.firstName} ${c.openedByTeacher.lastName}`.trim();
      const studentName = `${c.student.firstName} ${c.student.lastName}`.trim();
      
      // Map database PriorityLevel to capitalized PriorityLevel
      const priorityMap: Record<string, string> = {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        critical: 'Critical',
      };
      const priority = priorityMap[c.priority.toLowerCase()] || 'Medium';

      // Map categories
      const categoryType = c.caseTypeMap?.[0]?.followUpType?.name || 'Academic';

      return {
        id: c.id,
        teacher: teacherName,
        student: studentName,
        date: this.formatRelativeTime(c.createdAt, now),
        subject: c.title,
        type: categoryType,
        priority: priority,
      };
    });

    return {
      stats,
      recent_activity: recentActivity,
    };
  }

  calculateTrend(current: number, previous: number): string {
    if (previous === 0) {
      return current > 0 ? '+100%' : '0%';
    }
    const pct = ((current - previous) / previous) * 100;
    const rounded = Math.round(pct);
    const sign = rounded >= 0 ? '+' : '';
    return `${sign}${rounded}%`;
  }

  formatRelativeTime(date: Date, now: Date = new Date()): string {
    const diffMs = now.getTime() - date.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 0) {
      return 'just now'; // Fallback for minor clock drift
    }
    if (diffSec < 60) {
      return 'just now';
    } else if (diffMin < 60) {
      return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
    } else if (diffHour < 24) {
      return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
    } else if (diffDay < 30) {
      return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
    } else {
      const diffMonth = Math.floor(diffDay / 30);
      return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
    }
  }
}
