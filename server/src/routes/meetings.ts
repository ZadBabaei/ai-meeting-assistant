import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const meetingRoutes = Router();

// List all meetings
meetingRoutes.get('/', async (_req, res) => {
  try {
    const meetings = await prisma.meeting.findMany({
      include: {
        contacts: { include: { contact: true } },
        actionItems: true,
        _count: { select: { crmChanges: true } },
      },
      orderBy: { date: 'desc' },
    });
    res.json(meetings);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meetings' });
  }
});

// Get meeting by ID with all related data
meetingRoutes.get('/:id', async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
      include: {
        contacts: { include: { contact: true } },
        actionItems: { orderBy: { createdAt: 'asc' } },
        crmChanges: { include: { contact: true } },
        followUpEmail: true,
      },
    });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    res.json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch meeting' });
  }
});

// Create a new meeting
meetingRoutes.post('/', async (req, res) => {
  try {
    const { title, transcript, date, contactIds } = req.body;
    const meeting = await prisma.meeting.create({
      data: {
        title,
        transcript,
        date: date ? new Date(date) : new Date(),
        contacts: contactIds?.length
          ? {
              create: contactIds.map((contactId: string) => ({
                contactId,
              })),
            }
          : undefined,
      },
      include: {
        contacts: { include: { contact: true } },
        actionItems: true,
      },
    });
    res.status(201).json(meeting);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create meeting' });
  }
});

// Trigger LLM processing for a meeting
meetingRoutes.post('/:id/process', async (req, res) => {
  try {
    const meeting = await prisma.meeting.findUnique({
      where: { id: req.params.id },
    });
    if (!meeting) {
      return res.status(404).json({ error: 'Meeting not found' });
    }
    if (!meeting.transcript) {
      return res.status(400).json({ error: 'Meeting has no transcript to process' });
    }

    // Mark as processing
    await prisma.meeting.update({
      where: { id: req.params.id },
      data: { status: 'PROCESSING' },
    });

    // TODO: Wire up LLM agent pipeline in Phase 2
    res.json({ message: 'Processing started', meetingId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: 'Failed to start processing' });
  }
});

// Delete a meeting
meetingRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.meeting.delete({ where: { id: req.params.id } });
    res.json({ message: 'Meeting deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete meeting' });
  }
});
