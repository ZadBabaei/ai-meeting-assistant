import { Router } from 'express';
import { prisma } from '../lib/prisma.js';

export const contactRoutes = Router();

// List all contacts
contactRoutes.get('/', async (req, res) => {
  try {
    const { status, search } = req.query;
    const contacts = await prisma.contact.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(search
          ? {
              OR: [
                { name: { contains: search as string, mode: 'insensitive' } },
                { email: { contains: search as string, mode: 'insensitive' } },
                { company: { contains: search as string, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { meetings: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
});

// Get contact by ID with meeting history
contactRoutes.get('/:id', async (req, res) => {
  try {
    const contact = await prisma.contact.findUnique({
      where: { id: req.params.id },
      include: {
        meetings: {
          include: {
            meeting: {
              include: {
                actionItems: true,
              },
            },
          },
          orderBy: { meeting: { date: 'desc' } },
        },
        crmChanges: { orderBy: { createdAt: 'desc' } },
      },
    });
    if (!contact) {
      return res.status(404).json({ error: 'Contact not found' });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contact' });
  }
});

// Create a new contact
contactRoutes.post('/', async (req, res) => {
  try {
    const { name, email, company, role, phone, notes, status } = req.body;
    const contact = await prisma.contact.create({
      data: { name, email, company, role, phone, notes, ...(status ? { status } : {}) },
    });
    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create contact' });
  }
});

// Update a contact
contactRoutes.patch('/:id', async (req, res) => {
  try {
    const { name, email, company, role, phone, status, notes } = req.body;
    const contact = await prisma.contact.update({
      where: { id: req.params.id },
      data: { name, email, company, role, phone, status, notes },
    });
    res.json(contact);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update contact' });
  }
});

// Delete a contact
contactRoutes.delete('/:id', async (req, res) => {
  try {
    await prisma.contact.delete({ where: { id: req.params.id } });
    res.json({ message: 'Contact deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete contact' });
  }
});
