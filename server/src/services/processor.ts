import { prisma } from '../lib/prisma.js';
import { processTranscript, type AgentResult } from './agent.js';

export async function processMeeting(meetingId: string): Promise<void> {
  const meeting = await prisma.meeting.findUnique({
    where: { id: meetingId },
    include: { contacts: { include: { contact: true } } },
  });

  if (!meeting || !meeting.transcript) {
    throw new Error('Meeting not found or has no transcript');
  }

  try {
    // Mark as processing
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'PROCESSING' },
    });

    // Run LLM extraction
    const result = await processTranscript(meeting.transcript);

    // Store results in a transaction
    await prisma.$transaction(async (tx) => {
      // Update meeting summary
      await tx.meeting.update({
        where: { id: meetingId },
        data: {
          summary: result.summary,
          status: 'COMPLETED',
        },
      });

      // Create action items
      if (result.actionItems.length > 0) {
        await tx.actionItem.createMany({
          data: result.actionItems.map((item) => ({
            meetingId,
            description: item.description,
            assignee: item.assignee,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
          })),
        });
      }

      // Upsert contacts from participants list and link to meeting
      const upsertedContacts: { id: string; name: string }[] = [];
      for (const participantName of result.participants) {
        const existing = await tx.contact.findFirst({
          where: { name: { equals: participantName, mode: 'insensitive' } },
        });

        const contact = existing ?? await tx.contact.create({
          data: { name: participantName, status: 'PROSPECT' },
        });

        upsertedContacts.push({ id: contact.id, name: contact.name });

        const alreadyLinked = meeting.contacts.some((mc) => mc.contactId === contact.id);
        if (!alreadyLinked) {
          await tx.meetingContact.create({
            data: { meetingId, contactId: contact.id },
          });
        }
      }

      // Create CRM field changes — match against upserted contacts
      for (const change of result.crmChanges) {
        const matchedContact = upsertedContacts.find(
          (c) => c.name.toLowerCase().includes(change.contactName.toLowerCase())
            || change.contactName.toLowerCase().includes(c.name.toLowerCase())
        );

        await tx.cRMFieldChange.create({
          data: {
            meetingId,
            contactId: matchedContact?.id || null,
            fieldName: change.fieldName,
            oldValue: change.oldValue,
            newValue: change.newValue,
          },
        });
      }

      // Create follow-up email
      if (result.followUpEmail) {
        await tx.followUpEmail.create({
          data: {
            meetingId,
            subject: result.followUpEmail.subject,
            body: result.followUpEmail.body,
            to: result.followUpEmail.to,
          },
        });
      }
    });
  } catch (error) {
    // Mark as failed on error
    await prisma.meeting.update({
      where: { id: meetingId },
      data: { status: 'FAILED' },
    });
    throw error;
  }
}
