import prisma from './prisma'
import { NotificationType } from '@prisma/client'
import { daysUntilDeadline } from './utils'
import { scoreOpportunity } from './matching'
import { sendDeadlineReminderEmail, sendNewOpportunityEmail } from './email'

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
      // For now, we log them  -  they'll be triggered by a cron API route
      console.log(`Schedule reminder for ${userId} at ${day} days before deadline`)
    }
  }
}

export async function sendDeadlineReminders() {
  // Called by the consolidated daily cron route.
  const now = new Date()
  const notificationDays = [30, 14, 7, 2]

  // Track notified (userId:opportunityId) to avoid duplicates when a user
  // has both saved and applied to the same opportunity
  const notified = new Set<string>()

  // 1. Users tracking via Applications
  const applications = await prisma.application.findMany({
    include: {
      opportunity: true,
      user: { include: { profile: true } },
    },
    where: {
      opportunity: { deadline: { gt: now }, status: 'OPEN' },
    },
  })

  for (const app of applications) {
    const daysLeft = daysUntilDeadline(app.opportunity.deadline)
    const reminderDays = app.user.profile?.reminderDays ?? notificationDays

    if (reminderDays.includes(daysLeft)) {
      notified.add(`${app.userId}:${app.opportunityId}`)
      await createNotification({
        userId: app.userId,
        type: 'DEADLINE_REMINDER',
        title: `Deadline in ${daysLeft} days`,
        message: `The deadline for "${app.opportunity.title}" is in ${daysLeft} days.`,
        link: `/opportunities/${app.opportunityId}`,
      })
      if (app.user.profile?.notifyEmail !== false && app.user.email) {
        sendDeadlineReminderEmail({
          to: app.user.email,
          name: app.user.name ?? 'there',
          opportunityTitle: app.opportunity.title,
          opportunityId: app.opportunityId,
          daysLeft,
        }).catch(console.error)
      }
    }
  }

  // 2. Users who bookmarked (saved) but haven't applied
  const savedOpps = await prisma.savedOpportunity.findMany({
    include: {
      opportunity: true,
      user: { include: { profile: true } },
    },
    where: {
      opportunity: { deadline: { gt: now }, status: 'OPEN' },
    },
  })

  for (const saved of savedOpps) {
    const key = `${saved.userId}:${saved.opportunityId}`
    if (notified.has(key)) continue // already reminded via application

    const daysLeft = daysUntilDeadline(saved.opportunity.deadline)
    const reminderDays = saved.user.profile?.reminderDays ?? notificationDays

    if (reminderDays.includes(daysLeft)) {
      await createNotification({
        userId: saved.userId,
        type: 'DEADLINE_REMINDER',
        title: `Deadline in ${daysLeft} days`,
        message: `"${saved.opportunity.title}" closes in ${daysLeft} days  -  don't miss it!`,
        link: `/opportunities/${saved.opportunityId}`,
      })
      if (saved.user.profile?.notifyEmail !== false && saved.user.email) {
        sendDeadlineReminderEmail({
          to: saved.user.email,
          name: saved.user.name ?? 'there',
          opportunityTitle: saved.opportunity.title,
          opportunityId: saved.opportunityId,
          daysLeft,
        }).catch(console.error)
      }
    }
  }
}

export async function notifyMatchingUsers(opportunityId: string) {
  const opportunity = await prisma.opportunity.findUnique({
    where: { id: opportunityId },
  })
  if (!opportunity) return

  // Pull every user with a profile, then score each one with the matching
  // engine. Only genuinely strong matches (score >= threshold) get alerted -
  // this replaces the old naive field-OR-country broadcast.
  const MATCH_THRESHOLD = 50

  const users = await prisma.user.findMany({
    where: { status: 'ACTIVE', profile: { isNot: null } },
    select: {
      id: true,
      email: true,
      name: true,
      profile: {
        select: {
          level: true,
          targetCountries: true,
          targetFields: true,
          courseOfStudy: true,
          department: true,
          degree: true,
          graduationYear: true,
          notifyEmail: true,
        },
      },
    },
  })

  for (const user of users) {
    const { score, reasons } = scoreOpportunity(opportunity, user.profile)
    if (score < MATCH_THRESHOLD) continue

    await createNotification({
      userId: user.id,
      type: 'NEW_OPPORTUNITY',
      title: `New ${score}% match for you`,
      message: `"${opportunity.title}" just posted - ${reasons.join(', ')}.`,
      link: `/opportunities/${opportunityId}`,
    })

    if (user.profile?.notifyEmail !== false && user.email) {
      sendNewOpportunityEmail({
        to: user.email,
        name: user.name ?? 'there',
        opportunityTitle: opportunity.title,
        opportunityId,
        hostOrg: opportunity.hostOrg,
        country: opportunity.country,
        matchScore: score,
        matchReasons: reasons,
      }).catch(console.error)
    }
  }
}
