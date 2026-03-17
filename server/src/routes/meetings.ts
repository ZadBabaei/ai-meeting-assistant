import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { prisma } from '../lib/prisma.js';
import { processMeeting } from '../services/processor.js';
import { transcribeAudio } from '../services/transcribe.js';

export const meetingRoutes = Router();

const upload = multer({
  dest: 'uploads/',
  limits: { fileSize: 25 * 1024 * 1024 }, // 25MB limit (Whisper max)
  fileFilter: (_req, file, cb) => {
    const allowed = ['.mp3', '.mp4', '.mpeg', '.mpga', '.m4a', '.wav', '.webm'];
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, allowed.includes(ext));
  },
});

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

// Create a new meeting (JSON body with transcript)
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

// Upload audio file, transcribe, and create meeting
meetingRoutes.post('/upload', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No audio file provided' });
    }

    const title = req.body.title || 'Untitled Meeting';

    // Create meeting with PROCESSING status while we transcribe
    const meeting = await prisma.meeting.create({
      data: { title, status: 'PROCESSING' },
      include: {
        contacts: { include: { contact: true } },
        actionItems: true,
      },
    });

    res.status(201).json(meeting);

    // Transcribe async, then update the meeting
    try {
      const transcript = await transcribeAudio(req.file.path);
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { transcript, status: 'PENDING' },
      });
    } catch (err) {
      console.error(`Failed to transcribe audio for meeting ${meeting.id}:`, err);
      await prisma.meeting.update({
        where: { id: meeting.id },
        data: { status: 'FAILED' },
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to upload and transcribe audio' });
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

    // Start processing asynchronously
    res.json({ message: 'Processing started', meetingId: req.params.id });

    processMeeting(req.params.id).catch((err) => {
      console.error(`Failed to process meeting ${req.params.id}:`, err);
    });
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
