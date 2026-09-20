import { useState } from 'react'
import type { FormEvent } from 'react'
import { Modal } from './ui/Modal'
import { TextField } from './ui/TextField'
import { Button } from './ui/Button'
import styles from './SettleDebtModal.module.css'
import type { Client, PaymentMethod, Sale } from '../types'
import { getSalePendingAmount } from '../types'
import { paymentService } from '../services/paymentService'
import { centsDigitsToAmount, digitsOnly, formatBRL, formatCentsDigits } from '../utils/currency'

const PAYMENT_CHIPS: { value: PaymentMethod; label: string }[] = [
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'pix', label: 'Pix' },
  { value: 'cartao', label: 'Cartão' },
]

interface SettleDebtModalProps {
  client: Client
  pendingSales: Sale[]
  onClose: () => void
  onSettled: () => void
}

/** Permite registrar um pagamento recebido para abater da dívida acumulada do cliente. */
export function SettleDebtModal({ client, pendingSales, onClose, onSettled }: SettleDebtModalProps) {
  const [amountDigits, setAmountDigits] = useState('')
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('dinheiro')
  const [error, setError] = useState<string | null>(null)

  // Busca o total de pagamentos já realizados para calcular o saldo devedor real no modal
  const clientPayments = paymentService.getByClient(client.id)
  const totalSalesUnpaid = pendingSales.reduce((sum, sale) => sum + getSalePendingAmount(sale), 0)
  const totalPaymentsMade = clientPayments.reduce((sum, p) => sum + p.amount, 0)
  const totalDevendo = Math.max(0, totalSalesUnpaid - totalPaymentsMade)

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    const amount = centsDigitsToAmount(amountDigits)

    if (!Number.isFinite(amount) || amount <= 0) {
      setError('Informe o valor a abater.')
      return
    }
    if (amount > totalDevendo + 0.001) {
      setError(`O valor não pode ser maior que a dívida total (${formatBRL(totalDevendo)}).`)
      return
    }
    setError(null)

    // Grava o novo pagamento no histórico
    paymentService.add({
      clientId: client.id,
      amount,
      paymentMethod,
      paidAt: new Date().toISOString(),
    })

    onSettled()
  }

  return (
    <Modal title={`Abater dívida — ${client.name}`} onClose={onClose}>
      <form className={styles.form} onSubmit={handleSubmit}>
        <p className={styles.hint}>
          Dívida total: <strong>{formatBRL(totalDevendo)}</strong>. O valor informado será registrado como um pagamento recebido e abatido do saldo devedor.
        </p>

        <TextField
          label="Valor a abater (R$)"
          inputMode="numeric"
          placeholder="0,00"
          value={amountDigits ? formatCentsDigits(amountDigits) : ''}
          onChange={(value) => setAmountDigits(digitsOnly(value))}
        />

        <div className={styles.chipField}>
          <span className={styles.chipLabel}>Forma de pagamento</span>
          <div className={styles.chipGrid}>
            {PAYMENT_CHIPS.map((chip) => (
              <button
                key={chip.value}
                type="button"
                aria-pressed={paymentMethod === chip.value}
                className={`${styles.chip} ${paymentMethod === chip.value ? styles.chipSelected : ''}`}
                onClick={() => setPaymentMethod(chip.value)}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {error && <p className={styles.error}>{error}</p>}

        <Button type="submit" fullWidth className={styles.confirmButton}>
          Abater
        </Button>
      </form>
    </Modal>
  )
}