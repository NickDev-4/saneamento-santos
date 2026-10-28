import { useEffect } from 'react';
import type { ReactNode } from 'react';
import { Bell, Building2, ChartNoAxesCombined, ClipboardList, LogIn, Map, MapPin, Plus, UserRound, Wrench } from 'lucide-react';
import { Link, Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom';
import type { Role } from '../contracts';
import { roleLabels } from '../contracts';
import { isDemo } from '../services';
import { Brand, State } from '../components/ui';
import { useAuth } from './context';
import { MapPage, MyCasesPage } from '../features/cases';
import { AuthPage, ProfilePage, NoticesPage } from '../features/account';
import { CaseDetailPage } from '../features/detail';
import { ReportPage } from '../features/report';
import { StaffPage, CityHallPage } from '../features/institutions';

function Guard({ role, children }: { role?: Role; children: ReactNode }) {
  const { user, ready, sessionError, retrySession } = useAuth(); const location = useLocation();
  if (!ready) return <State loading/>;
  if (sessionError && !user) return <State error={sessionError} retry={() => { void retrySession(); }}/>;
  if (!user) return <Navigate to={`/entrar?retorno=${encodeURIComponent(location.pathname + location.search)}`} replace/>;
  if (role && user.perfil !== role) return <div className="page-container"><State title="Esta área pertence a outro perfil" text={`Você está usando o perfil ${roleLabels[user.perfil]}. Acesse sua área pelo menu.`}><Link className="button button-primary" to={homeFor(user.perfil)}>Ir para minha área</Link></State></div>;
  return children;
}
export function homeFor(role: Role) { return role === 'SABESP' ? '/sabesp' : role === 'PREFEITURA' ? '/prefeitura' : '/meus-chamados'; }
function Shell({ children }: { children: ReactNode }) {
  const { user } = useAuth(); const location = useLocation();
  const institutional = user?.perfil === 'SABESP' || user?.perfil === 'PREFEITURA';
  const main = user?.perfil === 'SABESP' ? { to: '/sabesp', label: 'Atendimento', Icon: Wrench } : user?.perfil === 'PREFEITURA' ? { to: '/prefeitura', label: 'Visão geral', Icon: ChartNoAxesCombined } : { to: '/meus-chamados', label: 'Meus chamados', Icon: ClipboardList };
  useEffect(() => { if (location.pathname !== '/') window.scrollTo({ top: 0 }); }, [location.pathname]);
  return <><a href="#conteudo" className="skip-link">Pular para o conteúdo</a><header className="topbar"><div className="topbar-inner"><Brand/><nav className="desktop-nav" aria-label="Navegação principal"><NavLink to="/" end><Map size={17}/>Mapa da cidade</NavLink><NavLink to={main.to}><main.Icon size={17}/>{main.label}</NavLink>{!user && <NavLink to="/entrar?institucional=1"><Building2 size={17}/>Acesso institucional</NavLink>}</nav><div className="header-actions"><span className="city-label"><MapPin size={14}/>Santos, SP</span>{isDemo && <span className="demo-badge" title="Ambiente de demonstração"><span className="demo-dot"/><span className="demo-label-full">Demonstração</span><span className="demo-label-short">Demo</span></span>}{user?.perfil === 'CIDADAO' && <Link className="icon-button header-bell" to="/avisos" aria-label="Notificações"><Bell size={20}/><span className="notification-dot"/></Link>}<Link className={`avatar-button ${user ? '' : 'guest-avatar'}`} to={user ? '/perfil' : '/entrar'} aria-label={user ? 'Meu perfil' : 'Entrar na conta'}>{user ? user.nome.split(' ').map(n => n[0]).slice(0, 2).join('') : <UserRound size={20}/>}</Link></div></div></header><main id="conteudo">{children}</main><nav className={`bottom-nav ${institutional ? 'institutional-nav' : ''}`} aria-label="Navegação do aplicativo"><NavLink to="/" end><Map size={22}/><span>Mapa</span></NavLink><NavLink to={main.to}><main.Icon size={22}/><span>{institutional ? main.label : 'Chamados'}</span></NavLink>{!institutional && <NavLink className="register-nav" to="/registrar"><span className="register-orb"><Plus size={27}/></span><span>Registrar</span></NavLink>}{!institutional && <NavLink to="/avisos"><Bell size={22}/><span>Avisos</span></NavLink>}<NavLink to={user ? '/perfil' : '/entrar'}><UserRound size={22}/><span>{user ? 'Perfil' : 'Entrar'}</span></NavLink></nav></>;
}
export default function App() {
  return <Shell><Routes>
    <Route path="/" element={<MapPage/>}/>
    <Route path="/entrar" element={<AuthPage mode="login"/>}/>
    <Route path="/cadastro" element={<AuthPage mode="signup"/>}/>
    <Route path="/recuperar-senha" element={<AuthPage mode="recover"/>}/>
    <Route path="/meus-chamados" element={<Guard role="CIDADAO"><MyCasesPage/></Guard>}/>
    <Route path="/chamados/:id" element={<CaseDetailPage/>}/>
    <Route path="/registrar" element={<Guard role="CIDADAO"><ReportPage/></Guard>}/>
    <Route path="/chamados/:id/editar" element={<Guard role="CIDADAO"><ReportPage/></Guard>}/>
    <Route path="/avisos" element={<Guard role="CIDADAO"><NoticesPage/></Guard>}/>
    <Route path="/perfil" element={<Guard><ProfilePage/></Guard>}/>
    <Route path="/sabesp" element={<Guard role="SABESP"><StaffPage/></Guard>}/>
    <Route path="/sabesp/chamados/:id" element={<Guard role="SABESP"><CaseDetailPage operational/></Guard>}/>
    <Route path="/prefeitura" element={<Guard role="PREFEITURA"><CityHallPage/></Guard>}/>
    <Route path="*" element={<div className="page-container"><State title="Página não encontrada" text="O endereço pode ter mudado. Volte ao mapa para continuar."><Link className="button button-primary" to="/">Abrir mapa<LogIn size={17}/></Link></State></div>}/>
  </Routes></Shell>;
}
