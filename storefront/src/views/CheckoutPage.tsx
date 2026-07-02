'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, Lock, Loader2, AlertCircle, ChevronDown, ChevronUp,
  ShieldCheck, MapPin, CreditCard, QrCode, FileText, Save,
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { formatPrice } from '@/lib/hooks';
import { sdk } from '@/lib/medusa';
import type { HttpTypes } from '@medusajs/types';
import ShippingQuote, { QuoteOption, ShippingQuoteItem } from '@/components/ShippingQuote';
import {
  CustomerAddress,
  createCustomerAddress,
  listCustomerAddresses,
} from '@/lib/auth';

declare global {
  interface Window {
    MercadoPago: any;
  }
}

const SHIPPING_PREVIEW_KEY = 'superfrete_preview';
const CHECKOUT_FORM_KEY = 'checkout_form_draft';
const BACKEND_URL = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL ?? 'http://localhost:9000';
const PUBLISHABLE_KEY = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY ?? '';
const STORE_HEADERS = {
  'Content-Type': 'application/json',
  'x-publishable-api-key': PUBLISHABLE_KEY,
};

// ─── Masks ────────────────────────────────────────────────────────────────────

const maskCEP = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 8);
  return d.length <= 5 ? d : `${d.slice(0, 5)}-${d.slice(5)}`;
};
const maskPhone = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
};
const maskCPF = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 3) return d;
  if (d.length <= 6) return `${d.slice(0, 3)}.${d.slice(3)}`;
  if (d.length <= 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
};
const maskCard = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 16);
  return d.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
};
const maskExpiry = (v: string) => {
  const d = v.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}/${d.slice(2)}`;
};

// ─── Validators ───────────────────────────────────────────────────────────────

type FieldErrors = Record<string, string>;

const validateEmail = (v: string) => !v.trim() ? 'E-mail é obrigatório' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? 'E-mail inválido' : null;
const validatePhone = (v: string) => { const d = v.replace(/\D/g, ''); return !d ? 'Telefone é obrigatório' : (d.length < 10 || d.length > 11) ? 'Telefone deve ter 10 ou 11 dígitos' : null; };
const validateName = (v: string, label: string) => !v.trim() ? `${label} é obrigatório` : v.trim().length < 2 ? `${label} deve ter pelo menos 2 caracteres` : null;
const validateCEP = (v: string) => { const d = v.replace(/\D/g, ''); return !d ? 'CEP é obrigatório' : d.length !== 8 ? 'CEP deve ter 8 dígitos' : null; };
const validateRequired = (v: string, label: string) => !v.trim() ? `${label} é obrigatório` : null;
const validateCPF = (v: string) => { const d = v.replace(/\D/g, ''); return !d ? 'CPF é obrigatório' : d.length !== 11 ? 'CPF deve ter 11 dígitos' : null; };

const validateShippingForm = (form: ShippingForm): FieldErrors => {
  const errors: FieldErrors = {};
  const checks: Array<[string, string | null]> = [
    ['email', validateEmail(form.email)],
    ['phone', validatePhone(form.phone)],
    ['firstName', validateName(form.firstName, 'Nome')],
    ['lastName', validateName(form.lastName, 'Sobrenome')],
    ['postalCode', validateCEP(form.postalCode)],
    ['address1', validateRequired(form.address1, 'Rua')],
    ['number', validateRequired(form.number, 'Número')],
    ['neighborhood', validateRequired(form.neighborhood, 'Bairro')],
    ['city', validateRequired(form.city, 'Cidade')],
    ['state', validateRequired(form.state, 'Estado')],
  ];
  checks.forEach(([k, err]) => { if (err) errors[k] = err; });
  return errors;
};

// ─── ViaCEP ───────────────────────────────────────────────────────────────────

interface ViaCEPResponse {
  cep: string; logradouro: string; complemento: string;
  bairro: string; localidade: string; uf: string; erro?: boolean;
}
const fetchAddressByCEP = async (cep: string): Promise<ViaCEPResponse | null> => {
  const digits = cep.replace(/\D/g, '');
  if (digits.length !== 8) return null;
  try {
    const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
    const data: ViaCEPResponse = await res.json();
    return data.erro ? null : data;
  } catch { return null; }
};

// ─── Types ────────────────────────────────────────────────────────────────────

interface ShippingForm {
  email: string; firstName: string; lastName: string;
  address1: string; number: string; complement: string;
  neighborhood: string; postalCode: string; city: string;
  state: string; countryCode: string; phone: string;
}

type PaymentMethod = 'card' | 'pix' | 'boleto';
type Step = 'shipping' | 'payment' | 'success';

interface Installment { installments: number; installment_amount: number; total_amount: number; labels: string[] }

// ─── Shared InputField ────────────────────────────────────────────────────────

const InputField = ({
  label, placeholder, type = 'text', value, onChange, onBlur,
  autoComplete, error, disabled = false, loading = false, maxLength, inputRef,
}: {
  label: string; placeholder: string; type?: string; value: string;
  onChange: (v: string) => void; onBlur?: () => void; autoComplete?: string;
  error?: string; disabled?: boolean; loading?: boolean; maxLength?: number;
  inputRef?: React.Ref<HTMLInputElement>;
}) => (
  <div className="space-y-3 relative group">
    <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest group-focus-within:text-[#c8102e] transition-colors">{label}</label>
    <div className="relative">
      <input
        ref={inputRef} type={type} placeholder={placeholder} value={value}
        onChange={(e) => onChange(e.target.value)} onBlur={onBlur}
        autoComplete={autoComplete} disabled={disabled} maxLength={maxLength}
        className={`w-full bg-transparent border-b py-4 pr-8 text-sm font-medium focus:outline-none transition-all placeholder:text-zinc-800 text-white disabled:text-zinc-500 disabled:cursor-not-allowed ${error ? 'border-[#c8102e]' : 'border-zinc-800 focus:border-[#c8102e]'}`}
        aria-label={label} aria-invalid={!!error}
      />
      <div className="absolute right-0 top-1/2 -translate-y-1/2">
        {loading && <Loader2 size={16} className="text-[#c8102e] animate-spin" />}
        {!loading && value && !error && (
          <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} className="text-[#c8102e]">
            <CheckCircle2 size={16} />
          </motion.div>
        )}
      </div>
    </div>
    {error && (
      <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
        className="text-[9px] font-medium text-[#c8102e] tracking-wide">{error}</motion.p>
    )}
  </div>
);

// ─── StepProgress ─────────────────────────────────────────────────────────────

const StepProgress = ({ step }: { step: Step }) => {
  const steps = ['shipping', 'payment'];
  const currentIndex = steps.indexOf(step);
  return (
    <div className="max-w-xl mx-auto mb-16 px-4">
      <div className="flex justify-between mb-4">
        {['Endereço', 'Pagar'].map((label, idx) => (
          <div key={label} className="flex flex-col items-center">
            <span className={`text-[9px] font-bold uppercase tracking-[0.3em] transition-colors ${idx <= currentIndex ? 'text-white' : 'text-zinc-700'}`}>{label}</span>
            <span className={`text-[8px] mt-1 transition-colors ${idx === currentIndex ? 'text-[#c8102e]' : 'text-transparent'}`}>Etapa {idx + 1} de 2</span>
          </div>
        ))}
      </div>
      <div className="h-[2px] w-full bg-zinc-900 relative overflow-hidden rounded-full">
        <motion.div initial={{ width: 0 }} animate={{ width: `${(currentIndex + 1) * 50}%` }}
          className="absolute top-0 left-0 h-full bg-[#c8102e] transition-all duration-500" />
      </div>
    </div>
  );
};

// ─── MercadoPago Payment Form ─────────────────────────────────────────────────

const MercadoPagoForm = ({
  sessionId, cartId, cart, onSuccess,
}: {
  sessionId: string; cartId: string; cart: any; onSuccess: () => void;
}) => {
  const [method, setMethod] = useState<PaymentMethod>('card');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mpReady, setMpReady] = useState(false);
  const mpRef = useRef<any>(null);

  // Card form state
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [cpf, setCpf] = useState('');
  const [installments, setInstallments] = useState(1);
  const [installmentOptions, setInstallmentOptions] = useState<Installment[]>([]);
  const [loadingInstallments, setLoadingInstallments] = useState(false);

  // Pix/Boleto result
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [pixQrBase64, setPixQrBase64] = useState<string | null>(null);
  const [pixCopied, setPixCopied] = useState(false);
  const [boletoLine, setBoletoLine] = useState<string | null>(null);
  const [boletoUrl, setBoletoUrl] = useState<string | null>(null);
  const [boletoCopied, setBoletoCopied] = useState(false);

  // 3DS
  const [challengeUrl, setChallengeUrl] = useState<string | null>(null);
  const [mpOrderId, setMpOrderId] = useState<string | null>(null);
  const challengeRef = useRef<HTMLIFrameElement>(null);

  // Pix/Boleto async confirmation (polling)
  const [asyncPaymentId, setAsyncPaymentId] = useState<string | null>(null);
  const [asyncStatus, setAsyncStatus] = useState<'awaiting' | 'confirming' | 'rejected' | 'timeout'>('awaiting');
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollAttemptsRef = useRef(0);

  const POLL_INTERVAL_MS = 5000;
  const MAX_POLL_ATTEMPTS = 120; // ~10 minutos

  const orderTotal = cart?.total ?? 0;
  const currencyCode = cart?.currency_code ?? 'brl';

  // Load MP.js SDK
  useEffect(() => {
    const publicKey = process.env.NEXT_PUBLIC_MP_PUBLIC_KEY;
    if (!publicKey || mpRef.current) return;

    const loadSdk = async () => {
      if (!window.MercadoPago) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://sdk.mercadopago.com/js/v2';
          script.async = true;
          script.onload = () => resolve();
          script.onerror = () => reject(new Error('Failed to load MP SDK'));
          document.head.appendChild(script);
        });
      }
      mpRef.current = new window.MercadoPago(publicKey, { locale: 'pt-BR' });
      setMpReady(true);
    };

    loadSdk().catch(() => setError('Falha ao carregar o processador de pagamento.'));
  }, []);

  // Fetch installments when card BIN is complete
  useEffect(() => {
    const digits = cardNumber.replace(/\D/g, '');
    if (digits.length < 6 || !mpReady) {
      setInstallmentOptions([]);
      return;
    }

    const bin = digits.slice(0, 6);
    const amount = orderTotal.toFixed(2);

    const timer = setTimeout(async () => {
      setLoadingInstallments(true);
      try {
        const paymentMethods = await mpRef.current.getInstallments({
          amount, bin,
        });
        const options = paymentMethods?.[0]?.payer_costs ?? [];
        setInstallmentOptions(options);
        if (options.length > 0) setInstallments(options[0].installments);
      } catch {
        setInstallmentOptions([]);
      } finally {
        setLoadingInstallments(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [cardNumber, orderTotal, mpReady]);

  // 3DS challenge listener
  useEffect(() => {
    if (!challengeUrl) return;

    const handler = async (e: MessageEvent) => {
      if (e.data?.status !== 'COMPLETE' || !mpOrderId) return;

      setLoading(true);
      try {
        const res = await fetch(
          `${BACKEND_URL}/store/payments/mercadopago/status?payment_id=${mpOrderId}&session_id=${sessionId}&cart_id=${cartId}`,
          { headers: STORE_HEADERS }
        );
        const result = await res.json();

        if (result.status === 'approved') {
          await completeCart();
          onSuccess();
        } else {
          setError('Autenticação recusada pelo banco. Tente outro cartão.');
          setChallengeUrl(null);
        }
      } catch {
        setError('Erro ao verificar pagamento após autenticação.');
      } finally {
        setLoading(false);
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [challengeUrl, mpOrderId]);

  const completeCart = async () => {
    const result = await sdk.store.cart.complete(cartId);
    if (result.type !== 'order') throw new Error('Pedido não pôde ser concluído.');
  };

  // Pix/Boleto: enquanto o cliente estiver na tela, consulta o status a cada poucos
  // segundos e completa o carrinho assim que a MP confirmar o pagamento.
  useEffect(() => {
    if (!asyncPaymentId) return;

    pollAttemptsRef.current = 0;
    setAsyncStatus('awaiting');

    const tick = async () => {
      pollAttemptsRef.current += 1;

      try {
        const res = await fetch(
          `${BACKEND_URL}/store/payments/mercadopago/status?payment_id=${asyncPaymentId}&session_id=${sessionId}&cart_id=${cartId}`,
          { headers: STORE_HEADERS }
        );
        const result = await res.json();

        if (result.status === 'approved') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          try {
            await completeCart();
            onSuccess();
          } catch (err) {
            console.error('[MP] completeCart falhou após status aprovado:', err);
            setAsyncStatus('confirming');
          }
          return;
        }

        if (result.status === 'rejected' || result.status === 'cancelled') {
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          setAsyncStatus('rejected');
          return;
        }
      } catch (err) {
        console.error('[MP] Falha ao consultar status, tentando novamente no próximo ciclo:', err);
      }

      if (pollAttemptsRef.current >= MAX_POLL_ATTEMPTS) {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setAsyncStatus('timeout');
      }
    };

    pollIntervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [asyncPaymentId]);

  const resetAsyncPayment = () => {
    setAsyncPaymentId(null);
    setAsyncStatus('awaiting');
    setPixQrCode(null);
    setPixQrBase64(null);
    setBoletoLine(null);
    setBoletoUrl(null);
    setError(null);
  };

  const renderAsyncStatusBanner = () => {
    if (asyncStatus === 'confirming') {
      return (
        <div className="mt-6 flex items-center gap-3 text-zinc-400 text-[9px] font-bold uppercase tracking-widest">
          <Loader2 size={14} className="animate-spin text-[#c8102e]" />
          Confirmando pedido...
        </div>
      );
    }
    if (asyncStatus === 'rejected') {
      return (
        <div className="mt-6 space-y-4">
          <div className="flex items-center gap-3 bg-[#c8102e]/10 border border-[#c8102e]/20 p-4 text-[#c8102e] text-xs font-medium rounded-sm">
            <AlertCircle size={16} className="shrink-0" />
            <span>Pagamento não aprovado ou cancelado.</span>
          </div>
          <button type="button" onClick={resetAsyncPayment}
            className="px-6 py-3 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white">
            Tentar novamente
          </button>
        </div>
      );
    }
    if (asyncStatus === 'timeout') {
      return (
        <p className="mt-6 text-[9px] text-zinc-500 uppercase tracking-widest leading-relaxed">
          Ainda não identificamos seu pagamento. Você pode fechar esta página — avisaremos quando for confirmado assim que o pagamento processar.
        </p>
      );
    }
    return (
      <div className="mt-6 flex items-center gap-3 text-zinc-500 text-[9px] font-bold uppercase tracking-widest">
        <Loader2 size={12} className="animate-spin" />
        Aguardando confirmação do pagamento...
      </div>
    );
  };

  const handleCardPayment = async () => {
    if (!mpReady || !mpRef.current) {
      setError('Processador de pagamento não carregado. Recarregue a página.');
      return;
    }

    const cardDigits = cardNumber.replace(/\D/g, '');
    const [expMonth, expYear] = expiry.split('/');
    const cpfDigits = cpf.replace(/\D/g, '');
    const nameParts = cardName.trim().split(' ');

    if (!cardDigits || cardDigits.length < 13 || !expMonth || !expYear || cvv.length < 3 || !cardName.trim() || cpfDigits.length !== 11) {
      setError('Preencha todos os dados do cartão corretamente.');
      return;
    }

    setLoading(true);
    setError(null);

    let cardToken: any;
    try {
      cardToken = await mpRef.current.createCardToken({
        cardNumber: cardDigits,
        cardExpirationMonth: expMonth,
        cardExpirationYear: expYear,
        securityCode: cvv,
        cardholderName: cardName.trim(),
        identificationType: 'CPF',
        identificationNumber: cpfDigits,
      });
    } catch (tokenErr: any) {
      const cause0 = tokenErr?.cause?.[0];
      const detail =
        cause0?.description ??
        cause0?.message ??
        tokenErr?.message ??
        'Falha ao tokenizar o cartão.';
      console.error('[MP createCardToken cause]', JSON.stringify(tokenErr?.cause));
      setError(`Erro ao processar cartão: ${detail} (código: ${cause0?.code ?? '?'})`);
      setLoading(false);
      return;
    }

    try {
      if (!cardToken?.id) throw new Error('Não foi possível tokenizar o cartão.');

      const paymentMethodId = await mpRef.current.getPaymentMethods({ bin: cardDigits.slice(0, 6) })
        .then((res: any) => res?.results?.[0]?.id ?? '')
        .catch(() => '');

      const payer = {
        email: cart.email as string,
        first_name: nameParts[0],
        last_name: nameParts.slice(1).join(' ') || nameParts[0],
        identification: { type: 'CPF', number: cpfDigits },
      };

      const res = await fetch(`${BACKEND_URL}/store/payments/mercadopago/process`, {
        method: 'POST',
        headers: STORE_HEADERS,
        body: JSON.stringify({
          cart_id: cartId,
          session_id: sessionId,
          method: 'card',
          token: cardToken.id,
          payment_method_id: paymentMethodId,
          installments,
          payer,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        setError(result.message ?? 'Cartão recusado. Tente outro cartão.');
        return;
      }

      if (result.challenge_url) {
        setMpOrderId(result.mp_payment_id);
        setChallengeUrl(result.challenge_url);
        return;
      }

      if (result.status === 'approved') {
        await completeCart();
        onSuccess();
      } else if (result.status === 'rejected') {
        setError(`Cartão recusado (${result.status_detail ?? 'cc_rejected_other_reason'}). Tente outro cartão.`);
      } else {
        setError(`Pagamento não aprovado (status: ${result.status}). Tente novamente.`);
      }
    } catch (err: any) {
      setError(err.message ?? 'Erro ao processar pagamento.');
    } finally {
      setLoading(false);
    }
  };

  const handlePixPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BACKEND_URL}/store/payments/mercadopago/process`, {
        method: 'POST',
        headers: STORE_HEADERS,
        body: JSON.stringify({
          cart_id: cartId,
          session_id: sessionId,
          method: 'pix',
          payer: { email: cart.email as string },
        }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message ?? 'Erro ao gerar Pix.'); return; }
      setPixQrCode(result.qr_code ?? null);
      setPixQrBase64(result.qr_code_base64 ?? null);
      setAsyncPaymentId(String(result.mp_payment_id));
    } catch (err: any) {
      setError(err.message ?? 'Erro ao gerar Pix.');
    } finally {
      setLoading(false);
    }
  };

  const handleBoletoPayment = async () => {
    setLoading(true);
    setError(null);

    const shippingAddr = cart.shipping_address;
    const addrParts = (shippingAddr?.address_1 ?? '').split(',').map((s: string) => s.trim());

    try {
      const res = await fetch(`${BACKEND_URL}/store/payments/mercadopago/process`, {
        method: 'POST',
        headers: STORE_HEADERS,
        body: JSON.stringify({
          cart_id: cartId,
          session_id: sessionId,
          method: 'boleto',
          payer: {
            email: cart.email as string,
            first_name: shippingAddr?.first_name ?? '',
            last_name: shippingAddr?.last_name ?? '',
            identification: { type: 'CPF', number: cpf.replace(/\D/g, '') },
            address: {
              zip_code: (shippingAddr?.postal_code ?? '').replace(/\D/g, ''),
              street_name: addrParts[0] ?? '',
              street_number: addrParts[1] ?? '',
              neighborhood: shippingAddr?.province ?? '',
              city: shippingAddr?.city ?? '',
              federal_unit: shippingAddr?.province ?? '',
            },
          },
        }),
      });
      const result = await res.json();
      if (!res.ok) { setError(result.message ?? 'Erro ao gerar boleto.'); return; }
      setBoletoLine(result.digitable_line ?? null);
      setBoletoUrl(result.ticket_url ?? null);
      setAsyncPaymentId(String(result.mp_payment_id));
    } catch (err: any) {
      setError(err.message ?? 'Erro ao gerar boleto.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (method === 'card') handleCardPayment();
    else if (method === 'pix') handlePixPayment();
    else handleBoletoPayment();
  };

  // ─ 3DS Challenge overlay ─
  if (challengeUrl) {
    return (
      <div className="space-y-8">
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c8102e] to-transparent opacity-50" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-4">
            Autenticação do banco
          </p>
          <p className="text-xs text-zinc-500 mb-6">
            Conclua a autenticação na janela abaixo para finalizar o pagamento.
          </p>
          <iframe
            ref={challengeRef}
            src={challengeUrl}
            className="w-full h-96 border border-zinc-800 rounded-sm"
            title="Autenticação 3DS"
          />
        </div>
        {loading && (
          <div className="flex items-center gap-3 text-zinc-400 text-xs">
            <Loader2 size={14} className="animate-spin" />
            Verificando pagamento...
          </div>
        )}
        {error && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 bg-[#c8102e]/10 border border-[#c8102e]/20 p-4 text-[#c8102e] text-xs font-medium rounded-sm">
            <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
          </motion.div>
        )}
      </div>
    );
  }

  // ─ Pix success ─
  if (pixQrCode || pixQrBase64) {
    return (
      <div className="space-y-8">
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c8102e] to-transparent opacity-50" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-6">Pagar com Pix</p>
          {pixQrBase64 && (
            <div className="flex justify-center mb-6">
              <img src={`data:image/jpeg;base64,${pixQrBase64}`} alt="QR Code Pix" className="w-48 h-48 rounded-sm border border-zinc-800" />
            </div>
          )}
          {pixQrCode && (
            <div className="space-y-3">
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Código Copia e Cola</p>
              <div className="flex gap-3">
                <input readOnly value={pixQrCode}
                  className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-xs text-zinc-300 rounded-sm font-mono truncate" />
                <button
                  onClick={() => { navigator.clipboard.writeText(pixQrCode); setPixCopied(true); setTimeout(() => setPixCopied(false), 2000); }}
                  className="px-4 py-3 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white whitespace-nowrap"
                >
                  {pixCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
          {renderAsyncStatusBanner()}
        </div>
      </div>
    );
  }

  // ─ Boleto success ─
  if (boletoLine || boletoUrl) {
    return (
      <div className="space-y-8">
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c8102e] to-transparent opacity-50" />
          <p className="text-[9px] font-bold uppercase tracking-widest text-zinc-400 mb-6">Boleto Bancário</p>
          {boletoLine && (
            <div className="space-y-3 mb-6">
              <p className="text-[8px] font-bold uppercase tracking-widest text-zinc-600">Linha Digitável</p>
              <div className="flex gap-3">
                <input readOnly value={boletoLine}
                  className="flex-1 bg-zinc-900 border border-zinc-800 px-4 py-3 text-xs text-zinc-300 rounded-sm font-mono truncate" />
                <button
                  onClick={() => { navigator.clipboard.writeText(boletoLine); setBoletoCopied(true); setTimeout(() => setBoletoCopied(false), 2000); }}
                  className="px-4 py-3 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white whitespace-nowrap"
                >
                  {boletoCopied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          )}
          {boletoUrl && (
            <a href={boletoUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-6 py-4 border border-white/10 text-[9px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white">
              <FileText size={14} />Abrir Boleto PDF
            </a>
          )}
          <p className="mt-6 text-[9px] text-zinc-500 uppercase tracking-widest">
            O prazo para pagamento é de 3 dias úteis.
          </p>
          {renderAsyncStatusBanner()}
        </div>
      </div>
    );
  }

  // ─ Boleto requires CPF ─
  const showCpfField = method === 'boleto';

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Method tabs */}
      <div className="flex gap-0 border border-white/10">
        {([
          { id: 'card', label: 'Cartão', icon: CreditCard },
          { id: 'pix', label: 'Pix', icon: QrCode },
          { id: 'boleto', label: 'Boleto', icon: FileText },
        ] as const).map(({ id, label, icon: Icon }) => (
          <button
            key={id} type="button" onClick={() => { setMethod(id); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-2 py-4 text-[9px] font-bold uppercase tracking-widest transition-all ${method === id ? 'bg-[#c8102e] text-white' : 'text-zinc-500 hover:text-white'}`}
          >
            <Icon size={12} />{label}
          </button>
        ))}
      </div>

      {/* Card form */}
      {method === 'card' && (
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 relative overflow-hidden space-y-6">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#c8102e] to-transparent opacity-50" />
          <div className="flex justify-between items-center">
            <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">Dados do Cartão</label>
            <div className="flex gap-2"><ShieldCheck size={16} className="text-zinc-500" /><Lock size={16} className="text-zinc-500" /></div>
          </div>

          <InputField label="Número do Cartão" placeholder="0000 0000 0000 0000"
            value={cardNumber} onChange={(v) => setCardNumber(maskCard(v))} maxLength={19} />

          <div className="grid grid-cols-2 gap-8">
            <InputField label="Validade" placeholder="MM/AA"
              value={expiry} onChange={(v) => setExpiry(maskExpiry(v))} maxLength={5} />
            <InputField label="CVV" placeholder="123" type="password"
              value={cvv} onChange={(v) => setCvv(v.replace(/\D/g, '').slice(0, 4))} maxLength={4} />
          </div>

          <InputField label="Nome no Cartão" placeholder="JOÃO SILVA"
            value={cardName} onChange={(v) => setCardName(v.toUpperCase())} />

          <InputField label="CPF do titular" placeholder="000.000.000-00"
            value={cpf} onChange={(v) => setCpf(maskCPF(v))} maxLength={14} />

          {/* Installments */}
          {installmentOptions.length > 0 && (
            <div className="space-y-3">
              <label className="text-[8px] font-bold text-zinc-600 uppercase tracking-widest">
                Parcelas {loadingInstallments && <Loader2 size={10} className="inline animate-spin ml-1" />}
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full bg-transparent border-b border-zinc-800 py-4 text-sm font-medium text-white focus:outline-none focus:border-[#c8102e] transition-all"
              >
                {installmentOptions.map((opt) => (
                  <option key={opt.installments} value={opt.installments} className="bg-zinc-900">
                    {opt.installments}x de {formatPrice(opt.installment_amount, currencyCode)}
                    {opt.labels?.includes('CFT_percent') ? '' : ' sem juros'}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}

      {/* Pix info */}
      {method === 'pix' && (
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 space-y-4">
          <div className="flex items-center gap-3">
            <QrCode size={24} className="text-[#c8102e]" />
            <div>
              <p className="text-sm font-medium text-white">Pagamento instantâneo</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                QR Code gerado após confirmação. Válido por 30 minutos.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Boleto info */}
      {method === 'boleto' && (
        <div className="bg-zinc-950 border border-white/10 rounded-sm p-6 md:p-8 space-y-6">
          <div className="flex items-center gap-3">
            <FileText size={24} className="text-[#c8102e]" />
            <div>
              <p className="text-sm font-medium text-white">Boleto Bancário</p>
              <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-1">
                Prazo de até 3 dias úteis para compensação.
              </p>
            </div>
          </div>
          <InputField label="CPF para o boleto" placeholder="000.000.000-00"
            value={cpf} onChange={(v) => setCpf(maskCPF(v))} maxLength={14} />
        </div>
      )}

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 bg-[#c8102e]/10 border border-[#c8102e]/20 p-4 text-[#c8102e] text-xs font-medium rounded-sm">
          <AlertCircle size={16} className="shrink-0" /><span>{error}</span>
        </motion.div>
      )}

      {/* Submit */}
      <button
        type="submit" disabled={loading || (method === 'card' && !mpReady)}
        className="w-full bg-[#c8102e] text-white py-6 text-[10px] font-bold uppercase tracking-[0.5em] hover:bg-white hover:text-black transition-all shadow-2xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group"
      >
        <span className="absolute inset-0 w-full h-full bg-white -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
        <span className="relative flex items-center gap-3 group-hover:text-black transition-colors">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <Lock size={14} />}
          {loading ? 'Processando...' : `Pagar ${formatPrice(orderTotal, currencyCode)}`}
        </span>
      </button>

      <div className="flex flex-col items-center gap-2 text-zinc-500">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} />
          <span className="text-[9px] font-bold uppercase tracking-widest">Pagamento 100% Seguro</span>
        </div>
        <span className="text-[8px] uppercase tracking-widest text-zinc-600">Processado via Mercado Pago</span>
      </div>
    </form>
  );
};

// ─── Main CheckoutPage ─────────────────────────────────────────────────────────

const CheckoutPage: React.FC = () => {
  const [step, setStep] = useState<Step>('shipping');
  const { cart, updateCart } = useCart();
  const { customer, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingOptions, setShippingOptions] = useState<HttpTypes.StoreCartShippingOption[]>([]);
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);
  const [confirmedTotal, setConfirmedTotal] = useState<number | null>(null);
  const [isSummaryOpen, setIsSummaryOpen] = useState(false);
  const [cepLoading, setCepLoading] = useState(false);
  const [cepFetched, setCepFetched] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const numberInputRef = useRef<HTMLInputElement>(null);
  const userInteractedRef = useRef(false);

  const [savedAddresses, setSavedAddresses] = useState<CustomerAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [saveAddress, setSaveAddress] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const [shippingForm, setShippingForm] = useState<ShippingForm>(() => {
    const empty: ShippingForm = {
      email: '', firstName: '', lastName: '', address1: '', number: '',
      complement: '', neighborhood: '', postalCode: '', city: '', state: '',
      countryCode: 'br', phone: '',
    };
    if (typeof window === 'undefined') return empty;
    try {
      const raw = window.localStorage.getItem(CHECKOUT_FORM_KEY);
      if (raw) Object.assign(empty, JSON.parse(raw) as Partial<ShippingForm>);
    } catch {}
    if (!empty.postalCode) {
      try {
        const raw = window.localStorage.getItem(SHIPPING_PREVIEW_KEY);
        if (raw) { const p = JSON.parse(raw); if (p?.cep) empty.postalCode = maskCEP(p.cep); }
      } catch {}
    }
    return empty;
  });

  const [selectedQuote, setSelectedQuote] = useState<QuoteOption | null>(() => {
    if (typeof window === 'undefined') return null;
    try {
      const raw = window.localStorage.getItem(SHIPPING_PREVIEW_KEY);
      if (!raw) return null;
      const p = JSON.parse(raw);
      if (!p?.service_code) return null;
      return { service_code: p.service_code, name: p.service_name || '', price: p.price || 0, currency: 'R$', delivery_min: 0, delivery_max: 0 } as QuoteOption;
    } catch { return null; }
  });

  const currencyCode = cart?.currency_code ?? 'brl';

  useEffect(() => {
    if (!cart?.id) return;
    sdk.store.fulfillment.listCartOptions({ cart_id: cart.id })
      .then(({ shipping_options }) => setShippingOptions(shipping_options ?? []))
      .catch(console.error);
  }, [cart?.id]);

  useEffect(() => {
    if (!isAuthenticated || !customer) return;
    setShippingForm((prev) => ({
      ...prev,
      email: prev.email || customer.email || '',
      firstName: prev.firstName || customer.first_name || '',
      lastName: prev.lastName || customer.last_name || '',
      phone: prev.phone || (customer.phone ? maskPhone(customer.phone) : ''),
    }));
    listCustomerAddresses().then(setSavedAddresses).catch(console.error);
  }, [isAuthenticated, customer]);

  const applySavedAddress = (addrId: string) => {
    const addr = savedAddresses.find((a) => a.id === addrId);
    if (!addr) return;
    setSelectedAddressId(addrId);
    const meta = (addr.metadata ?? {}) as Record<string, any>;
    const addrParts = (addr.address_1 ?? '').split(',').map((s) => s.trim());
    setShippingForm((prev) => ({
      ...prev,
      firstName: addr.first_name || prev.firstName,
      lastName: addr.last_name || prev.lastName,
      phone: addr.phone ? maskPhone(addr.phone) : prev.phone,
      postalCode: addr.postal_code ? maskCEP(addr.postal_code) : prev.postalCode,
      address1: addrParts[0] || prev.address1,
      number: meta.number || addrParts[1] || prev.number,
      complement: addrParts[2] || prev.complement,
      neighborhood: meta.district || prev.neighborhood,
      city: addr.city || prev.city,
      state: (addr.province || '').toUpperCase() || prev.state,
      countryCode: addr.country_code || 'br',
    }));
    setCepFetched(true);
    setFieldErrors({});
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try { window.localStorage.setItem(CHECKOUT_FORM_KEY, JSON.stringify(shippingForm)); } catch {}
  }, [shippingForm]);

  useEffect(() => {
    const digits = shippingForm.postalCode.replace(/\D/g, '');
    if (digits.length !== 8) { if (cepFetched) setCepFetched(false); return; }
    const t = setTimeout(async () => {
      setCepLoading(true);
      const data = await fetchAddressByCEP(digits);
      setCepLoading(false);
      if (data) {
        setCepFetched(true);
        setShippingForm((prev) => ({
          ...prev,
          address1: data.logradouro || prev.address1,
          neighborhood: data.bairro || prev.neighborhood,
          city: data.localidade || prev.city,
          state: data.uf || prev.state,
          complement: data.complemento || prev.complement,
        }));
        setFieldErrors((prev) => {
          const n = { ...prev };
          ['address1', 'neighborhood', 'city', 'state', 'postalCode'].forEach((k) => delete n[k]);
          return n;
        });
        if (userInteractedRef.current) numberInputRef.current?.focus({ preventScroll: true });
      } else {
        setCepFetched(false);
        setFieldErrors((prev) => ({ ...prev, postalCode: 'CEP não encontrado' }));
      }
    }, 500);
    return () => clearTimeout(t);
  }, [shippingForm.postalCode]);

  const handleShippingChange = (field: keyof ShippingForm, value: string) => {
    userInteractedRef.current = true;
    let v = value;
    if (field === 'postalCode') v = maskCEP(value);
    if (field === 'phone') v = maskPhone(value);
    setShippingForm((prev) => ({ ...prev, [field]: v }));
    if (touched[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const handleBlur = (field: keyof ShippingForm) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const form = shippingForm;
    let error: string | null = null;
    if (field === 'email') error = validateEmail(form.email);
    else if (field === 'phone') error = validatePhone(form.phone);
    else if (field === 'firstName') error = validateName(form.firstName, 'Nome');
    else if (field === 'lastName') error = validateName(form.lastName, 'Sobrenome');
    else if (field === 'postalCode') error = validateCEP(form.postalCode);
    else if (field === 'address1') error = validateRequired(form.address1, 'Rua');
    else if (field === 'number') error = validateRequired(form.number, 'Número');
    else if (field === 'neighborhood') error = validateRequired(form.neighborhood, 'Bairro');
    else if (field === 'city') error = validateRequired(form.city, 'Cidade');
    else if (field === 'state') error = validateRequired(form.state, 'Estado');
    setFieldErrors((prev) => { if (error) return { ...prev, [field]: error }; const n = { ...prev }; delete n[field]; return n; });
  };

  const handleSubmitShipping = async () => {
    if (!cart) return;
    const errors = validateShippingForm(shippingForm);
    setFieldErrors(errors);
    const allTouched: Record<string, boolean> = {};
    Object.keys(shippingForm).forEach((k) => { allTouched[k] = true; });
    setTouched(allTouched);
    if (Object.keys(errors).length > 0) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const fullAddress = [shippingForm.address1, shippingForm.number, shippingForm.complement, shippingForm.neighborhood].filter(Boolean).join(', ');

    try {
      await updateCart({
        email: shippingForm.email,
        shipping_address: {
          first_name: shippingForm.firstName, last_name: shippingForm.lastName,
          address_1: fullAddress, postal_code: shippingForm.postalCode.replace(/\D/g, ''),
          city: shippingForm.city, province: shippingForm.state,
          country_code: shippingForm.countryCode, phone: shippingForm.phone,
        },
        billing_address: {
          first_name: shippingForm.firstName, last_name: shippingForm.lastName,
          address_1: fullAddress, postal_code: shippingForm.postalCode.replace(/\D/g, ''),
          city: shippingForm.city, province: shippingForm.state,
          country_code: shippingForm.countryCode, phone: shippingForm.phone,
        },
      });

      if (isAuthenticated && saveAddress && !selectedAddressId) {
        createCustomerAddress({
          first_name: shippingForm.firstName, last_name: shippingForm.lastName,
          phone: shippingForm.phone.replace(/\D/g, '') || undefined,
          address_1: fullAddress, postal_code: shippingForm.postalCode.replace(/\D/g, ''),
          city: shippingForm.city, province: shippingForm.state,
          country_code: shippingForm.countryCode,
          metadata: { district: shippingForm.neighborhood, number: shippingForm.number },
        } as any).catch(console.error);
      }

      const { shipping_options: availableOptions = [] } = await sdk.store.fulfillment.listCartOptions({ cart_id: cart.id });
      setShippingOptions(availableOptions);

      const matchOption = selectedQuote
        ? availableOptions.find((o: any) => {
            const code = o?.data?.service_code ?? (typeof o?.data?.id === 'string' ? Number(o.data.id.replace(/\D/g, '')) : null);
            return code === selectedQuote.service_code;
          }) ?? null
        : null;

      const chosen = matchOption || availableOptions[0] || null;
      if (!chosen) throw new Error('Nenhuma opção de frete disponível para este endereço.');

      await sdk.store.cart.addShippingMethod(cart.id, { option_id: chosen.id }).catch((err: any) => {
        throw new Error(`Frete: ${err?.response?.data?.message ?? err?.message ?? 'Erro ao aplicar frete'}`);
      });

      const { cart: updatedCart } = await sdk.store.cart.retrieve(cart.id);
      setConfirmedTotal(updatedCart.total);

      const { payment_collection } = await sdk.store.payment.initiatePaymentSession(updatedCart, {
        provider_id: 'pp_mercadopago_mercadopago',
      });

      const session = payment_collection?.payment_sessions?.[0];
      if (!session?.id) throw new Error('Sessão de pagamento não inicializada.');

      setPaymentSessionId(session.id);
      setStep('payment');
      window.scrollTo({ top: 0, behavior: 'instant' });
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? err?.message ?? 'Ocorreu um erro inesperado.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePaymentSuccess = useCallback(() => {
    setStep('success');
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(CHECKOUT_FORM_KEY);
      window.localStorage.removeItem(SHIPPING_PREVIEW_KEY);
    }
  }, []);

  const isFormValid = Object.keys(validateShippingForm(shippingForm)).length === 0;

  if (step === 'success') {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex flex-col items-center justify-center text-center p-6 bg-[#0a0a0a]">
        <div className="w-20 h-20 border border-[#c8102e] flex items-center justify-center mb-10 shadow-[0_0_50px_rgba(200,16,46,0.15)]">
          <CheckCircle2 size={32} className="text-[#c8102e]" />
        </div>
        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-6 italic text-white">CONFIRMADO.</h1>
        <p className="max-w-xs mx-auto text-zinc-500 text-xs font-medium uppercase tracking-[0.3em] leading-relaxed mb-12">
          Seu pedido está garantido. Bem-vindo à Joias do Bairro.
        </p>
        <button onClick={() => navigate('/')}
          className="px-16 py-5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white hover:text-black transition-all text-white">
          Voltar à Loja
        </button>
      </motion.div>
    );
  }

  return (
    <div className="bg-[#0a0a0a] min-h-screen text-white pt-10 pb-20">
      <div className="container mx-auto px-6">
        <StepProgress step={step} />

        {/* Mobile Summary */}
        <div className="lg:hidden mb-12">
          <button onClick={() => setIsSummaryOpen(!isSummaryOpen)}
            className="w-full flex items-center justify-between bg-zinc-900/50 border border-white/10 p-5 rounded-sm">
            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 flex items-center gap-2">
              {isSummaryOpen ? 'Ocultar Resumo' : 'Ver Resumo do Pedido'}
              {isSummaryOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </span>
            <span className="text-lg font-light tracking-tighter">{formatPrice(cart?.total ?? 0, currencyCode)}</span>
          </button>
          <AnimatePresence>
            {isSummaryOpen && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="bg-zinc-900/30 border-x border-b border-white/10 p-5 rounded-b-sm space-y-5">
                  {cart?.items?.map((item) => (
                    <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                      <div className="flex flex-col">
                        <span className="text-zinc-300">{item.product_title || item.title}</span>
                        <span className="text-[9px] text-zinc-600 uppercase mt-1">{item.variant_title && `${item.variant_title} · `}Qtd: {item.quantity}</span>
                      </div>
                      <span className="tracking-tighter text-sm">{formatPrice((item.unit_price ?? 0) * item.quantity, currencyCode)}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-24 max-w-6xl mx-auto">
          <div className="lg:col-span-7">
            <AnimatePresence mode="wait">
              <motion.div key={step} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.5, ease: 'circOut' }} className="space-y-16">

                {step === 'shipping' && (
                  <div className="space-y-16">
                    {isAuthenticated && savedAddresses.length > 0 && (
                      <div>
                        <h2 className="text-3xl font-light tracking-tighter mb-4">Endereços salvos</h2>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-600 mb-6">Selecione um endereço ou preencha um novo abaixo</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {savedAddresses.map((addr) => (
                            <button key={addr.id} type="button" onClick={() => applySavedAddress(addr.id)}
                              className={`text-left p-5 border transition-all ${selectedAddressId === addr.id ? 'border-[#c8102e] bg-[#c8102e]/5' : 'border-white/10 hover:border-white/20 bg-zinc-950'}`}>
                              <div className="flex items-center gap-2 mb-2"><MapPin size={12} className="text-[#c8102e]" /><span className="text-[9px] font-bold uppercase tracking-[0.3em] text-zinc-500">{addr.first_name} {addr.last_name}</span></div>
                              <div className="text-sm font-medium text-white leading-relaxed">{addr.address_1}</div>
                              <div className="text-[10px] text-zinc-500 uppercase tracking-widest mt-2">{addr.city} · {addr.province} · {addr.postal_code}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Informações de Contato</h2>
                      <div className="space-y-8">
                        <InputField label="E-mail" placeholder="contato@example.com" type="email" value={shippingForm.email}
                          onChange={(v) => handleShippingChange('email', v)} onBlur={() => handleBlur('email')}
                          autoComplete="email" error={touched.email ? fieldErrors.email : undefined} />
                        <InputField label="Telefone" placeholder="(11) 99999-9999" type="tel" value={shippingForm.phone}
                          onChange={(v) => handleShippingChange('phone', v)} onBlur={() => handleBlur('phone')}
                          autoComplete="tel" error={touched.phone ? fieldErrors.phone : undefined} maxLength={15} />
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Endereço de Entrega</h2>
                      <div className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <InputField label="Nome" placeholder="João" value={shippingForm.firstName}
                            onChange={(v) => handleShippingChange('firstName', v)} onBlur={() => handleBlur('firstName')}
                            autoComplete="given-name" error={touched.firstName ? fieldErrors.firstName : undefined} />
                          <InputField label="Sobrenome" placeholder="Silva" value={shippingForm.lastName}
                            onChange={(v) => handleShippingChange('lastName', v)} onBlur={() => handleBlur('lastName')}
                            autoComplete="family-name" error={touched.lastName ? fieldErrors.lastName : undefined} />
                        </div>
                        <div className="relative">
                          <InputField label="CEP" placeholder="00000-000" value={shippingForm.postalCode}
                            onChange={(v) => handleShippingChange('postalCode', v)} onBlur={() => handleBlur('postalCode')}
                            autoComplete="postal-code" error={touched.postalCode ? fieldErrors.postalCode : undefined}
                            loading={cepLoading} maxLength={9} />
                          {cepFetched && (
                            <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 mt-2">
                              <MapPin size={12} className="text-emerald-500" />
                              <span className="text-[9px] font-medium text-emerald-500 tracking-wide">Endereço preenchido automaticamente</span>
                            </motion.div>
                          )}
                        </div>
                        <InputField label="Rua" placeholder="Rua das Flores" value={shippingForm.address1}
                          onChange={(v) => handleShippingChange('address1', v)} onBlur={() => handleBlur('address1')}
                          autoComplete="street-address" error={touched.address1 ? fieldErrors.address1 : undefined}
                          disabled={cepFetched && !!shippingForm.address1} />
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-12 gap-y-8">
                          <InputField label="Número" placeholder="123" value={shippingForm.number}
                            onChange={(v) => handleShippingChange('number', v)} onBlur={() => handleBlur('number')}
                            error={touched.number ? fieldErrors.number : undefined} inputRef={numberInputRef} />
                          <InputField label="Complemento" placeholder="Apto 42 (opcional)" value={shippingForm.complement}
                            onChange={(v) => handleShippingChange('complement', v)} />
                          <InputField label="Bairro" placeholder="Centro" value={shippingForm.neighborhood}
                            onChange={(v) => handleShippingChange('neighborhood', v)} onBlur={() => handleBlur('neighborhood')}
                            error={touched.neighborhood ? fieldErrors.neighborhood : undefined}
                            disabled={cepFetched && !!shippingForm.neighborhood} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
                          <InputField label="Cidade" placeholder="São Paulo" value={shippingForm.city}
                            onChange={(v) => handleShippingChange('city', v)} onBlur={() => handleBlur('city')}
                            autoComplete="address-level2" error={touched.city ? fieldErrors.city : undefined}
                            disabled={cepFetched && !!shippingForm.city} />
                          <InputField label="Estado" placeholder="SP" value={shippingForm.state}
                            onChange={(v) => handleShippingChange('state', v.toUpperCase().slice(0, 2))} onBlur={() => handleBlur('state')}
                            autoComplete="address-level1" error={touched.state ? fieldErrors.state : undefined}
                            disabled={cepFetched && !!shippingForm.state} maxLength={2} />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h2 className="text-3xl font-light tracking-tighter mb-8">Método de Envio</h2>
                      <ShippingQuote
                        items={(cart?.items ?? []).map((it): ShippingQuoteItem => ({
                          name: it.product_title || it.title,
                          quantity: it.quantity, unit_price: it.unit_price ?? 0,
                          weight: (it.variant as any)?.weight ?? null, height: (it.variant as any)?.height ?? null,
                          width: (it.variant as any)?.width ?? null, length: (it.variant as any)?.length ?? null,
                        }))}
                        cartId={cart?.id} initialCep={shippingForm.postalCode}
                        selectedServiceCode={selectedQuote?.service_code ?? null}
                        onSelect={(opt, cep) => {
                          setSelectedQuote(opt);
                          if (opt) {
                            try { window.localStorage.setItem(SHIPPING_PREVIEW_KEY, JSON.stringify({ cep: cep || shippingForm.postalCode.replace(/\D/g, ''), service_code: opt.service_code, service_name: opt.name, price: opt.price })); } catch {}
                          }
                        }}
                        showCepInput={false} label="Escolha a transportadora" />
                    </div>

                    {isAuthenticated && !selectedAddressId && (
                      <div className="pt-4">
                        <label className="flex items-start gap-4 cursor-pointer group">
                          <div className="relative mt-1">
                            <input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} className="sr-only peer" />
                            <div className="w-4 h-4 border border-white/20 peer-checked:bg-[#c8102e] peer-checked:border-[#c8102e] transition-all flex items-center justify-center">
                              {saveAddress && <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6L5 9L10 3" stroke="white" strokeWidth="2" /></svg>}
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white group-hover:text-[#c8102e] transition-colors">
                              <Save size={12} />Salvar endereço para próximas compras
                            </div>
                            <div className="text-[9px] text-zinc-600 uppercase tracking-widest mt-1">Você poderá selecioná-lo rapidamente em futuras compras</div>
                          </div>
                        </label>
                      </div>
                    )}

                    {submitError && (
                      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 bg-[#c8102e]/10 border border-[#c8102e]/20 p-4 text-[#c8102e] text-xs font-medium rounded-sm">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" /><span>{submitError}</span>
                      </motion.div>
                    )}

                    <div className="pt-8">
                      <button onClick={handleSubmitShipping} disabled={isSubmitting || !isFormValid}
                        className="w-full bg-white text-black py-6 text-[10px] font-bold uppercase tracking-[0.4em] hover:bg-[#c8102e] hover:text-white transition-all shadow-xl disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden group">
                        <span className="absolute inset-0 w-full h-full bg-[#c8102e] -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                        <span className="relative flex items-center gap-3">
                          {isSubmitting && <Loader2 size={14} className="animate-spin" />}
                          Continuar para Pagamento
                        </span>
                      </button>
                      <div className="mt-6 flex items-center justify-center gap-2 text-zinc-500">
                        <ShieldCheck size={14} />
                        <span className="text-[9px] font-bold uppercase tracking-widest">Informações criptografadas e seguras</span>
                      </div>
                    </div>
                  </div>
                )}

                {step === 'payment' && paymentSessionId && (
                  <div className="space-y-12">
                    <h2 className="text-4xl font-light tracking-tighter">Pagamento</h2>
                    <MercadoPagoForm
                      sessionId={paymentSessionId}
                      cartId={cart!.id}
                      cart={cart}
                      onSuccess={handlePaymentSuccess}
                    />
                  </div>
                )}

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-5">
            <div className="glass p-10 sticky top-40 premium-shadow rounded-sm">
              <h3 className="text-[10px] font-bold uppercase tracking-[0.5em] text-zinc-600 mb-10">RESUMO DO PEDIDO</h3>
              <div className="space-y-6 mb-12">
                {cart?.items?.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-xs font-medium">
                    <div className="flex flex-col">
                      <span className="text-zinc-300">{item.product_title || item.title}</span>
                      <span className="text-[9px] text-zinc-600 uppercase">{item.variant_title && `${item.variant_title} · `}Qtd: {item.quantity}</span>
                    </div>
                    <span className="tracking-tighter">{formatPrice((item.unit_price ?? 0) * item.quantity, currencyCode)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-8 border-t border-zinc-900 flex justify-between items-end">
                <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Valor Total</span>
                <span className="text-3xl font-light tracking-tighter">{formatPrice(confirmedTotal ?? cart?.total ?? 0, currencyCode)}</span>
              </div>
              <div className="mt-12 flex items-center gap-3 text-zinc-700">
                <Lock size={12} />
                <span className="text-[8px] font-bold uppercase tracking-widest">Checkout Seguro · Mercado Pago</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
