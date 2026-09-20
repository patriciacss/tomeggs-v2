import { STORAGE_KEYS, storageService } from '../storage/storageService'
import type { Payment, PaymentInput } from '../types'
import { generateId } from '../utils/id'
import { syncQueue } from './syncQueue'

function getAll(): Payment[] {
  return storageService.get<Payment[]>(STORAGE_KEYS.payments, [])
}

function saveAll(payments: Payment[]): void {
  storageService.set(STORAGE_KEYS.payments, payments)
}

function getByClient(clientId: string): Payment[] {
  return getAll()
    .filter((p) => p.clientId === clientId)
    .sort((a, b) => (a.paidAt < b.paidAt ? -1 : a.paidAt > b.paidAt ? 1 : 0))
}

function add(input: PaymentInput): Payment {
  const now = new Date().toISOString()
  const payment: Payment = {
    ...input,
    id: generateId(),
    createdAt: now,
    updatedAt: now,
  }
  const payments = getAll()
  payments.push(payment)
  saveAll(payments)
  syncQueue.queue('payment', payment.id)
  return payment
}

function remove(id: string): void {
  syncQueue.queue('payment', id, 'delete')
  saveAll(getAll().filter((p) => p.id !== id))
}

/** Remove todos os pagamentos de um cliente (usado ao excluir o cliente). */
function removeByClient(clientId: string): void {
  for (const payment of getByClient(clientId)) {
    remove(payment.id)
  }
}

export const paymentService = {
  getAll,
  getByClient,
  add,
  remove,
  removeByClient,
}
