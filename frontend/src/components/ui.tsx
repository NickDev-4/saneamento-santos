import { useEffect, useId, useRef } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, CalendarDays, Check, ChevronRight, CircleAlert, Droplets, LoaderCircle, MapPin, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Case, Status } from '../contracts';
import { statusLabels } from '../contracts';

export function Brand({ compact = false }: { compact?: boolean }) {
  return <Link to="/" className={`brand ${compact ? 'brand-compact' : ''}`} aria-label="Saneamento Santos, início"><span className="brand-symbol"><Droplets size={25} strokeWidth={1.8}/></span><span>Saneamento<strong>Santos<span className="brand-dot">.</span></strong></span></Link>;
}
export function Button({ children, variant = 'primary', className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  return <button {...props} className={`button button-${variant} ${className}`}>{children}</button>;
}
export function StatusBadge({ status }: { status: Status }) { return <span className={`status-badge status-${status.toLowerCase()}`}><span className="status-dot"/>{statusLabels[status]}</span>; }
export function date(value: string, time = false) {
  const d = new Date(value); if (Number.isNaN(d.getTime())) return 'Data não informada';
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: 'short', ...(time ? { hour: '2-digit', minute: '2-digit' } : {}), timeZone: 'America/Sao_Paulo' }).format(d);
}
export function address(c: Case) { return `${c.endereco.logradouro}${c.endereco.semNumero ? ', s/n' : `, ${c.endereco.numero}`}`; }
export function VisitWindow({ value, compact = false }: { value: Case['previsaoVisita']; compact?: boolean }) {
  const hour = (v: string) => new Intl.DateTimeFormat('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: 'America/Sao_Paulo' }).format(new Date(v));
  return <div className={`visit-window ${compact ? 'visit-compact' : ''}`}><span className="visit-icon"><CalendarDays size={19}/></span><div><span className="muted small">Previsão de visita</span><strong>{value ? `${date(value.inicio)} · ${hour(value.inicio)} às ${hour(value.fim)}` : 'Sem previsão informada'}</strong></div></div>;
}
export function CaseCard({ item, to, onSelect, selected = false }: { item: Case; to?: string; onSelect?: () => void; selected?: boolean }) {
  const content = <><span className={`case-card-icon pin-${item.status.toLowerCase()}`}><Droplets size={20}/></span><span className="case-card-body"><span className="case-card-top"><small>{item.protocolo}</small><StatusBadge status={item.status}/></span><strong>{address(item)}</strong><span className="case-type">{item.tipo}</span><span className="case-meta"><MapPin size={13}/>{item.endereco.bairro}<span>·</span>{date(item.criadoEm)}</span></span><ChevronRight className="case-chevron" size={18}/></>;
  return to ? <Link className={`case-card ${selected ? 'selected' : ''}`} to={to}>{content}</Link> : <button className={`case-card ${selected ? 'selected' : ''}`} onClick={onSelect}>{content}</button>;
}
export function PageTitle({ eyebrow, title, description, action }: { eyebrow?: string; title: string; description?: string; action?: ReactNode }) {
  return <div className="page-title"><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>;
}
export function State({ loading, error, retry, title = 'Nenhum chamado por aqui', text, children }: { loading?: boolean; error?: string; retry?: () => void; title?: string; text?: string; children?: ReactNode }) {
  return <div className="empty-state">{loading ? <LoaderCircle className="spin" size={28}/> : error ? <CircleAlert size={30}/> : <Droplets size={34}/>}<h2>{loading ? 'Carregando…' : error ? 'Não foi possível carregar' : title}</h2><p>{error || text || (loading ? 'Buscando as informações para você.' : 'Experimente outros filtros ou registre um problema.')}</p>{error && retry && <Button variant="secondary" onClick={retry}>Tentar novamente</Button>}{children}</div>;
}
export function BackLink({ to = '/', children = 'Voltar' }: { to?: string; children?: ReactNode }) { return <Link className="back-link" to={to}><ArrowLeft size={17}/>{children}</Link>; }
export function Field({ label, htmlFor, error, hint, children, optional }: { label: string; htmlFor: string; error?: string; hint?: string; children: ReactNode; optional?: boolean }) {
  return <div className={`field ${error ? 'field-error' : ''}`}><label htmlFor={htmlFor}>{label}{optional && <span className="optional">Opcional</span>}</label>{children}{error ? <span className="field-message" role="alert">{error}</span> : hint ? <span className="field-hint">{hint}</span> : null}</div>;
}
export function Dialog({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  const ref = useRef<HTMLDialogElement>(null); const titleId = useId();
  useEffect(() => { const element = ref.current; element?.showModal(); return () => element?.close(); }, []);
  return createPortal(<dialog ref={ref} className="dialog" aria-labelledby={titleId} onCancel={onClose} onClick={e => { if (e.target === e.currentTarget) onClose(); }}><div className="dialog-heading"><h2 id={titleId}>{title}</h2><button className="icon-button" aria-label="Fechar janela" onClick={onClose}><X size={20}/></button></div>{children}</dialog>, document.body);
}
export function Success({ title, text, to, label }: { title: string; text: string; to: string; label: string }) { return <div className="success-panel"><span className="success-icon"><Check size={34}/></span><h1>{title}</h1><p>{text}</p><Link className="button button-primary" to={to}>{label}<ArrowRight size={18}/></Link></div>; }
