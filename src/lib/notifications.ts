import prisma from './prisma'
import { NotificationType } from '@prisma/client'
import { daysUntilDeadline } from './utils'

export async function createNotification({
  userId,
  type,
  title,
  message,
  link,
}: {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}) {
  return prisma.notification.create({
    data: { userId, type, title, message, link },
  })
}

export async function scheduleDeadlineReminders(userId: string, opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  })
  if (!opportunity) return

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { profile: true },
  })
  if (!user) return

  const reminderDays = user.profile?.reminderDays ?? [30, 14, 7, 2]
  const daysLeft = daysUntilDeadline(opportunity.deadline)

  for (const day of reminderDays) {
    if (daysLeft > day) {
      // In production, schedule these with a job queue (e.g., Inngest, cron)
      // For now, we log them — they'll be triggered by a cron API route
      console.log(`Schedule reminder for ${userId} at ${day} days before deadline`)
    }
  }
}

export async function sendDeadlineReminders() {
  // Called by a cron job (e.g., daily at 8am)
  const now = new Date()

  const applications = await prisma.application.findMany({
    include: {
      opportunity: true,
      user: {
        include: { profile: true },
      },
    },
    where: {
      opportunity: {
        deadline: { gt: now },
        status: 'OPEN',
      },
    },
  })

  const notificationDays = [30, 14, 7, 2]

  for (const app of applications) {
    const daysLeft = daysUntilDeadline(app.opportunity.deadline)
    const reminderDays = app.user.profile?.reminderDays ?? notificationDays

    if (reminderDays.includes(daysLeft)) {
      await createNotification({
        userId: app.userId,
        type: 'DEADLINE_REMINDER',
        title: `Deadline in ${daysLeft} days`,
        message: `The deadline for "${app.opportunity.title}" is in ${daysLeft} days.`,
        link: `/opportunities/${app.opportunityId}`,
      })
    }
  }
}

export async function notifyMatchingUsers(opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  })
  if (!opportunity) return

  const matchingUsers = await prisma.user.findMany({
    where: {
      profile: {
        OR: [
          { targetFields: { has: opportunity.field } },
          { targetCountries: { has: opportunity.country } },
        ],
      },
    },
    select: { id: true },
  })

  for (const user of matchingUsers) {
    await createNotification({
      userId: user.id,
      type: 'NEW_OPPORTUNITY',
      title: 'New opportunity matches your profile',
      message: `"${opportunity.title}" just posted — matches your interests.`,
      link: `/opportunities/${opportunityId}`,
    })
  }
}
