import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import {randomUUID} from 'node:crypto';
import {Customer} from '@/models';
import {db} from './db';

export interface Address {
  id: string;
  fullName: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CustomerRecord {
  id: string;
  name: string;
  email: string;
  phone?: string;
  passwordHash: string;
  createdAt: string;
  addresses: Address[];
}

const DATA_DIR = path.join(process.cwd(), '.data');
const FILE_PATH = path.join(DATA_DIR, 'customers.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadLocalCustomers(): CustomerRecord[] {
  try {
    ensureDataDir();
    if (!fs.existsSync(FILE_PATH)) return [];
    const text = fs.readFileSync(FILE_PATH, 'utf-8');
    return JSON.parse(text) || [];
  } catch {
    return [];
  }
}

function saveLocalCustomers(records: CustomerRecord[]) {
  try {
    ensureDataDir();
    fs.writeFileSync(FILE_PATH, JSON.stringify(records, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to save customers locally:', e);
  }
}

export async function findCustomerByEmail(email: string): Promise<CustomerRecord | null> {
  const normEmail = email.trim().toLowerCase();
  if (process.env.MONGODB_URI) {
    try {
      await db();
      const doc = await Customer.findOne({ email: normEmail }).lean() as any;
      if (doc) {
        return {
          id: String(doc._id),
          name: (doc as any).name || 'Valued Customer',
          email: doc.email,
          phone: (doc as any).phone || '',
          passwordHash: doc.passwordHash || '',
          createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
          addresses: (doc as any).addresses || []
        };
      }
    } catch {
      // Fallback to local
    }
  }

  const list = loadLocalCustomers();
  return list.find(c => c.email.toLowerCase() === normEmail) || null;
}

export async function findCustomerById(id: string): Promise<CustomerRecord | null> {
  if (process.env.MONGODB_URI) {
    try {
      await db();
      const doc = await Customer.findById(id).lean() as any;
      if (doc) {
        return {
          id: String(doc._id),
          name: (doc as any).name || 'Valued Customer',
          email: doc.email,
          phone: (doc as any).phone || '',
          passwordHash: doc.passwordHash || '',
          createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
          addresses: (doc as any).addresses || []
        };
      }
    } catch {
      // Fallback to local
    }
  }

  const list = loadLocalCustomers();
  return list.find(c => c.id === id) || null;
}

export async function createCustomer(data: { name: string; email: string; phone?: string; password: string }): Promise<CustomerRecord> {
  const normEmail = data.email.trim().toLowerCase();
  const existing = await findCustomerByEmail(normEmail);
  if (existing) {
    throw new Error('An account with this email address already exists. Please sign in instead.');
  }

  const hash = await bcrypt.hash(data.password, 10);
  const newId = randomUUID();
  const now = new Date().toISOString();

  const record: CustomerRecord = {
    id: newId,
    name: data.name.trim(),
    email: normEmail,
    phone: data.phone?.trim() || '',
    passwordHash: hash,
    createdAt: now,
    addresses: []
  };

  if (process.env.MONGODB_URI) {
    try {
      await db();
      const doc = await Customer.create({
        name: record.name,
        email: record.email,
        phone: record.phone,
        passwordHash: record.passwordHash
      });
      record.id = String(doc._id);
      return record;
    } catch {
      // Fallback to local
    }
  }

  const list = loadLocalCustomers();
  list.push(record);
  saveLocalCustomers(list);
  return record;
}

export async function updateCustomerProfile(id: string, updates: { name?: string; phone?: string }): Promise<CustomerRecord | null> {
  if (process.env.MONGODB_URI) {
    try {
      await db();
      const doc = await Customer.findByIdAndUpdate(id, { $set: updates }, { new: true }).lean() as any;
      if (doc) {
        return {
          id: String(doc._id),
          name: (doc as any).name || '',
          email: doc.email,
          phone: (doc as any).phone || '',
          passwordHash: doc.passwordHash || '',
          createdAt: (doc as any).createdAt?.toISOString() || new Date().toISOString(),
          addresses: (doc as any).addresses || []
        };
      }
    } catch {
      // Fallback to local
    }
  }

  const list = loadLocalCustomers();
  const idx = list.findIndex(c => c.id === id);
  if (idx === -1) return null;
  if (updates.name) list[idx].name = updates.name.trim();
  if (updates.phone !== undefined) list[idx].phone = updates.phone.trim();
  saveLocalCustomers(list);
  return list[idx];
}

export async function addCustomerAddress(customerId: string, address: Omit<Address, 'id'>): Promise<Address[]> {
  const newAddress: Address = {
    ...address,
    id: randomUUID()
  };

  const list = loadLocalCustomers();
  const customer = list.find(c => c.id === customerId);
  if (customer) {
    if (newAddress.isDefault) {
      customer.addresses.forEach(a => { a.isDefault = false; });
    } else if (customer.addresses.length === 0) {
      newAddress.isDefault = true;
    }
    customer.addresses.push(newAddress);
    saveLocalCustomers(list);
    return customer.addresses;
  }

  return [newAddress];
}
