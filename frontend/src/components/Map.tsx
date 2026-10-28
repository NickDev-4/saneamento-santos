import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LocateFixed, Minus, Plus } from 'lucide-react';
import type { Case, Location } from '../contracts';
import { statusLabels } from '../contracts';
import { useFeedback } from '../app/context';

const center: L.LatLngExpression = [-23.9675, -46.3265];
const droplet = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3s-7 7.4-7 12a7 7 0 0 0 14 0c0-4.6-7-12-7-12Z"/><path d="M8 16c0 2 1 3 3 3" stroke-linecap="round"/></svg>';
export function CityMap({ cases = [], selected, onSelect, value, onChange, compact = false }: { cases?: Case[]; selected?: string; onSelect?: (id: string) => void; value?: Location; onChange?: (location: Location) => void; compact?: boolean }) {
  const host = useRef<HTMLDivElement>(null); const map = useRef<L.Map | null>(null); const layer = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect); onSelectRef.current = onSelect;
  const onChangeRef = useRef(onChange); onChangeRef.current = onChange;
  const { notify } = useFeedback(); const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!host.current) return;
    const instance = L.map(host.current, { center: value ? [value.latitude, value.longitude] : center, zoom: compact ? 15 : 14, zoomControl: false, scrollWheelZoom: false, attributionControl: true });
    map.current = instance;
    let failures = 0;
    const tiles = L.tileLayer(import.meta.env.VITE_MAP_TILE_URL || 'https://tile.openstreetmap.org/{z}/{x}/{y}.png', { maxZoom: 19, attribution: '© <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>' });
    tiles.on('tileerror', () => { if (++failures > 3) setFailed(true); }); tiles.on('tileload', () => setFailed(false)); tiles.addTo(instance);
    layer.current = L.layerGroup().addTo(instance);
    instance.on('click', e => onChangeRef.current?.({ latitude: Number(e.latlng.lat.toFixed(6)), longitude: Number(e.latlng.lng.toFixed(6)) }));
    const observer = new ResizeObserver(() => instance.invalidateSize()); observer.observe(host.current);
    return () => { observer.disconnect(); instance.remove(); map.current = null; };
  }, []);
  useEffect(() => {
    const group = layer.current; const instance = map.current; if (!group || !instance) return;
    group.clearLayers();
    if (value && Number.isFinite(value.latitude) && Number.isFinite(value.longitude) && Math.abs(value.latitude) <= 90 && Math.abs(value.longitude) <= 180) {
      const marker = L.marker([value.latitude, value.longitude], { draggable: Boolean(onChange), icon: L.divIcon({ html: `<span class="map-pin pin-edit">${droplet}</span>`, className: 'marker-host', iconSize: [40, 48], iconAnchor: [20, 47] }), title: 'Local confirmado do problema', alt: 'Local do problema' });
      marker.on('dragend', () => { const p = marker.getLatLng(); onChangeRef.current?.({ latitude: Number(p.lat.toFixed(6)), longitude: Number(p.lng.toFixed(6)) }); }); marker.addTo(group);
      if (!instance.getBounds().contains([value.latitude, value.longitude])) instance.panTo([value.latitude, value.longitude]);
    } else if (!value) cases.forEach(c => {
      const marker = L.marker([c.localizacao.latitude, c.localizacao.longitude], { icon: L.divIcon({ html: `<span class="map-pin pin-${c.status.toLowerCase()} ${selected === c.id ? 'pin-selected' : ''}">${droplet}</span>`, className: 'marker-host', iconSize: [40, 48], iconAnchor: [20, 47] }), title: `${c.protocolo}: ${c.endereco.logradouro} — ${statusLabels[c.status]}`, alt: `Selecionar ${c.protocolo}` });
      marker.on('click', () => onSelectRef.current?.(c.id)); marker.addTo(group);
    });
  }, [cases, selected, value?.latitude, value?.longitude, Boolean(onChange)]);
  function locate() {
    if (!navigator.geolocation) { notify('Seu navegador não oferece localização. Use a busca por endereço.', true); return; }
    navigator.geolocation.getCurrentPosition(p => {
      const { latitude, longitude } = p.coords;
      if (onChangeRef.current) onChangeRef.current({ latitude, longitude });
      map.current?.setView([latitude, longitude], 15);
    }, () => notify('Localização indisponível. Você pode navegar pelo mapa ou buscar um endereço.', true), { timeout: 10000 });
  }
  return <div className={`city-map ${compact ? 'map-compact' : ''}`}><div className="leaflet-host" ref={host} role="region" aria-label={onChange ? 'Mapa para ajustar o local do problema' : 'Mapa de ocorrências em Santos'}/><div className="map-controls" role="group" aria-label="Controles do mapa"><button type="button" aria-label="Minha localização" onClick={locate}><LocateFixed size={20}/></button><button type="button" aria-label="Aumentar zoom" onClick={() => map.current?.zoomIn()}><Plus size={20}/></button><button type="button" aria-label="Diminuir zoom" onClick={() => map.current?.zoomOut()}><Minus size={20}/></button></div>{failed && <div className="map-offline" role="status">Mapa indisponível. Consulte os chamados na lista.</div>}</div>;
}
