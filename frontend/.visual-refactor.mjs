import {createServer} from 'vite';
import {chromium,expect} from '@playwright/test';
process.env.VITE_DATA_MODE='demo';
const server=await createServer({server:{host:'127.0.0.1',port:5175,strictPort:true}});let browser;
const errors=[];
try{
 await server.listen();browser=await chromium.launch({channel:'msedge',headless:true});
 for(const [width,height,scale] of [[320,740,100],[390,844,100],[390,844,200],[1440,1000,100]]){
  const context=await browser.newContext({viewport:{width,height},isMobile:width<768,hasTouch:width<768,geolocation:{latitude:-23.965,longitude:-46.33},permissions:['geolocation']});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',msg=>{if(msg.type()==='error'&&msg.text().includes('Each child'))errors.push(msg.text());});
  await page.route('https://tile.openstreetmap.org/**',r=>r.abort());
  await page.addInitScript(scale=>document.addEventListener('DOMContentLoaded',()=>document.documentElement.style.fontSize=`${scale}%`),scale);
  const tag=`${width}-${scale}`;
  async function shot(name){await page.evaluate(()=>document.fonts.ready);const scroll=await page.evaluate(()=>document.documentElement.scrollWidth);expect(scroll,`${tag} ${name}: overflow`).toBeLessThanOrEqual(width+1);await page.screenshot({path:`test-results/refactor-${tag}-${name}.png`,fullPage:true});console.log(tag,name,'OK');}
  await page.goto('http://127.0.0.1:5175');await expect(page.locator('.case-card')).toHaveCount(6);await shot('map');
  await page.getByRole('button',{name:'Aumentar zoom'}).click();await page.getByRole('button',{name:'Diminuir zoom'}).click();await page.getByRole('button',{name:'Minha localização'}).click();
  if(width<768){
   await page.getByRole('button',{name:'Pesquisar ocorrências'}).click();await page.locator('.mobile-search-field input').fill('Gonzaga');await expect(page.locator('.case-card')).toHaveCount(2);await page.locator('.mobile-search-field button').click();await expect(page.locator('.case-card')).toHaveCount(6);
   const handle=page.locator('.sheet-handle');const box=await handle.boundingBox();await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2,box.y-240,{steps:15});await page.mouse.up();await expect(handle).toHaveAttribute('aria-expanded','true');
  }
  await page.locator('.case-card').first().click();await expect(page.locator('.preview-description')).toBeVisible();await shot('preview');await page.getByRole('link',{name:'Ver chamado completo'}).click();await expect(page.locator('.timeline')).toBeVisible();await shot('detail');
  await page.goto('http://127.0.0.1:5175/entrar');await page.getByRole('button',{name:'Cidadão',exact:true}).click();await page.waitForURL('**/meus-chamados');
  await page.locator('a[href="/registrar"]:visible').first().click();await page.locator('#cep').fill('11035-200');await page.getByRole('button',{name:'Buscar CEP',exact:true}).click();await expect(page.locator('#logradouro')).not.toHaveValue('');await page.locator('#numero').fill('210');await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.locator('#tipo')).toBeVisible();await shot('report');
  await page.locator('#tipo').selectOption({index:1});await page.locator('#descricao').fill('Teste visual de esgoto na via, em frente ao ponto informado.');await page.locator('#fotos').setInputFiles(`test-results/refactor-${tag}-map.png`);await page.getByRole('button',{name:'Continuar',exact:true}).click();await expect(page.locator('.review-content')).toBeVisible();await shot('review');await page.getByRole('button',{name:'Enviar relato',exact:true}).click();await expect(page.getByRole('heading',{name:'Recebemos seu relato!',exact:true})).toBeVisible();
  await page.locator('a[href="/perfil"]:visible').first().click();await page.getByRole('button',{name:'Prefeitura',exact:true}).click();await page.waitForURL('**/prefeitura');await expect(page.locator('.metric strong').first()).toHaveText('6');await shot('cityhall');
  await page.locator('a[href="/perfil"]:visible').first().click();await page.getByRole('button',{name:'Sabesp',exact:true}).click();await page.waitForURL('**/sabesp');await expect(page.locator('a[href="/sabesp/chamados/142"]:visible').first()).toBeVisible();await shot('staff');await page.locator('a[href="/sabesp/chamados/142"]:visible').first().click();await expect(page.locator('.operation-panel')).toBeVisible();await page.getByRole('button',{name:'Alterar agendamento',exact:true}).click();await expect(page.getByRole('dialog')).toBeVisible();await shot('operation-dialog');await page.getByRole('button',{name:'Cancelar',exact:true}).click();
  await context.close();
 }
 expect(errors).toEqual([]);
}finally{await browser?.close();await server.close();}
